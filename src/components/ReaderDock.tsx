import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Episode, Novel } from '../types'
import { ReaderSettingsDrawer } from './ReaderSettingsDrawer'
import { Icon } from './Icon'

interface Props {
  novel: Novel
  episode: Episode
  /** 같은 작품의 발행 회차 (진행 표시용) */
  published: Episode[]
  prev: Episode | null
  /** 이미 고른 루트가 있으면 그 다음 화, 없으면 null */
  next: Episode | null
  /** 선택지가 있어서 '선택하기'로 안내할 수 있는 회차인지 */
  canChoose: boolean
  /** 잠긴 회차 — 다음 화 대신 작품 페이지로 나가는 길을 보여 줍니다 */
  locked?: boolean
}

/**
 * 📖 읽기 하단 고정 바.
 * — 회차를 다 읽고 화면 맨 아래까지 내려가지 않아도 이전 화·다음 화·목차·읽기 설정에 닿게 합니다.
 * — 진행 게이지를 함께 보여, 지금 회차에서 얼마나 읽었는지 한눈에 남습니다.
 */
export function ReaderDock({ novel, episode, published, prev, next, canChoose, locked = false }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false)
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
  }, [episode.id])

  const goChoose = () => {
    const target = document.getElementById('vote')
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
  }

  return (
    <>
      <div className="reader-dock" role="navigation" aria-label="회차 이동">
        <div className="reader-dock-gauge" aria-hidden>
          <span style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>

        <div className="reader-dock-inner">
          {prev ? (
            <Link to={`/novel/${novel.id}/ep/${prev.id}`} className="dock-side" aria-label={`이전 화 ${prev.no}화`}>
              <Icon name="chevronLeft" size={16} />
              <span>이전</span>
            </Link>
          ) : (
            <span className="dock-side" data-off aria-hidden>
              <Icon name="chevronLeft" size={16} />
              <span>이전</span>
            </span>
          )}

          <Link
            to={`/novel/${novel.id}#episodes`}
            className="dock-center"
            aria-label={`회차 목록 — 전체 ${published.length}화`}
          >
            <b>
              {episode.no}화
            </b>
            <span>목차 · 전체 {published.length}화</span>
          </Link>

          <button
            type="button"
            className="dock-side"
            onClick={() => setSettingsOpen(true)}
            aria-label="읽기 설정"
          >
            <span className="dock-aa" aria-hidden>
              Aa
            </span>
            <span>설정</span>
          </button>

          {next ? (
            <Link to={`/novel/${novel.id}/ep/${next.id}`} className="dock-next" aria-label={`다음 화 ${next.no}화 ${next.title}`}>
              다음 화
              <Icon name="arrowRight" size={16} />
            </Link>
          ) : canChoose ? (
            <button type="button" className="dock-next" onClick={goChoose}>
              선택하기
              <Icon name="arrowRight" size={16} />
            </button>
          ) : (
            <Link to={`/novel/${novel.id}`} className="dock-next">
              {locked ? '작품으로' : '다른 루트'}
              <Icon name="arrowRight" size={16} />
            </Link>
          )}
        </div>
      </div>

      {settingsOpen && <ReaderSettingsDrawer onClose={() => setSettingsOpen(false)} />}
    </>
  )
}
