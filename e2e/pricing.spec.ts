import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * 유료 모델 — 무료 회차 · 기다무 · 대여권/코인 · 넥스트패스.
 *  · 4화는 잠겨 있고, 대여권 1장으로 열면 본문이 나온다 (지갑도 이 기기에 남는다)
 *  · 머리말 지갑에서 충전소를 열어 코인을 채우면 잔액이 늘어난다
 *  · 무료 체험 스위치로 넥스트패스를 켜면 잠긴 회차가 바로 열린다
 */

function watchConsole(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  return errors
}

test('4화는 잠겨 있고, 대여권으로 열면 지갑에서 1장이 빠진다', async ({ page }) => {
  const errors = watchConsole(page)
  await page.goto('/#/novel/nv-office/ep/ep-office-4a')

  const lock = page.locator('.ep-lock')
  await expect(lock).toBeVisible()
  await expect(lock).toContainText('이 회차는 유료 회차입니다')
  await expect(page.locator('article.reader-body')).toHaveCount(0)

  await page.getByRole('button', { name: /대여권 1장으로 열기/ }).click()
  await expect(page.locator('article.reader-body')).toBeVisible()
  await expect(page.locator('.ep-lock')).toHaveCount(0)
  await expect(page.locator('.wallet-pill')).toContainText('1')

  const stored = await page.evaluate(() => window.localStorage.getItem('np.wallet.v1') ?? '')
  expect(stored).toContain('ep:ep-office-4a')
  expect(errors).toEqual([])
})

test('1화는 무료이고, 3화는 기다무로 안내된다', async ({ page }) => {
  await page.goto('/#/novel/nv-office/ep/ep-office-1')
  await expect(page.locator('article.reader-body')).toBeVisible()
  await expect(page.locator('.ep-lock')).toHaveCount(0)

  await page.goto('/#/novel/nv-office/ep/ep-office-3a')
  await expect(page.locator('.ep-lock')).toContainText('기다리면 무료')
  await page.getByRole('button', { name: '기다무 신청하기' }).click()
  await expect(page.locator('.ep-lock h2')).toContainText('무료 공개까지')
})

test('충전소에서 코인을 채우고, 무료 체험으로 패스를 켜면 잠긴 회차가 열린다', async ({ page }) => {
  const errors = watchConsole(page)
  await page.goto('/#/')
  await page.locator('.wallet-pill').click()

  const modal = page.locator('.store-modal')
  await expect(modal).toBeVisible()
  await expect(modal.locator('.store-balance')).toContainText('코인')
  await expect(modal.locator('.store-card')).toHaveCount(4)

  // 50코인(+5) 패키지 결제 (데모)
  await modal.locator('.store-card').nth(1).click()
  await modal.getByRole('button', { name: /결제하기/ }).click()
  await expect(modal.locator('.store-balance')).toContainText('85')

  // 넥스트패스 무료 체험
  await modal.getByRole('tab', { name: '넥스트패스' }).click()
  await modal.locator('.pass-toggle input').check()
  await modal.getByRole('button', { name: /무료 체험 시작/ }).click()
  await expect(modal.locator('.store-balance')).toContainText('패스 D-7')

  await modal.getByRole('button', { name: '충전소 닫기' }).click()
  await expect(modal).toHaveCount(0)

  // 패스가 켜진 뒤에는 4화가 바로 읽힌다
  await page.goto('/#/novel/nv-office/ep/ep-office-4a')
  await expect(page.locator('article.reader-body')).toBeVisible()
  expect(errors).toEqual([])
})
