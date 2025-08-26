package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

type VideoResponse struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Status    string    `json:"status"`
	S3Key     string    `json:"s3_key"`
	CreatedAt time.Time `json:"created_at"`
	Filename  string    `json:"filename"`
	Title     string    `json:"title"`
}

func GetUserVideosHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(UserIDKey).(float64)
		if !ok {
			http.Error(w, "Invalid user ID in token", http.StatusInternalServerError)
			return
		}

		rows, err := db.Query("SELECT id, user_id, status, s3_key, created_at, filename, title FROM videos WHERE user_id = $1 ORDER BY created_at DESC", int(userID))
		if err != nil {
			log.Printf("Error querying videos: %v", err)
			http.Error(w, "Error fetching videos", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var videos []VideoResponse
		for rows.Next() {
			var video VideoResponse
			var s3Key sql.NullString
			if err := rows.Scan(&video.ID, &video.UserID, &video.Status, &s3Key, &video.CreatedAt, &video.Filename, &video.Title); err != nil {
				log.Printf("Error scanning video row: %v", err)
				continue
			}
			video.S3Key = s3Key.String
			videos = append(videos, video)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(videos)
	}
}

// --- NEW: Handler for Deleting a Video ---
func DeleteVideoHandler(db *sql.DB, sess *session.Session) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1. Get User ID from token to ensure ownership
		userID, ok := r.Context().Value(UserIDKey).(float64)
		if !ok {
			http.Error(w, "Invalid user ID in token", http.StatusInternalServerError)
			return
		}

		// 2. Get Video ID from the URL path (e.g., /videos/123)
		idStr := strings.TrimPrefix(r.URL.Path, "/videos/")
		videoID, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid video ID in URL path", http.StatusBadRequest)
			return
		}

		// 3. Get the S3 Key from the database BEFORE deleting
		// This also verifies that the video belongs to the user making the request
		var s3Key sql.NullString
		err = db.QueryRow("SELECT s3_key FROM videos WHERE id = $1 AND user_id = $2", videoID, int(userID)).Scan(&s3Key)
		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Video not found or you do not have permission to delete it", http.StatusNotFound)
				return
			}
			http.Error(w, "Error fetching video details", http.StatusInternalServerError)
			return
		}

		// 4. Delete the files from AWS S3 if an s3_key exists
		if s3Key.Valid && s3Key.String != "" {
			err = deleteS3Folder(sess, os.Getenv("S3_BUCKET_NAME"), s3Key.String)
			if err != nil {
				log.Printf("Failed to delete S3 files for key %s: %v", s3Key.String, err)
				// Decide if you want to stop or continue. We'll continue and delete the DB record anyway.
			}
		}

		// 5. Delete the record from the PostgreSQL database
		_, err = db.Exec("DELETE FROM videos WHERE id = $1 AND user_id = $2", videoID, int(userID))
		if err != nil {
			http.Error(w, "Failed to delete video record", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Video deleted successfully"})
	}
}

// --- NEW: Helper function to delete all files in an S3 "folder" ---
func deleteS3Folder(sess *session.Session, bucket string, key string) error {
	s3Svc := s3.New(sess)

	// The prefix for HLS files is the key without the "playlist.m3u8" part
	folderPrefix := strings.TrimSuffix(key, "playlist.m3u8")

	// List all objects with the given prefix
	listOutput, err := s3Svc.ListObjectsV2(&s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
		Prefix: aws.String(folderPrefix),
	})
	if err != nil {
		return fmt.Errorf("failed to list S3 objects: %w", err)
	}

	if len(listOutput.Contents) == 0 {
		return nil // No files to delete
	}

	// Create a list of objects to delete
	var objectsToDelete []*s3.ObjectIdentifier
	for _, object := range listOutput.Contents {
		objectsToDelete = append(objectsToDelete, &s3.ObjectIdentifier{Key: object.Key})
	}

	// Batch delete the objects
	_, err = s3Svc.DeleteObjects(&s3.DeleteObjectsInput{
		Bucket: aws.String(bucket),
		Delete: &s3.Delete{Objects: objectsToDelete},
	})
	if err != nil {
		return fmt.Errorf("failed to delete S3 objects: %w", err)
	}

	log.Printf("Successfully deleted %d files from S3 with prefix %s", len(objectsToDelete), folderPrefix)
	return nil
}
