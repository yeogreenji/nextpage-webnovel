import { useEffect, useState } from 'react'

/** 회차 읽기 진행률 — 화면 최상단 3px 게이지 */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      setProgress(max <= 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / max)))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div className="reading-progress" aria-hidden>
      <div className="reading-progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
    </div>
  )
}
