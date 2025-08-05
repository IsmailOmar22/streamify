package main

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

type VideoJob struct {
	Filename string `json:"filename"`
}

func main() {
	//redis
	rdb := redis.NewClient(&redis.Options{
		Addr: "redis:6379",
	})

	ctx := context.Background()
	fmt.Println("👷 Worker started. Waiting for jobs...")

	for {
		result, err := rdb.BRPop(ctx, 0*time.Second, "video_jobs").Result()
		if err != nil {
			log.Println("❌ Failed to pop job:", err)
			continue
		}

		job := VideoJob{}
		if err := json.Unmarshal([]byte(result[1]), &job); err != nil {
			log.Println("❌ Failed to parse job JSON:", err)
			continue
		}

		fmt.Println("📥 Received job:", job.Filename)

		inputPath := "/app/uploads/" + job.Filename
		outputFilename := job.Filename + ".mp4"
		outputPath := "/app/processed/" + outputFilename

		//ffmpeg
		cmd := exec.Command("ffmpeg", "-i", inputPath, "-y", outputPath)
		var stderr bytes.Buffer
		cmd.Stderr = &stderr

		if err := cmd.Run(); err != nil {
			log.Printf("❌ FFmpeg failed: %v\n%s", err, stderr.String())
			continue
		}
		fmt.Println("🎬 Video processed:", outputFilename)

		//s3 upload
		err = uploadToS3(outputPath, outputFilename)
		if err != nil {
			log.Println("❌ Failed to upload to S3:", err)
			continue
		}
		fmt.Println("☁️ Uploaded to S3:", outputFilename)

		err = insertIntoPostgres(outputFilename)
		if err != nil {
			log.Println("❌ Failed to insert into DB:", err)
			continue
		}
		fmt.Println("✅ Metadata inserted into DB:", outputFilename)
	}
}

func uploadToS3(filePath string, key string) error {
	awsAccessKey := os.Getenv("AWS_ACCESS_KEY_ID")
	awsSecretKey := os.Getenv("AWS_SECRET_ACCESS_KEY")
	awsRegion := os.Getenv("AWS_REGION")
	bucketName := os.Getenv("S3_BUCKET_NAME")

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(awsRegion),
		Credentials: credentials.NewStaticCredentials(
			awsAccessKey,
			awsSecretKey,
			"",
		),
	})
	if err != nil {
		return fmt.Errorf("failed to create AWS session: %w", err)
	}

	uploader := s3manager.NewUploader(sess)

	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	_, err = uploader.Upload(&s3manager.UploadInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
		Body:   file,
	})
	return err
}

func insertIntoPostgres(filename string) error {
	connStr := "host=postgres user=user password=password dbname=streamifydb sslmode=disable"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return err
	}
	defer db.Close()

	query := `INSERT INTO videos (filename, uploaded_at) VALUES ($1, $2)`
	_, err = db.Exec(query, filename, time.Now())
	return err
}
