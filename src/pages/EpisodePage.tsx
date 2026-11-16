import { useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { ReaderToolbar } from '../components/ReaderToolbar'
import { VotePanel } from '../components/VotePanel'
import { CommentSection } from '../components/CommentSection'
import { CharacterStrip } from '../components/CharacterStrip'
import { Countdown } from '../components/Countdown'
import { ReadingProgress } from '../components/ReadingProgress'
import { formatDateTime, readingMinutes } from '../lib/format'
import { copyText } from '../lib/share-card'
import { EPISODE_SCENES, imageUrl, placeScenes } from '../data/art'

export function EpisodePage() {
  const { novelId = '', episodeId = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
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
      <div className="page-shell py-24 text-center text-[13px]" style={{ color: 'var(--ink-mute)' }}>
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
        <div className="card p-7 max-w-[520px] mx-auto text-center">
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
  const blocks = placeScenes(episode.id, paragraphs)
  const sceneCount = EPISODE_SCENES[episode.id]?.length ?? 0
  const minutes = readingMinutes(episode.body)

  return (
    <div className="page-shell pt-5 pb-6">
      <ReadingProgress />

      <div className="reader-shell">
        {/* 📖 소설로 쭉 읽기 — 상단 토글 */}
        <div className="story-entry-bar">
          <span className="story-entry-label">
            지금까지 내 선택이 이어진 이야기를 한 편의 소설로 읽을 수 있어요
          </span>
          <button
            type="button"
            className="story-entry-btn"
            onClick={() => navigate(`/novel/${novel.id}/read?from=${episode.id}`)}
          >
            📖 소설로 쭉 읽기
          </button>
        </div>

        <nav className="flex items-center gap-1.5 text-[11.5px] mb-4" style={{ color: 'var(--ink-mute)' }}>
        <Link to="/library" className="hover:underline">
          작품
        </Link>
        <span aria-hidden>·</span>
        <Link to={`/novel/${novel.id}`} className="hover:underline truncate max-w-[45vw]">
          {novel.title}
        </Link>
        <span aria-hidden>·</span>
        <span style={{ color: 'var(--ink-soft)' }}>{episode.no}화</span>
      </nav>

      {/* 회차 헤더 */}
      <header className="chapter-frame px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex gap-4 sm:gap-6">
          <Link
            to={`/novel/${novel.id}`}
            className="hidden sm:block shrink-0 w-[72px] rounded-xl overflow-hidden self-start"
            style={{ boxShadow: '0 16px 34px -22px rgba(0,0,0,0.6)' }}
            aria-label={`${novel.title} 작품 페이지`}
          >
            {imageUrl(novel.coverImage) ? (
              <img
                src={imageUrl(novel.coverImage)}
                alt=""
                className="w-full aspect-[3/4] object-cover"
              />
            ) : (
              <div
                className="w-full aspect-[3/4]"
                style={{ backgroundImage: `linear-gradient(150deg, ${novel.cover.from}, ${novel.cover.to})` }}
              />
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="pill pill-live">EP.{String(episode.no).padStart(2, '0')}</span>
              <span className="pill pill-genre">{novel.genres[0]}</span>
              {episode.branchLabel && (
                <span className="pill pill-genre max-w-full truncate">“{episode.branchLabel}” 루트</span>
              )}
              {myVote && <span className="pill pill-dday">투표 완료</span>}
            </div>

            <h1 className="mt-3 text-[23px] sm:text-[31px] font-extrabold tracking-tight leading-snug">
              {episode.title}
            </h1>

            <div
              className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px]"
              style={{ color: 'var(--ink-mute)' }}
            >
              <span className="font-semibold" style={{ color: 'var(--ink-soft)' }}>
                {novel.penName}
              </span>
              <span>{formatDateTime(episode.publishedAt)}</span>
              <span>약 {minutes}분</span>
              <span>댓글 {commentCount}</span>
              {episode.voteClosesAt && (
                <span className="inline-flex items-center gap-1">
                  투표 <Countdown closesAt={episode.voteClosesAt} className="text-[11.5px]" />
                </span>
              )}
              {sceneCount > 0 && <span>삽화 {sceneCount}컷</span>}
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
          </div>
        </div>
      </header>

      <div className="reader-toolbar mt-3">
        <ReaderToolbar />
      </div>

      <article className="chapter-frame reader-body mt-4 px-5 py-8 sm:px-12 sm:py-12">
        {blocks.map((block, index) => {
          if (block.scene) {
            return (
              <figure className="inline-scene" key={`scene-${index}`}>
                <div className="inline-scene-media">
                  <img
                    src={imageUrl(block.scene.image)}
                    alt={block.scene.caption}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <figcaption>{block.scene.caption}</figcaption>
              </figure>
            )
          }
          return <p key={index}>{block.text}</p>
        })}
        <div className="mt-10 flex items-center justify-center gap-3" aria-hidden>
          <span className="h-px w-10" style={{ background: 'var(--line-strong)' }} />
          <span className="text-[13px]" style={{ color: 'var(--accent)' }}>
            ❖
          </span>
          <span className="h-px w-10" style={{ background: 'var(--line-strong)' }} />
        </div>
      </article>
      </div>

      <VotePanel novel={novel} episode={episode} />

      {/* 하단 토글 — 투표 후에도 바로 정주행 모드로 */}
      <div className="story-entry-bar mt-5">
        <span className="story-entry-label">선택한 분기를 한 편의 소설로 이어 읽기</span>
        <button
          type="button"
          className="story-entry-btn"
          onClick={() => navigate(`/novel/${novel.id}/read?from=${episode.id}`)}
        >
          📖 소설로 쭉 읽기
        </button>
      </div>

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

      {novel.characters && novel.characters.length > 0 && (
        <section className="mt-9">
          <div className="section-head">
            <div>
              <p className="eyebrow">Characters</p>
              <h2 className="text-[17px] font-extrabold mt-1">이 작품의 인물</h2>
            </div>
            <Link
              to={`/novel/${novel.id}`}
              className="text-[11.5px] font-bold"
              style={{ color: 'var(--accent)' }}
            >
              작품 페이지 →
            </Link>
          </div>
          <CharacterStrip characters={novel.characters} variant="compact" />
        </section>
      )}

      <CommentSection novelId={novel.id} episodeId={episode.id} />

      {episodesOfNovel.some((item) => item.status === 'published') && (
        <p className="mt-6 text-[11.5px] leading-relaxed" style={{ color: 'var(--ink-mute)' }}>
          이 작품의 다른 회차는 작품 페이지에서 이어 읽을 수 있습니다. 투표는 회차마다 한 번씩 참여됩니다.
        </p>
      )}
    </div>
  )
}
