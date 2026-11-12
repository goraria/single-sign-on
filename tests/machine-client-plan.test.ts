import { expect, it } from "vitest";
import { planMachineClients } from "@/utils/machine-client-plan";

const client = {
  clientId: "reader-production", uri: "https://reader.fixture.test", disabled: false,
  referenceId: "sso-administration", scopes: ["reader:read", "reader:write"],
  metadata: { environment: "production" },
};
const resources = [
  ["commerce", "commerce"], ["notify", "shared-notification-center"],
  ["discovery", "shared-discovery-engine"], ["media", "shared-media-storage"],
  ["resource", "shared-resource-interaction"],
].map(([name, application]) => ({
  identifier: "https://" + name + ".fixture.test", disabled: false, metadata: { application },
}));
it("plans separate clients only where explicit directory registrations exist", () => {
  const result = planMachineClients([client], resources, "https://sso.fixture.test");
  expect(result.drafts.map((draft) => draft.clientId).sort()).toEqual([
    "gorth-media-backend-production", "gorth-payment-backend-production", "gorth-reader-backend-production",
  ]);
  expect(result.drafts.every((draft) => draft.environment === "production")).toBe(true);
  expect(result.blocked).toContain("local:commerce");
});
it("uses narrow per-sender scopes and exact registered receiver audiences", () => {
  const drafts = planMachineClients([client], resources, "https://sso.fixture.test").drafts;
  const payment = drafts.find((draft) => draft.clientId.includes("payment"))!;
  expect(payment.links).toEqual([{ identifier: "https://commerce.fixture.test", scopes: ["commerce:payment:sync"], ttl: 600 }]);
  const reader = drafts.find((draft) => draft.clientId.includes("reader"))!;
  expect(reader.links.flatMap((link) => link.scopes).sort()).toEqual([
    "reader:discovery:write", "reader:media:delegate", "reader:notification:publish",
  ]);
  expect(JSON.stringify(drafts)).not.toContain("insight:");
});
it("registers storage credential resources with the full path and <=120 second lifetime", () => {
  const media = planMachineClients([client], resources, "https://sso.fixture.test")
    .drafts.find((draft) => draft.clientId.includes("media"))!;
  expect(media.links).toContainEqual({
    identifier: "https://reader.fixture.test/internal/storage/credential",
    scopes: ["storage:reader:credential"], ttl: 120,
  });
  expect(media.links.every((link) => link.ttl === 120)).toBe(true);
  expect(media.purpose).toBe("media-storage-credential-reader");
});
it("never uses local receivers as a production fallback or provisions an unknown application", () => {
  const result = planMachineClients([client], [], "https://sso.fixture.test");
  expect(result.drafts).toEqual([]);
  expect(result.blocked).toContain("production:notify");
});
it("plans Commerce's own disabled-registration draft only for registered consumer namespaces", () => {
  const marketplace = { ...client, scopes: ["marketplace:read", "marketplace:write"] };
  const draft = planMachineClients([marketplace], resources, "https://sso.fixture.test").drafts
    .find(draft => draft.clientId === "gorth-commerce-backend-production")!;
  expect(draft.purpose).toBe("commerce-outbox");
  expect(draft.links).toContainEqual({
    identifier: "https://sso.fixture.test/auth/commerce/notification-recipient",
    scopes: ["commerce:notification:recipient"], ttl: 120,
  });
  expect(draft.links.flatMap(link => link.scopes)).not.toContain("restaurant:notification:publish");
});
