import { JSDOM } from 'jsdom'

/**
 * 화면(DOM) 검사 — 실제 브라우저 대신 jsdom에서 앱을 띄워 확인합니다.
 *  · 장면 채팅의 「티키타카 둘 다 넣기」가 두 줄을 모두 남기는지 (본문·저장·완성본)
 *  · 조사 처리(이/가)가 화면 문구에 반영되는지
 *  · 콘솔 에러 없이 그려지는지
 */
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
})

const define = (key: string, value: unknown) => {
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
}

define('window', dom.window)
define('document', dom.window.document)
define('navigator', dom.window.navigator)
define('localStorage', dom.window.localStorage)
define('HTMLElement', dom.window.HTMLElement)
define('Node', dom.window.Node)
define('Element', dom.window.Element)
define('Event', dom.window.Event)
define('MouseEvent', dom.window.MouseEvent)
define('KeyboardEvent', dom.window.KeyboardEvent)
define('getComputedStyle', dom.window.getComputedStyle.bind(dom.window))
define('requestAnimationFrame', (callback: FrameRequestCallback) =>
  dom.window.setTimeout(() => callback(Date.now()), 16) as unknown as number,
)
define('cancelAnimationFrame', (handle: number) => dom.window.clearTimeout(handle))
define('scrollTo', () => {})
define('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }))
// jsdom에는 없는 스크롤 API — 화면 코드가 부드럽게 스크롤할 때 필요합니다.
dom.window.Element.prototype.scrollIntoView = () => {}
dom.window.scrollTo = () => {}

const { describe, it } = await import('node:test')
const assert = (await import('node:assert/strict')).default
const { render, fireEvent, waitFor, cleanup } = await import('@testing-library/react')
const React = await import('react')
const { MemoryRouter, Route, Routes } = await import('react-router-dom')
const { StoreProvider } = await import('../src/store/StoreProvider')
const { PlayPage } = await import('../src/pages/PlayPage')
const { FinalePage } = await import('../src/pages/FinalePage')
const { ALL_FLOWS } = await import('../src/data/flows')

const consoleErrors: string[] = []
const originalError = console.error
console.error = (...args: unknown[]) => {
  consoleErrors.push(args.map((value) => String(value)).join(' '))
  originalError(...args)
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 80))

function renderApp(initialPath: string) {
  return render(
    React.createElement(
      StoreProvider,
      null,
      React.createElement(
        MemoryRouter,
        { initialEntries: [initialPath] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: '/novel/:novelId/play', element: React.createElement(PlayPage) }),
          React.createElement(Route, {
            path: '/novel/:novelId/finale',
            element: React.createElement(FinalePage),
          }),
        ),
      ),
    ),
  )
}

/** 지금 열린 장면의 A/B 카드 중 하나를 누릅니다. */
async function pick(sceneIndex: number, choiceIndex: number) {
  const cards = await waitFor(() => {
    const found = document.querySelectorAll(`#play-scene-${sceneIndex} .choice-panel .choice-card`)
    assert.equal(found.length, 2, `${sceneIndex}장 선택지`)
    return found
  })
  await settle()
  fireEvent.click(cards[choiceIndex] as HTMLElement)
  await settle()
}

