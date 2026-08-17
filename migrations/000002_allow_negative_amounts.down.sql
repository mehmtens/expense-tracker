ALTER TABLE expenses ADD CONSTRAINT expenses_amount_check CHECK (amount >= 0);
