-- Run with psql -v media_origin='https://media.example' -f ...
-- No API keys or client secret: this client is used by a server-only endpoint.
BEGIN;
INSERT INTO oauth_client (client_id, name, disabled, scopes, redirect_uris,
  token_endpoint_auth_method, grant_types, response_types, public, require_pkce)
VALUES ('gorth-single-sign-on', 'Gorth SSO Media delegation', false,
  ARRAY['openid','profile','email','sso:read','sso:write'], '{}',
  'none', '{}', '{}', false, true)
ON CONFLICT (client_id) DO UPDATE SET
  scopes = (SELECT ARRAY(SELECT DISTINCT unnest(
    coalesce(oauth_client.scopes, '{}') || ARRAY['openid','profile','email','sso:read','sso:write'])));

INSERT INTO oauth_resource (identifier, name, allowed_scopes, access_token_ttl,
  disabled, dpop_bound_access_tokens_required, metadata)
VALUES (:'media_origin', 'Media storage', ARRAY['sso:read','sso:write'], 600, false, false,
  '{"application":"shared-media-storage"}'::jsonb)
ON CONFLICT (identifier) DO UPDATE SET
  allowed_scopes = (SELECT ARRAY(SELECT DISTINCT unnest(
    coalesce(oauth_resource.allowed_scopes, '{}') || ARRAY['sso:read','sso:write']))),
  metadata = coalesce(oauth_resource.metadata, '{}'::jsonb)
    || '{"application":"shared-media-storage"}'::jsonb,
  updated_at = now();

INSERT INTO oauth_client_resource (client_id, resource_id)
VALUES ('gorth-single-sign-on', :'media_origin')
ON CONFLICT (client_id, resource_id) DO NOTHING;
COMMIT;
