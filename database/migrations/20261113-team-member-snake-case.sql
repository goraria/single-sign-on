-- Rename only: PostgreSQL preserves rows, foreign keys, roles and table dependencies.
DO $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('sso-team-member-snake-case'));
  IF to_regclass('public."teamMember"') IS NOT NULL THEN
    IF to_regclass('public.team_member') IS NOT NULL THEN
      RAISE EXCEPTION 'both_team_member_tables_require_review';
    END IF;
    ALTER TABLE public."teamMember" RENAME TO team_member;
  ELSIF to_regclass('public.team_member') IS NULL THEN
    RAISE EXCEPTION 'team_member_table_missing';
  END IF;
  IF to_regclass('public."teamMember_team_id_idx"') IS NOT NULL THEN
    ALTER INDEX public."teamMember_team_id_idx" RENAME TO team_member_team_id_idx;
  END IF;
  IF to_regclass('public."teamMember_user_id_idx"') IS NOT NULL THEN
    ALTER INDEX public."teamMember_user_id_idx" RENAME TO team_member_user_id_idx;
  END IF;
END $$;