describe('화면 — 장면 대화로 넣은 대사', () => {
  it('티키타카 둘 다 넣기 → 두 줄이 본문과 저장소, 완성본에 모두 남는다', async () => {
    window.localStorage.clear()
    renderApp('/novel/nv-cafe/play')

    await pick(0, 1)

    // 2장에서 명숙과 대화 열기
    const chatButton = document.querySelector('#play-scene-1 .play-chat-inline') as HTMLElement | null
    assert.ok(chatButton, '이 장면에서 대화 버튼')
    fireEvent.click(chatButton)

    // 조사 처리 확인 — 명숙(받침) → '명숙이 지금 이 장면에 서 있습니다'
    await waitFor(() => {
      const title = document.querySelector('.scene-chat-empty-title')
      assert.ok(title, '대화 빈 화면')
      assert.equal(title?.textContent?.trim(), '명숙이 지금 이 장면에 서 있습니다')
    })

    // 메시지 보내기 → 기기 안 응답(개발 서버에는 /api/chat이 없습니다)
    const input = document.querySelector('input[aria-label="메시지 입력"]') as HTMLInputElement | null
    assert.ok(input, '메시지 입력')
    fireEvent.change(input, { target: { value: '할머니, 그 장부 아직 있어요?' } })
    fireEvent.submit(input.closest('form') as HTMLFormElement)

    const pairButton = await waitFor(
      () => {
        const buttons = Array.from(document.querySelectorAll('.scene-chat-apply')) as HTMLElement[]
        const found = buttons.find((button) => button.textContent?.includes('티키타카 둘 다 넣기'))
        assert.ok(found, '티키타카 버튼')
        return found as HTMLElement
      },
      { timeout: 10_000 },
    )
    fireEvent.click(pairButton)
    await settle()

    // 본문에 두 줄
    await waitFor(() => {
      const lines = document.querySelectorAll('#play-scene-1 .play-line')
      assert.equal(lines.length, 2)
    })
    const rendered = Array.from(document.querySelectorAll('#play-scene-1 .play-line')).map((line) =>
      line.textContent?.replace(/\s+/g, ' ').trim(),
    )
    assert.ok(rendered.some((text) => text?.includes('장부 아직 있어요')), '내 대사가 본문에')
    assert.ok(rendered.some((text) => text?.includes('명숙')), '캐릭터 대사가 본문에')

    // 저장소에도 두 줄
    const stored = JSON.parse(window.localStorage.getItem('np.play.v1') ?? '{}')
    const applied = stored['nv-cafe'].applied as { kind: string; text: string }[]
    assert.equal(applied.length, 2)
    assert.deepEqual(
      applied.map((line) => line.kind),
      ['user', 'character'],
    )

    // 나머지 선택을 마치고 완성본에서도 두 줄
    for (let index = 1; index < 6; index += 1) {
      await pick(index, 0)
    }

    const finaleLink = document.querySelector('#play-finish a.btn-primary') as HTMLAnchorElement | null
    assert.ok(finaleLink, '완성본 링크')
    fireEvent.click(finaleLink)

    await waitFor(() => {
      const says = document.querySelectorAll('.finale-say')
      assert.equal(says.length, 2)
    })
    const finaleText = document.querySelector('.finale-body')?.textContent ?? ''
    assert.ok(finaleText.includes(applied[0].text), '완성본에 내 대사')
    assert.ok(finaleText.includes(applied[1].text), '완성본에 캐릭터 대사')

    // 콘솔 에러 0 (React act 경고 등은 제외하고 실제 오류만)
    const realErrors = consoleErrors.filter((message) => !message.includes('not wrapped in act'))
    assert.deepEqual(realErrors, [])

    cleanup()
  })
})

describe('화면 — 마지막 선택과 엔딩', () => {
  for (const flow of ALL_FLOWS) {
    const endingB = flow.endings.find((ending) => ending.tone === 'B')!
    it(`${flow.novelId} · 마지막에 B를 고르면 「${endingB.name}」`, async () => {
      window.localStorage.clear()
      renderApp(`/novel/${flow.novelId}/play`)

      for (let index = 0; index < 6; index += 1) {
        await pick(index, index === 5 ? 1 : index % 2)
      }

      await waitFor(() => {
        const line = document.querySelector('.play-finish-ending')
        assert.ok(line, '엔딩 표시')
        assert.ok(line?.textContent?.includes(endingB.name), `엔딩 이름: ${line?.textContent}`)
      })

      cleanup()
    })
  }

  for (const novelId of ['nv-cafe', 'nv-academy', 'nv-parcel', 'nv-office']) {
    const flow = ALL_FLOWS.find((item) => item.novelId === novelId)!
    const endingA = flow.endings.find((ending) => ending.tone === 'A')!
    it(`${novelId} · 마지막에 A를 고르면 「${endingA.name}」`, async () => {
      window.localStorage.clear()
      renderApp(`/novel/${novelId}/play`)

      for (let index = 0; index < 6; index += 1) {
        await pick(index, index === 5 ? 0 : (index + 1) % 2)
      }

      await waitFor(() => {
        const line = document.querySelector('.play-finish-ending')
        assert.ok(line, '엔딩 표시')
        assert.ok(line?.textContent?.includes(endingA.name), `엔딩 이름: ${line?.textContent}`)
      })

      cleanup()
    })
  }
})
