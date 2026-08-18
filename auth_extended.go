package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"html"
	"io"
	"net/http"
	"net/smtp"
	"net/url"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func randomToken(bytes int) (string, error) {
	b := make([]byte, bytes)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func tokenHash(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func createAndSendVerification(ctx context.Context, user User) (string, error) {
	token, err := randomToken(32)
	if err != nil {
		return "", err
	}
	_, err = db.Exec(ctx, `DELETE FROM email_verification_tokens WHERE user_id=$1`, user.ID)
	if err == nil {
		_, err = db.Exec(ctx, `INSERT INTO email_verification_tokens(user_id, token_hash, expires_at) VALUES($1,$2,$3)`, user.ID, tokenHash(token), time.Now().Add(24*time.Hour))
	}
	if err != nil {
		return "", err
	}
	verifyURL := strings.TrimRight(config.FrontendURL, "/") + "/?verify=" + url.QueryEscape(token)
	if config.ResendAPIKey != "" {
		return verifyURL, sendVerificationWithResend(ctx, user, verifyURL)
	}
	if config.SMTPHost == "" {
		return verifyURL, nil
	}
	from := config.SMTPFrom
	if from == "" {
		from = config.SMTPUser
	}
	subject := "Bütçe hesabınızı doğrulayın"
	body := fmt.Sprintf("Merhaba %s,\r\n\r\nHesabınızı doğrulamak için bu bağlantıyı açın:\r\n%s\r\n\r\nBağlantı 24 saat geçerlidir.", user.Username, verifyURL)
	message := []byte("From: " + from + "\r\nTo: " + user.Email + "\r\nSubject: " + subject + "\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n" + body)
	auth := smtp.PlainAuth("", config.SMTPUser, config.SMTPPassword, config.SMTPHost)
	return verifyURL, smtp.SendMail(config.SMTPHost+":"+config.SMTPPort, auth, from, []string{user.Email}, message)
}

func sendVerificationWithResend(ctx context.Context, user User, verifyURL string) error {
	payload, err := json.Marshal(map[string]interface{}{
		"from":    config.EmailFrom,
		"to":      []string{user.Email},
		"subject": "Flowly hesabınızı doğrulayın",
		"text": fmt.Sprintf(
			"Merhaba %s,\n\nHesabınızı doğrulamak için bu bağlantıyı açın:\n%s\n\nBağlantı 24 saat geçerlidir.",
			user.Username,
			verifyURL,
		),
	})
	if err != nil {
		return err
	}

	requestContext, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(requestContext, http.MethodPost, "https://api.resend.com/emails", strings.NewReader(string(payload)))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+config.ResendAPIKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "flowly/1.0")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		data, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return fmt.Errorf("email provider returned %s: %s", resp.Status, strings.TrimSpace(string(data)))
	}
	return nil
}

func verifyEmail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", 405)
		return
	}
	var body struct {
		Token string `json:"token"`
	}
	if json.NewDecoder(r.Body).Decode(&body) != nil || body.Token == "" {
		http.Error(w, "Geçersiz doğrulama bağlantısı.", 400)
		return
	}
	result, err := db.Exec(r.Context(), `UPDATE users SET email_verified=TRUE WHERE id=(SELECT user_id FROM email_verification_tokens WHERE token_hash=$1 AND expires_at>NOW())`, tokenHash(body.Token))
	if err != nil || result.RowsAffected() == 0 {
		http.Error(w, "Doğrulama bağlantısının süresi dolmuş veya bağlantı geçersiz.", 400)
		return
	}
	_, _ = db.Exec(r.Context(), `DELETE FROM email_verification_tokens WHERE token_hash=$1`, tokenHash(body.Token))
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"verified": true})
}

