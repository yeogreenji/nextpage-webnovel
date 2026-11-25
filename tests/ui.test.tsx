import { JSDOM } from 'jsdom'

/**
 * 화면(DOM) 검사 — 실제 브라우저 대신 jsdom에서 앱을 띄워 확인합니다.
 *  · 말 걸기 지점에서 대화를 걸면 행동 요약과 대사가 본문에 그대로 들어가는지
 *  · 이후 대사를 「적용」으로 골라 담을 수 있는지 (본문·저장·완성본)
 *  · 25작품 모두 마지막 선택과 엔딩이 어긋나지 않는지
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

const settle = () => new Promise((resolve) => setTimeout(resolve, 90))

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

/** 지금 열린 장면에서 n번째 갈래를 누릅니다. */
async function pick(sceneIndex: number, choiceIndex: number) {
  const cards = await waitFor(() => {
    const found = document.querySelectorAll(`#play-scene-${sceneIndex} .choice-panel .choice-card`)
    assert.ok(found.length >= 2 && found.length <= 4, `${sceneIndex}화 선택지 ${found.length}`)
    return found
  })
  await settle()
  fireEvent.click(cards[choiceIndex % cards.length] as HTMLElement)
  await settle()
}

describe('화면 — 말 걸기 지점에서 소설로', () => {
  it('말을 걸면 행동 요약과 첫 대사가 본문·저장소·완성본에 들어간다', async () => {
    window.localStorage.clear()
    const flow = ALL_FLOWS.find((item) => item.novelId === 'nv-secretary')!
    renderApp('/novel/nv-secretary/play')

    // 1장의 말 걸기 지점이 보인다
    const gate = await waitFor(() => {
      const found = document.querySelector('#play-scene-0 .speak-gate')
      assert.ok(found, '말 걸기 지점')
      return found as HTMLElement
    })
    const prompts = gate.querySelectorAll('.speak-gate-prompts button')
    assert.ok(prompts.length >= 2, '이 화 전용 힌트')

    // 추천 대사 하나를 고르면 입력창에 그대로 담긴다
    fireEvent.click(prompts[0] as HTMLElement)
    const input = await waitFor(() => {
      const found = document.querySelector('input[aria-label="메시지 입력"]') as HTMLInputElement | null
      assert.ok(found, '메시지 입력')
      return found
    })
    const chosen = (prompts[0] as HTMLElement).textContent?.replace(/^“|”$/g, '') ?? ''
    await waitFor(() => assert.ok(input.value.length > 0, '추천 대사가 채워짐'))
    assert.equal(input.value, chosen)

    // 보내면 대화가 열리고, 행동 요약 + 내 대사가 바로 소설로 들어간다
    fireEvent.submit(input.closest('form') as HTMLFormElement)
    await waitFor(
      () => {
        const said = document.querySelector('#play-scene-0 .play-said')
        assert.ok(said, '소설에 들어간 대화')
        assert.equal(said?.querySelectorAll('.play-line').length, 2, '내 대사 + 캐릭터 대사')
        assert.equal(said?.querySelectorAll('.play-said-action').length, 1, '행동 요약')
      },
      { timeout: 12_000 },
    )

    const stored = JSON.parse(window.localStorage.getItem('np.play.v1') ?? '{}')
    const applied = stored['nv-secretary'].applied as { kind: string; text: string }[]
    assert.equal(applied.length, 3, '행동 + 내 대사 + 캐릭터 대사')
    assert.deepEqual(applied.map((line) => line.kind), ['action', 'user', 'character'])

    // 대화 닫고, 이후 대사는 「적용」으로 골라 담는다
    fireEvent.click(document.querySelector('.scene-chat-close') as HTMLElement)
    await settle()
    fireEvent.click(document.querySelector('#play-scene-0 .speak-gate-open') as HTMLElement)
    const input2 = await waitFor(() => {
      const found = document.querySelector('input[aria-label="메시지 입력"]') as HTMLInputElement | null
      assert.ok(found)
      return found
    })
    fireEvent.change(input2, { target: { value: '그 숫자, 저는 못 믿겠습니다.' } })
    fireEvent.submit(input2.closest('form') as HTMLFormElement)
    const applyButton = await waitFor(
      () => {
        const buttons = Array.from(document.querySelectorAll('.scene-chat-apply')) as HTMLElement[]
        const found = buttons.find((button) => (button.textContent ?? '').includes('이 대사 소설에 적용'))
        assert.ok(found, '적용 버튼')
        return found as HTMLElement
      },
      { timeout: 12_000 },
    )
    fireEvent.click(applyButton)
    await settle()
    fireEvent.click(document.querySelector('.scene-chat-close') as HTMLElement)
    await settle()

    await waitFor(() => {
      const lines = document.querySelectorAll('#play-scene-0 .play-said .play-line')
      assert.ok(lines.length >= 3, `본문 대사 ${lines.length}`)
    })

    // 나머지 선택을 마치고 완성본에서도 대사가 이어진다
    for (let index = 0; index < flow.scenes.length; index += 1) {
      await pick(index, 0)
    }
    const finaleLink = document.querySelector('#play-finish a.btn-primary') as HTMLAnchorElement | null
    assert.ok(finaleLink, '완성본 링크')
    fireEvent.click(finaleLink)
    await waitFor(() => {
      const body = document.querySelector('.finale-body')?.textContent ?? ''
      assert.ok(body.includes('그 숫자, 저는 못 믿겠습니다.'), '완성본에 내 대사')
      assert.ok(body.includes('나는'), '완성본에 행동 요약')
    })

    const realErrors = consoleErrors.filter((message) => !message.includes('not wrapped in act'))
    assert.deepEqual(realErrors, [])

    cleanup()
  })
})

