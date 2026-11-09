package middleware

import (
	"net"
	"net/http"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type clientLimiter struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type IPMiddleware struct {
	mu      sync.Mutex
	clients map[string]*clientLimiter
	r       rate.Limit
	b       int
}

func NewIPRateLimiter(r rate.Limit, b int) *IPMiddleware {
	im := &IPMiddleware{
		clients: make(map[string]*clientLimiter),
		r:       r,
		b:       b,
	}

	// Background cleanup routine for stale limiters every minute
	go func() {
		for {
			time.Sleep(time.Minute)
			im.mu.Lock()
			for ip, client := range im.clients {
				if time.Since(client.lastSeen) > 3*time.Minute {
					delete(im.clients, ip)
				}
			}
			im.mu.Unlock()
		}
	}()

	return im
}

func (im *IPMiddleware) addClient(ip string) *rate.Limiter {
	im.mu.Lock()
	defer im.mu.Unlock()

	if client, exists := im.clients[ip]; exists {
		client.lastSeen = time.Now()
		return client.limiter
	}

	limiter := rate.NewLimiter(im.r, im.b)
	im.clients[ip] = &clientLimiter{
		limiter:  limiter,
		lastSeen: time.Now(),
	}
	return limiter
}

func (im *IPMiddleware) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			ip = r.RemoteAddr
		}

		limiter := im.addClient(ip)
		if !limiter.Allow() {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"error":"Rate limit exceeded. Please try again later."}`))
			return
		}

		next.ServeHTTP(w, r)
	})
}
