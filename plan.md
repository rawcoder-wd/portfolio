# Project Implementation Plan: Full-Stack Developer Portfolio

## 1. Project Overview
A decoupled, single-page developer portfolio website featuring a **Go (Golang)** REST API backend and a **React (Vite + TypeScript + Tailwind CSS)** frontend. The public site is a sleek, responsive one-page experience paired with a protected **Super-User Control Panel** (`/admin`) to dynamically manage all content without a multi-user registration system.

---

## 2. Tech Stack & Architecture
* **Backend:** Go (`net/http` standard router or `go-chi/chi`), SQLite (`modernc.org/sqlite` for pure-Go, CGO-free single-file persistence), JWT (`golang-jwt/jwt/v5`) for super-user authentication, and Go's built-in in-memory rate limiting (`golang.org/x/time/rate`) for form/login protection (no Redis required).
* **Frontend:** React 18+ (Vite), TypeScript, Tailwind CSS, `lucide-react` icons, and `@calcom/embed-react` for consultation booking.
* **File Storage:** Local `./backend/uploads/` directory served statically by Go for the dynamic CV (`cv.pdf`) and project preview images.
* **AI Agent Token Optimization:** Include a `.geminiignore` file at the project root ignoring `node_modules/`, `dist/`, `.git/`, `*.db`, and `uploads/` so the coding agent never wastes context tokens scanning heavy folders.

---

## 3. Directory Structure
```text
portfolio/
├── .geminiignore
├── plan.md
├── backend/
│   ├── .env.example                # ADMIN_PASSWORD, JWT_SECRET, PORT, ALLOWED_ORIGIN
│   ├── cmd/server/main.go          # Server setup, CORS, rate limiter, static uploads, routes
│   ├── internal/
│   │   ├── config/config.go        # Loads environment variables with safe defaults
│   │   ├── database/db.go          # Pure-Go SQLite connection, auto-migrations & initial seed
│   │   ├── middleware/
│   │   │   ├── auth.go             # JWT Bearer token verification for /api/admin/*
│   │   │   └── ratelimit.go        # In-memory IP rate limiter for login & inquiry endpoints
│   │   ├── models/models.go        # Structs for Settings, Project, Skill, Inquiry
│   │   └── handlers/
│   │       ├── auth.go             # POST /api/admin/login
│   │       ├── public.go           # GET /api/portfolio-data, POST /api/inquiries
│   │       ├── admin.go            # CRUD for projects, skills, settings, inquiries
│   │       ├── upload.go           # Multipart upload handlers for CV (PDF) & images
│   │       └── calcom.go           # Validates Cal.com API key & fetches/saves booking config
│   ├── uploads/                    # Stores cv.pdf and project images
│   └── go.mod
└── frontend/
    ├── src/
    │   ├── api/client.ts           # Typed API client with automatic JWT header injection
    │   ├── types/index.ts          # Shared TypeScript interfaces matching Go JSON structs
    │   ├── components/
    │   │   ├── Navbar.tsx          # Sticky smooth-scroll nav + Download CV button
    │   │   ├── Hero.tsx            # Headline, role tagline, "Book Consultation" & "View Work" CTAs
    │   │   ├── About.tsx           # Developer bio, highlights, and direct CV download button
    │   │   ├── Skills.tsx          # Categorized skills with proficiency meter + "How I Learned It" story
    │   │   ├── Portfolio.tsx       # Filterable project cards + "Request to Buy / License" modal
    │   │   ├── Booking.tsx         # Embedded Cal.com scheduler configured via admin settings
    │   │   ├── Contact.tsx         # Direct contact form with validation & feedback toast
    │   │   └── Footer.tsx          # Social links, quick nav, and copyright
    │   ├── pages/
    │   │   ├── Home.tsx            # Single-page layout assembling all public sections
    │   │   ├── AdminLogin.tsx      # Clean super-user password login screen
    │   │   └── AdminDashboard.tsx  # Protected tabbed control panel
    │   ├── App.tsx                 # Client router: `/` (One-Page Site) and `/admin` (Control Panel)
    │   └── main.tsx
    └── package.json
```

