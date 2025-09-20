package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

// APIKeyResponse is for fetching an existing key's metadata
type APIKeyResponse struct {
	LastFour string `json:"last_four"`
	Exists   bool   `json:"exists"` // Let the frontend know if a key has been generated yet
}

// NewAPIKeyResponse is for generating a new key
type NewAPIKeyResponse struct {
	Key string `json:"key"` // The full, raw key is only shown once
}

// --- THIS HANDLER HAS BEEN REWRITTEN ---
// GenerateAPIKeyHandler creates a new API key for the user
func GenerateAPIKeyHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(UserIDKey).(float64)
		if !ok {
			http.Error(w, "Invalid user ID in token", http.StatusInternalServerError)
			return
		}

		// 1. Generate a new, cryptographically secure random key
		randomBytes := make([]byte, 32)
		if _, err := rand.Read(randomBytes); err != nil {
			http.Error(w, "Failed to generate API key", http.StatusInternalServerError)
			return
		}
		newKey := "sk_live_" + base64.URLEncoding.EncodeToString(randomBytes)

		// 2. Hash the key for secure storage in the database
		hashedKey, err := bcrypt.GenerateFromPassword([]byte(newKey), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "Failed to hash API key", http.StatusInternalServerError)
			return
		}

		// 3. --- FIX: Store the last four digits along with the hash ---
		lastFour := newKey[len(newKey)-4:]

		// 4. Store the hashed key and last four, replacing any old key (UPSERT)
		query := `
        INSERT INTO api_keys (user_id, key_hash, last_four) VALUES ($1, $2, $3)
        ON CONFLICT (user_id) DO UPDATE SET key_hash = EXCLUDED.key_hash, last_four = EXCLUDED.last_four;
        `
		if _, err := db.Exec(query, int(userID), string(hashedKey), lastFour); err != nil {
			log.Printf("Failed to save API key hash: %v", err)
			http.Error(w, "Failed to save API key", http.StatusInternalServerError)
			return
		}

		// 5. Return the full, unhashed key to the user ONCE
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(NewAPIKeyResponse{Key: newKey})
	}
}

// --- THIS HANDLER HAS BEEN REWRITTEN ---
// GetAPIKeyHandler fetches the user's existing key's last four characters
func GetAPIKeyHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(UserIDKey).(float64)
		if !ok {
			http.Error(w, "Invalid user ID in token", http.StatusInternalServerError)
			return
		}

		var lastFour string
		query := "SELECT last_four FROM api_keys WHERE user_id = $1"
		err := db.QueryRow(query, int(userID)).Scan(&lastFour)

		if err != nil {
			if err == sql.ErrNoRows {
				// This is not an error, it just means the user hasn't created a key yet.
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(APIKeyResponse{Exists: false})
				return
			}
			log.Printf("Failed to get API key: %v", err)
			http.Error(w, "Failed to retrieve API key", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(APIKeyResponse{LastFour: lastFour, Exists: true})
	}
}
