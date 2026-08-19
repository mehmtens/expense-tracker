package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRateLimiterBlocksExcessRequests(t *testing.T) {
	limiter := &rateLimiter{entries: make(map[string]rateLimitEntry)}
	handler := limiter.limit("login", 2, time.Hour, func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) })

	for attempt := 1; attempt <= 3; attempt++ {
		request := httptest.NewRequest(http.MethodPost, "/login", nil)
		request.Header.Set("X-Forwarded-For", "203.0.113.10")
		response := httptest.NewRecorder()
		handler(response, request)
		if attempt <= 2 && response.Code != http.StatusNoContent {
			t.Fatalf("attempt %d returned %d", attempt, response.Code)
		}
		if attempt == 3 && response.Code != http.StatusTooManyRequests {
			t.Fatalf("expected 429, got %d", response.Code)
		}
	}
}

func TestClientIPUsesProxyAppendedForwardedAddress(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/", nil)
	request.Header.Set("X-Forwarded-For", "198.51.100.8, 10.0.0.1")
	if got := clientIP(request); got != "198.51.100.8" {
		t.Fatalf("unexpected client IP: %s", got)
	}
}
