package handlers

import "net/http"

// CORSMiddleware is a centralized handler for CORS headers.
// It wraps another http.Handler and applies the headers to every request.
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set the necessary CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE, PUT")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		// If it's a preflight (OPTIONS) request, we handle it and stop the chain here.
		// The browser is just asking for permission.
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Otherwise, it's a real request, so we pass it along to the next handler in the chain.
		next.ServeHTTP(w, r)
	})
}
