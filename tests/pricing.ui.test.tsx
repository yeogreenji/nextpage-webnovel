import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { JSDOM } from 'jsdom'

/** 단독 실행 대비 최소 DOM */
if (typeof window === 'undefined') {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
  })
  const define = (key: string, value: unknown) =>
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
  define('window', dom.window)
  define('document', dom.window.document)
  define('navigator', dom.window.navigator)
  define('localStorage', dom.window.localStorage)
  define('HTMLElement', dom.window.HTMLElement)
}

const { render, fireEvent, waitFor, cleanup } = await import('@testing-library/react')
const React = await import('react')
const { MemoryRouter, Route, Routes } = await import('react-router-dom')
const { StoreProvider } = await import('../src/store/StoreProvider')
const { EpisodePage } = await import('../src/pages/EpisodePage')
const { Layout } = await import('../src/components/Layout')
const { clearWallet, loadWallet } = await import('../src/lib/commerce')

const settle = () => new Promise((resolve) => setTimeout(resolve, 150))

function renderEpisode(episodeId: string) {
  return render(
    React.createElement(
      StoreProvider,
      null,
      React.createElement(
        MemoryRouter,
        { initialEntries: [`/novel/nv-office/ep/${episodeId}`] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: '/novel/:novelId/ep/:episodeId',
            element: React.createElement(EpisodePage),
          }),
        ),
      ),
    ),
  )
}

describe('화면 — 유료 회차 잠금과 열기', () => {
  it('4화는 잠겨 있고, 대여권으로 열면 본문이 나오며 장수가 줄어든다', async () => {
    window.localStorage.clear()
    clearWallet()

    renderEpisode('ep-office-4a')
    await waitFor(() => assert.ok(document.querySelector('.ep-lock')), '잠금 안내')
    assert.equal(document.querySelectorAll('article.reader-body').length, 0, '본문은 아직 없음')
    assert.match(document.body.textContent ?? '', /이 회차는 유료 회차입니다/)
    assert.equal(loadWallet().tickets, 2)

    const openWithTicket = Array.from(document.querySelectorAll('button')).find((node) =>
      (node.textContent ?? '').includes('대여권 1장으로 열기'),
    ) as HTMLButtonElement | undefined
    assert.ok(openWithTicket, '대여권 버튼')
    fireEvent.click(openWithTicket)
    await settle()

    await waitFor(() => assert.ok(document.querySelector('article.reader-body')), '본문 공개')
    assert.equal(document.querySelectorAll('.ep-lock').length, 0, '잠금 해제')
    const wallet = loadWallet()
    assert.equal(wallet.tickets, 1, '대여권 1장 차감')
    assert.ok(wallet.unlocked.includes('ep:ep-office-4a'), '열람 기록')

    cleanup()
    window.localStorage.clear()
  })

  it('1화는 무료라서 바로 읽힌다', async () => {
    window.localStorage.clear()
    clearWallet()
    renderEpisode('ep-office-1')
    await waitFor(() => assert.ok(document.querySelector('article.reader-body')), '본문')
    assert.equal(document.querySelectorAll('.ep-lock').length, 0)
    cleanup()
    window.localStorage.clear()
  })
})

describe('화면 — 머리말 지갑과 충전소', () => {
  it('지갑 잔액이 머리말에 보이고, 충전소에서 코인을 채우면 잔액이 늘어난다', async () => {
    window.localStorage.clear()
    clearWallet()

    render(
      React.createElement(
        StoreProvider,
        null,
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(Layout, null, React.createElement('div', null, '본문')),
        ),
      ),
    )
    await settle()

    const pill = document.querySelector('.wallet-pill') as HTMLButtonElement
    assert.ok(pill, '지갑 버튼')
    assert.match(pill.getAttribute('aria-label') ?? '', /보유 코인 30, 대여권 2장/)

    fireEvent.click(pill)
    await waitFor(() => assert.ok(document.querySelector('.store-modal')), '충전소 열림')
    const cards = document.querySelectorAll('.store-card')
    assert.ok(cards.length >= 4, '코인 패키지 카드')

    // 두 번째 패키지(50코인 +5) 선택 후 결제
    fireEvent.click(cards[1] as HTMLElement)
    await settle()
    const payButton = Array.from(document.querySelectorAll('.store-foot button')).find((node) =>
      (node.textContent ?? '').includes('결제하기'),
    ) as HTMLButtonElement
    assert.ok(payButton, '결제 버튼')
    fireEvent.click(payButton)
    await settle()

    const wallet = loadWallet()
    assert.equal(wallet.coins, 30 + 55, '50코인 + 5 보너스')
    assert.ok((document.querySelector('.store-balance')?.textContent ?? '').includes('85'))

    // 패스 탭에는 무료 체험 스위치가 있고, 켜면 체험이 시작된다
    const passTab = Array.from(document.querySelectorAll('[role="tab"]')).find((node) =>
      (node.textContent ?? '').includes('넥스트패스'),
    ) as HTMLElement
    fireEvent.click(passTab)
    await waitFor(() => assert.ok(document.querySelector('.pass-toggle')), '무료 체험 스위치')
    const toggle = document.querySelector('.pass-toggle input') as HTMLInputElement
    fireEvent.click(toggle)
    await settle()
    const startButton = Array.from(document.querySelectorAll('.pass-side button')).find((node) =>
      (node.textContent ?? '').includes('무료 체험 시작'),
    ) as HTMLButtonElement
    assert.ok(startButton, '무료 체험 시작 버튼')
    fireEvent.click(startButton)
    await settle()

    const afterTrial = loadWallet()
    assert.equal(afterTrial.trialUsed, true, '체험 사용 기록')
    assert.ok(afterTrial.passUntil, '패스 만료 시각')
    assert.match(document.querySelector('.store-balance')?.textContent ?? '', /패스 D-7/)

    cleanup()
    window.localStorage.clear()
  })
})
