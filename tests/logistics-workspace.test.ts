import { readFileSync } from "node:fs"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it } from "vitest"
import { shipments } from "@/features/admin-dashboards/logistics/_components/shipment-data"
import { ShipmentRouteMap } from "@/features/admin-dashboards/logistics/_components/shipment-route-map"

const shipment = shipments[0]

it("puts the Vietnam HAN to Singapore SIN shipment first and selects it by default", () => {
  expect(shipment.id).toBe("SDA-00-2400")
  expect(shipment.mode).toBe("air")
  expect(shipment.origin.country).toBe("Vietnam")
  expect(shipment.origin.display).toContain("HAN")
  expect(shipment.origin.display).toContain("Nội Bài")
  expect(shipment.destination.country).toBe("Singapore")
  expect(shipment.destination.display).toContain("SIN")
  expect(shipment.origin.coordinates[0]).toBeCloseTo(105.807, 2)
  expect(shipment.origin.coordinates[1]).toBeCloseTo(21.221, 2)
  expect(new Set(shipments.map((item) => item.id)).size).toBe(shipments.length)
})

it("projects both airport markers inside the map and labels the matching route", () => {
  const html = renderToStaticMarkup(
    createElement(ShipmentRouteMap, { shipment })
  )
  expect(html).toContain("HAN Airport · Nội Bài")
  expect(html).toContain("SIN Airport · Changi")
  expect(html).toContain("Vietnam")
  expect(html).toContain('stroke-dasharray="8 8"')
  const markers = [...html.matchAll(/translate\(([\d.-]+), ([\d.-]+)\)/g)]
  expect(markers).toHaveLength(2)
  for (const [, x, y] of markers) {
    expect(Number(x)).toBeGreaterThan(0)
    expect(Number(x)).toBeLessThan(1000)
    expect(Number(y)).toBeGreaterThan(0)
    expect(Number(y)).toBeLessThan(520)
  }
})

it("confines logistics scrolling to the shipment list, leaving other dashboards unchanged", () => {
  const source = (path: string) =>
    readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
  const shell = source("layouts/dashboard-shell.tsx")
  expect(shell).toContain('usePathname() === "/admin/logistics"')
  expect(shell).toContain('"min-h-0 min-w-0 overflow-hidden"')
  const logistics = source(
    "features/admin-dashboards/logistics/_components/logistics.tsx"
  )
  expect(logistics).not.toContain("--dashboard-header-height")
  expect(logistics).toContain("h-full min-h-0 flex-1 overflow-hidden")
  expect(logistics).toContain(">(shipments[0].id)")
  const details = source(
    "features/admin-dashboards/logistics/_components/shipment-details.tsx"
  )
  expect(details).not.toContain("overflow-auto")
  const list = source(
    "features/admin-dashboards/logistics/_components/shipment-list.tsx"
  )
  expect(list).toContain('<ScrollArea className="h-0 flex-1">')
})
