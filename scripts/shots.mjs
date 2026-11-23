import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

/**
 * 화면 캡처 도구 — docs/screenshots 갱신용.
 * 사용: node scripts/shots.mjs [baseUrl] [outDir]
 *  · 개발 서버가 없으면 직접 띄우고, 끝나면 함께 종료합니다.
 *  · 느린(지연) 이미지까지 모두 불러온 뒤 찍습니다.
 */
const base = process.argv[2] ?? 'http://127.0.0.1:4173'
const out = process.argv[3] ?? 'docs/screenshots/v8'
mkdirSync(out, { recursive: true })

let server = null
async function ensureServer() {
  try {
    const response = await fetch(base)
    if (response.ok) return
  } catch {
    // 아래에서 직접 띄웁니다.
  }
  server = spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'],
    { stdio: 'ignore' },
  )
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    try {
      const response = await fetch(base)
      if (response.ok) return
    } catch {
      // 아직 준비 중
    }
  }
  throw new Error('개발 서버를 띄우지 못했습니다')
}

const shots = [
  { name: '01-home', url: '/#/' },
  { name: '02-home-full', url: '/#/', full: true },
  { name: '03-novel', url: '/#/novel/nv-office', full: true },
  { name: '04-episode', url: '/#/novel/nv-office/ep/ep-office-1' },
  { name: '05-library', url: '/#/library', full: true },
  { name: '06-shelf', url: '/#/shelf' },
  { name: '07-play', url: '/#/novel/nv-ceo/play' },
  { name: '08-studio', url: '/#/studio' },
  { name: '09-about', url: '/#/about' },
  { name: '10-store', url: '/#/', click: '.wallet-pill' },
  { name: '11-store-pass', url: '/#/', click: '.wallet-pill', tab: '넥스트패스' },
  { name: '12-mobile-home', url: '/#/', viewport: { width: 390, height: 844 }, full: true },
  { name: '13-mobile-episode', url: '/#/novel/nv-office/ep/ep-office-1', viewport: { width: 390, height: 844 } },
  { name: '14-episode-locked', url: '/#/novel/nv-office/ep/ep-office-4a' },
  { name: '15-episode-locked-mobile', url: '/#/novel/nv-office/ep/ep-office-4a', viewport: { width: 390, height: 844 } },
  { name: '16-novel-mobile', url: '/#/novel/nv-office', viewport: { width: 390, height: 844 } },
]

await ensureServer()
const browser = await chromium.launch({
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ko-KR' })
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })

for (const spec of shots) {
  console.log('· ' + spec.name)
  const context = spec.viewport ? mobile : desktop
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(String(error)))
  await page.goto(base + spec.url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  if (spec.click) {
    await page.locator(spec.click).first().click()
    await page.waitForTimeout(350)
    if (spec.tab) {
      const tab = page.getByRole('tab', { name: spec.tab })
      if (await tab.count()) {
        await tab.first().click()
        await page.waitForTimeout(300)
      }
    }
  }
  await Promise.race([
    page.evaluate(async () => {
      const step = window.innerHeight * 0.9
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y)
        await new Promise((resolve) => setTimeout(resolve, 160))
      }
      window.scrollTo(0, 0)
      document.querySelectorAll('img').forEach((img) => {
        img.loading = 'eager'
      })
    }),
    new Promise((resolve) => setTimeout(resolve, 20_000)),
  ])
  await page
    .waitForFunction(() => Array.from(document.images).every((img) => img.complete), null, {
      timeout: 12_000,
    })
    .catch(() => {})
  await page.waitForTimeout(2500)
  // 긴 전체 페이지는 JPEG 로 (PNG 는 수 MB까지 커집니다)
  const ext = spec.full ? 'jpg' : 'png'
  await page.screenshot({
    path: `${out}/${spec.name}.${ext}`,
    fullPage: Boolean(spec.full),
    ...(spec.full ? { type: 'jpeg', quality: 82 } : {}),
  })
  if (errors.length) console.log(`  ! ${spec.name}: ${errors.slice(0, 2).join(' | ')}`)
  await page.close()
}

await browser.close()
if (server) server.kill()
console.log('saved to', out)
