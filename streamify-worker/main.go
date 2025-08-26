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
	"path/filepath"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

// --- UPDATED: VideoJob now includes the VideoID ---
type VideoJob struct {
	Filename string `json:"filename"`
	VideoID  int    `json:"video_id"`
}

func main() {
	ctx := context.Background()
	rdb := redis.NewClient(&redis.Options{Addr: "redis:6379"})
	if _, err := rdb.Ping(ctx).Result(); err != nil {
		log.Fatal("Worker failed to connect to Redis:", err)
	}
	log.Println("✅ Worker connected to Redis")

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_HOST"), os.Getenv("DB_PORT"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_NAME"))
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Worker failed to connect to DB:", err)
	}
	defer db.Close()
	if err = db.Ping(); err != nil {
		log.Fatal("Worker could not ping DB:", err)
	}
	log.Println("✅ Worker connected to PostgreSQL")

	sess, err := createAWSSession()
	if err != nil {
		log.Fatal("Worker failed to create AWS session:", err)
	}
	uploader := s3manager.NewUploader(sess)
	bucketName := os.Getenv("S3_BUCKET_NAME")
	log.Println("✅ Worker AWS session created")
	log.Println("👷 Worker started. Waiting for jobs...")

	for {
		result, err := rdb.BRPop(ctx, 0*time.Second, "video_jobs").Result()
		if err != nil {
			log.Printf("❌ Failed to pop job from redis: %v", err)
			continue
		}

		var job VideoJob
		if err := json.Unmarshal([]byte(result[1]), &job); err != nil {
			log.Printf("❌ Failed to parse job JSON: %v", err)
			continue
		}

		log.Printf("📥 Received job for video ID %d: %s", job.VideoID, job.Filename)

		inputPath := filepath.Join("/app/uploads", job.Filename)
		s3KeyPrefix := fmt.Sprintf("videos/%d/%s", job.VideoID, job.Filename)
		outputDir := filepath.Join("/tmp", job.Filename)
		os.MkdirAll(outputDir, os.ModePerm)

		cmd := exec.Command("ffmpeg",
			"-i", inputPath, "-profile:v", "main", "-level", "3.1",
			"-start_number", "0", "-hls_time", "10", "-hls_list_size", "0",
			"-f", "hls", filepath.Join(outputDir, "playlist.m3u8"),
		)

		var stderr bytes.Buffer
		cmd.Stderr = &stderr
		if err := cmd.Run(); err != nil {
			log.Printf("❌ FFmpeg failed for %s: %v\n%s", job.Filename, err, stderr.String())
			updateVideoStatus(db, job.VideoID, "failed", "") // NEW: Update status to 'failed' on error
			os.Remove(inputPath)
			os.RemoveAll(outputDir)
			continue
		}
		log.Printf("🎬 Video processed: %s", job.Filename)

		err = filepath.Walk(outputDir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			if !info.IsDir() {
				s3Key := filepath.Join(s3KeyPrefix, info.Name())
				err := uploadToS3(uploader, bucketName, path, s3Key)
				if err != nil {
					log.Printf("❌ Failed to upload %s to S3: %v", info.Name(), err)
					return err
				}
			}
			return nil
		})
		if err != nil {
			log.Printf("❌ Error during S3 upload walk: %v", err)
			updateVideoStatus(db, job.VideoID, "failed", "")
			os.Remove(inputPath)
			os.RemoveAll(outputDir)
			continue
		}
		log.Printf("☁️ Uploaded all files for %s to S3", job.Filename)

		playlistS3Key := filepath.Join(s3KeyPrefix, "playlist.m3u8")
		// --- UPDATED: Update status to 'ready' instead of inserting ---
		err = updateVideoStatus(db, job.VideoID, "ready", playlistS3Key)
		if err != nil {
			log.Printf("❌ Failed to update DB for %s: %v", job.Filename, err)
			continue
		}
		log.Printf("✅ Metadata updated in DB for: %s", job.Filename)

		os.Remove(inputPath)
		os.RemoveAll(outputDir)
	}
}

func createAWSSession() (*session.Session, error) {
	awsRegion := os.Getenv("AWS_REGION")
	if awsRegion == "" {
		return nil, fmt.Errorf("AWS_REGION environment variable not set")
	}
	return session.NewSession(&aws.Config{
		Region: aws.String(awsRegion),
	})
}

func uploadToS3(uploader *s3manager.Uploader, bucketName string, filePath string, key string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open file %s: %w", filePath, err)
	}
	defer file.Close()

	_, err = uploader.Upload(&s3manager.UploadInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
		Body:   file,
	})
	return err
}

// --- RENAMED & REWRITTEN: This function now performs an UPDATE ---
func updateVideoStatus(db *sql.DB, videoID int, status string, s3Key string) error {
	query := `UPDATE videos SET status = $1, s3_key = $2 WHERE id = $3`
	_, err := db.Exec(query, status, s3Key, videoID)
	return err
}
