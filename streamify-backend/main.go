package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
)

// Enable CORS for local dev (localhost:3000)
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

	// Parse the multipart form
	err := r.ParseMultipartForm(10 << 20) // 10MB
	if err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	// Get the file
	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Failed to get file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Save to uploads directory
	uploadPath := filepath.Join("uploads", handler.Filename)
	dst, err := os.Create(uploadPath)
	if err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()
	io.Copy(dst, file)

	// Process with FFmpeg (convert to .ts as example)
	outputPath := filepath.Join("processed", handler.Filename+".ts")
	cmd := exec.Command("ffmpeg", "-i", uploadPath, "-c", "copy", outputPath)
	err = cmd.Run()
	if err != nil {
		http.Error(w, "Failed to run FFmpeg", http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "File uploaded and processed successfully: %s", handler.Filename)
}

func main() {
	// Create upload & processed folders if not exist
	os.MkdirAll("uploads", os.ModePerm)
	os.MkdirAll("processed", os.ModePerm)

	http.HandleFunc("/upload", uploadHandler)

	fmt.Println("Server started on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
