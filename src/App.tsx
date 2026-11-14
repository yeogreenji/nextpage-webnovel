import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './store/StoreProvider'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { LibraryPage } from './pages/LibraryPage'
import { NovelPage } from './pages/NovelPage'
import { EpisodePage } from './pages/EpisodePage'
import { TreePage } from './pages/TreePage'
import { StudioPage } from './pages/StudioPage'
import { AboutPage } from './pages/AboutPage'

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/novel/:novelId" element={<NovelPage />} />
            <Route path="/novel/:novelId/tree" element={<TreePage />} />
            <Route path="/novel/:novelId/ep/:episodeId" element={<EpisodePage />} />
            <Route path="/studio" element={<StudioPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </StoreProvider>
  )
}