describe('화면 — 마지막 선택과 엔딩', () => {
  for (const flow of ALL_FLOWS) {
    const last = flow.scenes[flow.scenes.length - 1]
    const endingB = flow.endings.find((ending) => ending.tone === 'B')!
    const bIndex = last.choices.findIndex((choice) => choice.tone === 'B')
    it(`${flow.novelId} · 마지막에 B를 고르면 「${endingB.name}」`, async () => {
      window.localStorage.clear()
      renderApp(`/novel/${flow.novelId}/play`)

      for (let index = 0; index < flow.scenes.length; index += 1) {
        await pick(index, index === flow.scenes.length - 1 ? bIndex : index % last.choices.length)
      }

      await waitFor(() => {
        const line = document.querySelector('.play-finish-ending')
        assert.ok(line, '엔딩 표시')
        assert.ok(line?.textContent?.includes(endingB.name), `엔딩 이름: ${line?.textContent}`)
      })

      cleanup()
    })
  }

  for (const novelId of ['nv-cafe', 'nv-academy', 'nv-parcel', 'nv-office', 'nv-secretary']) {
    const flow = ALL_FLOWS.find((item) => item.novelId === novelId)!
    const last = flow.scenes[flow.scenes.length - 1]
    const endingA = flow.endings.find((ending) => ending.tone === 'A')!
    const aIndex = last.choices.findIndex((choice) => choice.tone === 'A')
    it(`${novelId} · 마지막에 A를 고르면 「${endingA.name}」`, async () => {
      window.localStorage.clear()
      renderApp(`/novel/${novelId}/play`)

      for (let index = 0; index < flow.scenes.length; index += 1) {
        await pick(index, index === flow.scenes.length - 1 ? aIndex : (index + 1) % last.choices.length)
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

describe('화면 — 6화 작품도 7화부터 이어쓴다', () => {
  it('완결 화면 아래에 장편 이어쓰기와 7화 버튼이 있다', async () => {
    window.localStorage.clear()
    const flow = ALL_FLOWS.find((item) => item.novelId === 'nv-cafe')!
    renderApp('/novel/nv-cafe/play')
    for (let index = 0; index < flow.scenes.length; index += 1) {
      await pick(index, 0)
    }
    await waitFor(() => {
      const section = document.querySelector('.serial-writer')
      assert.ok(section, '이어쓰기 섹션')
      const text = section?.textContent ?? ''
      assert.ok(text.includes('장편 이어쓰기'), text.slice(0, 40))
      assert.ok(text.includes('7화'), '다음 화 7화')
      assert.ok(text.includes('/ 100화'), '100화 목표')
    })
    cleanup()
  })
})
