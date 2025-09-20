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

	// Use a router (mux) to organize handlers
	mux := http.NewServeMux()
	mux.HandleFunc("/register", handlers.RegisterHandler(server.db))
	mux.HandleFunc("/login", handlers.LoginHandler(server.db, server.config.JWTSecret))
	mux.HandleFunc("/upload", handlers.JWTMiddleware(server.uploadHandler, server.config.JWTSecret))
	mux.HandleFunc("/videos/", handlers.JWTMiddleware(server.videosRouter, server.config.JWTSecret))
	mux.HandleFunc("/keys/", handlers.JWTMiddleware(server.keysRouter, server.config.JWTSecret))

	// Wrap the entire mux with the CORS middleware
	handler := handlers.CORSMiddleware(mux)

	log.Println("🚀 Server started on :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

func (s *Server) videosRouter(w http.ResponseWriter, r *http.Request) {
	if (r.URL.Path == "/videos" || r.URL.Path == "/videos/") && r.Method == http.MethodGet {
		handlers.GetUserVideosHandler(s.db)(w, r)
		return
	}
	if strings.HasPrefix(r.URL.Path, "/videos/") && r.Method == http.MethodDelete {
		handlers.DeleteVideoHandler(s.db, s.awsSess)(w, r)
		return
	}
	http.NotFound(w, r)
}

func (s *Server) keysRouter(w http.ResponseWriter, r *http.Request) {
	if (r.URL.Path == "/keys" || r.URL.Path == "/keys/") && r.Method == http.MethodGet {
		handlers.GetAPIKeyHandler(s.db)(w, r)
		return
	}
	if (r.URL.Path == "/keys" || r.URL.Path == "/keys/") && r.Method == http.MethodPost {
		handlers.GenerateAPIKeyHandler(s.db)(w, r)
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
		log.Printf("DB insert error: %v", err)
		http.Error(w, "Failed to create video record", http.StatusInternalServerError)
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

	createAPIKeysTable := `
	CREATE TABLE IF NOT EXISTS api_keys (
		id SERIAL PRIMARY KEY,
		user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		key_hash TEXT NOT NULL,
		last_four TEXT NOT NULL,
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

	_, err = s.db.Exec(createAPIKeysTable)
	if err != nil {
		return fmt.Errorf("error creating api_keys table: %w", err)
	}

	log.Println("✅ Database tables checked/created successfully.")
	return nil
}
