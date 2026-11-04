-- Apply explicitly before deploying the DB-backed provider. Never runs on startup.
BEGIN;
CREATE TABLE IF NOT EXISTS oauth_scope_revision (
  revision integer PRIMARY KEY CONSTRAINT oauth_scope_revision_positive CHECK (revision > 0),
  scopes text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES "user"(id) ON DELETE SET NULL
);
-- Revision 1 preserves exactly the previously supported provider catalog.
-- Client/resource policies and unsupported future scope names are not activated.
INSERT INTO oauth_scope_revision (revision, scopes)
SELECT 1, array_agg(DISTINCT scope ORDER BY scope)
FROM (
  SELECT unnest(ARRAY[
    'openid',
    'profile',
    'email',
    'offline_access',
    'sso:read',
    'sso:write',
    'storage:sso:credential',
    'chat:read',
    'chat:write',
    'video:read',
    'video:write',
    'reader:read',
    'reader:write',
    'social:read',
    'social:write',
    'task:read',
    'task:write',
    'marketplace:read',
    'marketplace:write',
    'chat:notification:publish',
    'video:notification:publish',
    'reader:notification:publish',
    'social:notification:publish',
    'task:notification:publish',
    'marketplace:notification:publish',
    'chat:discovery:write',
    'video:discovery:write',
    'reader:discovery:write',
    'social:discovery:write',
    'task:discovery:write',
    'marketplace:discovery:write'
  ]::text[]) AS scope
) catalog
WHERE scope ~ '^[!-~]+$' AND strpos(scope, chr(34)) = 0
  AND strpos(scope, chr(92)) = 0 AND length(scope) BETWEEN 1 AND 128
ON CONFLICT (revision) DO NOTHING;
COMMIT;
