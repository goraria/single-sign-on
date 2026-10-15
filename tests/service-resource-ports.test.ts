import { expect, it } from "vitest"
import {
  planServiceResourcePorts,
  serviceResourcePortMappings,
} from "@/database/service-resource-ports"
import {
  oauthResourceSeeds,
  oauthClientResourceSeeds,
} from "@/database/seeds/oauth-resources"

const previous = () =>
  serviceResourcePortMappings
    .filter((row) => row.newPort !== 5058)
    .map((row) => ({
      identifier: row.oldIdentifier,
      metadata: { application: row.application },
    }))
it("renames existing resources and creates only missing Insight without new app grants", () => {
  const plan = planServiceResourcePorts(previous())
  expect(plan.filter((row) => row.action === "rename")).toHaveLength(6)
  expect(
    plan.filter((row) => row.action === "create").map((row) => row.identifier)
  ).toEqual(["http://localhost:5058"])
  expect(
    oauthClientResourceSeeds.every(
      (client) =>
        !client.resourceIds.some((id) => String(id) === "http://localhost:5058")
    )
  ).toBe(true)
})
it("is idempotent and rejects collisions, unexpected applications and missing existing services", () => {
  const current = serviceResourcePortMappings.map((row) => ({
    identifier: row.identifier,
    metadata: { application: row.application },
  }))
  expect(
    planServiceResourcePorts(current).every((row) => row.action === "unchanged")
  ).toBe(true)
  expect(() => planServiceResourcePorts([...previous(), current[0]!])).toThrow(
    "resource_port_collision"
  )
  expect(() => planServiceResourcePorts(previous().slice(1))).toThrow(
    "missing_service_resource"
  )
  const wrong = previous()
  wrong[0]!.metadata.application = "other-service"
  expect(() => planServiceResourcePorts(wrong)).toThrow(
    "unexpected_resource_application"
  )
})
it("keeps seed ports and Video resource grants aligned with the seven services", () => {
  for (const mapping of serviceResourcePortMappings)
    expect(
      oauthResourceSeeds.some(
        (row) =>
          row.identifier === mapping.identifier &&
          row.metadata.application === mapping.application
      )
    ).toBe(true)
  expect(
    oauthResourceSeeds.some((row) => /localhost:707[2-8]/.test(row.identifier))
  ).toBe(false)
  const video = oauthClientResourceSeeds.find(
    (row) => row.clientId === "gorth-video-streaming-platform"
  )!
  expect(video.resourceIds).toEqual([
    "http://localhost:3031",
    "http://localhost:5053",
    "http://localhost:5052",
    "http://localhost:5057",
    "http://localhost:5054",
  ])
})
