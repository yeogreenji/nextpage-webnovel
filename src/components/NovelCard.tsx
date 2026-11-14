import { Link } from 'react-router-dom'
import type { Episode, Novel } from '../types'
import { Countdown } from './Countdown'
import { formatNumber, formatRelative } from '../lib/format'
import { novelParticipants, nextOpenVote, tallyVotes } from '../lib/vote'
import { useStore } from '../store/StoreProvider'

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

  return (
    <article className="card card-tap overflow-hidden">
      <Link to={`/novel/${novel.id}`} className="flex gap-4 p-4 sm:p-5">
        <div
          className="relative shrink-0 w-[92px] h-[124px] sm:w-[104px] sm:h-[140px] rounded-[14px] overflow-hidden flex items-end p-2.5"
          style={{
            backgroundImage: `linear-gradient(150deg, ${novel.cover.from}, ${novel.cover.to})`,
          }}
        >
          <span className="absolute top-2 right-2.5 text-[26px] leading-none opacity-90 drop-shadow">
            {novel.cover.glyph}
          </span>
          <span
            className="relative text-[11px] font-bold leading-tight"
            style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 6px rgba(0,0,0,0.35)' }}
          >
            {novel.penName}
          </span>
        </div>

        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {novel.genres.slice(0, 3).map((genre) => (
              <span key={genre} className="chip chip-accent">
                {genre}
              </span>
            ))}
          </div>

          <h3 className="text-[16px] sm:text-[17px] font-extrabold leading-snug tracking-tight line-clamp-2">
            {novel.title}
          </h3>
          <p className="mt-1 text-[12.5px] leading-relaxed line-clamp-1" style={{ color: 'var(--ink-mute)' }}>
            {novel.tagline}
          </p>

          <div className="mt-auto pt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px]">
            <span className="chip">{current ? `${current.no}화 연재 중` : '연재 준비'}</span>
            <span style={{ color: 'var(--ink-mute)' }}>
              참여 {formatNumber(participants)}명
            </span>
            {myVoted > 0 && (
              <span style={{ color: 'var(--accent)' }} className="font-semibold">
                내 선택 {myVoted}회
              </span>
            )}
          </div>

          {openVote ? (
            <div
              className="mt-3 flex items-center justify-between gap-2 rounded-xl px-3 py-2"
              style={{ background: 'var(--surface-2)' }}
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--ink-soft)' }}>
                  {openVote.no}화 투표 진행 중
                  {leading && leading.leaderId && (
                    <span style={{ color: 'var(--ink-mute)' }}>
                      {' '}
                      · 1위 {leading.percents[leading.leaderId]}%
                    </span>
                  )}
                </p>
                <Countdown closesAt={openVote.voteClosesAt} className="text-[11px]" />
              </div>
              <span className="text-[11px] font-bold shrink-0" style={{ color: 'var(--accent)' }}>
                <span className="hidden sm:inline">지금 고르기 </span>→
              </span>
            </div>
          ) : (
            <p className="mt-3 text-[11px]" style={{ color: 'var(--ink-mute)' }}>
              {current ? `${current.no}화 · ${formatRelative(current.publishedAt)} 공개` : '곧 공개됩니다'}
            </p>
          )}
        </div>
      </Link>
    </article>
  )
}
