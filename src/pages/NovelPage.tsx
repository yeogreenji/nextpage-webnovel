import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { BranchTree } from '../components/BranchTree'
import { Countdown } from '../components/Countdown'
import { formatNumber, formatRelative } from '../lib/format'
import { novelParticipants, tallyVotes } from '../lib/vote'
import type { Episode } from '../types'

export function NovelPage() {
  const { novelId = '' } = useParams()
  const { ready, novels, episodes, votes } = useStore()
  const novel = novels.find((item) => item.id === novelId)
  const episodesOfNovel = episodes.filter((item) => item.novelId === novelId)
  const published = episodesOfNovel
    .filter((item) => item.status === 'published')
    .sort((a, b) => a.no - b.no)
  const pending = episodesOfNovel
    .filter((item) => item.status === 'pending')
    .sort((a, b) => a.no - b.no)

  useEffect(() => {
    if (novel) document.title = `${novel.title} — 넥스트페이지`
    return () => {
      document.title = '넥스트페이지 · 선택형 웹소설'
    }
  }, [novel])

  if (!ready) {
    return (
      <div className="page-shell py-20 text-center text-[13px]" style={{ color: 'var(--ink-mute)' }}>
        불러오는 중…
      </div>
    )
  }

  if (!novel) {
    return (
      <div className="page-shell py-20 text-center">
        <p className="text-[15px] font-bold">작품을 찾을 수 없습니다.</p>
        <Link to="/library" className="btn btn-secondary btn-sm mt-4">
          작품 목록으로
        </Link>
      </div>
    )
  }

  const participants = novelParticipants(episodesOfNovel)
  const first = published.find((item) => item.id === novel.startEpisodeId) ?? published[0]

  return (
    <div className="page-shell pt-6">
      <section className="flex flex-col sm:flex-row gap-5">
        <div
          className="relative w-[132px] h-[176px] sm:w-[168px] sm:h-[224px] rounded-2xl overflow-hidden shrink-0 flex items-end p-3"
          style={{ backgroundImage: `linear-gradient(150deg, ${novel.cover.from}, ${novel.cover.to})` }}
        >
          <span className="absolute top-3 right-3 text-[38px] leading-none opacity-90">
            {novel.cover.glyph}
          </span>
          <span
            className="relative text-[12px] font-extrabold"
            style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 8px rgba(0,0,0,0.35)' }}
          >
            {novel.penName}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            {novel.genres.map((genre) => (
              <span key={genre} className="chip chip-accent">
                {genre}
              </span>
            ))}
            <span className="chip">{novel.status === 'ongoing' ? '연재 중' : '완결'}</span>
          </div>
          <h1 className="mt-3 text-[23px] sm:text-[30px] font-extrabold tracking-tight leading-snug">
            {novel.title}
          </h1>
          <p className="mt-1.5 text-[13px]" style={{ color: 'var(--ink-soft)' }}>
            {novel.tagline}
          </p>
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[12px]">
            <div>
              <dt style={{ color: 'var(--ink-mute)' }}>공개 회차</dt>
              <dd className="font-extrabold text-[14px]">
                {published.length}화{pending.length > 0 ? ` (+${pending.length}화 준비 중)` : ''}
              </dd>
            </div>
            <div>
              <dt style={{ color: 'var(--ink-mute)' }}>누적 참여</dt>
              <dd className="font-extrabold text-[14px]">{formatNumber(participants)}명</dd>
            </div>
            <div>
              <dt style={{ color: 'var(--ink-mute)' }}>최근 업데이트</dt>
              <dd className="font-extrabold text-[14px]">
                {published.length > 0
                  ? formatRelative(published[published.length - 1].publishedAt)
                  : '-'}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            {first && (
              <Link to={`/novel/${novel.id}/ep/${first.id}`} className="btn btn-primary">
                1화부터 읽기
              </Link>
            )}
            <Link to={`/novel/${novel.id}/tree`} className="btn btn-secondary">
              분기 트리
            </Link>
          </div>
        </div>
      </section>

      <section className="card p-5 mt-6">
        <p className="eyebrow">Synopsis</p>
        <p
          className="mt-2 text-[13.5px] leading-relaxed"
          style={{ color: 'var(--ink-soft)', wordBreak: 'keep-all' }}
        >
          {novel.synopsis}
        </p>
      </section>

      <section className="card p-5 mt-4">
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <p className="eyebrow">Branching</p>
            <h2 className="text-[17px] font-extrabold mt-1">이야기는 이렇게 갈라집니다</h2>
          </div>
          <Link
            to={`/novel/${novel.id}/tree`}
            className="text-[11.5px] font-bold"
            style={{ color: 'var(--accent)' }}
          >
            크게 보기 →
          </Link>
        </div>
        <BranchTree novel={novel} episodes={episodesOfNovel} votes={votes} compact />
        <p className="mt-2 text-[11px]" style={{ color: 'var(--ink-mute)' }}>
          굵은 선이 지금 다수파가 고른 채택 루트, 점선은 아직 집필 중인 회차입니다.
          <span className="md:hidden"> 트리는 좌우로 밀어서 볼 수 있어요.</span>
        </p>
      </section>

      <section className="mt-6">
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <p className="eyebrow">Episodes</p>
            <h2 className="text-[17px] font-extrabold mt-1">회차 목록</h2>
          </div>
          <span className="text-[11.5px]" style={{ color: 'var(--ink-mute)' }}>
            총 {published.length + pending.length}화
          </span>
        </div>
        <ul className="grid grid-cols-1 gap-2">
          {[...published, ...pending].map((episode) => (
            <EpisodeRow
              key={episode.id}
              novelId={novel.id}
              episode={episode}
              voted={votes.some((vote) => vote.episodeId === episode.id)}
              leading={(() => {
                if (episode.choices.length === 0) return null
                const tally = tallyVotes(episode, votes)
                const leader = episode.choices.find((choice) => choice.id === tally.leaderId)
                return leader ? `${tally.percents[leader.id]}%` : null
              })()}
            />
          ))}
        </ul>
      </section>
    </div>
  )
}

