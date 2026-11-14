import { useStore } from '../store/StoreProvider'
import type { ThemeName } from '../types'

const THEMES: { value: ThemeName; label: string }[] = [
  { value: 'light', label: '라이트' },
  { value: 'sepia', label: '세피아' },
  { value: 'dark', label: '다크' },
]

const MIN = 15
const MAX = 26

/** 읽기 환경 설정: 테마 + 글자 크기 */
export function ReaderToolbar() {
  const { settings, setTheme, setFontSize } = useStore()

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
      </div>
    </div>
  )
}
