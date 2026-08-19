package main

import (
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

type rateLimitEntry struct {
	count   int
	resetAt time.Time
}

type rateLimiter struct {
	mu      sync.Mutex
	entries map[string]rateLimitEntry
	calls   uint64
}

var authLimiter = &rateLimiter{entries: make(map[string]rateLimitEntry)}

func (limiter *rateLimiter) limit(scope string, maximum int, window time.Duration, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			next(w, r)
			return
		}

		now := time.Now()
		key := scope + ":" + clientIP(r)
		limiter.mu.Lock()
		entry, exists := limiter.entries[key]
		if !exists || !now.Before(entry.resetAt) {
			entry = rateLimitEntry{resetAt: now.Add(window)}
		}
		entry.count++
		limiter.entries[key] = entry
		limiter.calls++
		if limiter.calls%500 == 0 {
			for candidate, value := range limiter.entries {
				if !now.Before(value.resetAt) {
					delete(limiter.entries, candidate)
				}
			}
		}
		blocked := entry.count > maximum
		retryAfter := max(1, int(time.Until(entry.resetAt).Seconds()))
		limiter.mu.Unlock()

		if blocked {
			w.Header().Set("Retry-After", strconv.Itoa(retryAfter))
			http.Error(w, "Çok fazla deneme yaptınız. Lütfen biraz sonra tekrar deneyin.", http.StatusTooManyRequests)
			return
		}
		next(w, r)
	}
}

func clientIP(r *http.Request) string {
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		addresses := strings.Split(forwarded, ",")
		fallback := ""
		for index := len(addresses) - 1; index >= 0; index-- {
			candidate := strings.TrimSpace(addresses[index])
			if parsed := net.ParseIP(candidate); parsed != nil {
				if fallback == "" {
					fallback = candidate
				}
				if !parsed.IsPrivate() && !parsed.IsLoopback() {
					return candidate
				}
			}
		}
		if fallback != "" {
			return fallback
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil && host != "" {
		return host
	}
	return r.RemoteAddr
}
