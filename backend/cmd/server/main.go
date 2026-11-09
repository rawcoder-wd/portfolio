package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"portfolio-backend/internal/config"
	"portfolio-backend/internal/database"
	"portfolio-backend/internal/handlers"
	custommw "portfolio-backend/internal/middleware"
	"golang.org/x/time/rate"
)

type HealthResponse struct {
	Status    string    `json:"status"`
	Service   string    `json:"service"`
	Timestamp time.Time `json:"timestamp"`
}

func main() {
	cfg := config.Load()

	// Initialize Database
	database.InitDB(cfg.DBPath)

	// Ensure uploads directory exists
	if err := os.MkdirAll(cfg.UploadsDir, 0755); err != nil {
		log.Printf("Warning: Failed to ensure uploads directory: %v", err)
	}

	r := chi.NewRouter()

	// Global Middlewares
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	// CORS Configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.AllowedOrigin, "http://localhost:*", "http://127.0.0.1:*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link", "Content-Disposition"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Rate limiter for inquiries (e.g. 10 requests per minute per IP)
	inquiryLimiter := custommw.NewIPRateLimiter(rate.Limit(10.0/60.0), 5)
	// Rate limiter for admin login (e.g. 5 attempts per minute per IP)
	loginLimiter := custommw.NewIPRateLimiter(rate.Limit(5.0/60.0), 3)

	// Static uploads file server
	r.Handle("/uploads/*", http.StripPrefix("/uploads", http.FileServer(http.Dir(cfg.UploadsDir))))

	// API Routes
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

		// Public Endpoints from Phase 3
		r.Get("/portfolio-data", handlers.GetPortfolioData)
		r.Get("/cv/download", handlers.DownloadCV)

		r.Group(func(sub chi.Router) {
			sub.Use(inquiryLimiter.Limit)
			sub.Post("/inquiries", handlers.CreateInquiry)
		})

		// Admin Login (rate limited)
		r.Group(func(sub chi.Router) {
			sub.Use(loginLimiter.Limit)
			sub.Post("/admin/login", handlers.LoginHandler)
		})

		// Protected Admin Endpoints
		r.Route("/admin", func(r chi.Router) {
			r.Use(custommw.AuthMiddleware(cfg.JWTSecret))

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

	// Serve compiled React static files (`./static`) for all non-/api/* and non-/uploads/* routes
	staticDir := http.Dir("./static")
	staticFileServer := http.FileServer(staticDir)
	r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		filePath := filepath.Join("./static", path)
		if info, err := os.Stat(filePath); err == nil && !info.IsDir() {
			staticFileServer.ServeHTTP(w, r)
			return
		}
		http.ServeFile(w, r, "./static/index.html")
	})

	serverAddr := ":" + cfg.Port
	log.Printf("Portfolio backend server running on http://localhost%s", serverAddr)
	if err := http.ListenAndServe(serverAddr, r); err != nil {
		log.Fatalf("Server stopped: %v", err)
	}
}
