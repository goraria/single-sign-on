import { expect, it } from "vitest";
import { buildApplicationDirectory } from "@/utils/application-directory";
const client = (changes: Record<string, unknown> = {}) => ({
  clientId: "reader-prod", uri: "https://reader.fixture.test", disabled: false,
  referenceId: "sso-administration", scopes: ["openid", "reader:read", "reader:write"],
  metadata: { environment: "production" }, ...changes,
});
const resource = (changes: Record<string, unknown> = {}) => ({
  identifier: "https://payment.fixture.test", disabled: false,
  metadata: { application: "shared-payment-gateway" }, ...changes,
});
const directory = (clients = [client()], resources = [resource()]) =>
  buildApplicationDirectory(clients, resources, "production", "https://sso.fixture.test");
it("projects managed OAuth homepages and audiences without credentials, private metadata or grants", () => {
  expect(directory()).toMatchObject({
    issuer: "https://sso.fixture.test/auth", environment: "production",
    applications: { reader: { origin: "https://reader.fixture.test", clientIds: ["reader-prod"] } },
    services: { payment: { origin: "https://payment.fixture.test", audience: "https://payment.fixture.test" } },
  });
  expect(JSON.stringify(directory())).not.toContain("reader:write");
});
it.each([
  { disabled: true }, { referenceId: "unmanaged" }, { uri: null },
  { metadata: { environment: "local" } }, { uri: "http://localhost:3032" },
  { uri: "https://reader.fixture.test/private" }, { uri: "https://127.0.0.1" },
  { uri: "https://username:password@reader.fixture.test" },
  { scopes: ["reader:read", "social:read"] },
])("does not publish untrusted, ambiguous, wrong-environment or invalid app registrations: %j", (changes) => {
  expect(directory([client(changes)]).applications).not.toHaveProperty("reader");
});
it("fails closed on conflicting origins rather than selecting an arbitrary registration", () => {
  expect(() => directory([client(), client({ clientId: "reader-other", uri: "https://other.fixture.test" })]))
    .toThrow("ambiguous_directory_registration");
  expect(() => directory([], [resource(), resource({ identifier: "https://other.fixture.test" })]))
    .toThrow("ambiguous_directory_registration");
});
it("keeps disabled resources and wrong-environment service origins out of the directory", () => {
  expect(directory([], [resource({ disabled: true })]).services).toEqual({});
  expect(directory([], [resource({ identifier: "http://localhost:5055" })]).services).toEqual({});
});
it("uses the local client only when local is requested and merges identical-origin aliases", () => {
  const result = buildApplicationDirectory([
    client(), client({ clientId: "reader-local", uri: "http://localhost:3032", metadata: { environment: "local" } }),
  ], [resource({ identifier: "http://localhost:5055" })], "local", "https://sso.fixture.test");
  expect(result.applications.reader).toEqual({ origin: "http://localhost:3032", clientIds: ["reader-local"] });
  expect(result.services.payment?.audience).toBe("http://localhost:5055");
  expect(directory([client(), client({ clientId: "reader-alias" })]).applications.reader?.clientIds)
    .toEqual(["reader-alias", "reader-prod"]);
});
