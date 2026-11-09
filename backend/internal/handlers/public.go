package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"portfolio-backend/internal/database"
	"portfolio-backend/internal/models"
)

type PortfolioDataResponse struct {
	Settings models.Settings  `json:"settings"`
	Skills   []models.Skill   `json:"skills"`
	Projects []models.Project `json:"projects"`
}

// GetPortfolioData handles GET /api/portfolio-data
// Returns public settings (masking sensitive API keys), skills ordered by display_order, and projects ordered by display_order
func GetPortfolioData(w http.ResponseWriter, r *http.Request) {
	db := database.DB

	// 1. Fetch settings (id = 1)
	var settings models.Settings
	err := db.QueryRow(`
		SELECT id, hero_title, hero_subtitle, about_text, contact_email, github_url, linkedin_url, 
		       cv_filename, calcom_username, calcom_event_slug, calcom_enabled, updated_at
		FROM settings WHERE id = 1
	`).Scan(
		&settings.ID,
		&settings.HeroTitle,
		&settings.HeroSubtitle,
		&settings.AboutText,
		&settings.ContactEmail,
		&settings.GithubURL,
		&settings.LinkedinURL,
		&settings.CVFilename,
		&settings.CalcomUsername,
		&settings.CalcomEventSlug,
		&settings.CalcomEnabled,
		&settings.UpdatedAt,
	)

	if err != nil && err != sql.ErrNoRows {
		http.Error(w, `{"error":"Database error"}`, http.StatusInternalServerError)
		return
	}
	// Explicitly ensure CalcomAPIKey is empty/omitted in public output
	settings.CalcomAPIKey = ""

	// 2. Fetch skills
	skillsRows, err := db.Query(`
		SELECT id, name, category, proficiency, learning_story, display_order 
		FROM skills ORDER BY display_order ASC, id ASC
	`)
	if err != nil {
		http.Error(w, `{"error":"Database error"}`, http.StatusInternalServerError)
		return
	}
	defer skillsRows.Close()

	skills := []models.Skill{}
	for skillsRows.Next() {
		var s models.Skill
		if err := skillsRows.Scan(&s.ID, &s.Name, &s.Category, &s.Proficiency, &s.LearningStory, &s.DisplayOrder); err != nil {
			continue
		}
		skills = append(skills, s)
	}

	// 3. Fetch projects
	projectRows, err := db.Query(`
		SELECT id, title, summary, description, tech_stack, image_url, live_url, repo_url, 
		       price_note, is_available, display_order, created_at 
		FROM projects ORDER BY display_order ASC, id ASC
	`)
	if err != nil {
		http.Error(w, `{"error":"Database error"}`, http.StatusInternalServerError)
		return
	}
	defer projectRows.Close()

	projects := []models.Project{}
	for projectRows.Next() {
		var p models.Project
		if err := projectRows.Scan(
			&p.ID, &p.Title, &p.Summary, &p.Description, &p.TechStack,
			&p.ImageURL, &p.LiveURL, &p.RepoURL, &p.PriceNote,
			&p.IsAvailable, &p.DisplayOrder, &p.CreatedAt,
		); err != nil {
			continue
		}
		projects = append(projects, p)
	}

	response := PortfolioDataResponse{
		Settings: settings,
		Skills:   skills,
		Projects: projects,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

type CreateInquiryRequest struct {
	Type            string `json:"type"` // "contact" or "purchase_request"
	ProjectID       *int   `json:"project_id"`
	SenderName      string `json:"sender_name"`
	SenderEmail     string `json:"sender_email"`
	BudgetOrSubject string `json:"budget_or_subject"`
	Message         string `json:"message"`
}

// CreateInquiry handles POST /api/inquiries
// Validates input and creates a contact message or purchase request
func CreateInquiry(w http.ResponseWriter, r *http.Request) {
	var req CreateInquiryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	// Basic validation
	req.Type = strings.TrimSpace(req.Type)
	req.SenderName = strings.TrimSpace(req.SenderName)
	req.SenderEmail = strings.TrimSpace(req.SenderEmail)
	req.Message = strings.TrimSpace(req.Message)

	if req.Type != "contact" && req.Type != "purchase_request" {
		http.Error(w, `{"error":"Invalid inquiry type. Must be 'contact' or 'purchase_request'"}`, http.StatusBadRequest)
		return
	}
	if req.SenderName == "" || req.SenderEmail == "" || req.Message == "" {
		http.Error(w, `{"error":"sender_name, sender_email, and message are required"}`, http.StatusBadRequest)
		return
	}
	if !strings.Contains(req.SenderEmail, "@") || !strings.Contains(req.SenderEmail, ".") {
		http.Error(w, `{"error":"Invalid email address format"}`, http.StatusBadRequest)
		return
	}

	db := database.DB
	var projectTitle *string

	if req.ProjectID != nil {
		var title string
		err := db.QueryRow("SELECT title FROM projects WHERE id = ?", *req.ProjectID).Scan(&title)
		if err == nil {
			projectTitle = &title
		}
	}

	res, err := db.Exec(`
		INSERT INTO inquiries (type, project_id, project_title, sender_name, sender_email, budget_or_subject, message, is_read, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
	`, req.Type, req.ProjectID, projectTitle, req.SenderName, req.SenderEmail, req.BudgetOrSubject, req.Message)

	if err != nil {
		http.Error(w, `{"error":"Failed to save inquiry"}`, http.StatusInternalServerError)
		return
	}

	inquiryID, _ := res.LastInsertId()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"success":    true,
		"message":    "Inquiry submitted successfully",
		"inquiry_id": inquiryID,
	})
}

// DownloadCV handles GET /api/cv/download
// Serves the uploaded CV PDF file
func DownloadCV(w http.ResponseWriter, r *http.Request) {
	// Determine uploads directory from environment or default
	uploadsDir := os.Getenv("UPLOADS_DIR")
	if uploadsDir == "" {
		uploadsDir = "./uploads"
	}

	cvPath := filepath.Join(uploadsDir, "cv.pdf")

	// Check if file exists
	if _, err := os.Stat(cvPath); os.IsNotExist(err) {
		// Try fallback to any pdf in uploads if cv.pdf doesn't exist yet
		entries, readErr := os.ReadDir(uploadsDir)
		if readErr == nil {
			for _, entry := range entries {
				if !entry.IsDir() && strings.HasSuffix(strings.ToLower(entry.Name()), ".pdf") {
					cvPath = filepath.Join(uploadsDir, entry.Name())
					break
				}
			}
		}
	}

	if _, err := os.Stat(cvPath); os.IsNotExist(err) {
		http.Error(w, `{"error":"CV document not found. Please upload one via admin panel."}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", `attachment; filename="Developer_CV.pdf"`)
	http.ServeFile(w, r, cvPath)
}
