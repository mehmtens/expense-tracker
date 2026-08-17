package main

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type Expense struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Amount    float64   `json:"amount"`
	Category  string    `json:"category"`
	CreatedAt time.Time `json:"created_at"`
	UserID    int       `json:"user_id"`
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-ID")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func getUserID(r *http.Request) (int, error) {
	return strconv.Atoi(r.Header.Get("X-User-ID"))
}

func getExpenses(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserID(r)

	if err != nil {
		http.Error(w, "Invalid user", http.StatusUnauthorized)
		return
	}

	rows, err := db.Query(
		context.Background(),
		`SELECT id, title, amount, category, created_at, user_id
		 FROM expenses
		 WHERE user_id = $1
		 ORDER BY id`,
		userID,
	)

	if err != nil {
		println("DATABASE ERROR:", err.Error())
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	defer rows.Close()

	expenses := []Expense{}

	for rows.Next() {
		var expense Expense

		err := rows.Scan(
			&expense.ID,
			&expense.Title,
			&expense.Amount,
			&expense.Category,
			&expense.CreatedAt,
			&expense.UserID,
		)

		if err != nil {
			println("SCAN ERROR:", err.Error())
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		expenses = append(expenses, expense)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(expenses)
}

func createExpense(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserID(r)

	if err != nil {
		http.Error(w, "Invalid user", http.StatusUnauthorized)
		return
	}

	var expense Expense

	err = json.NewDecoder(r.Body).Decode(&expense)

	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	err = db.QueryRow(
		context.Background(),
		`INSERT INTO expenses (title, amount, category, user_id)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, created_at`,
		expense.Title,
		expense.Amount,
		expense.Category,
		userID,
	).Scan(
		&expense.ID,
		&expense.CreatedAt,
	)

	if err != nil {
		println("DATABASE ERROR:", err.Error())
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	expense.UserID = userID

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(expense)
}

func getExpenseByID(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserID(r)

	if err != nil {
		http.Error(w, "Invalid user", http.StatusUnauthorized)
		return
	}

	idString := strings.TrimPrefix(r.URL.Path, "/expenses/")

	id, err := strconv.Atoi(idString)

	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var expense Expense

	err = db.QueryRow(
		context.Background(),
		`SELECT id, title, amount, category, created_at, user_id
		 FROM expenses
		 WHERE id = $1 AND user_id = $2`,
		id,
		userID,
	).Scan(
		&expense.ID,
		&expense.Title,
		&expense.Amount,
		&expense.Category,
		&expense.CreatedAt,
		&expense.UserID,
	)

	if err != nil {
		http.Error(w, "Expense not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(expense)
}

func updateExpense(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserID(r)

	if err != nil {
		http.Error(w, "Invalid user", http.StatusUnauthorized)
		return
	}

	idString := strings.TrimPrefix(r.URL.Path, "/expenses/")

	id, err := strconv.Atoi(idString)

	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var updatedExpense Expense

	err = json.NewDecoder(r.Body).Decode(&updatedExpense)

	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	result, err := db.Exec(
		context.Background(),
		`UPDATE expenses
		 SET title = $1,
		     amount = $2,
		     category = $3
		 WHERE id = $4 AND user_id = $5`,
		updatedExpense.Title,
		updatedExpense.Amount,
		updatedExpense.Category,
		id,
		userID,
	)

	if err != nil {
		println("DATABASE ERROR:", err.Error())
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(w, "Expense not found", http.StatusNotFound)
		return
	}

	updatedExpense.ID = id
	updatedExpense.UserID = userID

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedExpense)
}

func deleteExpense(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserID(r)

	if err != nil {
		http.Error(w, "Invalid user", http.StatusUnauthorized)
		return
	}

	idString := strings.TrimPrefix(r.URL.Path, "/expenses/")

	id, err := strconv.Atoi(idString)

	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	result, err := db.Exec(
		context.Background(),
		"DELETE FROM expenses WHERE id = $1 AND user_id = $2",
		id,
		userID,
	)

	if err != nil {
		println("DATABASE ERROR:", err.Error())
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(w, "Expense not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func main() {
	var err error

	config, err = loadConfig()
	if err != nil {
		panic(err)
	}

	err = connectDatabase()

	if err != nil {
		panic(databaseError(err))
	}

	defer db.Close(context.Background())

	println("Connected to PostgreSQL!")
	println("Server running on http://localhost:" + config.Port)

	http.HandleFunc("/register", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		register(w, r)
	})

	http.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		login(w, r)
	})

	http.HandleFunc("/expenses", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			getExpenses(w, r)

		case http.MethodPost:
			createExpense(w, r)

		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	http.HandleFunc("/expenses/", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			getExpenseByID(w, r)

		case http.MethodPut:
			updateExpense(w, r)

		case http.MethodDelete:
			deleteExpense(w, r)

		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	err = http.ListenAndServe(":"+config.Port, enableCORS(http.DefaultServeMux))

	if err != nil {
		panic(err)
	}
}
