import { Link } from 'react-router-dom'
import type { Episode, Novel } from '../types'
import { Countdown } from './Countdown'
import { formatDday, formatNumber } from '../lib/format'
import { novelParticipants, nextOpenVote, tallyVotes } from '../lib/vote'
import { useStore } from '../store/StoreProvider'
import { imageUrl } from '../data/art'

export function NovelCard({ novel, episodes }: { novel: Novel; episodes: Episode[] }) {
  const { votes } = useStore()
  const published = episodes.filter((episode) => episode.status === 'published')
  const current = published.reduce<Episode | null>(
    (latest, episode) => (!latest || episode.no > latest.no ? episode : latest),
    null,
  )
  const openVote = nextOpenVote(episodes)
  const participants = novelParticipants(episodes)
  const myVoted = episodes.filter((episode) => votes.some((vote) => vote.episodeId === episode.id)).length
  const leading = openVote ? tallyVotes(openVote, votes) : null
  const dday = openVote ? formatDday(openVote.voteClosesAt) : null
  const cover = imageUrl(novel.coverImage)
  const hot = openVote !== null && (leading?.total ?? 0) > 1200

  return (
    <article className="book-card">
      <Link to={`/novel/${novel.id}`} className="flex flex-col h-full">
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
            {openVote && <span className="pill pill-live">● LIVE</span>}
            {hot && <span className="pill pill-hot">HOT</span>}
            {dday && <span className="pill pill-dday">{dday}</span>}
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
            {myVoted > 0 && (
              <>
                <span aria-hidden>·</span>
                <span style={{ color: 'var(--accent)' }} className="font-bold">
                  내 선택 {myVoted}
                </span>
              </>
            )}
          </div>

          {openVote ? (
            <div className="book-vote" data-live="true">
              <span className="min-w-0 flex flex-col gap-0.5">
                <span className="truncate">
                  {openVote.no}화 투표 · 1위 {leading?.percents[leading.leaderId ?? ''] ?? 0}%
                </span>
                <Countdown closesAt={openVote.voteClosesAt} className="text-[10.5px]" />
              </span>
              <span className="shrink-0 font-extrabold">→</span>
            </div>
          ) : (
            <div className="book-vote">
              <span className="truncate" style={{ color: 'var(--ink-mute)' }}>
                {current ? `${current.no}화 공개 완료` : '곧 공개됩니다'}
              </span>
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}
