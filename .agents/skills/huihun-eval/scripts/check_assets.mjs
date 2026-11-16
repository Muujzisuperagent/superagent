#!/usr/bin/env node
/**
 * Validate every GLB under game/public/assets/generated with Khronos glTF Validator.
 * Usage: node check_assets.mjs --out <dir> [--game <game dir>]
 */
import { createRequire } from 'node:module'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve, basename } from 'node:path'
import { pathToFileURL } from 'node:url'

const args = process.argv.slice(2)
const getArg = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const outDir = resolve(getArg('--out', 'eval-out'))
const gameDir = resolve(getArg('--game', process.env.GAME_DIR ?? join(process.cwd(), 'game')))
const assetDir = join(gameDir, 'public', 'assets', 'generated')

const requireLocal = createRequire(new URL('./package.json', import.meta.url))
const requireGame = createRequire(pathToFileURL(join(gameDir, 'package.json')))
let validator
try {
  validator = requireLocal('gltf-validator')
} catch {
  try {
    validator = requireGame('gltf-validator')
  } catch {
    console.error(JSON.stringify({ ok: false, error: 'gltf-validator not installed. Run: cd .agents/skills/huihun-eval/scripts && npm install' }))
    process.exit(2)
  }
}

const files = (await readdir(assetDir)).filter((f) => f.toLowerCase().endsWith('.glb')).sort()
const results = []

for (const file of files) {
  const abs = join(assetDir, file)
  const bytes = await readFile(abs)
  let entry = { file, bytes: bytes.length, errors: null, warnings: null, infos: null, triangles: null, vertices: null, images: null, extensionsUsed: [], topIssues: [] }
  try {
    const report = await validator.validateBytes(new Uint8Array(bytes), { uri: basename(abs), maxIssues: 200 })
    const issues = report.issues ?? {}
    entry.errors = issues.numErrors ?? 0
    entry.warnings = issues.numWarnings ?? 0
    entry.infos = issues.numInfos ?? 0
    entry.triangles = report.info?.totalTriangleCount ?? null
    entry.vertices = report.info?.totalVertexCount ?? null
    entry.images = report.info?.totalImageCount ?? null
    entry.extensionsUsed = report.info?.extensionsUsed ?? []
    entry.topIssues = (issues.messages ?? [])
      .filter((m) => m.severity <= 1)
      .slice(0, 8)
      .map((m) => ({ severity: m.severity, code: m.code, message: m.message, pointer: m.pointer }))
  } catch (error) {
    entry.errors = -1
    entry.topIssues = [{ severity: 0, code: 'VALIDATOR_CRASH', message: String(error?.message || error) }]
  }
  results.push(entry)
}

const summary = {
  fileCount: results.length,
  errorFiles: results.filter((r) => r.errors !== 0).map((r) => r.file),
  totalErrors: results.reduce((n, r) => n + Math.max(0, r.errors ?? 0), 0),
  totalWarnings: results.reduce((n, r) => n + (r.warnings ?? 0), 0),
  totalTriangles: results.reduce((n, r) => n + (r.triangles ?? 0), 0)
}

await writeFile(join(outDir, 'assets.json'), JSON.stringify({ assetDir, summary, files: results }, null, 2), 'utf8')
console.log(JSON.stringify({ ok: true, out: join(outDir, 'assets.json'), ...summary }))
