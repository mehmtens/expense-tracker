package main

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
)

var db *pgx.Conn

func connectDatabase() error {
	var err error

	db, err = pgx.Connect(context.Background(), config.DatabaseURL)

	if err != nil {
		return err
	}

	err = db.Ping(context.Background())
	if err != nil {
		return err
	}

	_, _ = db.Exec(context.Background(), "ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_amount_check;")

	return nil
}

func databaseError(err error) error {
	return fmt.Errorf("database connection failed: %w", err)
}
