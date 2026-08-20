-- Remove the legacy sample administrator without losing authored content.
-- If a real admin exists, posts are reassigned before deletion. If this is an
-- old local database with only the sample account, the account is disabled and
-- soft-deleted so foreign-key protected content remains intact.
DO $$
DECLARE
  sample_admin_id BIGINT;
  replacement_admin_id BIGINT;
BEGIN
  SELECT "id" INTO sample_admin_id
  FROM "users"
  WHERE lower("email") = 'admin@midicosmetics.local'
  LIMIT 1;

  IF sample_admin_id IS NULL THEN
    RETURN;
  END IF;

  SELECT "id" INTO replacement_admin_id
  FROM "users"
  WHERE "role" = 'ADMIN'
    AND "id" <> sample_admin_id
    AND "deleted_at" IS NULL
  ORDER BY "created_at" ASC
  LIMIT 1;

  DELETE FROM "refresh_tokens" WHERE "user_id" = sample_admin_id;
  DELETE FROM "admin_verification_tokens" WHERE "admin_id" = sample_admin_id;

  IF replacement_admin_id IS NULL THEN
    UPDATE "users"
    SET "status" = 'INACTIVE',
        "deleted_at" = COALESCE("deleted_at", NOW()),
        "password_hash" = 'DISABLED_LEGACY_SAMPLE_ACCOUNT',
        "updated_at" = NOW()
    WHERE "id" = sample_admin_id;
    RETURN;
  END IF;

  UPDATE "blog_posts"
  SET "author_id" = replacement_admin_id,
      "updated_at" = NOW()
  WHERE "author_id" = sample_admin_id;

  DELETE FROM "users" WHERE "id" = sample_admin_id;
END $$;
