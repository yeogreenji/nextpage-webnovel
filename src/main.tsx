import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import pretendardUrl from './assets/fonts/PretendardVariable.woff2?url'
import notoSerif400Url from './assets/fonts/NotoSerifKR-400.woff2?url'
import notoSerif700Url from './assets/fonts/NotoSerifKR-700.woff2?url'

/**
 * 본문 폰트를 앱이 직접 불러옵니다.
 * — 배포 경로(base)가 달라져도 Vite가 만든 실제 파일 경로를 쓰므로 폰트가 깨지지 않습니다.
 * — Pretendard(고딕)가 기본, 명조를 고르면 Noto Serif KR로 읽습니다.
 */
const fontFace = `
@font-face{font-family:'Pretendard Variable';font-weight:45 920;font-style:normal;font-display:swap;src:url('${pretendardUrl}') format('woff2-variations')}
@font-face{font-family:'Noto Serif KR';font-weight:400;font-style:normal;font-display:swap;src:url('${notoSerif400Url}') format('woff2')}
@font-face{font-family:'Noto Serif KR';font-weight:700;font-style:normal;font-display:swap;src:url('${notoSerif700Url}') format('woff2')}
`
const fontStyle = document.createElement('style')
fontStyle.textContent = fontFace
document.head.appendChild(fontStyle)

const container = document.getElementById('root')
if (!container) throw new Error('root element not found')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
