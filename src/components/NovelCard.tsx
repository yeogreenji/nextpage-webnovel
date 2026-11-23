import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Episode, Novel } from '../types'
import { formatNumber } from '../lib/format'
import { novelParticipants } from '../lib/vote'
import { imageUrl } from '../data/art'
import { flowFor } from '../data/flows'
import { allSessions, progressOf } from '../lib/play'
import { isOnShelf, readingOf, toggleShelf } from '../lib/library'
import { useStore } from '../store/StoreProvider'
import { FREE_EPISODE_NO, WAIT_FREE_EPISODE_NO } from '../lib/commerce'
import { Icon } from './Icon'

export function NovelCard({ novel, episodes }: { novel: Novel; episodes: Episode[] }) {
  const { notify } = useStore()
  const published = episodes.filter((episode) => episode.status === 'published')
  const current = published.reduce<Episode | null>(
    (latest, episode) => (!latest || episode.no > latest.no ? episode : latest),
    null,
  )
  const participants = novelParticipants(episodes)
  const cover = imageUrl(novel.coverImage)
  const flow = flowFor(novel.id)
  const session = allSessions()[novel.id]
  const progress = progressOf(flow, session ?? null)
  const reading = readingOf(novel.id)
  const [onShelf, setOnShelf] = useState(() => isOnShelf(novel.id))
  const hasWait = published.some((episode) => episode.no === WAIT_FREE_EPISODE_NO)
  const hasPaid = published.some((episode) => episode.no > WAIT_FREE_EPISODE_NO)

  // 다른 화면에서 찜을 바꾸고 돌아온 경우 반영
  useEffect(() => {
    setOnShelf(isOnShelf(novel.id))
  }, [novel.id])

  const shelf = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const added = toggleShelf(novel.id)
    setOnShelf(added)
    notify(added ? '내 서재에 담았어요' : '내 서재에서 뺐어요')
  }

  return (
    <article className="book-card">
      <Link to={`/novel/${novel.id}`} className="book-link">
        <div className="book-cover">
          {cover ? (
            <img src={cover} alt={`${novel.title} 표지 일러스트`} loading="lazy" decoding="async" />
          ) : (
            <div
              className="book-cover-fallback"
              style={{ backgroundImage: `linear-gradient(150deg, ${novel.cover.from}, ${novel.cover.to})` }}
            >
              <span>{novel.cover.glyph}</span>
            </div>
          )}
          <div className="book-badges">
            {novel.status === 'completed' && <span className="tag tag-solid">완결</span>}
            {progress.complete && <span className="tag tag-solid">완성함</span>}
            {progress.done > 0 && !progress.complete && (
              <span className="tag tag-solid">
                {progress.done}/{progress.total}
              </span>
            )}
          </div>
          <div className="book-cover-foot">
            <span className="truncate">{novel.penName}</span>
            <span>{reading ? `${reading.episodeNo}화 읽음` : current ? `${current.no}화` : '준비 중'}</span>
          </div>
        </div>

        <div className="book-meta">
          <h3 className="book-title">{novel.title}</h3>
          <p className="book-tagline">{novel.tagline}</p>

          <div className="book-stats">
            <span>{published.length}화 연재</span>
            <span aria-hidden>·</span>
            <span>참여 {formatNumber(participants)}명</span>
            {flow && (
              <>
                <span aria-hidden>·</span>
                <span>엔딩 {flow.endings.length}</span>
              </>
            )}
          </div>

          <div className="book-price">
            <span className="tag" data-tone="free">
              {FREE_EPISODE_NO}화까지 무료
            </span>
            {hasWait && (
              <span className="tag" data-tone="wait">
                {WAIT_FREE_EPISODE_NO}화 기다무
              </span>
            )}
            {hasPaid && (
              <span className="tag" data-tone="paid">
                이후 유료
              </span>
            )}
          </div>

          <p className="book-genres">
            {novel.genres.slice(0, 2).map((genre) => (
              <span key={genre}>#{genre.replace(/\s/g, '')}</span>
            ))}
          </p>
        </div>
      </Link>

      <button
        type="button"
        className="book-shelf"
        data-on={onShelf}
        onClick={shelf}
        aria-pressed={onShelf}
        aria-label={onShelf ? `${novel.title} 내 서재에서 빼기` : `${novel.title} 내 서재에 담기`}
        title={onShelf ? '내 서재에서 빼기' : '내 서재에 담기'}
      >
        <Icon name={onShelf ? 'heartFilled' : 'heart'} size={16} />
      </button>
    </article>
  )
}
