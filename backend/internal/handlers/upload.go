package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"portfolio-backend/internal/database"
)

// UploadCV handles POST /api/admin/cv (multipart/form-data with "cv" file)
func UploadCV(w http.ResponseWriter, r *http.Request) {
	// Max upload size: 10MB
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, `{"error":"File too large or invalid multipart form (max 10MB)"}`, http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("cv")
	if err != nil {
		http.Error(w, `{"error":"Missing 'cv' file field in request"}`, http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate extension (.pdf)
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".pdf" {
		http.Error(w, `{"error":"Invalid file type. Only PDF documents are allowed for CV."}`, http.StatusBadRequest)
		return
	}

	uploadsDir := os.Getenv("UPLOADS_DIR")
	if uploadsDir == "" {
		uploadsDir = "./uploads"
	}

	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		http.Error(w, `{"error":"Failed to create uploads directory"}`, http.StatusInternalServerError)
		return
	}

	dstPath := filepath.Join(uploadsDir, "cv.pdf")
	dst, err := os.Create(dstPath)
	if err != nil {
		http.Error(w, `{"error":"Failed to save file on server"}`, http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, `{"error":"Failed to write file contents"}`, http.StatusInternalServerError)
		return
	}

	// Update settings table with cv_filename
	db := database.DB
	_, err = db.Exec("UPDATE settings SET cv_filename = ?, updated_at = ? WHERE id = 1", "cv.pdf", time.Now().UTC())
	if err != nil {
		// Log warning but file is successfully saved
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
		"success":  true,
		"message":  "CV uploaded successfully",
		"filename": "cv.pdf",
		"url":      "/uploads/cv.pdf",
	})
}

// UploadImage handles POST /api/admin/upload-image (multipart/form-data with "image" file)
func UploadImage(w http.ResponseWriter, r *http.Request) {
	// Max upload size: 10MB
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, `{"error":"File too large or invalid multipart form (max 10MB)"}`, http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		http.Error(w, `{"error":"Missing 'image' file field in request"}`, http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate image extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".svg": true, ".gif": true}
	if !allowedExts[ext] {
		http.Error(w, `{"error":"Invalid image format. Allowed: .jpg, .jpeg, .png, .webp, .svg, .gif"}`, http.StatusBadRequest)
		return
	}

	uploadsDir := os.Getenv("UPLOADS_DIR")
	if uploadsDir == "" {
		uploadsDir = "./uploads"
	}

	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		http.Error(w, `{"error":"Failed to create uploads directory"}`, http.StatusInternalServerError)
		return
	}

	// Generate unique filename to avoid collisions
	safeName := fmt.Sprintf("img_%d%s", time.Now().UnixNano(), ext)
	dstPath := filepath.Join(uploadsDir, safeName)

	dst, err := os.Create(dstPath)
	if err != nil {
		http.Error(w, `{"error":"Failed to save image on server"}`, http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, `{"error":"Failed to write image contents"}`, http.StatusInternalServerError)
		return
	}

	fileURL := fmt.Sprintf("/uploads/%s", safeName)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
		"success":   true,
		"message":   "Image uploaded successfully",
		"image_url": fileURL,
	})
}
