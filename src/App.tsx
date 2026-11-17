import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { StoreProvider } from './store/StoreProvider'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { LibraryPage } from './pages/LibraryPage'
import { NovelPage } from './pages/NovelPage'
import { EpisodePage } from './pages/EpisodePage'
import { TreePage } from './pages/TreePage'
import { StudioPage } from './pages/StudioPage'
import { AboutPage } from './pages/AboutPage'
import { StoryModePage } from './pages/StoryModePage'
import { PlayPage } from './pages/PlayPage'
import { FinalePage } from './pages/FinalePage'

/** 화면을 옮기면 스크롤을 맨 위로 — 해시로 특정 위치를 지정한 경우엔 그쪽이 처리합니다. */
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/library" element={<LibraryPage />} />
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
        </Layout>
      </HashRouter>
    </StoreProvider>
  )
}
