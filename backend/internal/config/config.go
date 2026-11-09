package config

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"
)

type Config struct {
	Port          string
	AllowedOrigin string
	AdminPassword string
	JWTSecret     string
	DBPath        string
	UploadsDir    string
}

// LoadEnvFile optionally loads key-value pairs from a .env file into the process environment
func LoadEnvFile(filename string) {
	file, err := os.Open(filename)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])
			// Only set if not already set in environment
			if os.Getenv(key) == "" {
				os.Setenv(key, value)
			}
		}
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

// Load loads the configuration from environment variables with safe fallbacks
func Load() *Config {
	LoadEnvFile(".env")

	dataDir := getEnv("DATA_DIR", "./data")

	return &Config{
		Port:          getEnv("PORT", "8080"),
		AllowedOrigin: getEnv("ALLOWED_ORIGIN", "http://localhost:5173"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "admin123"),
		JWTSecret:     getEnv("JWT_SECRET", "super-secret-jwt-key"),
		DBPath:        getEnv("DB_PATH", filepath.Join(dataDir, "portfolio.db")),
		UploadsDir:    getEnv("UPLOADS_DIR", filepath.Join(dataDir, "uploads")),
	}
}
