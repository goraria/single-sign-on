import { afterAll, beforeAll, expect, it, vi } from "vitest"
import nextEnv from "@next/env"
vi.mock("server-only", () => ({}))
let db: typeof import("@/database"), service: typeof import("@/services/commerce-notification")
const [owner, staff, finance, orphan] = Array.from({ length: 4 }, () => crypto.randomUUID()) as [string,string,string,string]
const organization = crypto.randomUUID(), teamA = crypto.randomUUID(), teamB = crypto.randomUUID()
beforeAll(async () => {
  nextEnv.loadEnvConfig(process.cwd(), true)
  db = await import("@/database")
  service = await import("@/services/commerce-notification")
  for (const id of [owner,staff,finance,orphan])
    await db.pool.query('INSERT INTO "user"(id,name,email) VALUES($1,$2,$3)',[id,"Recipient fixture",id+"@fixture.invalid"])
  await db.pool.query("INSERT INTO organization(id,name,slug) VALUES($1,'Recipient fixture',$2)",[organization,"readiness-"+organization])
  for (const id of [owner,staff,finance,orphan])
    await db.pool.query("INSERT INTO member(organization_id,user_id,role) VALUES($1,$2,$3)",[organization,id,id===owner?"owner":"member"])
  await db.pool.query("INSERT INTO team(id,organization_id,name) VALUES($1,$3,'Fixture A'),($2,$3,'Fixture B')",[teamA,teamB,organization])
  await db.pool.query('INSERT INTO "teamMember"(team_id,user_id,role) VALUES($1,$2,\'staff\'),($3,$4,\'finance\')',[teamA,staff,teamB,finance])
})
afterAll(async () => {
  if (!db) return
  try {
    await db.pool.query("DELETE FROM organization WHERE id=$1",[organization])
    await db.pool.query('DELETE FROM "user" WHERE id=ANY($1::uuid[])',[ [owner,staff,finance,orphan] ])
  } finally { await db.pool.end() }
})
it("resolves only the store's authorized staff plus org administrators",async()=>{
  const result=await service.getCommerceNotificationRecipients({application:"marketplace",organizationId:organization,teamId:teamA,capability:"order"})
  expect(result.recipients.map(person=>person.subject).sort()).toEqual([owner,staff].sort())
})
it("does not leak finance recipients from a different team or grant access to orphan members",async()=>{
  const result=await service.getCommerceNotificationRecipients({application:"marketplace",organizationId:organization,teamId:teamA,capability:"finance"})
  expect(result.recipients.map(person=>person.subject)).toEqual([owner])
  expect((await service.getCommerceNotificationRecipients({application:"marketplace",organizationId:crypto.randomUUID(),teamId:teamA,capability:"order"})).recipients).toEqual([])
})
it("excludes banned users from notification fanout",async()=>{
  await db.pool.query('UPDATE "user" SET banned=true WHERE id=$1',[staff])
  const result=await service.getCommerceNotificationRecipients({application:"marketplace",organizationId:organization,teamId:teamA,capability:"order"})
  expect(result.recipients.map(person=>person.subject)).toEqual([owner])
})
it("denies an unregistered caller using the current cloud OAuth schema",async()=>{
  await expect(service.checkCommerceNotificationClient("missing-readiness-"+crypto.randomUUID(),"marketplace","https://fixture.invalid/auth/commerce/notification-recipient")).rejects.toMatchObject({status:403})
})
