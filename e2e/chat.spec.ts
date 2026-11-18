import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * 장면 중간 캐릭터 대화 — 「티키타카 둘 다 넣기」와 한국어 조사.
 *  · 두 대사가 모두 본문에 들어가고, 새로고침 뒤에도 남고, 완성본에도 실립니다.
 *  · 이름 뒤 조사가 받침에 맞게 붙습니다 (명숙이 / 유나가).
 */

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

async function openPlay(page: Page, novelId: string): Promise<string[]> {
  const errors = watchConsole(page)
  await page.goto(`/#/novel/${novelId}/play`)
  await expect(page.locator('#play-scene-0 .choice-panel .choice-card')).toHaveCount(2)
  return errors
}

async function pick(page: Page, sceneIndex: number, choiceIndex: number): Promise<void> {
  const cards = page.locator(`#play-scene-${sceneIndex} .choice-panel .choice-card`)
  await expect(cards).toHaveCount(2)
  await cards.nth(choiceIndex).click()
}

test('티키타카 둘 다 넣기 — 두 대사가 본문·저장·완성본에 모두 남는다', async ({ page }) => {
  const errors = await openPlay(page, 'nv-cafe')
  await pick(page, 0, 1)

  // 2장(명숙) 대화 열기
  await page.locator('#play-scene-1 .play-chat-inline').click()
  await expect(page.locator('.scene-chat')).toBeVisible()
  await expect(page.locator('.scene-chat-empty-title')).toHaveText('명숙이 지금 이 장면에 서 있습니다')

  const input = page.locator('input[aria-label="메시지 입력"]')
  await input.fill('할머니, 그 장부 아직 있어요?')
  await page.getByRole('button', { name: '보내기' }).click()

  const pairButton = page.getByRole('button', { name: '티키타카 둘 다 넣기' })
  await expect(pairButton).toBeVisible()

  const reply = (await page.locator('.scene-chat-bubble[data-role="character"]').last().innerText()).trim()
  await pairButton.click()

  // 본문에 내 대사 + 캐릭터 대사
  const lines = page.locator('#play-scene-1 .play-line')
  await expect(lines).toHaveCount(2)
  await expect(lines.first()).toContainText('장부 아직 있어요')
  await expect(lines.nth(1)).toContainText(reply.slice(0, 12))

  // 새로고침 후에도 두 줄 유지
  await page.reload()
  await expect(page.locator('#play-scene-1 .play-line')).toHaveCount(2)

  // 나머지 선택을 마치고 완성본에서도 두 줄
  for (let index = 1; index < 6; index += 1) {
    await pick(page, index, 0)
  }
  await page.locator('#play-finish a.btn-primary').click()
  await expect(page.locator('.finale-say')).toHaveCount(2)
  await expect(page.locator('.finale-body')).toContainText('장부 아직 있어요')
  await expect(page.locator('.finale-body')).toContainText(reply.slice(0, 12))

  expect(errors).toEqual([])
})

test('이름 뒤 조사가 받침에 맞는다 — 명숙이 / 유나가', async ({ page }) => {
  const errors = watchConsole(page)

  await page.goto('/#/novel/nv-office/play')
  await expect(page.locator('#play-scene-0 .choice-panel .choice-card')).toHaveCount(2)
  await expect(page.locator('#play-scene-0 .play-chat-inline')).toContainText('서준')

  await page.locator('#play-scene-0 .play-chat-inline').click()
  await expect(page.locator('.scene-chat-empty-title')).toHaveText('서준이 지금 이 장면에 서 있습니다')
  await page.getByRole('button', { name: '대화 닫기' }).click()

  // 3장(유나)까지 진행
  await pick(page, 0, 0)
  await pick(page, 1, 0)
  await page.locator('#play-scene-2 .play-chat-inline').click()
  await expect(page.locator('.scene-chat-empty-title')).toHaveText('유나가 지금 이 장면에 서 있습니다')

  expect(errors).toEqual([])
})

test('작품 페이지의 캐릭터 톡 — 하윤과 / 유나와', async ({ page }) => {
  const errors = watchConsole(page)

  await page.goto('/#/novel/nv-office')
  const chat = page.locator('#chat .chat-empty-title').first()
  await expect(chat).toHaveText('하윤과 첫 대화를 시작해 보세요')

  await page.locator('#chat .chat-tab', { hasText: '유나' }).click()
  await expect(page.locator('#chat .chat-empty-title').first()).toHaveText('유나와 첫 대화를 시작해 보세요')

  expect(errors).toEqual([])
})
