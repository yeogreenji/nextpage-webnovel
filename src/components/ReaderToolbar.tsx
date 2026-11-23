import { useState } from 'react'
import { useStore } from '../store/StoreProvider'
import type { ReaderFont, ThemeName } from '../types'
import { ReaderSettingsDrawer } from './ReaderSettingsDrawer'

const THEMES: { value: ThemeName; label: string; glyph: string }[] = [
  { value: 'light', label: '화이트', glyph: '☀' },
  { value: 'sepia', label: '세피아', glyph: '◐' },
  { value: 'dark', label: '다크', glyph: '☾' },
]

const FONT_LABEL: Record<ReaderFont, string> = {
  serif: '명조',
  sans: '고딕',
  maru: '마루부리',
}

const MIN = 15
const MAX = 28

/**
 * 읽기 도구 모음 — 서체·크기·줄간격·테마를 한 번에.
 * — 자주 쓰는 테마와 크기는 바에서 바로, 나머지는 「Aa 읽기 설정」 드로어에서 조절합니다.
 */
export function ReaderToolbar() {
  const { settings, setTheme, setFontSize } = useStore()
  const [open, setOpen] = useState(false)

  return (
    <div className="reader-quickbar">
      <button
        type="button"
        className="reader-settings-open"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label="읽기 설정 열기 (서체·글자 크기·줄간격·테마)"
      >
        <span className="reader-settings-aa" aria-hidden>
          Aa
        </span>
        <span className="reader-settings-copy">
          <b>읽기 설정</b>
          <em>
            {FONT_LABEL[settings.font]} · {settings.fontSize}px · {settings.lineHeight.toFixed(1)}배
          </em>
        </span>
      </button>

      <div className="segmented" role="group" aria-label="배경 테마">
        {THEMES.map((theme) => (
          <button
            key={theme.value}
            type="button"
            data-active={settings.theme === theme.value}
            onClick={() => setTheme(theme.value)}
            aria-label={`${theme.label} 테마`}
            title={`${theme.label} 테마`}
          >
            <span aria-hidden>{theme.glyph}</span> {theme.label}
          </button>
        ))}
      </div>

      <div className="reader-size">
        <button
          type="button"
          className="reader-size-btn"
          onClick={() => setFontSize(Math.max(MIN, settings.fontSize - 1))}
          aria-label="글자 작게"
          disabled={settings.fontSize <= MIN}
        >
          가
        </button>
        <span className="reader-size-value" aria-hidden>
          {settings.fontSize}
        </span>
        <button
          type="button"
          className="reader-size-btn"
          onClick={() => setFontSize(Math.min(MAX, settings.fontSize + 1))}
          aria-label="글자 크게"
          disabled={settings.fontSize >= MAX}
        >
          가
        </button>
      </div>

      {open && <ReaderSettingsDrawer onClose={() => setOpen(false)} />}
    </div>
  )
}
