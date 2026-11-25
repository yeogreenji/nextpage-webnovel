import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * 말 걸기 — 화 중간의 말 걸기 지점에서 독자가 직접 타자로 말을 겁니다.
 *  · 이 화에 실제로 있는 인물만 대화 상대로 열립니다(없는 사람은 목록에 없음).
 *  · 행동 요약과 첫 대사가 그 자리에서 소설 본문으로 들어가고, 새로고침 뒤에도 남습니다.
 *  · 이후 대사는 「이 대사 소설에 적용」으로 골라 담습니다.
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

async function pick(page: Page, sceneIndex: number, choiceIndex: number): Promise<void> {
  const cards = page.locator(`#play-scene-${sceneIndex} .choice-panel .choice-card`)
  await expect(cards.first()).toBeVisible()
  await cards.nth(choiceIndex).click()
}

test('직접 쓴 말이 본문·저장·완성본에 모두 남는다', async ({ page }) => {
  const errors = watchConsole(page)
  await page.goto('/#/novel/nv-cafe/play')
  await expect(page.locator('#play-scene-0 .choice-panel .choice-card').first()).toBeVisible()
  await pick(page, 0, 1)

  // 2화(명숙)의 말 걸기 지점 — 이 화 전용 힌트 3개
  const gate = page.locator('#play-scene-1 .speak-gate')
  await expect(gate).toBeVisible()
  await expect(gate.locator('.speak-gate-prompts button')).toHaveCount(3)

  // 추천 멘트가 아니라 직접 입력으로 말을 건다
  await gate.locator('.speak-gate-open').click()
  const panel = page.locator('.scene-chat')
  await expect(panel).toBeVisible()
  await expect(page.locator('.scene-chat-empty-title')).toHaveText('명숙이 지금 이 화에 서 있습니다')

  const input = page.locator('input[aria-label="메시지 입력"]')
  await input.fill('할머니, 그 장부 아직 있어요?')
  await page.getByRole('button', { name: '보내기' }).click()

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
  await input.fill('그 장부, 제가 봐도 될까요?')
  await page.getByRole('button', { name: '보내기' }).click()
  const row = page.locator('.scene-chat-row', { hasText: '그 장부, 제가 봐도 될까요?' }).last()
  await expect(row).toBeVisible()
  await row.locator('.scene-chat-apply').first().click()
  await page.locator('.scene-chat-close').click()
  await expect(page.locator('#play-scene-1 .play-said .play-line')).toHaveCount(3)

  // 새로고침 뒤에도 남는다
  await page.reload()
  await expect(page.locator('#play-scene-1 .play-said .play-line')).toHaveCount(3)

  // 나머지 화를 고르면 완성본에 내 대사가 들어간다
  await pick(page, 1, 0)
  for (let index = 2; index < 6; index += 1) {
    await pick(page, index, 0)
  }
  await expect(page.locator('#play-finish')).toBeVisible()
  await page.locator('.play-finish-actions a.btn-primary').click()
  await expect(page.locator('.finale-body')).toContainText('할머니, 그 장부 아직 있어요?')
  await expect(page.locator('.finale-action').first()).toBeVisible()

  expect(errors).toEqual([])
})

test('이 화에 없는 인물은 대화 상대로 열리지 않는다', async ({ page }) => {
  const errors = watchConsole(page)
  await page.goto('/#/novel/nv-office/play')
  await pick(page, 0, 0)
  const gate = page.locator('#play-scene-1 .speak-gate')
  await expect(gate).toBeVisible()
  await gate.locator('.speak-gate-open').click()

  const panel = page.locator('.scene-chat')
  await expect(panel).toBeVisible()
  const names = await panel.locator('.scene-chat-chip-name').allTextContents()
  expect(names).toContain('서준')
  expect(names).not.toContain('민재')
  // 서술자(하윤)는 '나'이므로 대화 상대 목록에 없습니다
  expect(names).not.toContain('하윤')

  expect(errors).toEqual([])
})

test('20화 장편 아크와 100화 이어쓰기가 화면에서 동작한다', async ({ page }) => {
  const errors = watchConsole(page)
  await page.goto('/#/novel/nv-office/play')
  await expect(page.locator('.play-intro-rules')).toContainText('22화')
  await expect(page.locator('.play-part')).toHaveCount(1)

  // 22화까지 고르면 4부 장편이 완결된다
  for (let index = 0; index < 22; index += 1) {
    await page.locator(`#play-scene-${index}`).scrollIntoViewIfNeeded()
    const cards = page.locator(`#play-scene-${index} .choice-panel .choice-card`)
    await expect(cards.first()).toBeVisible()
    await cards.nth(index === 21 ? 1 : index % (await cards.count())).click()
  }
  await expect(page.locator('#play-finish')).toBeVisible()
  await expect(page.locator('#play-finish')).toContainText('22화')

  // 장편 이어쓰기 — 23화부터 계속 쓴다
  await page.locator('#serial').scrollIntoViewIfNeeded()
  await expect(page.locator('.serial-writer')).toContainText('장편 이어쓰기')
  await page.getByRole('button', { name: '23화 쓰기' }).click()
  await expect(page.locator('.serial-chapter')).toHaveCount(1)
  await expect(page.locator('.serial-chapter-no')).toHaveText('23화')

  // 쓴 화는 새로고침 뒤에도 남는다
  await page.reload()
  await expect(page.locator('.serial-chapter')).toHaveCount(1)

  expect(errors).toEqual([])
})
