package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"portfolio-backend/internal/middleware"
)

type LoginRequest struct {
	Password string `json:"password"`
}

// LoginHandler handles POST /api/admin/login
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	adminPassword := os.Getenv("ADMIN_PASSWORD")
	if adminPassword == "" {
		adminPassword = "admin123"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "super-secret-jwt-key"
	}

	if strings.TrimSpace(req.Password) != adminPassword {
		http.Error(w, `{"error":"Invalid super-user password"}`, http.StatusUnauthorized)
		return
	}

	token, err := middleware.GenerateJWT(jwtSecret, 24)
	if err != nil {
		http.Error(w, `{"error":"Failed to generate authentication token"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"token":   token,
		"message": "Super-user authenticated successfully",
	})
}
