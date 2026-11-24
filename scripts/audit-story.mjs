import { build } from 'esbuild'
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'

/**
 * 스토리라인 전수 감사 실행기.
 * `npm run audit:story` — 25작품의 회차 그래프·분기·연속성·흐름을 검사해 보고합니다.
 */
const outfile = '.audit/story-audit.mjs'
mkdirSync('.audit', { recursive: true })
await build({
  entryPoints: ['scripts/story-audit.ts'],
  bundle: true,
  outfile,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  logLevel: 'error',
  define: { 'import.meta.env.BASE_URL': '"./"' },
})

const result = spawnSync(process.execPath, [outfile], { stdio: 'inherit' })
process.exit(result.status ?? 1)
