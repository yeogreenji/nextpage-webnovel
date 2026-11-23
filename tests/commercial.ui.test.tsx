import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { JSDOM } from 'jsdom'

/** ui.test.tsx 가 window 를 준비하기 전에 단독 실행되는 경우를 대비합니다. */
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
const { MemoryRouter } = await import('react-router-dom')
const { StoreProvider } = await import('../src/store/StoreProvider')
const { ShelfPage } = await import('../src/pages/ShelfPage')
const { recordReading, toggleShelf, unlockEnding } = await import('../src/lib/library')
const { ALL_FLOWS } = await import('../src/data/flows')

const settle = () => new Promise((resolve) => setTimeout(resolve, 120))

function renderShelf() {
  return render(
    React.createElement(
      StoreProvider,
      null,
      React.createElement(MemoryRouter, { initialEntries: ['/shelf'] }, React.createElement(ShelfPage)),
    ),
  )
}

describe('화면 — 내 서재', () => {
  it('최근 본 · 내 서재 · 엔딩 도감 탭이 저장된 기록으로 채워진다', async () => {
    window.localStorage.clear()
    recordReading({
      novelId: 'nv-cafe',
      episodeId: 'ep-cafe-1',
      episodeNo: 1,
      episodeTitle: '새벽 두 시',
      percent: 0.42,
    })
    toggleShelf('nv-ceo')
    unlockEnding('nv-office', ALL_FLOWS.find((flow) => flow.novelId === 'nv-office')!.endings[1])

    renderShelf()
    await waitFor(() => {
      assert.ok(document.body.textContent?.includes('내 서재'))
      assert.ok(document.body.textContent?.includes('새벽 두 시의 냄새') || document.body.textContent?.includes('새벽 두 시'))
    })
    await settle()

    // 엔딩 도감 — 모은 엔딩 1/3, 못 본 엔딩은 잠금
    const codexTab = Array.from(document.querySelectorAll('[role="tab"]')).find((node) =>
      (node.textContent ?? '').includes('엔딩 도감'),
    ) as HTMLElement
    assert.ok(codexTab, '엔딩 도감 탭')
    fireEvent.click(codexTab)
    await waitFor(() => {
      const locked = document.querySelectorAll('.codex-slot:not([data-unlocked="true"])')
      assert.ok(locked.length > 0, '잠긴 엔딩 슬롯')
      const opened = document.querySelectorAll('.codex-slot[data-unlocked="true"]')
      assert.ok(opened.length >= 1, '열린 엔딩 슬롯')
      const names = Array.from(locked).map((node) => node.textContent ?? '')
      assert.ok(names.every((name) => name.includes('아직 보지 못한 엔딩')))
    })
    await settle()

    // 내 서재 — 찜한 작품
    const shelfTab = Array.from(document.querySelectorAll('[role="tab"]')).find((node) =>
      (node.textContent ?? '').includes('내 서재'),
    ) as HTMLElement
    fireEvent.click(shelfTab)
    await waitFor(() => {
      assert.ok(document.body.textContent?.includes('사장님, 그 계약 제가 다시 씁니다'))
    })

    cleanup()
    window.localStorage.clear()
  })
})
