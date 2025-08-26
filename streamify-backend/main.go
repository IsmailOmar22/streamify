package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"streamify-backend/handlers"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/redis/go-redis/v9"

	_ "github.com/lib/pq"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	JWTSecret  string
}

type Server struct {
	db      *sql.DB
	redis   *redis.Client
	awsSess *session.Session
	config  Config
}

func main() {
	cfg := Config{
		DBHost:     os.Getenv("DB_HOST"),
		DBPort:     os.Getenv("DB_PORT"),
		DBUser:     os.Getenv("DB_USER"),
		DBPassword: os.Getenv("DB_PASSWORD"),
		DBName:     os.Getenv("DB_NAME"),
		JWTSecret:  os.Getenv("JWT_SECRET"),
	}
	if cfg.JWTSecret == "" {
		log.Fatal("FATAL: JWT_SECRET environment variable not set.")
	}

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName)

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
		log.Printf("Waiting for database to be ready... (%d/10)", i+1)
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		log.Fatal("Error connecting to database after retries:", err)
	}
	defer db.Close()
	log.Println("✅ Connected to PostgreSQL")

	rdb := redis.NewClient(&redis.Options{
		Addr: "redis:6379",
	})
	if _, err := rdb.Ping(context.Background()).Result(); err != nil {
		log.Fatal("Error connecting to Redis:", err)
	}
	log.Println("✅ Connected to Redis")

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(os.Getenv("AWS_REGION")),
	})
	if err != nil {
		log.Fatal("Error creating AWS session:", err)
	}
	log.Println("✅ Connected to AWS")

	server := &Server{
		db:      db,
		redis:   rdb,
		awsSess: sess,
		config:  cfg,
	}

	if err := server.initDB(); err != nil {
		log.Fatal("Error initializing database:", err)
	}

	// Register public handlers
	http.HandleFunc("/register", handlers.RegisterHandler(server.db))
	http.HandleFunc("/login", handlers.LoginHandler(server.db, server.config.JWTSecret))

	// Register protected handlers
	http.HandleFunc("/upload", handlers.JWTMiddleware(server.uploadHandler, server.config.JWTSecret))

	// --- THIS IS THE FIX ---
	// Explicitly register the router for BOTH paths to prevent redirects.
	http.HandleFunc("/videos", handlers.JWTMiddleware(server.videosRouter, server.config.JWTSecret))
	http.HandleFunc("/videos/", handlers.JWTMiddleware(server.videosRouter, server.config.JWTSecret))
	// --- END OF FIX ---

	log.Println("🚀 Server started on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// This router handles different methods on the /videos/ path
func (s *Server) videosRouter(w http.ResponseWriter, r *http.Request) {
	// Route for GET /videos or /videos/ (to list all videos for a user)
	if (r.URL.Path == "/videos" || r.URL.Path == "/videos/") && r.Method == http.MethodGet {
		handlers.GetUserVideosHandler(s.db)(w, r)
		return
	}
	// Route for DELETE /videos/{id} (to delete a single video)
	if strings.HasPrefix(r.URL.Path, "/videos/") && r.Method == http.MethodDelete {
		handlers.DeleteVideoHandler(s.db, s.awsSess)(w, r)
		return
	}

	http.NotFound(w, r)
}

func (s *Server) uploadHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(handlers.UserIDKey).(float64)
	if !ok {
		http.Error(w, "Could not get user ID from token", http.StatusInternalServerError)
		return
	}

	r.ParseMultipartForm(32 << 20)
	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Error retrieving the file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	uploadPath := filepath.Join("/app/uploads", handler.Filename)
	dst, err := os.Create(uploadPath)
	if err != nil {
		http.Error(w, "Error creating the file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Error saving the file", http.StatusInternalServerError)
		return
	}

	originalFilename := handler.Filename
	extension := filepath.Ext(originalFilename)
	videoTitle := strings.TrimSuffix(originalFilename, extension)

	var videoID int
	insertQuery := `INSERT INTO videos (user_id, filename, title, status) VALUES ($1, $2, $3, 'processing') RETURNING id`
	err = s.db.QueryRow(insertQuery, int(userID), handler.Filename, videoTitle).Scan(&videoID)
	if err != nil {
		http.Error(w, "Failed to create video record", http.StatusInternalServerError)
		log.Printf("DB insert error: %v", err)
		return
	}

	jobPayload := map[string]interface{}{
		"filename": handler.Filename,
		"video_id": videoID,
	}
	jobJSON, err := json.Marshal(jobPayload)
	if err != nil {
		http.Error(w, "Error creating job payload", http.StatusInternalServerError)
		return
	}

	err = s.redis.LPush(context.Background(), "video_jobs", jobJSON).Err()
	if err != nil {
		http.Error(w, "Failed to enqueue job", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{"message": "File uploaded and processing started."})
}

func (s *Server) initDB() error {
	createUsersTable := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username TEXT NOT NULL,
		email TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);`

	createVideosTable := `
	CREATE TABLE IF NOT EXISTS videos (
		id SERIAL PRIMARY KEY,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		filename TEXT NOT NULL,
		title TEXT NOT NULL,
		status TEXT NOT NULL DEFAULT 'processing',
		s3_key TEXT,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);`

	_, err := s.db.Exec(createUsersTable)
	if err != nil {
		return fmt.Errorf("error creating users table: %w", err)
	}

	_, err = s.db.Exec(createVideosTable)
	if err != nil {
		return fmt.Errorf("error creating videos table: %w", err)
	}
	log.Println("Database tables checked/created successfully.")
	return nil
}