---

## 4. Database Schema & Core Features

### A. Single Super-User Control Panel (No User Registration)
* Zero public registration or user tables.
* Admin logs in at `/admin` using the password set in `ADMIN_PASSWORD`.
* `POST /api/admin/login` (rate-limited to 5 attempts/minute) validates the password and issues a 24-hour JWT.

### B. Portfolio Showcase & "Request to Buy" Workflow (No Cart/Checkout)
* **Table `projects`:** `id` (PK), `title`, `summary`, `description`, `tech_stack` (JSON string array), `image_url`, `live_url`, `repo_url`, `price_note` (e.g., `"Available for Custom License"` or `"Starting at $500"`), `is_available` (bool), `display_order` (int), `created_at`.
* **Visitor Experience:** Visitors inspect project details and click **"Request to Buy"**. This opens a clean modal pre-filled with the project name where the visitor enters their name, email, intended use/offer, and message (`POST /api/inquiries` with `type = "purchase_request"`).

### C. Skills Section (Expertise Level + Learning Story)
* **Table `skills`:** `id` (PK), `name`, `category` (e.g., `Backend`, `Frontend`, `Database & DevOps`), `proficiency` (int `1–100` + label like `Expert` / `Advanced`), `learning_story` (short narrative on how the skill was learned and real-world projects built with it), `display_order` (int).

### D. Cal.com Consultation Booking Integration
* **Table `settings` (single row `id = 1`):** `hero_title`, `hero_subtitle`, `about_text`, `contact_email`, `github_url`, `linkedin_url`, `cv_filename`, `calcom_api_key`, `calcom_username`, `calcom_event_slug`, `calcom_enabled` (bool).
* **Admin Setup:** Inside `/admin` -> **Cal.com Integration**, the super-user pastes their **Cal.com API Key** and **Event Slug** (e.g., `username/consultation`).
* **Backend Sync (`POST /api/admin/calcom`):** Go verifies the API key against Cal.com's API (`https://cal.com...` or `v2`), saves the credentials securely in SQLite, and returns only safe public embed settings (`calcom_username`, `calcom_event_slug`, `calcom_enabled`) inside `GET /api/portfolio-data`—never exposing the secret API key to the browser.

### E. Dynamic CV Upload & Instant Public Download
* **Admin Upload (`POST /api/admin/cv`):** Accepts `multipart/form-data` (`.pdf` only, max 10MB), saves it to `./backend/uploads/cv.pdf`, and updates `cv_filename` in `settings`.
* **Public Download (`GET /api/cv/download`):** Serves `./backend/uploads/cv.pdf` with header `Content-Disposition: attachment; filename="Developer_CV.pdf"`.

### F. Contact Form & Unified Super-User Inbox
* **Table `inquiries`:** `id` (PK), `type` (`"contact"` or `"purchase_request"`), `project_id` (nullable), `project_title` (nullable), `sender_name`, `sender_email`, `budget_or_subject`, `message`, `is_read` (bool), `created_at`.
* **Public Submission (`POST /api/inquiries`):** Rate-limited endpoint handling both general contact messages and project purchase requests.
* **Admin Inbox Tab:** Super-user views unread badge counts, filters between `"All"`, `"Purchase Requests"`, and `"Contact Messages"`, marks items read, or deletes spam.

---

## 5. REST API Specification

### Public Endpoints
* `GET /api/portfolio-data` — Single aggregated response returning `settings` (public fields only), `skills`, and `projects` for fast one-page rendering.
* `GET /api/cv/download` — Streams the uploaded CV PDF file.
* `POST /api/inquiries` — Creates a new `"contact"` or `"purchase_request"` inquiry.

