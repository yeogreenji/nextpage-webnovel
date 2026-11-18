import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * 말 걸기 — 장면 중간의 말 걸기 지점에서 대화를 걸면
 *  · 행동 요약과 첫 대사가 그 자리에서 소설 본문으로 들어가고
 *  · 새로고침 뒤에도 남고, 완성본에도 실립니다.
 *  · 이후 대사는 「이 대사 소설에 적용」으로 골라 담습니다.
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

async function pick(page: Page, sceneIndex: number, choiceIndex: number): Promise<void> {
  const cards = page.locator(`#play-scene-${sceneIndex} .choice-panel .choice-card`)
  await expect(cards.first()).toBeVisible()
  await cards.nth(choiceIndex).click()
}

test('말을 걸면 행동 요약과 대사가 본문·저장·완성본에 모두 남는다', async ({ page }) => {
  const errors = watchConsole(page)
  await page.goto('/#/novel/nv-cafe/play')
  await expect(page.locator('#play-scene-0 .choice-panel .choice-card').first()).toBeVisible()
  await pick(page, 0, 1)

  // 2장(명숙)의 말 걸기 지점
  const gate = page.locator('#play-scene-1 .speak-gate')
  await expect(gate).toBeVisible()
  await expect(gate.locator('.speak-gate-prompts button')).toHaveCount(4)
  await gate.locator('.speak-gate-open').click()

  const panel = page.locator('.scene-chat')
  await expect(panel).toBeVisible()
  await expect(page.locator('.scene-chat-empty-title')).toHaveText('명숙이 지금 이 장면에 서 있습니다')

  // 추천 대사 하나를 누르면 그대로 말을 건다
  const suggestion = page.locator('.scene-chat-suggest-row button').first()
  await suggestion.click()

  const said = page.locator('#play-scene-1 .play-said')
  await expect(said).toBeVisible()
  await expect(said.locator('.play-said-action')).toHaveCount(1)
  await expect(said.locator('.play-line')).toHaveCount(2)

  const stored = await page.evaluate(() => {
    const raw = window.localStorage.getItem('np.play.v1') ?? '{}'
    const map = JSON.parse(raw) as Record<string, { applied: { kind: string }[] }>
    return map['nv-cafe'].applied.map((line) => line.kind)
  })
  expect(stored).toEqual(['action', 'user', 'character'])

  // 이후 대사를 하나 더 골라 담는다
  const input2 = page.locator('input[aria-label="메시지 입력"]')
  await input2.fill('할머니, 그 장부 아직 있어요?')
  await page.getByRole('button', { name: '보내기' }).click()
  const row = page.locator('.scene-chat-row', { hasText: '할머니, 그 장부 아직 있어요?' }).last()
  const applyButton = row.locator('.scene-chat-apply').first()
  await expect(applyButton).toBeVisible()
  await applyButton.click()
  await page.locator('.scene-chat-close').click()
  await expect(page.locator('#play-scene-1 .play-said .play-line')).toHaveCount(3)

  // 새로고침 뒤에도 남는다
  await page.reload()
  await expect(page.locator('#play-scene-1 .play-said .play-line')).toHaveCount(3)

  // 나머지 선택을 마치고 완성본 확인
  for (let index = 1; index < 6; index += 1) {
    await pick(page, index, 0)
  }
  await page.locator('.play-finish-actions a.btn-primary').click()
  await expect(page.locator('.finale-body')).toContainText('할머니, 그 장부 아직 있어요?')
  await expect(page.locator('.finale-action').first()).toBeVisible()

  expect(errors).toEqual([])
})
