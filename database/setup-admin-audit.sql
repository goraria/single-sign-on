-- Apply manually only when audit_log is absent. Existing rows are preserved.
-- This matches database/schema.ts; no Better Auth schema changes are required.
DO $$ BEGIN
  CREATE TYPE public.audit_outcome_enum AS ENUM ('success', 'failure');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organization(id) ON DELETE SET NULL,
  action varchar(128) NOT NULL,
  outcome public.audit_outcome_enum NOT NULL,
  resource_type varchar(128),
  resource_id text,
  ip_address text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_actor_user_id_idx ON public.audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS audit_log_organization_id_idx ON public.audit_log(organization_id);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log(created_at);
