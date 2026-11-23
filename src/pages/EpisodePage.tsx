import { useEffect, useMemo, useRef } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { ReaderToolbar } from '../components/ReaderToolbar'
import { VotePanel } from '../components/VotePanel'
import { CommentSection } from '../components/CommentSection'
import { CharacterStrip } from '../components/CharacterStrip'
import { Countdown } from '../components/Countdown'
import { ReadingProgress } from '../components/ReadingProgress'
import { EpisodeLock } from '../components/EpisodeLock'
import { Icon } from '../components/Icon'
import { formatDateTime, readingMinutes } from '../lib/format'
import { copyText } from '../lib/share-card'
import { EPISODE_SCENES, imageUrl, placeScenes } from '../data/art'
import { recordReading } from '../lib/library'

export function EpisodePage() {
  const { novelId = '', episodeId = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { ready, novels, episodes, comments, votes, notify, accessOf } = useStore()

  const novel = novels.find((item) => item.id === novelId)
  const episode = episodes.find((item) => item.id === episodeId)
  const access = episode ? accessOf(episode) : null
  const episodesOfNovel = useMemo(
    () => episodes.filter((item) => item.novelId === novelId),
    [episodes, novelId],
  )
  const parent = episode?.parentEpisodeId
    ? episodes.find((item) => item.id === episode.parentEpisodeId)
    : null
  const commentCount = comments.filter((comment) => comment.episodeId === episodeId).length
  const myVote = votes.find((vote) => vote.episodeId === episodeId)
  const children = useMemo(
    () => episodesOfNovel.filter((item) => item.parentEpisodeId === episodeId && item.status === 'published'),
    [episodesOfNovel, episodeId],
  )
  const articleRef = useRef<HTMLElement>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [episodeId])

  // 읽던 자리 저장 — 회차를 열면 기록하고, 스크롤에 따라 진행률을 갱신합니다.
  // 읽던 자리 저장 — 열람이 가능한 회차만 기록합니다.
  useEffect(() => {
    if (!novel || !episode || episode.status !== 'published' || !access?.readable) return undefined
    const save = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const percent = max <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / max))
      recordReading({
        novelId: novel.id,
        episodeId: episode.id,
        episodeNo: episode.no,
        episodeTitle: episode.title,
        percent,
      })
    }
    save()
    let timer: number | null = null
    const onScroll = () => {
      if (timer !== null) return
      timer = window.setTimeout(() => {
        timer = null
        save()
      }, 900)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (timer !== null) window.clearTimeout(timer)
      save()
    }
  }, [episode, novel, access?.readable])

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

  /* ── 잠긴 회차: 앞부분만 미리 보여 주고 대여권·코인·패스 안내로 잠급니다 ── */
  if (access && !access.readable) {
    return (
      <div className="page-shell pt-5 pb-10">
        <div className="reader-shell">
          <nav className="crumbs" aria-label="위치">
            <Link to="/library">작품</Link>
            <span aria-hidden>·</span>
            <Link to={`/novel/${novel.id}`} className="truncate max-w-[45vw]">
              {novel.title}
            </Link>
            <span aria-hidden>·</span>
            <span>{episode.no}화</span>
          </nav>

          <header className="chapter-head">
            <div className="chapter-head-top">
              <span className="tag tag-ink">EP.{String(episode.no).padStart(2, '0')}</span>
              <span className="tag">{novel.genres[0]}</span>
              <span className="tag" data-tone={access.kind === 'locked' ? 'paid' : 'wait'}>
                {access.badge}
              </span>
            </div>
            <h1 className="chapter-title">{episode.title}</h1>
            <p className="chapter-meta">
              <b>{novel.penName}</b>
              <span>{formatDateTime(episode.publishedAt)}</span>
              <span>약 {readingMinutes(episode.body)}분</span>
            </p>
          </header>

          <div className="ep-teaser" aria-hidden>
            {paragraphs.slice(0, 2).map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>

          <EpisodeLock episode={episode} access={access} />

          {novel.characters && novel.characters.length > 0 && (
            <section className="mt-8">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Characters</p>
                  <h2 className="section-title">이 작품의 인물</h2>
                </div>
                <Link to={`/novel/${novel.id}`} className="section-more">
                  작품 페이지 <Icon name="arrowRight" size={13} />
                </Link>
              </div>
              <CharacterStrip characters={novel.characters} variant="compact" />
            </section>
          )}
        </div>
      </div>
    )
  }

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
            <Icon name="bookOpen" size={14} /> 소설로 쭉 읽기
          </button>
        </div>

        <nav className="crumbs" aria-label="위치">
          <Link to="/library">작품</Link>
          <span aria-hidden>·</span>
          <Link to={`/novel/${novel.id}`} className="truncate max-w-[45vw]">
            {novel.title}
          </Link>
          <span aria-hidden>·</span>
          <span>{episode.no}화</span>
        </nav>

      {/* 회차 헤더 */}
      <header className="chapter-head">
        <div className="chapter-head-row">
          <Link
            to={`/novel/${novel.id}`}
            className="chapter-thumb"
            aria-label={`${novel.title} 작품 페이지`}
          >
            {imageUrl(novel.coverImage) ? (
              <img src={imageUrl(novel.coverImage)} alt="" />
            ) : (
              <span
                style={{ backgroundImage: `linear-gradient(150deg, ${novel.cover.from}, ${novel.cover.to})` }}
              />
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="chapter-head-top">
              <span className="tag tag-ink">EP.{String(episode.no).padStart(2, '0')}</span>
              <span className="tag">{novel.genres[0]}</span>
              {access && <span className="tag" data-tone={access.kind === 'locked' ? 'paid' : undefined}>{access.badge}</span>}
              {episode.branchLabel && (
                <span className="tag max-w-full truncate">“{episode.branchLabel}” 루트</span>
              )}
              {myVote && <span className="tag" data-tone="done">투표 완료</span>}
            </div>

            <h1 className="chapter-title">{episode.title}</h1>

            <div className="chapter-meta">
              <b>{novel.penName}</b>
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
                className="link-dotted"
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

      <article ref={articleRef} className="chapter-frame reader-body mt-4 px-5 py-8 sm:px-12 sm:py-12">
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
        <div className="chapter-end" aria-hidden>
          <span />
          <em>NEXT PAGE</em>
          <span />
        </div>
      </article>
      </div>

      {children.length > 0 && (
        <section className="reader-shell mt-4">
          <div className="card p-4">
            <p className="eyebrow">Next</p>
            <h2 className="mt-1 text-[15px] font-extrabold">이 선택으로 이어진 다음 화</h2>
            <ul className="mt-2.5 grid gap-2">
              {children.map((child) => (
                <li key={child.id}>
                  <Link
                    to={`/novel/${novel.id}/ep/${child.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                    style={{ background: 'var(--surface-2)' }}
                  >
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-bold truncate">{child.no}화 · {child.title}</span>
                      {child.branchLabel && (
                        <span className="mt-0.5 block text-[10.5px] truncate" style={{ color: 'var(--ink-mute)' }}>
                          “{child.branchLabel}” 루트
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-[12px] font-extrabold" style={{ color: 'var(--accent)' }}>
                      읽기 →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <VotePanel novel={novel} episode={episode} />
      {episode.choices.length === 0 && (
        <section className="card mt-9 p-6 text-center">
          <p className="eyebrow">End of route</p>
          <h2 className="mt-1.5 text-[17px] font-extrabold">이 루트는 여기까지 이어집니다</h2>
          <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
            다른 선택으로 갈라진 이야기도 있습니다. 분기 지도에서 다른 길을 읽거나, 내가 고르는 인터랙티브로 한 편을 완성해 보세요.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link to={`/novel/${novel.id}/tree`} className="btn btn-secondary btn-sm">
              분기 지도 보기
            </Link>
            <Link to={`/novel/${novel.id}/play`} className="btn btn-primary btn-sm">
              내가 쓰는 소설로 완성하기
            </Link>
          </div>
        </section>
      )}

      {/* 하단 토글 — 투표 후에도 바로 정주행 모드로 */}
      <div className="story-entry-bar mt-5">
        <span className="story-entry-label">선택한 분기를 한 편의 소설로 이어 읽기</span>
        <button
          type="button"
          className="story-entry-btn"
          onClick={() => navigate(`/novel/${novel.id}/read?from=${episode.id}`)}
        >
          <Icon name="bookOpen" size={14} /> 소설로 쭉 읽기
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
