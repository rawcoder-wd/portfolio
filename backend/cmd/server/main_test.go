package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strconv"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"

	"portfolio-backend/internal/database"
	"portfolio-backend/internal/handlers"
	custommw "portfolio-backend/internal/middleware"
	"portfolio-backend/internal/models"
)

func setupTestRouterWithDB(t *testing.T) (*chi.Mux, string) {
	tmpDir, err := os.MkdirTemp("", "portfolio_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}

	dbPath := filepath.Join(tmpDir, "test.db")
	os.Setenv("UPLOADS_DIR", filepath.Join(tmpDir, "uploads"))
	database.InitDB(dbPath)

	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:*", "http://127.0.0.1:*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link", "Content-Disposition"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Route("/api", func(r chi.Router) {
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(HealthResponse{
				Status:    "ok",
				Service:   "portfolio-backend",
				Timestamp: time.Now().UTC(),
			})
		})

		r.Get("/portfolio-data", handlers.GetPortfolioData)
		r.Get("/cv/download", handlers.DownloadCV)
		r.Post("/inquiries", handlers.CreateInquiry)

		r.Post("/admin/login", handlers.LoginHandler)

		r.Route("/admin", func(r chi.Router) {
			r.Use(custommw.AuthMiddleware("super-secret-jwt-key"))

			r.Post("/calcom", handlers.VerifyAndSaveCalcomConfig)
			r.Post("/cv", handlers.UploadCV)
			r.Post("/upload-image", handlers.UploadImage)

			r.Get("/settings", handlers.GetAdminSettings)
			r.Put("/settings", handlers.UpdateAdminSettings)

			r.Post("/projects", handlers.CreateProject)
			r.Put("/projects/{id}", handlers.UpdateProject)
			r.Delete("/projects/{id}", handlers.DeleteProject)

			r.Post("/skills", handlers.CreateSkill)
			r.Put("/skills/{id}", handlers.UpdateSkill)
			r.Delete("/skills/{id}", handlers.DeleteSkill)

			r.Get("/inquiries", handlers.GetAdminInquiries)
			r.Patch("/inquiries/{id}/read", handlers.MarkInquiryRead)
			r.Delete("/inquiries/{id}", handlers.DeleteInquiry)
		})
	})

	return r, tmpDir
}

func TestHealthCheck(t *testing.T) {
	router, tmpDir := setupTestRouterWithDB(t)
	defer os.RemoveAll(tmpDir)

	req := httptest.NewRequest("GET", "/api/health", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}
}

func TestGetPortfolioData(t *testing.T) {
	router, tmpDir := setupTestRouterWithDB(t)
	defer os.RemoveAll(tmpDir)

	req := httptest.NewRequest("GET", "/api/portfolio-data", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var data handlers.PortfolioDataResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &data); err != nil {
		t.Fatalf("failed to decode portfolio data: %v", err)
	}

	if data.Settings.ID != 1 {
		t.Fatalf("expected settings ID 1, got %d", data.Settings.ID)
	}
	if data.Settings.CalcomAPIKey != "" {
		t.Fatalf("expected CalcomAPIKey to be masked/empty in public response")
	}
	if len(data.Projects) == 0 {
		t.Fatalf("expected seeded projects, got 0")
	}
	if len(data.Skills) == 0 {
		t.Fatalf("expected seeded skills, got 0")
	}
}

