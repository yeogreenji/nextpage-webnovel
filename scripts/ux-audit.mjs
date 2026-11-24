import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { spawn } from 'node:child_process'

/**
 * 리더 여정 UX 점검 캡처.
 *   node scripts/ux-audit.mjs [baseUrl] [outDir]
 * · 서버가 없으면 직접 띄웁니다.
 * · 한 페이지를 재사용해 SPA 이동으로 여정을 따라갑니다(실제 독자 흐름과 같게).
 */
const base = process.argv[2] ?? 'http://127.0.0.1:4173'
const out = process.argv[3] ?? '.audit/shots'
const only = process.argv[4] ?? 'both'
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
  throw new Error('서버를 띄우지 못했습니다')
}
await ensureServer()

const browser = await chromium.launch({
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process', '--no-zygote'],
})
const errors = []

async function metrics(page, name) {
  const m = await page.evaluate(() => {
    const small = [...document.querySelectorAll('a,button')]
      .map((el) => {
        const r = el.getBoundingClientRect()
        return {
          text: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 34),
          w: Math.round(r.width),
          h: Math.round(r.height),
        }
      })
      .filter((x) => x.h > 0 && x.h < 40)
    return {
      pixels: document.documentElement.scrollHeight,
      screens: Math.round(document.documentElement.scrollHeight / innerHeight),
      small,
      sticky: [...new Set([...document.querySelectorAll('*')]
        .filter((el) => ['sticky', 'fixed'].includes(getComputedStyle(el).position))
        .map((el) => el.className?.toString?.().slice(0, 40)))],
    }
  })
  console.log(`\n[${name}] ${m.screens} screens (${m.pixels}px) · under-40px targets ${m.small.length}`)
  if (m.sticky.length) console.log('  sticky:', m.sticky.join(' | '))
  return m
}

async function run(prefix, context) {
  const page = await context.newPage()
  page.on('pageerror', (e) => errors.push(`${prefix}: ${e}`))
  await page.goto(base + '/#/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)

  const snap = async (name, opts = {}) => {
    if (opts.before) await opts.before(page)
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${out}/${prefix}-${name}.png`, fullPage: Boolean(opts.full) })
    if (opts.metrics) await metrics(page, `${prefix}-${name}`)
  }

  await snap('01-home', { metrics: true })
  await snap('02-home-full', { full: true })

  await page.goto(base + '/#/novel/nv-office', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(900)
  await snap('03-novel', { full: true, metrics: true })

  await page.goto(base + '/#/novel/nv-office/ep/ep-office-1', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(900)
  await snap('04-episode', { metrics: true })
  await snap('05-episode-mid', { before: async () => page.evaluate(() => window.scrollTo(0, 1800)) })
  await snap('06-episode-bottom', {
    before: async () => page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight - innerHeight * 2)),
  })
  await snap('07-episode-end', {
    before: async () => page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)),
  })

  await page.goto(base + '/#/novel/nv-office/ep/ep-office-4a', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(900)
  await snap('08-locked', { metrics: true })

  await page.goto(base + '/#/shelf', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(900)
  await snap('09-shelf', { metrics: true })

  await page.goto(base + '/#/library', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(900)
  await snap('10-library', { full: true, metrics: true })

  await page.goto(base + '/#/novel/nv-ceo/play', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  await snap('11-play', { metrics: true })

  await page.goto(base + '/#/novel/nv-office/tree', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(900)
  await snap('12-tree')

  await page.goto(base + '/#/novel/nv-office/read', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  await snap('13-read')

  await page.goto(base + '/#/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1000)
  await page.locator('.wallet-pill').first().click()
  await page.waitForTimeout(600)
  await snap('14-store')

  await page.close()
}

if (only !== 'mobile') {
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ko-KR' })
  await run('d', desk)
  await desk.close()
}
if (only !== 'desktop') {
  const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
  await run('m', mob)
  await mob.close()
}

console.log('\n페이지 오류:', errors.length)
for (const e of [...new Set(errors)].slice(0, 10)) console.log('  ' + e)
await browser.close()
if (server) server.kill()
