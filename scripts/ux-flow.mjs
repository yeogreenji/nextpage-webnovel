import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { spawn } from 'node:child_process'

/** 상호작용 점검 — 투표 → 다음 화, 잠금 → 무료 회차, 종결 회차 → 다른 루트, 홈 더 보기 */
const base = process.argv[2] ?? 'http://127.0.0.1:4173'
const out = process.argv[3] ?? '.audit/flow'
mkdirSync(out, { recursive: true })

let server = null
async function ensureServer() {
  try {
    const res = await fetch(base)
    if (res.ok) return
  } catch {}
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: 'ignore' })
  for (let i = 0; i < 80; i += 1) {
    await new Promise((r) => setTimeout(r, 500))
    try {
      const res = await fetch(base)
      if (res.ok) return
    } catch {}
  }
  throw new Error('no server')
}
await ensureServer()

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process', '--no-zygote'] })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

const log = (...a) => console.log(...a)

// 1) 1화 읽고 투표
await page.goto(base + '/#/novel/nv-office/ep/ep-office-1', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1500)
log('dock:', await page.locator('.reader-dock').innerText())
await page.locator('.vs-panel').first().click()
await page.waitForTimeout(1200)
await page.screenshot({ path: `${out}/01-after-vote.png` })
log('after vote, dock:', await page.locator('.reader-dock').innerText())
const routes = await page.locator('#vote a').allInnerTexts()
log('route links:', routes.slice(0, 4))

// 2) 독 하단 '다음 화'로 이동
const nextHref = await page.locator('.reader-dock .dock-next').getAttribute('href')
log('dock next href:', nextHref)
await page.locator('.reader-dock .dock-next').click()
await page.waitForTimeout(1200)
log('now url:', page.url())
log('now title:', await page.locator('.chapter-title').innerText())
await page.screenshot({ path: `${out}/02-next-episode.png` })

// 3) 잠긴 회차
await page.goto(base + '/#/novel/nv-office/ep/ep-office-4a', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1000)
log('locked dock:', await page.locator('.reader-dock').innerText())
log('escape:', await page.locator('.ep-lock-escape').innerText())
await page.screenshot({ path: `${out}/03-locked.png` })

// 4) 종결 회차(선택지 없음)
await page.goto(base + '/#/novel/nv-office/ep/ep-office-4a', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(500)
await page.goto(base + '/#/novel/nv-secretary/ep/ep-secretary-1', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(900)
const s1 = await page.locator('.reader-dock').innerText()
log('secretary 1화 dock:', s1)

// 5) 홈 더 보기
await page.goto(base + '/#/', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1200)
log('book cards before:', await page.locator('.book-card').count())
const more = page.getByRole('button', { name: /작품 더 보기/ })
log('more button:', await more.count())
if (await more.count()) {
  await more.click()
  await page.waitForTimeout(400)
  log('book cards after 1 click:', await page.locator('.book-card').count())
  await more.click({ force: true }).catch(() => {})
  await page.waitForTimeout(400)
  log('book cards after 2 clicks:', await page.locator('.book-card').count())
  await page.screenshot({ path: `${out}/04-home-more.png` })
}

// 6) 작품 페이지 회차 목록 점프
await page.goto(base + '/#/novel/nv-office', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(900)
await page.getByRole('button', { name: /회차 목록/ }).first().click()
await page.waitForTimeout(900)
await page.screenshot({ path: `${out}/05-novel-episodes.png` })
log('scroll after jump:', await page.evaluate(() => Math.round(window.scrollY)))

// 7) 작품 페이지 해시로 회차 목록 진입 (독 목차)
await page.goto(base + '/#/novel/nv-office#episodes', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1200)
log('scroll on #episodes:', await page.evaluate(() => Math.round(window.scrollY)))
await page.screenshot({ path: `${out}/06-novel-hash-episodes.png` })

log('page errors:', errors.length, [...new Set(errors)].slice(0, 5))
await browser.close()
if (server) server.kill()
