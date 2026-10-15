import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import { expect, it } from "vitest"

it("leaves hover and tooltip props unset on every SSO identity", () => {
  const root = fileURLToPath(new URL("../", import.meta.url))
  const violations: string[] = []
  let identities = 0

  function inspect(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name)
      if (entry.isDirectory()) {
        inspect(file)
        continue
      }
      if (!/\.tsx?$/.test(file)) continue
      const source = readFileSync(file, "utf8")
      const tree = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
        file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      )
      const names = new Set<string>()
      for (const node of tree.statements) {
        if (
          !ts.isImportDeclaration(node) ||
          !ts.isStringLiteral(node.moduleSpecifier) ||
          node.moduleSpecifier.text !== "@gorth/primitive/dashboard/nav-user"
        )
          continue
        const bindings = node.importClause?.namedBindings
        if (bindings && ts.isNamedImports(bindings)) {
          for (const binding of bindings.elements) {
            if (
              ["NavIdentity", "NavName"].includes(
                (binding.propertyName ?? binding.name).text
              )
            )
              names.add(binding.name.text)
          }
        }
      }
      if (!names.size) continue
      function visit(node: ts.Node) {
        if (
          (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
          names.has(node.tagName.getText(tree))
        ) {
          identities++
          for (const prop of node.attributes.properties) {
            if (
              ts.isJsxAttribute(prop) &&
              ["hover", "tooltip"].includes(prop.name.getText(tree))
            ) {
              violations.push(
                `${file.slice(root.length)}: ${prop.name.getText(tree)}`
              )
            }
          }
        }
        ts.forEachChild(node, visit)
      }
      visit(tree)
    }
  }

  for (const directory of [
    "app",
    "components",
    "features",
    "layouts",
    "hooks",
    "providers",
    "utils",
    "lib",
    "services",
  ])
    inspect(join(root, directory))
  expect(identities).toBeGreaterThan(0)
  expect(violations).toEqual([])
})
