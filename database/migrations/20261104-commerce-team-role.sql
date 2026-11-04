ALTER TABLE auth_team_member ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='auth_team_member_commerce_role') THEN
 ALTER TABLE auth_team_member ADD CONSTRAINT auth_team_member_commerce_role CHECK(role IN('member','manager','staff','catalog','inventory','fulfillment','finance','support','viewer'));
 END IF;
END $$;