func resendVerification(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", 405)
		return
	}
	var body struct {
		Email string `json:"email"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	var user User
	err := db.QueryRow(r.Context(), `SELECT id, username, email, created_at, email_verified, auth_provider FROM users WHERE email=LOWER($1)`, strings.TrimSpace(body.Email)).Scan(&user.ID, &user.Username, &user.Email, &user.CreatedAt, &user.EmailVerified, &user.AuthProvider)
	if err == nil && !user.EmailVerified {
		_, _ = createAndSendVerification(r.Context(), user)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Hesap uygunsa doğrulama e-postası gönderildi."})
}

func googleStart(w http.ResponseWriter, r *http.Request) {
	if config.GoogleClientID == "" || config.GoogleClientSecret == "" {
		http.Error(w, "Google ile giriş henüz yapılandırılmadı.", 503)
		return
	}
	state, _ := randomToken(24)
	http.SetCookie(w, &http.Cookie{Name: "oauth_state", Value: state, Path: "/", HttpOnly: true, Secure: r.TLS != nil, SameSite: http.SameSiteLaxMode, MaxAge: 600})
	q := url.Values{"client_id": {config.GoogleClientID}, "redirect_uri": {config.GoogleRedirectURL}, "response_type": {"code"}, "scope": {"openid email profile"}, "state": {state}, "prompt": {"select_account"}}
	http.Redirect(w, r, "https://accounts.google.com/o/oauth2/v2/auth?"+q.Encode(), http.StatusFound)
}

func googleCallback(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("oauth_state")
	if err != nil || subtle.ConstantTimeCompare([]byte(cookie.Value), []byte(r.URL.Query().Get("state"))) != 1 {
		redirectAuthError(w, r, "Güvenlik doğrulaması başarısız.")
		return
	}
	form := url.Values{"code": {r.URL.Query().Get("code")}, "client_id": {config.GoogleClientID}, "client_secret": {config.GoogleClientSecret}, "redirect_uri": {config.GoogleRedirectURL}, "grant_type": {"authorization_code"}}
	resp, err := http.PostForm("https://oauth2.googleapis.com/token", form)
	if err != nil || resp.StatusCode != 200 {
		redirectAuthError(w, r, "Google oturumu açılamadı.")
		return
	}
	defer resp.Body.Close()
	var tokens struct {
		AccessToken string `json:"access_token"`
	}
	_ = json.NewDecoder(resp.Body).Decode(&tokens)
	req, _ := http.NewRequest("GET", "https://openidconnect.googleapis.com/v1/userinfo", nil)
	req.Header.Set("Authorization", "Bearer "+tokens.AccessToken)
	profileResp, err := http.DefaultClient.Do(req)
	if err != nil || profileResp.StatusCode != 200 {
		redirectAuthError(w, r, "Google profili alınamadı.")
		return
	}
	defer profileResp.Body.Close()
	data, _ := io.ReadAll(io.LimitReader(profileResp.Body, 1<<20))
	var profile struct {
		Sub, Email, Name string
		EmailVerified    bool `json:"email_verified"`
	}
	if json.Unmarshal(data, &profile) != nil || !profile.EmailVerified {
		redirectAuthError(w, r, "Doğrulanmış Google e-postası gerekli.")
		return
	}
	username := strings.ToLower(strings.Map(func(c rune) rune {
		if c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9' {
			return c
		}
		return -1
	}, strings.Split(profile.Email, "@")[0]))
	if username == "" {
		username = "user"
	}
	username += "_" + profile.Sub[len(profile.Sub)-6:]
	dummy, _ := bcrypt.GenerateFromPassword([]byte(profile.Sub+time.Now().String()), bcrypt.DefaultCost)
	var user User
	err = db.QueryRow(r.Context(), `INSERT INTO users(username,email,password_hash,email_verified,auth_provider,provider_id) VALUES($1,LOWER($2),$3,TRUE,'google',$4) ON CONFLICT(email) DO UPDATE SET email_verified=TRUE, provider_id=COALESCE(users.provider_id,EXCLUDED.provider_id) RETURNING id,username,email,created_at,email_verified,auth_provider`, username, profile.Email, string(dummy), profile.Sub).Scan(&user.ID, &user.Username, &user.Email, &user.CreatedAt, &user.EmailVerified, &user.AuthProvider)
	if err != nil {
		redirectAuthError(w, r, "Hesap oluşturulamadı.")
		return
	}
	token, err := issueToken(user)
	if err != nil {
		redirectAuthError(w, r, "Oturum oluşturulamadı.")
		return
	}
	userJSON, _ := json.Marshal(user)
	target := strings.TrimRight(config.FrontendURL, "/") + "/?oauth_token=" + url.QueryEscape(token) + "&oauth_user=" + url.QueryEscape(base64.RawURLEncoding.EncodeToString(userJSON))
	http.Redirect(w, r, target, http.StatusFound)
}

func issueToken(user User) (string, error) {
	claims := jwt.MapClaims{"user_id": user.ID, "email": user.Email, "exp": time.Now().Add(24 * time.Hour).Unix(), "iat": time.Now().Unix()}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(config.JWTSecret))
}
func redirectAuthError(w http.ResponseWriter, r *http.Request, message string) {
	http.Redirect(w, r, strings.TrimRight(config.FrontendURL, "/")+"/?auth_error="+url.QueryEscape(html.EscapeString(message)), http.StatusFound)
}
