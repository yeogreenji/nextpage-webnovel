import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../store/StoreProvider'
import type { ReaderFont, ThemeName } from '../types'

/**
 * 📖 읽기 설정 드로어.
 * — 서체 · 글자 크기 · 줄간격 · 테마를 한 화면에서 조절하고, 이 기기에 저장합니다.
 * — 모바일에서는 아래에서 올라오는 시트, 넓은 화면에서는 오른쪽 드로어로 열립니다.
 */

const THEMES: { value: ThemeName; label: string; hint: string; bg: string; ink: string; line: string }[] = [
  { value: 'light', label: '화이트', hint: '밝은 낮', bg: '#ffffff', ink: '#17121d', line: '#e7e1ee' },
  { value: 'sepia', label: '세피아', hint: '종이색', bg: '#f9f0dd', ink: '#2c2415', line: '#d8c6a3' },
  { value: 'dark', label: '다크', hint: '야간 모드', bg: '#140f1e', ink: '#f8f3f7', line: '#2e2339' },
]

const FONTS: { value: ReaderFont; label: string; sample: string; family: string }[] = [
  { value: 'serif', label: '본문 명조', sample: '그날의 문장은, 명조로 남았다.', family: 'var(--font-serif)' },
  { value: 'sans', label: '깔끔 고딕', sample: '그날의 문장은, 고딕으로 남았다.', family: 'var(--font-sans)' },
  { value: 'maru', label: '마루부리', sample: '그날의 문장은, 마루부리로 남았다.', family: 'var(--font-maru)' },
]

const MIN_SIZE = 15
const MAX_SIZE = 28
const MIN_LINE = 1.5
const MAX_LINE = 2.4

export function ReaderSettingsDrawer({ onClose }: { onClose: () => void }) {
  const { settings, setTheme, setFont, setFontSize, setLineHeight, notify } = useStore()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    panelRef.current?.focus({ preventScroll: true })
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const reset = () => {
    setTheme('light')
    setFont('sans')
    setFontSize(18)
    setLineHeight(1.9)
    notify('읽기 설정을 처음 값으로 되돌렸어요')
  }

  // 헤더·본문의 쌓임 맥락(z-index)에 갇히지 않도록 body 로 포털합니다.
  return createPortal(
    <>
      <div className="settings-backdrop" onClick={onClose} aria-hidden />
      <aside
        className="settings-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="읽기 설정"
        ref={panelRef}
        tabIndex={-1}
      >
        <header className="settings-head">
          <div>
            <p className="eyebrow">Reading</p>
            <h2>읽기 설정</h2>
          </div>
          <button type="button" className="settings-close" onClick={onClose} aria-label="읽기 설정 닫기">
            ×
          </button>
        </header>

        <div className="settings-body">
          {/* 서체 */}
          <section className="settings-block">
            <div className="settings-label">
              <span>서체</span>
              <span className="settings-value">
                {FONTS.find((font) => font.value === settings.font)?.label}
              </span>
            </div>
            <div className="settings-fonts" role="radiogroup" aria-label="본문 서체">
              {FONTS.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  role="radio"
                  aria-checked={settings.font === font.value}
                  className="settings-font"
                  data-active={settings.font === font.value}
                  onClick={() => setFont(font.value)}
                >
                  <span className="settings-font-name">{font.label}</span>
                  <span className="settings-font-sample" style={{ fontFamily: font.family }}>
                    {font.sample}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* 글자 크기 */}
          <section className="settings-block">
            <div className="settings-label">
              <span>글자 크기</span>
              <span className="settings-value">{settings.fontSize}px</span>
            </div>
            <div className="settings-slider">
              <span className="settings-slider-min" aria-hidden>
                가
              </span>
              <input
                type="range"
                min={MIN_SIZE}
                max={MAX_SIZE}
                step={1}
                value={settings.fontSize}
                onChange={(event) => setFontSize(Number(event.target.value))}
                aria-label="글자 크기"
              />
              <span className="settings-slider-max" aria-hidden>
                가
              </span>
            </div>
            <div className="settings-ticks" aria-hidden>
              <span>{MIN_SIZE}</span>
              <span>{MAX_SIZE}</span>
            </div>
          </section>

          {/* 줄간격 */}
          <section className="settings-block">
            <div className="settings-label">
              <span>줄간격</span>
              <span className="settings-value">{settings.lineHeight.toFixed(1)}배</span>
            </div>
            <div className="settings-slider">
              <span className="settings-slider-min" aria-hidden>
                좁게
              </span>
              <input
                type="range"
                min={MIN_LINE}
                max={MAX_LINE}
                step={0.1}
                value={settings.lineHeight}
                onChange={(event) => setLineHeight(Number(event.target.value))}
                aria-label="줄간격"
              />
              <span className="settings-slider-max" aria-hidden>
                넓게
              </span>
            </div>
          </section>

          {/* 테마 */}
          <section className="settings-block">
            <div className="settings-label">
              <span>배경 테마</span>
              <span className="settings-value">
                {THEMES.find((theme) => theme.value === settings.theme)?.label}
              </span>
            </div>
            <div className="settings-themes" role="radiogroup" aria-label="배경 테마">
              {THEMES.map((theme) => (
                <button
                  key={theme.value}
                  type="button"
                  role="radio"
                  aria-checked={settings.theme === theme.value}
                  className="settings-theme"
                  data-active={settings.theme === theme.value}
                  onClick={() => setTheme(theme.value)}
                >
                  <span
                    className="settings-theme-swatch"
                    style={{ background: theme.bg, borderColor: theme.line }}
                    aria-hidden
                  >
                    <span style={{ background: theme.ink }} />
                    <span style={{ background: theme.line }} />
                    <span style={{ background: theme.line }} />
                  </span>
                  <span className="settings-theme-name">{theme.label}</span>
                  <span className="settings-theme-hint">{theme.hint}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 미리보기 */}
          <section className="settings-preview" aria-label="미리보기">
            <p className="settings-preview-label">미리보기</p>
            <div className="reader-body">
              <p>
                문장은 사람을 기다리지 않는다. 다만 읽는 사람이 나타나면, 그때 비로소 제 속도를
                찾는다.
              </p>
            </div>
          </section>
        </div>

        <footer className="settings-foot">
          <p>이 기기에 저장됩니다. 다음에 열어도 같은 설정으로 읽습니다.</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={reset}>
            기본값으로
          </button>
        </footer>
      </aside>
    </>,
    document.body,
  )
}
