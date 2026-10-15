import { readFileSync } from "node:fs"
import ts from "typescript"
import { expect, it } from "vitest"

it("scrolls header, main and footer together without pinning the footer", () => {
  const source = readFileSync(
    new URL("../layouts/dashboard-shell.tsx", import.meta.url),
    "utf8"
  )
  const tree = ts.createSourceFile(
    "dashboard-shell.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  let checked = false
  function normalClass(attribute: ts.JsxAttribute) {
    const expression = ts.isJsxExpression(attribute.initializer!)
      ? attribute.initializer.expression
      : undefined
    return expression && ts.isConditionalExpression(expression)
      ? expression.whenFalse.getText(tree)
      : attribute.initializer?.getText(tree)
  }
  function visit(node: ts.Node) {
    if (
      ts.isJsxElement(node) &&
      node.openingElement.tagName.getText(tree) === "SidebarInset"
    ) {
      const attributes = node.openingElement.attributes.properties
      const className = attributes.find(
        (prop) =>
          ts.isJsxAttribute(prop) && prop.name.getText(tree) === "className"
      ) as ts.JsxAttribute
      expect(normalClass(className)).toContain("overflow-y-auto")
      expect(normalClass(className)).not.toContain("overflow-hidden")
      const elements = node.children.filter(
        (child) => ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)
      )
      expect(
        elements.map((child) =>
          ts.isJsxElement(child)
            ? child.openingElement.tagName.getText(tree)
            : (child as ts.JsxSelfClosingElement).tagName.getText(tree)
        )
      ).toEqual(["Dashbar", "main", "Footer"])
      const main = elements[1] as ts.JsxElement
      const mainClass = main.openingElement.attributes.properties.find(
        (prop) =>
          ts.isJsxAttribute(prop) && prop.name.getText(tree) === "className"
      ) as ts.JsxAttribute
      expect(normalClass(mainClass)).toContain("flex-1 shrink-0")
      expect(normalClass(mainClass)).not.toContain("overflow")
      expect(normalClass(mainClass)).not.toContain("min-h-0")
      checked = true
    }
    ts.forEachChild(node, visit)
  }
  visit(tree)
  expect(checked).toBe(true)
})
