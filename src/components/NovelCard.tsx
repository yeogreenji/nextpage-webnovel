import { Link } from 'react-router-dom'
import type { Episode, Novel } from '../types'
import { formatNumber } from '../lib/format'
import { novelParticipants } from '../lib/vote'
import { imageUrl } from '../data/art'
import { flowFor } from '../data/flows'
import { allSessions, progressOf } from '../lib/play'

export function NovelCard({ novel, episodes }: { novel: Novel; episodes: Episode[] }) {
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

  return (
    <article className="book-card">
      <Link to={`/novel/${novel.id}/play`} className="flex flex-col h-full">
        <div className="book-cover">
          {cover ? (
            <img src={cover} alt={`${novel.title} 표지 일러스트`} loading="lazy" decoding="async" />
          ) : (
            <div
              className="book-cover-fallback"
              style={{ backgroundImage: `linear-gradient(150deg, ${novel.cover.from}, ${novel.cover.to})` }}
            >
              <span className="text-[26px] leading-none opacity-90">{novel.cover.glyph}</span>
            </div>
          )}
          <div className="book-cover-scrim" />
          <div className="book-badges">
            {flow && <span className="pill pill-hot">선택형</span>}
            {progress.complete && <span className="pill pill-dday">완성함</span>}
            {progress.done > 0 && !progress.complete && (
              <span className="pill pill-live">
                {progress.done}/{progress.total}
              </span>
            )}
          </div>
          <div className="book-cover-foot">
            <span className="truncate">{novel.penName}</span>
            <span className="text-[10px] font-semibold opacity-80 shrink-0">
              {current ? `${current.no}화` : '준비 중'}
            </span>
          </div>
        </div>

        <div className="book-meta">
          <div className="book-genres">
            {novel.genres.slice(0, 2).map((genre) => (
              <span key={genre} className="pill pill-genre">
                {genre}
              </span>
            ))}
            {novel.status === 'completed' && <span className="pill pill-dday">완결</span>}
          </div>

          <h3 className="book-title">{novel.title}</h3>
          <p className="book-tagline">{novel.tagline}</p>

          <div className="book-stats">
            <span>참여 {formatNumber(participants)}명</span>
            <span aria-hidden>·</span>
            <span>{published.length}화 연재</span>
            {flow && (
              <>
                <span aria-hidden>·</span>
                <span>엔딩 {flow.endings.length}개</span>
              </>
            )}
          </div>

          <div className="book-vote" data-live={flow ? 'true' : undefined}>
            <span className="min-w-0 flex flex-col gap-0.5">
              {flow ? (
                <>
                  <span className="truncate">
                    {progress.done > 0
                      ? `${progress.done} / ${progress.total} 선택 — 이어 쓰기`
                      : `${flow.scenes.length}번의 선택으로 내 소설 쓰기`}
                  </span>
                  <span className="text-[10.5px]" style={{ color: 'var(--ink-mute)' }}>
                    {flow.structure}
                  </span>
                </>
              ) : (
                <span className="truncate" style={{ color: 'var(--ink-mute)' }}>
                  {current ? `${current.no}화 공개 완료` : '곧 공개됩니다'}
                </span>
              )}
            </span>
            <span className="shrink-0 font-extrabold">→</span>
          </div>
        </div>
      </Link>
    </article>
  )
}
