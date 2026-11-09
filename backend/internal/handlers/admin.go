package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"portfolio-backend/internal/database"
	"portfolio-backend/internal/models"
)

// GetAdminSettings handles GET /api/admin/settings
func GetAdminSettings(w http.ResponseWriter, r *http.Request) {
	db := database.DB
	var s models.Settings
	err := db.QueryRow(`
		SELECT id, hero_title, hero_subtitle, about_text, contact_email, github_url, linkedin_url, 
		       cv_filename, calcom_api_key, calcom_username, calcom_event_slug, calcom_enabled, updated_at
		FROM settings WHERE id = 1
	`).Scan(
		&s.ID, &s.HeroTitle, &s.HeroSubtitle, &s.AboutText, &s.ContactEmail,
		&s.GithubURL, &s.LinkedinURL, &s.CVFilename, &s.CalcomAPIKey,
		&s.CalcomUsername, &s.CalcomEventSlug, &s.CalcomEnabled, &s.UpdatedAt,
	)

	if err != nil {
		http.Error(w, `{"error":"Settings not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(s)
}

// UpdateAdminSettings handles PUT /api/admin/settings
func UpdateAdminSettings(w http.ResponseWriter, r *http.Request) {
	var req models.Settings
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	db := database.DB

	// If calcom_api_key is empty in request, keep existing key from DB
	apiKeyToSave := req.CalcomAPIKey
	if apiKeyToSave == "" {
		var existingKey string
		err := db.QueryRow("SELECT calcom_api_key FROM settings WHERE id = 1").Scan(&existingKey)
		if err == nil {
			apiKeyToSave = existingKey
		}
	}

	_, err := db.Exec(`
		UPDATE settings 
		SET hero_title = ?, hero_subtitle = ?, about_text = ?, contact_email = ?, 
		    github_url = ?, linkedin_url = ?, calcom_api_key = ?, calcom_username = ?, 
		    calcom_event_slug = ?, calcom_enabled = ?, updated_at = ?
		WHERE id = 1
	`, req.HeroTitle, req.HeroSubtitle, req.AboutText, req.ContactEmail,
		req.GithubURL, req.LinkedinURL, apiKeyToSave, req.CalcomUsername,
		req.CalcomEventSlug, req.CalcomEnabled, time.Now().UTC())

	if err != nil {
		http.Error(w, `{"error":"Failed to update settings"}`, http.StatusInternalServerError)
		return
	}

	// Return updated settings
	GetAdminSettings(w, r)
}

// CreateProject handles POST /api/admin/projects
func CreateProject(w http.ResponseWriter, r *http.Request) {
	var p models.Project
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(p.Title) == "" {
		http.Error(w, `{"error":"Project title is required"}`, http.StatusBadRequest)
		return
	}

	if p.TechStack == "" {
		p.TechStack = "[]"
	}

	db := database.DB
	res, err := db.Exec(`
		INSERT INTO projects (title, summary, description, tech_stack, image_url, live_url, repo_url, price_note, is_available, display_order, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
	`, p.Title, p.Summary, p.Description, p.TechStack, p.ImageURL, p.LiveURL, p.RepoURL, p.PriceNote, p.IsAvailable, p.DisplayOrder)

	if err != nil {
		http.Error(w, `{"error":"Failed to create project"}`, http.StatusInternalServerError)
		return
	}

	id, _ := res.LastInsertId()
	p.ID = int(id)
	p.CreatedAt = time.Now().UTC()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(p)
}

// UpdateProject handles PUT /api/admin/projects/{id}
func UpdateProject(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"Invalid project ID"}`, http.StatusBadRequest)
		return
	}

	var p models.Project
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	db := database.DB
	_, err = db.Exec(`
		UPDATE projects 
		SET title = ?, summary = ?, description = ?, tech_stack = ?, image_url = ?, 
		    live_url = ?, repo_url = ?, price_note = ?, is_available = ?, display_order = ?
		WHERE id = ?
	`, p.Title, p.Summary, p.Description, p.TechStack, p.ImageURL, p.LiveURL, p.RepoURL, p.PriceNote, p.IsAvailable, p.DisplayOrder, id)

	if err != nil {
		http.Error(w, `{"error":"Failed to update project"}`, http.StatusInternalServerError)
		return
	}

	p.ID = id
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(p)
}

// DeleteProject handles DELETE /api/admin/projects/{id}
func DeleteProject(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"Invalid project ID"}`, http.StatusBadRequest)
		return
	}

	db := database.DB
	_, err = db.Exec("DELETE FROM projects WHERE id = ?", id)
	if err != nil {
		http.Error(w, `{"error":"Failed to delete project"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{"success": true, "message": "Project deleted successfully"})
}