func TestCreateInquiry(t *testing.T) {
	router, tmpDir := setupTestRouterWithDB(t)
	defer os.RemoveAll(tmpDir)

	payload := handlers.CreateInquiryRequest{
		Type:            "contact",
		SenderName:      "Alice Smith",
		SenderEmail:     "alice@example.com",
		BudgetOrSubject: "Project Inquiry",
		Message:         "Hello, I would like to discuss a project.",
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest("POST", "/api/inquiries", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d (body: %s)", rec.Code, rec.Body.String())
	}
}

func TestDownloadCVNotFound(t *testing.T) {
	router, tmpDir := setupTestRouterWithDB(t)
	defer os.RemoveAll(tmpDir)

	req := httptest.NewRequest("GET", "/api/cv/download", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status 404 when CV does not exist, got %d", rec.Code)
	}
}

func TestAdminWorkflow(t *testing.T) {
	router, tmpDir := setupTestRouterWithDB(t)
	defer os.RemoveAll(tmpDir)

	os.Setenv("ADMIN_PASSWORD", "secret123")
	os.Setenv("JWT_SECRET", "super-secret-jwt-key")

	// 1. Test Admin Login
	loginPayload := handlers.LoginRequest{Password: "secret123"}
	body, _ := json.Marshal(loginPayload)
	req := httptest.NewRequest("POST", "/api/admin/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected login status 200, got %d (body: %s)", rec.Code, rec.Body.String())
	}

	var loginResp map[string]any
	json.Unmarshal(rec.Body.Bytes(), &loginResp)
	token, ok := loginResp["token"].(string)
	if !ok || token == "" {
		t.Fatalf("expected valid JWT token from login")
	}

	authHeader := "Bearer " + token

	// 2. Test Get Admin Settings
	req = httptest.NewRequest("GET", "/api/admin/settings", nil)
	req.Header.Set("Authorization", authHeader)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected get settings status 200, got %d", rec.Code)
	}

	// 3. Test Update Admin Settings
	settingsUpdate := map[string]any{
		"hero_title":    "Updated Hero Title",
		"hero_subtitle": "Updated Subtitle",
		"about_text":    "Updated about text...",
		"contact_email": "test@example.com",
		"github_url":    "https://github.com/test",
		"linkedin_url":  "https://linkedin.com/in/test",
		"cv_filename":   "cv.pdf",
		"calcom_username": "myuser",
		"calcom_event_slug": "consultation",
		"calcom_enabled": true,
	}
	body, _ = json.Marshal(settingsUpdate)
	req = httptest.NewRequest("PUT", "/api/admin/settings", bytes.NewReader(body))
	req.Header.Set("Authorization", authHeader)
	req.Header.Set("Content-Type", "application/json")
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected update settings status 200, got %d (body: %s)", rec.Code, rec.Body.String())
	}

	// 4. Test Cal.com Config Verification & Save
	calPayload := handlers.CalcomConfigRequest{
		CalcomAPIKey:    "test_cal_key_123",
		CalcomUsername:  "myuser",
		CalcomEventSlug: "consultation",
		CalcomEnabled:   true,
	}
	body, _ = json.Marshal(calPayload)
	req = httptest.NewRequest("POST", "/api/admin/calcom", bytes.NewReader(body))
	req.Header.Set("Authorization", authHeader)
	req.Header.Set("Content-Type", "application/json")
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected calcom save status 200, got %d (body: %s)", rec.Code, rec.Body.String())
	}

	// 5. Test Project CRUD (Create, Update, Delete)
	projPayload := map[string]any{
		"title":         "Test Project",
		"summary":       "Test summary",
		"description":   "Test description",
		"tech_stack":    "[\"Go\", \"React\"]",
		"image_url":     "https://example.com/img.png",
		"live_url":      "https://example.com",
		"repo_url":      "https://github.com",
		"price_note":    "Free",
		"is_available":  true,
		"display_order": 10,
	}
	body, _ = json.Marshal(projPayload)
	req = httptest.NewRequest("POST", "/api/admin/projects", bytes.NewReader(body))
	req.Header.Set("Authorization", authHeader)
	req.Header.Set("Content-Type", "application/json")
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected create project status 201, got %d (body: %s)", rec.Code, rec.Body.String())
	}

	var createdProj models.Project
	json.Unmarshal(rec.Body.Bytes(), &createdProj)

	// Update project
	projPayload["title"] = "Updated Test Project"
	body, _ = json.Marshal(projPayload)
	req = httptest.NewRequest("PUT", "/api/admin/projects/"+strconvItoa(createdProj.ID), bytes.NewReader(body))
	req.Header.Set("Authorization", authHeader)
	req.Header.Set("Content-Type", "application/json")
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected update project status 200, got %d", rec.Code)
	}

	// Delete project
	req = httptest.NewRequest("DELETE", "/api/admin/projects/"+strconvItoa(createdProj.ID), nil)
	req.Header.Set("Authorization", authHeader)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected delete project status 200, got %d", rec.Code)
	}

	// 6. Test Skill CRUD
	skillPayload := map[string]any{
		"name":           "GraphQL",
		"category":       "Backend",
		"proficiency":    85,
		"learning_story": "Learned while building robust APIs.",
		"display_order":  5,
	}
	body, _ = json.Marshal(skillPayload)
	req = httptest.NewRequest("POST", "/api/admin/skills", bytes.NewReader(body))
	req.Header.Set("Authorization", authHeader)
	req.Header.Set("Content-Type", "application/json")
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected create skill status 201, got %d", rec.Code)
	}

	var createdSkill models.Skill
	json.Unmarshal(rec.Body.Bytes(), &createdSkill)

	// Delete skill
	req = httptest.NewRequest("DELETE", "/api/admin/skills/"+strconvItoa(createdSkill.ID), nil)
	req.Header.Set("Authorization", authHeader)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected delete skill status 200, got %d", rec.Code)
	}

	// 7. Test Inquiries Management (Get, Mark Read, Delete)
	req = httptest.NewRequest("GET", "/api/admin/inquiries", nil)
	req.Header.Set("Authorization", authHeader)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected get inquiries status 200, got %d", rec.Code)
	}

	var inquiries []models.Inquiry
	json.Unmarshal(rec.Body.Bytes(), &inquiries)
	if len(inquiries) > 0 {
		inqID := inquiries[0].ID
		req = httptest.NewRequest("PATCH", "/api/admin/inquiries/"+strconvItoa(inqID)+"/read", nil)
		req.Header.Set("Authorization", authHeader)
		rec = httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected mark inquiry read status 200, got %d", rec.Code)
		}

		req = httptest.NewRequest("DELETE", "/api/admin/inquiries/"+strconvItoa(inqID), nil)
		req.Header.Set("Authorization", authHeader)
		rec = httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected delete inquiry status 200, got %d", rec.Code)
		}
	}
}

func strconvItoa(i int) string {
	return strconv.Itoa(i)
}

