-- One-time cutover to the native model names. No CASCADE and no auth reset.
DO $migration$
DECLARE item record;
BEGIN
  IF to_regclass('public.auth_team') IS NULL THEN
    IF to_regclass('public.team') IS NOT NULL
       AND to_regclass('public."teamMember"') IS NOT NULL
       AND to_regclass('public.event_log') IS NOT NULL
       AND to_regtype('public.event_log_type_enum') IS NOT NULL
       AND to_regclass('public.team_member') IS NULL
       AND to_regclass('public.auth_team_member') IS NULL
       AND to_regclass('public.authentication_event') IS NULL
       AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invitation' AND column_name='team_id' AND data_type='text') THEN
      RETURN;
    END IF;
    RAISE EXCEPTION 'unexpected_organization_schema';
  END IF;

  LOCK TABLE public.team,public.team_member,public.auth_team,public.auth_team_member,public.invitation,public.authentication_event IN ACCESS EXCLUSIVE MODE;
  -- Cloud preflight confirmed these legacy tables are empty. Refuse to erase
  -- any legacy record inserted since preflight or in another environment.
  IF EXISTS(SELECT 1 FROM public.team) OR EXISTS(SELECT 1 FROM public.team_member) THEN
    RAISE EXCEPTION 'nonempty_legacy_team_requires_explicit_data_migration';
  END IF;

  FOR item IN SELECT conname FROM pg_constraint
    WHERE conrelid='public.invitation'::regclass AND contype='f'
      AND confrelid='public.auth_team'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.invitation DROP CONSTRAINT %I',item.conname);
  END LOOP;
  ALTER TABLE public.invitation ALTER COLUMN team_id TYPE text USING team_id::text;

  DROP TABLE public.team_member;
  DROP TABLE public.team;
  ALTER TABLE public.auth_team RENAME TO team;
  ALTER TABLE public.auth_team_member RENAME TO "teamMember";

  -- Rename owned constraints as well as their PK/unique backing indexes.
  FOR item IN SELECT conrelid::regclass AS table_id,conname FROM pg_constraint
    WHERE conrelid IN('public.team'::regclass,'public."teamMember"'::regclass)
      AND conname LIKE 'auth_team%'
  LOOP
    EXECUTE format('ALTER TABLE %s RENAME CONSTRAINT %I TO %I',item.table_id,item.conname,
      replace(replace(item.conname,'auth_team_member','teamMember'),'auth_team','team'));
  END LOOP;
  ALTER INDEX public.auth_team_organization_id_idx RENAME TO team_organization_id_idx;
  ALTER INDEX public.auth_team_member_team_id_idx RENAME TO "teamMember_team_id_idx";
  ALTER INDEX public.auth_team_member_user_id_idx RENAME TO "teamMember_user_id_idx";

  ALTER TABLE public.authentication_event RENAME TO event_log;
  ALTER TYPE public.authentication_event_type_enum RENAME TO event_log_type_enum;
  FOR item IN SELECT conname FROM pg_constraint WHERE conrelid='public.event_log'::regclass
    AND conname LIKE 'authentication_event%'
  LOOP
    EXECUTE format('ALTER TABLE public.event_log RENAME CONSTRAINT %I TO %I',item.conname,replace(item.conname,'authentication_event','event_log'));
  END LOOP;
  ALTER INDEX public.authentication_event_user_id_idx RENAME TO event_log_user_id_idx;
  ALTER INDEX public.authentication_event_created_at_idx RENAME TO event_log_created_at_idx;
END
$migration$;
