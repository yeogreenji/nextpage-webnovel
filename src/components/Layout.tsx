import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { allSessions } from '../lib/play'
import { Icon } from './Icon'
import { PricingModal } from './PricingModal'
import type { ThemeName } from '../types'

const NAV = [
  { to: '/', label: '홈', end: true },
  { to: '/library', label: '작품', end: false },
  { to: '/shelf', label: '서재', end: false },
  { to: '/studio', label: '스튜디오', end: false },
  { to: '/about', label: '소개', end: false },
]

const THEME_ORDER: ThemeName[] = ['light', 'sepia', 'dark']
const THEME_LABEL: Record<ThemeName, string> = { light: '라이트', sepia: '세피아', dark: '다크' }

export function Layout({ children }: { children: ReactNode }) {
  const { settings, setTheme, toast, wallet, hasPass, passDays, openPricing } = useStore()
  const startedCount = Object.values(allSessions()).filter((session) => session.picks.length > 0).length

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="site-header">
        <div className="page-shell header-bar">
          <Link to="/" className="brand" aria-label="넥스트페이지 홈">
            <span className="brand-mark">NP</span>
            <span className="brand-copy">
              <span className="brand-name">넥스트페이지</span>
              <span className="brand-sub">NEXT PAGE</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center nav-list">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="nav-link whitespace-nowrap">
                {({ isActive }) => <span data-active={isActive}>{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="header-tools">
            <Link to="/shelf" className="header-shelf" title="이 기기에서 쓰기 시작한 소설 수">
              서재 <b>{startedCount}</b>
            </Link>

            <button
              type="button"
              className="wallet-pill"
              onClick={() => openPricing('coin')}
              aria-label={`보유 코인 ${wallet.coins}, 대여권 ${wallet.tickets}장 — 충전소 열기`}
            >
              <span className="wallet-item">
                <Icon name="coin" size={14} />
                {wallet.coins}
              </span>
              <span className="wallet-divider" aria-hidden />
              <span className="wallet-item">
                <Icon name="ticket" size={14} />
                {wallet.tickets}
              </span>
              {hasPass && (
                <>
                  <span className="wallet-divider" aria-hidden />
                  <span className="wallet-item wallet-pass">패스 D-{passDays}</span>
                </>
              )}
            </button>

            <button type="button" className="btn btn-primary btn-sm charge-btn" onClick={() => openPricing('coin')}>
              충전
            </button>

            <div className="hidden md:flex theme-switch" role="group" aria-label="화면 테마">
              {THEME_ORDER.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  data-active={settings.theme === theme}
                  onClick={() => setTheme(theme)}
                  aria-pressed={settings.theme === theme}
                >
                  {THEME_LABEL[theme]}
                </button>
              ))}
            </div>
            <div className="md:hidden">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
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
        </div>
      </header>

      <main className="flex-1 pb-16 md:pb-0">{children}</main>

      <footer className="site-footer">
        <div className="page-shell footer-inner">
          <div>
            <p className="footer-brand">넥스트페이지</p>
            <p className="footer-line">다음 화는, 당신이 고른다.</p>
          </div>
          <div className="footer-cols">
            <div>
              <p className="footer-head">작품</p>
              <Link to="/library">전체 작품</Link>
              <Link to="/library?curation=romance">로맨스</Link>
              <Link to="/library?curation=fantasy-romance">로맨스 판타지</Link>
              <Link to="/library?genre=미스터리">미스터리</Link>
            </div>
            <div>
              <p className="footer-head">이용</p>
              <button type="button" onClick={() => openPricing('pass')}>
                넥스트패스
              </button>
              <button type="button" onClick={() => openPricing('coin')}>
                코인 충전
              </button>
              <Link to="/shelf">내 서재</Link>
              <Link to="/about">운영 안내</Link>
            </div>
            <div>
              <p className="footer-head">안내</p>
              <p className="footer-note">
                수록된 작품·인물·필명은 모두 가상이며, 표지·인물·장면 일러스트도 AI로 생성한 가상의
                이미지입니다.
              </p>
            </div>
          </div>
          <p className="footer-legal">
            넥스트페이지 · 선택형 웹소설 · React · TypeScript · Vite · Tailwind CSS로 만들었습니다.
            내가 고른 분기·대사·댓글은 이 기기에만 저장됩니다.
          </p>
        </div>
      </footer>

      {/* 모바일 하단 내비게이션 */}
      <nav className="mobile-nav md:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="mobile-nav-link">
              {({ isActive }) => (
                <>
                  <span className="mobile-nav-dot" data-active={isActive} aria-hidden />
                  <span data-active={isActive}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <PricingModal />
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
