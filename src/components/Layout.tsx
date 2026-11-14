import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import type { ThemeName } from '../types'

const NAV = [
  { to: '/', label: '홈', glyph: '⌂', end: true },
  { to: '/library', label: '작품', glyph: '▤', end: false },
  { to: '/studio', label: '스튜디오', glyph: '✎', end: false },
  { to: '/about', label: '소개', glyph: 'ⓘ', end: false },
]

const THEME_ORDER: ThemeName[] = ['light', 'sepia', 'dark']
const THEME_LABEL: Record<ThemeName, string> = { light: '라이트', sepia: '세피아', dark: '다크' }

export function Layout({ children }: { children: ReactNode }) {
  const { settings, setTheme, votes, toast } = useStore()

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="site-header">
        <div className="page-shell flex items-center justify-between gap-3 py-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="brand-mark">NP</span>
            <span className="flex flex-col leading-none">
              <span className="text-[15px] font-extrabold tracking-tight">넥스트페이지</span>
              <span
                className="mt-1 text-[10px] font-semibold tracking-[0.16em] uppercase"
                style={{ color: 'var(--ink-mute)' }}
              >
                Next Page
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="nav-link whitespace-nowrap">
                {({ isActive }) => <span data-active={isActive}>{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="chip hidden sm:inline-flex" title="이 기기에서 참여한 투표 수">
              내 투표 {votes.length}
            </span>
            <div className="hidden md:flex segmented">
              {THEME_ORDER.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  data-active={settings.theme === theme}
                  onClick={() => setTheme(theme)}
                >
                  {THEME_LABEL[theme]}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="md:hidden btn btn-secondary btn-sm"
              onClick={() => {
                const index = THEME_ORDER.indexOf(settings.theme)
                setTheme(THEME_ORDER[(index + 1) % THEME_ORDER.length])
              }}
              aria-label={`배경 테마 변경 (현재 ${THEME_LABEL[settings.theme]})`}
            >
              {THEME_LABEL[settings.theme]}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-16 md:pb-0">{children}</main>

      <footer className="mt-16 border-t" style={{ borderColor: 'var(--line)' }}>
        <div className="page-shell py-10 flex flex-col gap-3 text-[12px]" style={{ color: 'var(--ink-mute)' }}>
          <p className="font-bold" style={{ color: 'var(--ink-soft)' }}>
            넥스트페이지 · 다음 화는, 당신이 고른다
          </p>
          <p>
            수록된 작품·인물·필명은 모두 가상이며, 표지·인물·장면 일러스트도 AI로 생성한 가상의
            이미지입니다. 투표와 댓글은 이 기기에만 저장되며, 서버를 연결하면 여러 독자가 같은
            이야기를 함께 고를 수 있습니다.
          </p>
          <p>
            React · TypeScript · Vite · Tailwind CSS로 만들었습니다. ·{' '}
            <Link to="/about" className="underline decoration-dotted underline-offset-4">
              운영 안내
            </Link>
          </p>
        </div>
      </footer>

      {/* 모바일 하단 내비게이션 */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t"
        style={{
          borderColor: 'var(--line)',
          background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
          backdropFilter: 'blur(14px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="grid grid-cols-4">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="py-2.5 flex flex-col items-center gap-1">
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden
                    className="text-[15px] leading-none"
                    style={{ color: isActive ? 'var(--accent)' : 'var(--ink-mute)' }}
                  >
                    {item.glyph}
                  </span>
                  <span
                    className="text-[10.5px] font-bold"
                    style={{ color: isActive ? 'var(--accent)' : 'var(--ink-mute)' }}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
