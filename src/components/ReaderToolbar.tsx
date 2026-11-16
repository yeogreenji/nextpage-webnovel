import { useStore } from '../store/StoreProvider'
import type { ReaderFont, ThemeName } from '../types'

const THEMES: { value: ThemeName; label: string }[] = [
  { value: 'light', label: '라이트' },
  { value: 'sepia', label: '세피아' },
  { value: 'dark', label: '다크' },
]

const FONTS: { value: ReaderFont; label: string }[] = [
  { value: 'serif', label: '명조' },
  { value: 'sans', label: '고딕' },
]

const MIN = 15
const MAX = 26

const LINE_STEPS = [1.6, 1.8, 2.0, 2.2, 2.4]

/** 읽기 환경 설정: 테마 + 글자 크기 + 줄간격 + 서체 */
export function ReaderToolbar() {
  const { settings, setTheme, setFontSize, setLineHeight, setFont } = useStore()

  const lineIndex = Math.max(
    0,
    LINE_STEPS.findIndex((step) => Math.abs(step - settings.lineHeight) < 0.05),
  )

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <span className="eyebrow">Reading</span>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="segmented">
          {THEMES.map((theme) => (
            <button
              key={theme.value}
              type="button"
              data-active={settings.theme === theme.value}
              onClick={() => setTheme(theme.value)}
            >
              {theme.label}
            </button>
          ))}
        </div>

        <span className="w-px h-5" style={{ background: 'var(--line)' }} aria-hidden />

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="w-8 h-8 rounded-lg border text-[12px] font-bold transition-colors"
            style={{ borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink-soft)' }}
            onClick={() => setFontSize(Math.max(MIN, settings.fontSize - 1))}
            aria-label="글자 작게"
            disabled={settings.fontSize <= MIN}
          >
            가
          </button>
          <span className="w-8 text-center text-[11.5px] font-bold tabular-nums" style={{ color: 'var(--ink-mute)' }}>
            {settings.fontSize}
          </span>
          <button
            type="button"
            className="w-8 h-8 rounded-lg border text-[15px] font-bold transition-colors"
            style={{ borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink-soft)' }}
            onClick={() => setFontSize(Math.min(MAX, settings.fontSize + 1))}
            aria-label="글자 크게"
            disabled={settings.fontSize >= MAX}
          >
            가
          </button>
        </div>

        <span className="w-px h-5" style={{ background: 'var(--line)' }} aria-hidden />

        <button
          type="button"
          className="h-8 rounded-lg border px-2.5 text-[11px] font-bold tabular-nums transition-colors"
          style={{ borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink-soft)' }}
          onClick={() => setLineHeight(LINE_STEPS[(lineIndex + 1) % LINE_STEPS.length])}
          aria-label={`줄간격 변경 (현재 ${settings.lineHeight.toFixed(1)}배)`}
          title="줄간격 바꾸기"
        >
          줄간격 {settings.lineHeight.toFixed(1)}
        </button>

        <div className="segmented">
          {FONTS.map((font) => (
            <button
              key={font.value}
              type="button"
              data-active={settings.font === font.value}
              onClick={() => setFont(font.value)}
            >
              {font.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