### Protected Super-User Endpoints (`Authorization: Bearer <token>`)
* `POST /api/admin/login` — Authenticates super-user and returns JWT.
* `GET /api/admin/settings` & `PUT /api/admin/settings` — Reads/updates Hero, About, and social links.
* `POST /api/admin/calcom` — Validates Cal.com API key with Cal.com API and saves booking configuration.
* `POST /api/admin/cv` — Uploads/replaces the CV PDF.
* `POST /api/admin/upload-image` — Uploads a project thumbnail and returns its `/uploads/...` URL.
* `POST /api/admin/projects` | `PUT /api/admin/projects/{id}` | `DELETE /api/admin/projects/{id}` — Full project CRUD.
* `POST /api/admin/skills` | `PUT /api/admin/skills/{id}` | `DELETE /api/admin/skills/{id}` — Full skill CRUD.
* `GET /api/admin/inquiries` | `PATCH /api/admin/inquiries/{id}/read` | `DELETE /api/admin/inquiries/{id}` — Manage all client inquiries.

---

## 6. Phased Execution Guide (For AI Coding Agent)
Execute one phase at a time in **Interactive** mode and pause after each phase for verification:

* **Phase 1: Project Scaffolding & Ignore Rules.** Create `.geminiignore`, initialize `/backend` (`go mod init portfolio-backend`), initialize `/frontend` (Vite + React + TypeScript + Tailwind CSS), and set up basic Go server health check with CORS.
* **Phase 2: SQLite Database, Seed Data & Admin Auth.** Implement pure-Go SQLite migrations for `settings`, `projects`, `skills`, and `inquiries`, seed initial sample records, and implement JWT login + in-memory rate limiting middleware.
* **Phase 3: Complete Backend API & File Uploads.** Implement `GET /api/portfolio-data`, `POST /api/inquiries`, `GET /api/cv/download`, CV/image upload endpoints, Cal.com API verification handler, and all protected `/api/admin/*` CRUD endpoints.
* **Phase 4: One-Page Public Frontend.** Build the responsive single-page website (`Navbar`, `Hero`, `About` with CV download, `Skills` with proficiency + learning story, `Portfolio` with "Request to Buy" modal, `Booking` with Cal.com embed, `Contact` form, and `Footer`) wired to the Go API.
* **Phase 5: Super-User Control Panel (`/admin`).** Build `AdminLogin` and the tabbed `AdminDashboard` (Profile & CV Upload, Cal.com API Key Setup, Projects Manager, Skills Manager, and Inquiries Inbox) with end-to-end testing instructions.

## Phase 6: Dockerization & Railway Deployment Setup
* **Go Static Frontend Serving (`cmd/server/main.go`):** Configure Go to serve the compiled React static files (`./static`) for all non-`/api/*` and non-`/uploads/*` routes, falling back to `index.html` so React Router (`/admin`) works on page refresh.
* **Configurable Data Directory (`internal/config/config.go`):** Add `DATA_DIR` env var (default `./data`). Store SQLite database at `${DATA_DIR}/portfolio.db` and uploads at `${DATA_DIR}/uploads/` so a single Railway Persistent Volume preserves both DB records and uploaded CVs/images across deployments.
* **Multi-Stage `Dockerfile` (at project root):**
  * **Stage 1 (`node:20-alpine`):** Install frontend dependencies and run `npm run build`.
  * **Stage 2 (`golang:1.23-alpine`):** Copy `/backend`, set `CGO_ENABLED=0`, and build the static Go binary.
  * **Stage 3 (`alpine:latest`):** Copy the compiled Go binary, copy `/frontend/dist` to `./static`, create `/app/data/uploads`, expose `$PORT`, and run the server.
* **Local `docker-compose.yml`:** Configure single-command local Docker testing mapping `./data:/app/data` and `.env` variables.
* **`.dockerignore`:** Ignore `node_modules`, `.git`, local `data/`, and temporary build artifacts.
