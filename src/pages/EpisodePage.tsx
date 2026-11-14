import { useEffect, useMemo } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { ReaderToolbar } from '../components/ReaderToolbar'
import { VotePanel } from '../components/VotePanel'
import { CommentSection } from '../components/CommentSection'
import { Countdown } from '../components/Countdown'
import { formatDateTime } from '../lib/format'
import { copyText } from '../lib/share-card'

export function EpisodePage() {
  const { novelId = '', episodeId = '' } = useParams()
  const location = useLocation()
  const { ready, novels, episodes, comments, votes, notify } = useStore()

  const novel = novels.find((item) => item.id === novelId)
  const episode = episodes.find((item) => item.id === episodeId)
  const episodesOfNovel = useMemo(
    () => episodes.filter((item) => item.novelId === novelId),
    [episodes, novelId],
  )
  const parent = episode?.parentEpisodeId
    ? episodes.find((item) => item.id === episode.parentEpisodeId)
    : null
  const commentCount = comments.filter((comment) => comment.episodeId === episodeId).length
  const myVote = votes.find((vote) => vote.episodeId === episodeId)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [episodeId])

  useEffect(() => {
    if (location.hash === '#vote') {
      const timer = window.setTimeout(() => {
        document.getElementById('vote')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 220)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [location.hash, episodeId])

  useEffect(() => {
    if (novel && episode) {
      document.title = `${episode.title} · ${novel.title} — 넥스트페이지`
    }
    return () => {
      document.title = '넥스트페이지 · 선택형 웹소설'
    }
  }, [novel, episode])

  if (!ready) {
    return (
      <div className="page-shell py-20 text-center text-[13px]" style={{ color: 'var(--ink-mute)' }}>
        불러오는 중…
      </div>
    )
  }

  if (!novel || !episode) {
    return (
      <div className="page-shell py-20 text-center">
        <p className="text-[15px] font-bold">회차를 찾을 수 없습니다.</p>
        <Link to="/library" className="btn btn-secondary btn-sm mt-4">
          작품 목록으로
        </Link>
      </div>
    )
  }

  if (episode.status === 'pending') {
    return (
      <div className="page-shell py-16">
        <div className="card p-6 max-w-[520px] mx-auto text-center">
          <p className="eyebrow">Coming soon</p>
          <h1 className="mt-2 text-[19px] font-extrabold">{episode.title}</h1>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
            {episode.branchLabel ? `“${episode.branchLabel}” 루트의 ` : ''}
            다음 화는 아직 집필 중입니다. 투표 결과가 확정되면 이 자리에 공개됩니다.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link to={`/novel/${novel.id}`} className="btn btn-primary btn-sm">
              작품 페이지
            </Link>
            {parent && (
              <Link to={`/novel/${novel.id}/ep/${parent.id}`} className="btn btn-secondary btn-sm">
                이전 화 읽기
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  const paragraphs = episode.body.split(/\n{2,}/).filter((line) => line.trim().length > 0)

  return (
    <div className="page-shell pt-6 pb-6">
      <nav className="flex items-center gap-1.5 text-[11.5px] mb-4" style={{ color: 'var(--ink-mute)' }}>
        <Link to="/library" className="hover:underline">
          작품
        </Link>
        <span aria-hidden>·</span>
        <Link to={`/novel/${novel.id}`} className="hover:underline truncate max-w-[45vw]">
          {novel.title}
        </Link>
        <span aria-hidden>·</span>
        <span>{episode.no}화</span>
      </nav>

      <header className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip chip-accent">{episode.no}화</span>
          {episode.branchLabel && (
            <span className="chip max-w-full truncate">“{episode.branchLabel}” 루트</span>
          )}
          {myVote && <span className="chip">투표 완료</span>}
        </div>
        <h1 className="mt-3 text-[24px] sm:text-[30px] font-extrabold tracking-tight leading-snug">
          {episode.title}
        </h1>
        <div
          className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]"
          style={{ color: 'var(--ink-mute)' }}
        >
          <span className="font-semibold" style={{ color: 'var(--ink-soft)' }}>
            {novel.penName}
          </span>
          <span>{formatDateTime(episode.publishedAt)} 공개</span>
          <span>댓글 {commentCount}</span>
          {episode.voteClosesAt && (
            <span className="inline-flex items-center gap-1">
              투표 <Countdown closesAt={episode.voteClosesAt} className="text-[11.5px]" />
            </span>
          )}
          <button
            type="button"
            className="font-semibold underline decoration-dotted underline-offset-4"
            onClick={async () => {
              const ok = await copyText(window.location.href)
              notify(ok ? '회차 링크를 복사했어요' : '링크를 복사하지 못했어요')
            }}
          >
            링크 복사
          </button>
        </div>
      </header>

      <ReaderToolbar />

      <article className="card mt-4 px-5 py-7 sm:px-10 sm:py-10 reader-body">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </article>

      <VotePanel novel={novel} episode={episode} />

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/novel/${novel.id}/tree`} className="btn btn-secondary btn-sm">
          분기 트리 보기
        </Link>
        {parent && (
          <Link to={`/novel/${novel.id}/ep/${parent.id}`} className="btn btn-secondary btn-sm">
            ← {parent.no}화 · {parent.title}
          </Link>
        )}
        <Link to={`/novel/${novel.id}`} className="btn btn-ghost btn-sm">
          작품 페이지
        </Link>
      </div>

      <CommentSection novelId={novel.id} episodeId={episode.id} />

      {episodesOfNovel.some((item) => item.status === 'published') && (
        <p className="mt-6 text-[11.5px] leading-relaxed" style={{ color: 'var(--ink-mute)' }}>
          이 작품의 다른 회차는 작품 페이지에서 이어 읽을 수 있습니다. 투표는 회차마다 한 번씩 참여됩니다.
        </p>
      )}
    </div>
  )
}
