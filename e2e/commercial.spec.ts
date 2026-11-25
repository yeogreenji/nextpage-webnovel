import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { ALL_FLOWS } from '../src/data/flows'

/**
 * 상용 리더기 · 서재 · 엔딩 도감.
 *  · 읽기 설정(서체·크기·줄간격·테마)이 이 기기에 저장되고 다시 열어도 유지되는지
 *  · 회차를 읽으면 최근 본 작품에 남고, 이어 읽기로 돌아오는지
 *  · 마지막 선택까지 마치면 엔딩 도감에 기록되는지
 */

function watchConsole(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    const isApiFallback = message.location().url.includes('/api/chat')
    if (message.type() === 'error' && !isApiFallback) errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  return errors
}

test('읽기 설정을 바꾸면 이 기기에 저장되고, 다시 열어도 유지된다', async ({ page }) => {
  const errors = watchConsole(page)
  await page.goto('/#/novel/nv-secretary/ep/ep-secretary-1')
  await expect(page.locator('.chapter-frame.reader-body')).toBeVisible()

  await page.getByRole('button', { name: /읽기 설정 열기/ }).click()
  const drawer = page.locator('.settings-drawer')
  await expect(drawer).toBeVisible()

  // 서체 — 마루부리
  await page.setDefaultTimeout(15_000)
  await drawer.locator('.settings-font').filter({ hasText: '마루부리' }).click()
  // 글자 크기 · 줄간격 — 슬라이더 (range input 은 fill 대신 input 이벤트로)
  const size = drawer.getByLabel('글자 크기')
  await size.focus()
  for (let step = 0; step < 4; step += 1) await size.press('ArrowRight')
  const line = drawer.getByLabel('줄간격')
  await line.focus()
  for (let step = 0; step < 3; step += 1) await line.press('ArrowRight')
  // 테마 — 세피아
  await drawer.locator('.settings-theme').filter({ hasText: '세피아' }).click()
  await drawer.getByRole('button', { name: '읽기 설정 닫기' }).click()

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sepia')
  await expect(page.locator('.reader-settings-copy em')).toHaveText(/마루부리 · 22px · 2\.2배/)

  // 새로고침해도 유지
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sepia')
  await expect(page.locator('.reader-settings-copy em')).toHaveText(/마루부리 · 22px · 2\.2배/)

  const stored = await page.evaluate(() => window.localStorage.getItem('np.settings.v2') ?? '')
  expect(stored).toContain('"font":"maru"')
  expect(stored).toContain('"fontSize":22')
  expect(stored).toContain('"lineHeight":2.2')
  expect(errors).toEqual([])
})

test('읽던 회차가 최근 본 작품에 남고, 이어 읽기로 돌아온다', async ({ page }) => {
  const errors = watchConsole(page)
  await page.goto('/#/novel/nv-ramen/ep/ep-ramen-1')
  await expect(page.locator('.chapter-frame.reader-body')).toBeVisible()
  await page.mouse.wheel(0, 900)
  // 진행률 저장은 스크롤 뒤 0.9초
  await page.waitForTimeout(1400)

  await page.goto('/#/shelf')
  await expect(page.getByRole('heading', { name: '내 서재' })).toBeVisible()
  const row = page.locator('.reading-row').filter({ hasText: '옆집 남자는 새벽 두 시에' })
  await expect(row).toBeVisible()
  await expect(row).toContainText('1화')
  await row.getByText('이어 읽기 →').click()
  await expect(page).toHaveURL(/novel\/nv-ramen\/ep\/ep-ramen-1/)
  expect(errors).toEqual([])
})

test('엔딩을 모으면 엔딩 도감에 이름이 열린다', async ({ page }) => {
  const errors = watchConsole(page)
  await page.goto('/#/novel/nv-ceo/play')
  await expect(page.locator('#play-scene-0 .choice-card').first()).toBeVisible()

  const total = ALL_FLOWS.find((item) => item.novelId === 'nv-ceo')!.scenes.length
  for (let index = 0; index < total; index += 1) {
    const cards = page.locator(`#play-scene-${index} .choice-panel .choice-card`)
    await cards.first().scrollIntoViewIfNeeded()
    await cards.first().click()
  }
  await expect(page.locator('#play-finish')).toBeVisible()
  const endingName = (await page.locator('.play-finish-ending b').textContent())?.trim() ?? ''
  expect(endingName.length).toBeGreaterThan(0)

  await page.goto('/#/shelf')
  await page.getByRole('tab', { name: '엔딩 도감' }).click()
  const card = page.locator('.codex-card').filter({ hasText: '사장님, 그 계약 제가 다시 씁니다' })
  await expect(card).toContainText(endingName)
  await expect(card.locator('.codex-count')).toHaveText('1/3')
  expect(errors).toEqual([])
})

test('찜한 작품이 서재에 담기고, 카드에서 바로 뺄 수 있다', async ({ page }) => {
  const errors = watchConsole(page)
  await page.goto('/#/library')
  const card = page.locator('.book-card').filter({ hasText: '악녀는 오늘도 야근을 한다' })
  await card.locator('.book-shelf').click()
  await expect(card.locator('.book-shelf')).toHaveAttribute('aria-pressed', 'true')

  await page.goto('/#/shelf')
  await page.getByRole('tab', { name: '내 서재', exact: true }).click()
  const row = page.locator('.reading-row').filter({ hasText: '악녀는 오늘도 야근을 한다' })
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: '빼기' }).click()
  await expect(row).toHaveCount(0)
  expect(errors).toEqual([])
})
