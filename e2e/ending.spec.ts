import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { ALL_FLOWS } from '../src/data/flows'

/**
 * 엔딩은 마지막 화의 선택이 정합니다.
 * 25작품 전부를 실제 화면에서 끝까지 골라, 표시된 엔딩이 마지막 선택과 어긋나지 않는지 봅니다.
 * 대표작 5편은 22화 장편, 나머지는 6화입니다.
 */

function watchConsole(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    const isApiFallback =
      message.location().url.includes('/api/chat') || message.location().url.includes('/api/continue')
    if (message.type() === 'error' && !isApiFallback) errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  return errors
}

async function startFresh(page: Page, novelId: string): Promise<string[]> {
  const errors = watchConsole(page)
  await page.goto(`/#/novel/${novelId}/play`)
  const cards = page.locator('.choice-panel .choice-card')
  await expect(cards.first()).toBeVisible()
  const count = await cards.count()
  expect(count >= 2 && count <= 4).toBeTruthy()
  return errors
}

/** 마지막 화까지 차례로 고릅니다. 마지막 화만 지정한 갈래로. */
async function playThrough(page: Page, total: number, lastIndex: number): Promise<void> {
  for (let index = 0; index < total; index += 1) {
    await page.locator('#play-scene-' + index).scrollIntoViewIfNeeded()
    const cards = page.locator('#play-scene-' + index + ' .choice-panel .choice-card')
    await expect(cards.first()).toBeVisible()
    const count = await cards.count()
    await cards.nth(index === total - 1 ? lastIndex : index % count).click()
  }
  await expect(page.locator('#play-finish')).toBeVisible()
}

for (const flow of ALL_FLOWS) {
  const total = flow.scenes.length
  const last = flow.scenes[total - 1]
  const endingB = flow.endings.find((ending) => ending.tone === 'B')!
  const bIndex = last.choices.findIndex((choice) => choice.tone === 'B')
  test(`${flow.novelId} · 마지막에 B를 고르면 B 엔딩(${endingB.name})`, async ({ page }) => {
    const errors = await startFresh(page, flow.novelId)
    await playThrough(page, total, bIndex)

    await expect(page.locator('.play-finish-ending')).toContainText(endingB.name)
    await expect(page.locator('.play-finish-actions')).toContainText('내가 완성한 소설 읽기')

    await page.locator('.play-finish-actions a.btn-primary').click()
    await expect(page.locator('.finale-chapter-ending h2')).toHaveText(endingB.name)

    expect(errors).toEqual([])
  })
}

for (const novelId of ['nv-cafe', 'nv-academy', 'nv-parcel', 'nv-office', 'nv-secretary']) {
  const flow = ALL_FLOWS.find((item) => item.novelId === novelId)!
  const total = flow.scenes.length
  const last = flow.scenes[total - 1]
  const endingA = flow.endings.find((ending) => ending.tone === 'A')!
  const aIndex = last.choices.findIndex((choice) => choice.tone === 'A')
  test(`${novelId} · 마지막에 A를 고르면 A 엔딩(${endingA.name})`, async ({ page }) => {
    const errors = await startFresh(page, novelId)
    await playThrough(page, total, aIndex)

    await expect(page.locator('.play-finish-ending')).toContainText(endingA.name)
    expect(errors).toEqual([])
  })
}
