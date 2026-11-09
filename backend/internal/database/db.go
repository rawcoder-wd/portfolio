package database

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

func InitDB(dbPath string) {
	// Ensure directory exists
	dir := filepath.Dir(dbPath)
	if dir != "." && dir != "" {
		if err := os.MkdirAll(dir, 0755); err != nil {
			log.Fatalf("Failed to create database directory: %v", err)
		}
	}

	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("Failed to open SQLite database: %v", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatalf("Failed to ping SQLite database: %v", err)
	}

	runMigrations()
	seedData()

	log.Println("Database connected and migrations applied successfully.")
}

func runMigrations() {
	query := `
	CREATE TABLE IF NOT EXISTS settings (
		id INTEGER PRIMARY KEY CHECK (id = 1),
		hero_title TEXT NOT NULL,
		hero_subtitle TEXT NOT NULL,
		about_text TEXT NOT NULL,
		contact_email TEXT NOT NULL,
		github_url TEXT NOT NULL,
		linkedin_url TEXT NOT NULL,
		cv_filename TEXT NOT NULL,
		calcom_api_key TEXT NOT NULL,
		calcom_username TEXT NOT NULL,
		calcom_event_slug TEXT NOT NULL,
		calcom_enabled BOOLEAN NOT NULL,
		updated_at DATETIME NOT NULL
	);

	CREATE TABLE IF NOT EXISTS projects (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		summary TEXT NOT NULL,
		description TEXT NOT NULL,
		tech_stack TEXT NOT NULL,
		image_url TEXT NOT NULL,
		live_url TEXT NOT NULL,
		repo_url TEXT NOT NULL,
		price_note TEXT NOT NULL,
		is_available BOOLEAN NOT NULL,
		display_order INTEGER NOT NULL,
		created_at DATETIME NOT NULL
	);

	CREATE TABLE IF NOT EXISTS skills (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		category TEXT NOT NULL,
		proficiency INTEGER NOT NULL,
		learning_story TEXT NOT NULL,
		display_order INTEGER NOT NULL
	);

	CREATE TABLE IF NOT EXISTS inquiries (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		type TEXT NOT NULL,
		project_id INTEGER,
		project_title TEXT,
		sender_name TEXT NOT NULL,
		sender_email TEXT NOT NULL,
		budget_or_subject TEXT NOT NULL,
		message TEXT NOT NULL,
		is_read BOOLEAN NOT NULL,
		created_at DATETIME NOT NULL
	);
	`

	_, err := DB.Exec(query)
	if err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}
}

func seedData() {
	// Seed settings if not exists
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM settings").Scan(&count)
	if err == nil && count == 0 {
		_, err = DB.Exec(`
			INSERT INTO settings (id, hero_title, hero_subtitle, about_text, contact_email, github_url, linkedin_url, cv_filename, calcom_api_key, calcom_username, calcom_event_slug, calcom_enabled, updated_at)
			VALUES (1, 'Full-Stack Software Engineer & System Architect', 'Building high-performance distributed systems, resilient backends, and polished reactive UIs.', 'I am a passionate software engineer with 6+ years of experience designing robust web applications, microservices, and modern user interfaces. I specialize in Go, TypeScript, React, and cloud-native architecture.', 'contact@example.com', 'https://github.com', 'https://linkedin.com', 'cv.pdf', '', 'username', 'consultation', 0, CURRENT_TIMESTAMP)
		`)
		if err != nil {
			log.Printf("Failed to seed settings: %v", err)
		}
	}

	// Seed sample projects if empty
	err = DB.QueryRow("SELECT COUNT(*) FROM projects").Scan(&count)
	if err == nil && count == 0 {
		_, err = DB.Exec(`
			INSERT INTO projects (title, summary, description, tech_stack, image_url, live_url, repo_url, price_note, is_available, display_order, created_at)
			VALUES 
			('Distributed SaaS Analytics Engine', 'Real-time telemetry and metrics ingestion pipeline processing 50k events/sec.', 'Engineered a high-throughput event ingestion pipeline in Go with Kafka and ClickHouse. Designed custom partitioning, rate-limiting, and an interactive React analytics dashboard.', '["Go", "TypeScript", "React", "SQLite", "Docker"]', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80', 'https://example.com', 'https://github.com', 'Available for Custom License', 1, 1, CURRENT_TIMESTAMP),
			('E-Commerce Multi-Tenant Platform', 'Scalable headless e-commerce backend with sub-50ms p99 latency.', 'Built a secure multi-tenant microservices architecture supporting dynamic tenant provisioning, Stripe webhook orchestration, and automated inventory sync.', '["Go", "PostgreSQL", "Redis", "TailwindCSS"]', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80', 'https://example.com', 'https://github.com', 'Starting at $1,200', 1, 2, CURRENT_TIMESTAMP);
		`)
		if err != nil {
			log.Printf("Failed to seed projects: %v", err)
		}
	}

	// Seed sample skills if empty
	err = DB.QueryRow("SELECT COUNT(*) FROM skills").Scan(&count)
	if err == nil && count == 0 {
		_, err = DB.Exec(`
			INSERT INTO skills (name, category, proficiency, learning_story, display_order)
			VALUES 
			('Go (Golang)', 'Backend', 95, 'Mastered Go while building concurrent distributed microservices handling millions of requests. Deep appreciation for its simplicity, fast compilation, and strong typing.', 1),
			('TypeScript & React', 'Frontend', 90, 'Built dozens of single-page applications and dashboards with strict TypeScript. Passionate about component reusability, accessibility, and state management.', 2),
			('SQLite & PostgreSQL', 'Database & DevOps', 92, 'Extensive experience optimizing relational schemas, indexing strategies, write-ahead logging, and query tuning for high-load systems.', 3),
			('Docker & Kubernetes', 'Database & DevOps', 88, 'Containerized microservices ecosystems and automated CI/CD deployment pipelines using Docker multi-stage builds and Kubernetes clusters.', 4);
		`)
		if err != nil {
			log.Printf("Failed to seed skills: %v", err)
		}
	}
}
