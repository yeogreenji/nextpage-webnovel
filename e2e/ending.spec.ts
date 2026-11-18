import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { ALL_FLOWS } from '../src/data/flows'

/**
 * 엔딩은 마지막(6장) 선택이 정합니다.
 * 15작품 전부를 실제 화면에서 끝까지 골라, 표시된 엔딩이 마지막 선택과 어긋나지 않는지 봅니다.
 */

/** 콘솔 에러를 모아 두었다가 테스트 끝에 0건인지 확인합니다. */
function watchConsole(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    // 개발 서버에는 /api/chat이 없어 404가 찍힙니다 — 화면은 기기 안 응답으로 폴백합니다.
    const isApiFallback = message.location().url.includes('/api/chat')
    if (message.type() === 'error' && !isApiFallback) errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  return errors
}

async function startFresh(page: Page, novelId: string): Promise<string[]> {
  const errors = watchConsole(page)
  await page.goto(`/#/novel/${novelId}/play`)
  await expect(page.locator('.choice-panel .choice-card')).toHaveCount(2)
  return errors
}

/** 6장까지 차례로 고릅니다. picks: 0=A, 1=B */
async function playThrough(page: Page, picks: number[]): Promise<void> {
  for (let index = 0; index < picks.length; index += 1) {
    await page.locator('#play-scene-' + index).scrollIntoViewIfNeeded()
    const cards = page.locator('#play-scene-' + index + ' .choice-panel .choice-card')
    await expect(cards).toHaveCount(2)
    await cards.nth(picks[index]).click()
  }
  await expect(page.locator('#play-finish')).toBeVisible()
}

for (const flow of ALL_FLOWS) {
  const endingB = flow.endings.find((ending) => ending.tone === 'B')!
  test(`${flow.novelId} · 마지막에 B를 고르면 B 엔딩(${endingB.name})`, async ({ page }) => {
    const errors = await startFresh(page, flow.novelId)
    await playThrough(page, [1, 0, 1, 0, 1, 1])

    await expect(page.locator('.play-finish-ending')).toContainText(endingB.name)
    await expect(page.locator('.play-finish-actions')).toContainText('내가 완성한 소설 읽기')

    // 완성본 화면의 에필로그도 같은 엔딩이어야 합니다.
    await page.locator('.play-finish-actions a.btn-primary').click()
    await expect(page.locator('.finale-chapter-ending h2')).toHaveText(endingB.name)

    expect(errors).toEqual([])
  })
}

for (const novelId of ['nv-cafe', 'nv-academy', 'nv-parcel', 'nv-lodge']) {
  const flow = ALL_FLOWS.find((item) => item.novelId === novelId)!
  const endingA = flow.endings.find((ending) => ending.tone === 'A')!
  test(`${novelId} · 마지막에 A를 고르면 A 엔딩(${endingA.name})`, async ({ page }) => {
    const errors = await startFresh(page, novelId)
    await playThrough(page, [0, 1, 0, 1, 0, 0])

    await expect(page.locator('.play-finish-ending')).toContainText(endingA.name)
    await page.locator('.play-finish-actions a.btn-primary').click()
    await expect(page.locator('.finale-chapter-ending h2')).toHaveText(endingA.name)
    await expect(page.locator('.finale-ending-tone')).toContainText('마지막 한 번이 이')

    expect(errors).toEqual([])
  })
}

test('마지막 선택만 되돌려 다시 고르면 엔딩이 따라 바뀐다', async ({ page }) => {
  const errors = await startFresh(page, 'nv-cafe')
  const flow = ALL_FLOWS.find((item) => item.novelId === 'nv-cafe')!
  const endingA = flow.endings.find((ending) => ending.tone === 'A')!
  const endingB = flow.endings.find((ending) => ending.tone === 'B')!

  await playThrough(page, [0, 0, 0, 0, 0, 1])
  await expect(page.locator('.play-finish-ending')).toContainText(endingB.name)

  // 「마지막 선택 다시 하기」 → 6장이 다시 열립니다.
  await page.getByRole('button', { name: '마지막 선택 다시 하기' }).click()
  const cards = page.locator('#play-scene-5 .choice-panel .choice-card')
  await expect(cards).toHaveCount(2)
  await cards.nth(0).click()

  await expect(page.locator('.play-finish-ending')).toContainText(endingA.name)
  expect(errors).toEqual([])
})
