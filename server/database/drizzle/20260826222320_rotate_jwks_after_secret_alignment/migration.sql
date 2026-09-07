UPDATE "jwkss"
SET "expires_at" = now()
WHERE "expires_at" IS NULL OR "expires_at" > now();
