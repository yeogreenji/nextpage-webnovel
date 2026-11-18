import { build } from 'esbuild'
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'

/**
 * 단위·화면 검사 실행기.
 * — tests/ 아래 검사 파일을 esbuild로 한 덩어리로 묶어 node:test로 실행합니다.
 * — 데이터·로직(엔딩·조사·대사 저장)과 jsdom 화면 검사를 브라우저 없이 돌립니다.
 */
const outfile = 'tests/.build/run.mjs'
mkdirSync('tests/.build', { recursive: true })
await build({
  entryPoints: ['tests/run.ts'],
  bundle: true,
  outfile,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  jsx: 'automatic',
  logLevel: 'error',
  external: ['jsdom', 'react', 'react-dom', 'react-dom/client', 'react-router-dom', '@testing-library/react', '@testing-library/dom'],
  define: { 'import.meta.env.BASE_URL': '"./"' },
})

const result = spawnSync(process.execPath, [outfile], { stdio: 'inherit' })
process.exit(result.status ?? 1)
