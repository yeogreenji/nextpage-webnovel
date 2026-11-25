import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

/**
 * 장편 증보·이어쓰기 화면 캡처.
 * 사용: node scripts/shots-longform.mjs [baseUrl] [outDir]
 *  · preview 서버가 없으면 dist 로 직접 띄웁니다.
 */
const base = process.argv[2] ?? 'http://127.0.0.1:4188'
const out = process.argv[3] ?? 'docs/screenshots/v11'
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
    ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4188', '--strictPort'],
    { stdio: 'ignore', env: { ...process.env, TMPDIR: '/workspace/tmp/pw' } },
  )
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    try {
      const response = await fetch(base)
      if (response.ok) return
    } catch {
      // 준비 중
    }
  }
  throw new Error('preview 서버를 띄우지 못했습니다')
}

await ensureServer()
const browser = await chromium.launch({
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--single-process', '--no-zygote', '--disable-gpu'],
})

const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ko-KR' })
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(String(error)))

async function shot(name, options = {}) {
  await page.waitForTimeout(options.wait ?? 400)
  if (options.locator) {
    await page.locator(options.locator).first().scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
  }
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: Boolean(options.full) })
  console.log('·', name)
}

// 1) 장편 아크 — 1화와 말 걸기 지점
await page.goto(`${base}/#/novel/nv-office/play`, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await shot('20-play-longform-intro')

// 2) 6화를 골라 2부 머리글까지
for (let index = 0; index < 6; index += 1) {
  await page.locator(`#play-scene-${index}`).scrollIntoViewIfNeeded()
  await page.locator(`#play-scene-${index} .choice-panel .choice-card`).first().click()
  await page.waitForTimeout(150)
}
await page.locator('.play-part').nth(1).scrollIntoViewIfNeeded()
await page.waitForTimeout(500)
await page.locator('.play-part').nth(1).screenshot({ path: `${out}/21-play-part2.png` })
console.log('· 21-play-part2')

// 3) 2부 첫 화의 말 걸기 지점 + 대화
await page.locator('#play-scene-6 .speak-gate').scrollIntoViewIfNeeded()
await page.waitForTimeout(400)
await shot('22-play-gate')
await page.locator('#play-scene-6 .speak-gate-open').click()
await page.locator('.scene-chat').waitFor({ state: 'visible' })
await page.waitForTimeout(700)
await shot('23-scene-chat')
await page.locator('.scene-chat-close').click()

// 4) 22화 완결 → 이어쓰기
for (let index = 6; index < 22; index += 1) {
  await page.locator(`#play-scene-${index}`).scrollIntoViewIfNeeded()
  await page.locator(`#play-scene-${index} .choice-panel .choice-card`).first().click()
  await page.waitForTimeout(120)
}
await page.locator('#play-finish').scrollIntoViewIfNeeded()
await page.waitForTimeout(500)
await shot('24-play-finish')
await page.locator('.serial-writer').scrollIntoViewIfNeeded()
await page.waitForTimeout(400)
await shot('25-serial-writer')
await page.getByRole('button', { name: /23화 쓰기/ }).click()
await page.locator('.serial-chapter').first().waitFor({ state: 'visible', timeout: 30_000 })
await page.locator('.serial-chapter').first().scrollIntoViewIfNeeded()
await page.waitForTimeout(500)
await shot('26-serial-chapter')

// 5) 작품 페이지 — 장편 통계
await page.goto(`${base}/#/novel/nv-office`, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await shot('27-novel-page', { full: true })

