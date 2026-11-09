package models

import "time"

type Settings struct {
	ID              int       `json:"id" db:"id"`
	HeroTitle       string    `json:"hero_title" db:"hero_title"`
	HeroSubtitle    string    `json:"hero_subtitle" db:"hero_subtitle"`
	AboutText       string    `json:"about_text" db:"about_text"`
	ContactEmail    string    `json:"contact_email" db:"contact_email"`
	GithubURL       string    `json:"github_url" db:"github_url"`
	LinkedinURL     string    `json:"linkedin_url" db:"linkedin_url"`
	CVFilename      string    `json:"cv_filename" db:"cv_filename"`
	CalcomAPIKey    string    `json:"calcom_api_key,omitempty" db:"calcom_api_key"` // omitted/masked in public API
	CalcomUsername  string    `json:"calcom_username" db:"calcom_username"`
	CalcomEventSlug string    `json:"calcom_event_slug" db:"calcom_event_slug"`
	CalcomEnabled   bool      `json:"calcom_enabled" db:"calcom_enabled"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

type Project struct {
	ID           int       `json:"id" db:"id"`
	Title        string    `json:"title" db:"title"`
	Summary      string    `json:"summary" db:"summary"`
	Description  string    `json:"description" db:"description"`
	TechStack    string    `json:"tech_stack" db:"tech_stack"` // JSON string or comma-separated
	ImageURL     string    `json:"image_url" db:"image_url"`
	LiveURL      string    `json:"live_url" db:"live_url"`
	RepoURL      string    `json:"repo_url" db:"repo_url"`
	PriceNote    string    `json:"price_note" db:"price_note"`
	IsAvailable  bool      `json:"is_available" db:"is_available"`
	DisplayOrder int       `json:"display_order" db:"display_order"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

type Skill struct {
	ID           int       `json:"id" db:"id"`
	Name         string    `json:"name" db:"name"`
	Category     string    `json:"category" db:"category"`
	Proficiency  int       `json:"proficiency" db:"proficiency"` // 1-100
	LearningStory string   `json:"learning_story" db:"learning_story"`
	DisplayOrder int       `json:"display_order" db:"display_order"`
}

type Inquiry struct {
	ID                int       `json:"id" db:"id"`
	Type              string    `json:"type" db:"type"` // "contact" or "purchase_request"
	ProjectID         *int      `json:"project_id,omitempty" db:"project_id"`
	ProjectTitle      *string   `json:"project_title,omitempty" db:"project_title"`
	SenderName        string    `json:"sender_name" db:"sender_name"`
	SenderEmail       string    `json:"sender_email" db:"sender_email"`
	BudgetOrSubject   string    `json:"budget_or_subject" db:"budget_or_subject"`
	Message           string    `json:"message" db:"message"`
	IsRead            bool      `json:"is_read" db:"is_read"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
}