function EpisodeRow({
  novelId,
  episode,
  voted,
  leading,
}: {
  novelId: string
  episode: Episode
  voted: boolean
  leading: string | null
}) {
  const pending = episode.status === 'pending'
  const content = (
    <>
      <span
        className="shrink-0 w-9 text-[12px] font-extrabold tabular-nums"
        style={{ color: pending ? 'var(--ink-mute)' : 'var(--accent)' }}
      >
        {episode.no}화
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block text-[13.5px] font-bold truncate"
          style={{ color: pending ? 'var(--ink-mute)' : 'var(--ink)' }}
        >
          {episode.title}
        </span>
        {episode.branchLabel && (
          <span className="block text-[11px] truncate mt-0.5" style={{ color: 'var(--ink-mute)' }}>
            “{episode.branchLabel}” 루트
          </span>
        )}
      </span>
      <span className="shrink-0 text-right text-[11px]" style={{ color: 'var(--ink-mute)' }}>
        {pending ? (
          '집필 중'
        ) : voted ? (
          <span style={{ color: 'var(--accent)' }}>투표 완료</span>
        ) : episode.voteClosesAt ? (
          <Countdown closesAt={episode.voteClosesAt} className="text-[11px]" />
        ) : (
          leading ?? ''
        )}
      </span>
    </>
  )

  if (pending) {
    return (
      <li
        className="flex items-center gap-3 rounded-xl border px-3.5 py-2.5"
        style={{ borderColor: 'var(--line)', borderStyle: 'dashed', background: 'var(--surface)' }}
      >
        {content}
      </li>
    )
  }

  return (
    <li>
      <Link
        to={`/novel/${novelId}/ep/${episode.id}`}
        className="card card-tap flex items-center gap-3 px-3.5 py-2.5"
      >
        {content}
      </Link>
    </li>
  )
}
