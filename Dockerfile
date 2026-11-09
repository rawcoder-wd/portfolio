# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend Binary
FROM golang:1.22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server ./cmd/server/main.go

# Stage 3: Final Production Image
FROM alpine:3.20
WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

# Copy binary from backend-builder
COPY --from=backend-builder /app/backend/server /app/server

# Copy built frontend assets from frontend-builder into ./static
COPY --from=frontend-builder /app/frontend/dist /app/static

# Create default data directory for persistent volume (SQLite & uploads)
RUN mkdir -p /app/data/uploads

ENV PORT=8080
ENV DATA_DIR=/app/data

EXPOSE 8080

CMD ["./server"]
