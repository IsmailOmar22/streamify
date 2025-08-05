package main

import (
	"context"
	"database/sql"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/redis/go-redis/v9"

	_ "github.com/lib/pq"
)

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	err := r.ParseMultipartForm(10 << 20) // 10MB
	if err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Failed to get file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	uploadPath := filepath.Join("uploads", handler.Filename)
	dst, err := os.Create(uploadPath)
	if err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()
	io.Copy(dst, file)

	// Enqueue job in Redis
	rdb := redis.NewClient(&redis.Options{
		Addr: "redis:6379",
	})
	ctx := context.Background()
	job := fmt.Sprintf(`{"filename": "%s"}`, handler.Filename)
	err = rdb.LPush(ctx, "video_jobs", job).Err()
	if err != nil {
		http.Error(w, "Failed to enqueue job", http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "✅ File uploaded and job enqueued: %s", handler.Filename)
}

func main() {

	connStr := "host=postgres port=5432 user=user password=password dbname=streamifydb sslmode=disable"
	var db *sql.DB
	var err error

	for i := 0; i < 10; i++ {
		db, err = sql.Open("postgres", connStr)
		if err == nil {
			err = db.Ping()
			if err == nil {
				break
			}
		}

		fmt.Println("Waiting for database to be ready...")
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		log.Fatal("Error connecting to database after retries:", err)
	}
	defer db.Close()
	fmt.Println("✅ Connected to PostgreSQL")

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			username TEXT NOT NULL,
			email TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS videos (
			id SERIAL PRIMARY KEY,
			filename TEXT NOT NULL,
			uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			user_id INTEGER REFERENCES users(id)
		);
	`)
	if err != nil {
		log.Fatal("Error creating tables:", err)
	}

	//uploads + processed
	os.MkdirAll("uploads", os.ModePerm)
	os.MkdirAll("processed", os.ModePerm)

	http.HandleFunc("/upload", uploadHandler)

	fmt.Println("Server started on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
