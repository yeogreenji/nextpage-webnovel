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
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5"
      style={{ background: 'var(--surface-2)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold" style={{ color: 'var(--ink-mute)' }}>
          배경
        </span>
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
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold" style={{ color: 'var(--ink-mute)' }}>
          글자
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm px-3"
          style={{ paddingInline: 12 }}
          onClick={() => setFontSize(Math.max(MIN, settings.fontSize - 1))}
          aria-label="글자 작게"
          disabled={settings.fontSize <= MIN}
        >
          가
        </button>
        <span className="text-[12px] font-bold tabular-nums w-9 text-center">
          {settings.fontSize}
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ paddingInline: 12, fontSize: 16 }}
          onClick={() => setFontSize(Math.min(MAX, settings.fontSize + 1))}
          aria-label="글자 크게"
          disabled={settings.fontSize >= MAX}
        >
          가
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setFontSize(18)}
          aria-label="글자 크기 초기화"
        >
          초기화
        </button>
      </div>
    </div>
  )
}
