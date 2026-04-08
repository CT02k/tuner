import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

const files = [
  "node_modules/react-gauge-component/dist/GaugeComponent/hooks/pointer.ts",
  "node_modules/react-gauge-component/dist/lib/GaugeComponent/hooks/pointer.js",
]

const chartImportLine = 'import * as chartHooks from "./chart";'
const pointerImportAnchor = 'import { PointerContext, PointerProps, PointerType, PointerWithValue, MultiPointerRef, defaultPointerContext } from "../types/Pointer";'
const pointerImportLine = 'import { PointerContext, PointerProps, PointerType, PointerWithValue, MultiPointerRef, defaultPointerContext, defaultPointer } from "../types/Pointer";'
const pointerJsImportAnchor = 'import { PointerType, defaultPointerContext } from "../types/Pointer";'
const pointerJsImportLine = 'import { PointerType, defaultPointerContext, defaultPointer } from "../types/Pointer";'
const requireCallPattern =
  /(const|var)\s+chartHooks\s*=\s*require\(['"]\.\/chart['"]\);\s*chartHooks\.initChart\(gauge,\s*false\);/g
const defaultPointerTsPattern =
  /const\s+\{\s*defaultPointer\s*\}\s*=\s*require\("\.\.\/types\/Pointer"\);/g
const defaultPointerJsPattern =
  /var\s+defaultPointer\s*=\s*require\("\.\.\/types\/Pointer"\)\.defaultPointer;/g

let patchedAny = false

for (const relativePath of files) {
  const filePath = resolve(relativePath)

  if (!existsSync(filePath)) {
    continue
  }

  let content = readFileSync(filePath, "utf8")

  if (relativePath.endsWith(".ts")) {
    if (content.includes(pointerImportAnchor)) {
      content = content.replace(pointerImportAnchor, pointerImportLine)
    }
  }

  if (relativePath.endsWith(".js")) {
    if (content.includes(pointerJsImportAnchor)) {
      content = content.replace(pointerJsImportAnchor, pointerJsImportLine)
    }
  }

  if (!content.includes(chartImportLine)) {
    const chartAnchor = 'import { GaugeType } from "../types/GaugeComponentProps";'

    if (content.includes(chartAnchor)) {
      content = content.replace(chartAnchor, `${chartAnchor}\n${chartImportLine}`)
    }
  }

  content = content.replace(requireCallPattern, "chartHooks.initChart(gauge, false);")
  content = content.replace(defaultPointerTsPattern, "")
  content = content.replace(defaultPointerJsPattern, "")

  if (
    content.includes("chartHooks.initChart(gauge, false);")
  ) {
    writeFileSync(filePath, content, "utf8")
    patchedAny = true
  }
}

if (patchedAny) {
  console.log("Patched react-gauge-component to remove runtime require('./chart').")
} else {
  console.log("react-gauge-component patch skipped or already applied.")
}
