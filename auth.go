package main

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID            int       `json:"id"`
	Username      string    `json:"username"`
	Email         string    `json:"email"`
	PasswordHash  string    `json:"-"`
	CreatedAt     time.Time `json:"created_at"`
	EmailVerified bool      `json:"email_verified"`
	AuthProvider  string    `json:"auth_provider"`
}

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Identifier string `json:"identifier"`
	Email      string `json:"email"`
	Password   string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

func register(w http.ResponseWriter, r *http.Request) {
	var request RegisterRequest

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	request.Username = strings.TrimSpace(request.Username)
	request.Email = strings.TrimSpace(request.Email)

	if request.Username == "" ||
		request.Email == "" ||
		request.Password == "" {
		http.Error(w, "All fields are required", http.StatusBadRequest)
		return
	}

	if len(request.Password) < 6 {
		http.Error(w, "Password must be at least 6 characters", http.StatusBadRequest)
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword(
		[]byte(request.Password),
		bcrypt.DefaultCost,
	)

	if err != nil {
		http.Error(w, "Password hashing failed", http.StatusInternalServerError)
		return
	}

	var user User

	err = db.QueryRow(
		context.Background(),
		`INSERT INTO users (username, email, password_hash)
		 VALUES ($1, LOWER($2), $3)
		 RETURNING id, username, email, created_at, email_verified, auth_provider`,
		request.Username,
		request.Email,
		string(passwordHash),
	).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.CreatedAt,
		&user.EmailVerified, &user.AuthProvider,
	)

	if err != nil {
		http.Error(w, "Username or email already exists", http.StatusConflict)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	verificationURL, mailErr := createAndSendVerification(r.Context(), user)
	response := map[string]interface{}{"user": user, "verification_required": true}
	emailConfigured := config.ResendAPIKey != "" || config.SMTPHost != ""
	if mailErr != nil && emailConfigured {
		http.Error(w, "Verification email could not be sent", http.StatusBadGateway)
		return
	}
	if !emailConfigured {
		response["development_verification_url"] = verificationURL
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

func login(w http.ResponseWriter, r *http.Request) {
	var request LoginRequest

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	identifier := strings.TrimSpace(request.Identifier)
	if identifier == "" {
		identifier = strings.TrimSpace(request.Email)
	}

	if identifier == "" || request.Password == "" {
		http.Error(w, "All fields are required", http.StatusBadRequest)
		return
	}

	var user User

	err = db.QueryRow(
		context.Background(),
		`SELECT id, username, email, password_hash, created_at, email_verified, auth_provider
		 FROM users
		 WHERE email = LOWER($1) OR username = $1`,
		identifier,
	).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.CreatedAt,
		&user.EmailVerified, &user.AuthProvider,
	)

	if err != nil {
		http.Error(w, "Invalid username/email or password", http.StatusUnauthorized)
		return
	}
	if !user.EmailVerified {
		http.Error(w, "E-posta adresinizi doğrulayın.", http.StatusForbidden)
		return
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(request.Password),
	)

	if err != nil {
		http.Error(w, "Invalid username/email or password", http.StatusUnauthorized)
		return
	}

	claims := jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(
		jwt.SigningMethodHS256,
		claims,
	)

	signedToken, err := token.SignedString([]byte(config.JWTSecret))

	if err != nil {
		http.Error(w, "Token creation failed", http.StatusInternalServerError)
		return
	}

	user.PasswordHash = ""

	response := LoginResponse{
		Token: signedToken,
		User:  user,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		authHeader := r.Header.Get("Authorization")

		if authHeader == "" {
			http.Error(
				w,
				"Authorization header required",
				http.StatusUnauthorized,
			)
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)

		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(
				w,
				"Invalid authorization format",
				http.StatusUnauthorized,
			)
			return
		}

		tokenString := parts[1]

		token, err := jwt.Parse(
			tokenString,
			func(token *jwt.Token) (interface{}, error) {

				if token.Method != jwt.SigningMethodHS256 {
					return nil, jwt.ErrSignatureInvalid
				}

				return []byte(config.JWTSecret), nil
			},
		)

		if err != nil || !token.Valid {
			http.Error(
				w,
				"Invalid or expired token",
				http.StatusUnauthorized,
			)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)

		if !ok {
			http.Error(
				w,
				"Invalid token claims",
				http.StatusUnauthorized,
			)
			return
		}

		userIDFloat, ok := claims["user_id"].(float64)

		if !ok {
			http.Error(
				w,
				"Invalid user ID",
				http.StatusUnauthorized,
			)
			return
		}

		userID := int(userIDFloat)

		r.Header.Set("X-User-ID", strconv.Itoa(userID))

		next.ServeHTTP(w, r)
	}
}
