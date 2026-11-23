import { Suspense, lazy, useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { StoreProvider } from './store/StoreProvider'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'

/** 홈은 첫 화면이라 바로, 나머지 화면은 누를 때 불러옵니다(모바일 첫 로딩 절약). */
const LibraryPage = lazy(() => import('./pages/LibraryPage').then((module) => ({ default: module.LibraryPage })))
const ShelfPage = lazy(() => import('./pages/ShelfPage').then((module) => ({ default: module.ShelfPage })))
const NovelPage = lazy(() => import('./pages/NovelPage').then((module) => ({ default: module.NovelPage })))
const EpisodePage = lazy(() => import('./pages/EpisodePage').then((module) => ({ default: module.EpisodePage })))
const TreePage = lazy(() => import('./pages/TreePage').then((module) => ({ default: module.TreePage })))
const StudioPage = lazy(() => import('./pages/StudioPage').then((module) => ({ default: module.StudioPage })))
const AboutPage = lazy(() => import('./pages/AboutPage').then((module) => ({ default: module.AboutPage })))
const StoryModePage = lazy(() => import('./pages/StoryModePage').then((module) => ({ default: module.StoryModePage })))
const PlayPage = lazy(() => import('./pages/PlayPage').then((module) => ({ default: module.PlayPage })))
const FinalePage = lazy(() => import('./pages/FinalePage').then((module) => ({ default: module.FinalePage })))

/** 화면을 옮기면 스크롤을 맨 위로 — 해시로 특정 위치를 지정한 경우엔 그쪽이 처리합니다. */
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname, hash])
  return null
}

function PageFallback() {
  return (
    <div className="page-shell py-24 text-center text-[13px]" style={{ color: 'var(--ink-mute)' }}>
      페이지를 펼치는 중…
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <ScrollToTop />
        <Layout>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/shelf" element={<ShelfPage />} />
              <Route path="/novel/:novelId" element={<NovelPage />} />
              <Route path="/novel/:novelId/play" element={<PlayPage />} />
              <Route path="/novel/:novelId/finale" element={<FinalePage />} />
              <Route path="/novel/:novelId/tree" element={<TreePage />} />
              <Route path="/novel/:novelId/ep/:episodeId" element={<EpisodePage />} />
              <Route path="/novel/:novelId/read" element={<StoryModePage />} />
              <Route path="/studio" element={<StudioPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </HashRouter>
    </StoreProvider>
  )
}