// CreateSkill handles POST /api/admin/skills
func CreateSkill(w http.ResponseWriter, r *http.Request) {
	var s models.Skill
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(s.Name) == "" {
		http.Error(w, `{"error":"Skill name is required"}`, http.StatusBadRequest)
		return
	}

	db := database.DB
	res, err := db.Exec(`
		INSERT INTO skills (name, category, proficiency, learning_story, display_order)
		VALUES (?, ?, ?, ?, ?)
	`, s.Name, s.Category, s.Proficiency, s.LearningStory, s.DisplayOrder)

	if err != nil {
		http.Error(w, `{"error":"Failed to create skill"}`, http.StatusInternalServerError)
		return
	}

	id, _ := res.LastInsertId()
	s.ID = int(id)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(s)
}

// UpdateSkill handles PUT /api/admin/skills/{id}
func UpdateSkill(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"Invalid skill ID"}`, http.StatusBadRequest)
		return
	}

	var s models.Skill
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	db := database.DB
	_, err = db.Exec(`
		UPDATE skills 
		SET name = ?, category = ?, proficiency = ?, learning_story = ?, display_order = ?
		WHERE id = ?
	`, s.Name, s.Category, s.Proficiency, s.LearningStory, s.DisplayOrder, id)

	if err != nil {
		http.Error(w, `{"error":"Failed to update skill"}`, http.StatusInternalServerError)
		return
	}

	s.ID = id
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(s)
}

// DeleteSkill handles DELETE /api/admin/skills/{id}
func DeleteSkill(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"Invalid skill ID"}`, http.StatusBadRequest)
		return
	}

	db := database.DB
	_, err = db.Exec("DELETE FROM skills WHERE id = ?", id)
	if err != nil {
		http.Error(w, `{"error":"Failed to delete skill"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{"success": true, "message": "Skill deleted successfully"})
}

// GetAdminInquiries handles GET /api/admin/inquiries
func GetAdminInquiries(w http.ResponseWriter, r *http.Request) {
	db := database.DB

	query := `SELECT id, type, project_id, project_title, sender_name, sender_email, budget_or_subject, message, is_read, created_at FROM inquiries`
	args := []any{}

	typeFilter := r.URL.Query().Get("type")
	if typeFilter != "" {
		query += ` WHERE type = ?`
		args = append(args, typeFilter)
	}

	query += ` ORDER BY created_at DESC`

	rows, err := db.Query(query, args...)
	if err != nil {
		http.Error(w, `{"error":"Database error"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	inquiries := []models.Inquiry{}
	for rows.Next() {
		var i models.Inquiry
		if err := rows.Scan(
			&i.ID, &i.Type, &i.ProjectID, &i.ProjectTitle,
			&i.SenderName, &i.SenderEmail, &i.BudgetOrSubject,
			&i.Message, &i.IsRead, &i.CreatedAt,
		); err != nil {
			continue
		}
		inquiries = append(inquiries, i)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(inquiries)
}

// MarkInquiryRead handles PATCH /api/admin/inquiries/{id}/read
func MarkInquiryRead(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"Invalid inquiry ID"}`, http.StatusBadRequest)
		return
	}

	db := database.DB
	_, err = db.Exec("UPDATE inquiries SET is_read = 1 WHERE id = ?", id)
	if err != nil {
		http.Error(w, `{"error":"Failed to update inquiry status"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{"success": true, "message": "Inquiry marked as read"})
}

// DeleteInquiry handles DELETE /api/admin/inquiries/{id}
func DeleteInquiry(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"Invalid inquiry ID"}`, http.StatusBadRequest)
		return
	}

	db := database.DB
	_, err = db.Exec("DELETE FROM inquiries WHERE id = ?", id)
	if err != nil {
		http.Error(w, `{"error":"Failed to delete inquiry"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{"success": true, "message": "Inquiry deleted successfully"})
}
