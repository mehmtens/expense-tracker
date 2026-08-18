DROP TABLE IF EXISTS email_verification_tokens;
DROP INDEX IF EXISTS users_provider_id_idx;
ALTER TABLE users DROP COLUMN IF EXISTS provider_id;
ALTER TABLE users DROP COLUMN IF EXISTS auth_provider;
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;
