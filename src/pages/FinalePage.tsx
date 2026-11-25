import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { flowFor } from '../data/flows'
import { imageUrl } from '../data/art'
import { ReaderToolbar } from '../components/ReaderToolbar'
import { ReadingProgress } from '../components/ReadingProgress'
import { unlockEnding } from '../lib/library'
import {
  buildFinale,
  clearSession,
  emptySession,
  ensureSession,
  progressOf,
  saveSession,
  undoLastPick,
} from '../lib/play'
import { formatDateTime } from '../lib/format'
import type { FinaleBlock } from '../lib/play'

/**
 * 📖 내가 완성한 소설 읽기.
 * - 내가 고른 분기의 본문 + 장면마다 채팅으로 옮긴 대사 + 도달한 엔딩이
 *   버튼·선택지 없이 한 편의 소설로 이어집니다.
 */
export function FinalePage() {
  const { novelId = '' } = useParams()
  const navigate = useNavigate()
  const { ready, novels, notify } = useStore()
  const novel = novels.find((item) => item.id === novelId)
  const flow = flowFor(novelId)
  const [session, setSession] = useState(() => ensureSession(novelId))
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setSession(ensureSession(novelId))
  }, [novelId])

  // 완성본에 들어오면 표지부터 (본문·삽화가 다 붙은 뒤에도 한 번 더)
  useEffect(() => {
    const toTop = () => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    toTop()
    const frame = window.requestAnimationFrame(toTop)
    const timers = [80, 200, 420, 760].map((delay) => window.setTimeout(toTop, delay))
    return () => {
      window.cancelAnimationFrame(frame)
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [novelId, ready])

  useEffect(() => {
    if (novel) document.title = `내가 완성한 소설 · ${novel.title} — 넥스트페이지`
    return () => {
      document.title = '넥스트페이지 · 선택형 웹소설'
    }
  }, [novel])

  const finale = useMemo(
    () => (flow ? buildFinale(flow, session) : null),
    // tick: 다시 쓰기 등 세션 변경 후 재계산
    [flow, session, tick],
  )
  const progress = progressOf(flow, session)

  useEffect(() => {
    if (finale && novel) unlockEnding(novel.id, finale.ending)
  }, [finale, novel])

  if (!ready) {
    return (
      <div className="page-shell py-24 text-center text-[13px]" style={{ color: 'var(--ink-mute)' }}>
        소설을 묶는 중…
      </div>
    )
  }

  if (!novel || !flow) {
    return (
      <div className="page-shell py-20 text-center">
        <p className="text-[15px] font-bold">작품을 찾을 수 없습니다.</p>
        <Link to="/library" className="btn btn-secondary btn-sm mt-4">
          작품 목록으로
        </Link>
      </div>
    )
  }

  if (!finale) {
    return (
      <div className="page-shell py-16">
        <div className="card p-7 max-w-[560px] mx-auto text-center">
          <p className="eyebrow">Not yet</p>
          <h1 className="mt-2 text-[19px] font-extrabold">아직 완성되지 않은 소설입니다</h1>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
            {flow.scenes.length - progress.done}번 더 고르면, 지금까지의 선택이 한 편의 소설로
            묶입니다. 지금까지 {progress.done}번 골랐어요.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link to={`/novel/${novel.id}/play`} className="btn btn-primary btn-sm">
              이어서 쓰기
            </Link>
            <Link to={`/novel/${novel.id}`} className="btn btn-secondary btn-sm">
              작품 페이지
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const cover = imageUrl(novel.coverImage)

  const renderBlock = (block: FinaleBlock, index: number) => {
    if (block.kind === 'say') {
      return (
        <div className="finale-say" key={`say-${index}`} data-mine={block.mine}>
          <span className="finale-say-who">{block.mine ? '나' : block.who}</span>
          <p>{block.text}</p>
        </div>
      )
    }
    if (block.kind === 'action') {
      return (
        <p className="finale-action" key={`action-${index}`}>
          {block.text}
        </p>
      )
    }
    if (block.kind === 'pick') {
      return (
        <p className="finale-pick" key={`pick-${index}`}>
          <span className="finale-pick-label">내 선택</span>
          {block.text}
        </p>
      )
    }
    return <p key={`p-${index}`}>{block.text}</p>
  }

  const rewriteLast = () => {
    if (!flow) return
    setSession(saveSession(undoLastPick(flow, session)))
    setTick((value) => value + 1)
    notify('마지막 선택을 지웠어요. 다시 골라 보세요')
    navigate(`/novel/${novel.id}/play`)
  }

  const rewriteAll = () => {
    clearSession(novel.id)
    saveSession(emptySession(novel.id))
    notify('처음부터 다시 씁니다')
    navigate(`/novel/${novel.id}/play`)
  }

  return (
    <div className="page-shell finale-shell pt-4 pb-24">
      <ReadingProgress />

      <div className="finale-bar">
        <Link to={`/novel/${novel.id}/play`} className="play-back" aria-label="이어서 쓰기">
          ‹
        </Link>
        <div className="finale-bar-main">
          <p className="eyebrow">내가 완성한 소설</p>
          <p className="finale-bar-title">{novel.title}</p>
        </div>
        <div className="finale-bar-actions">
          <button type="button" className="play-bar-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            처음부터 읽기
          </button>
          <button type="button" className="play-bar-btn" onClick={rewriteLast}>
            다른 선택지로 다시 쓰기
          </button>
        </div>
      </div>

      <header className="finale-title-page">
        <div className="finale-title-art" aria-hidden>
          {imageUrl(novel.heroImage ?? novel.coverImage) ? (
            <img src={imageUrl(novel.heroImage ?? novel.coverImage)} alt="" />
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `radial-gradient(120% 120% at 18% 0%, ${novel.cover.from}, ${novel.cover.to})`,
              }}
            />
          )}
        </div>
        <div className="finale-title-inner">
          {cover && <img className="finale-title-cover" src={cover} alt={`${novel.title} 표지`} />}
          <div className="min-w-0">
            <p className="eyebrow">A novel written by you</p>
            <h1 className="finale-title">{novel.title}</h1>
            <p className="finale-tagline">{novel.tagline}</p>
            <p className="finale-credit">
              원작 {novel.penName} · {novel.genres.join(' · ')}
            </p>
            <p className="finale-credit-dim">
              이 루트는 {formatDateTime(finale.finishedAt)}에, 독자가 직접 고른 {finale.stats.picks}번의
              선택으로 완성되었습니다.
            </p>
          </div>
        </div>

        <dl className="finale-stats">
          <div>
            <dt>내가 고른 분기</dt>
            <dd>{finale.stats.picks}번</dd>
          </div>
          <div>
            <dt>소설에 넣은 대사</dt>
            <dd>{finale.stats.applied}개</dd>
          </div>
          <div>
            <dt>도달한 엔딩</dt>
            <dd>{finale.stats.endingName}</dd>
          </div>
        </dl>

        <div className="finale-tools">
          <ReaderToolbar />
        </div>
      </header>

      <article className="chapter-frame finale-body">
        {finale.chapters.map((chapter, chapterIndex) => (
          <section className="finale-chapter" key={chapter.id} id={`finale-${chapter.id}`}>
            <header className="finale-chapter-head">
              <p className="eyebrow">
                {chapter.no}장 · {chapter.place.split('·').pop()?.trim()}
              </p>
              <h2>{chapter.title}</h2>
            </header>
            <div className="reader-body finale-prose">{chapter.blocks.map(renderBlock)}</div>
            {chapterIndex < finale.chapters.length - 1 && (
              <div className="finale-divider" aria-hidden>
                <span aria-hidden>·</span>
              </div>
            )}
          </section>
        ))}

        <section className="finale-chapter finale-chapter-ending" id={`finale-${finale.ending.id}`}>
          <header className="finale-chapter-head">
            <p className="eyebrow">에필로그 · Ending</p>
            <h2>{finale.ending.name}</h2>
            <p className="finale-ending-kicker">{finale.ending.kicker}</p>
            <p className="finale-ending-tone">
              {finale.stats.scenes}번의 선택 중 A {finale.stats.toneA} · B {finale.stats.toneB}
              {finale.stats.toneC > 0 ? ` · C ${finale.stats.toneC}` : ''}. 그중 마지막 한 번이 이 결말을
              정했습니다.
            </p>
          </header>
          <div className="reader-body finale-prose">
            {finale.ending.body.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          <div className="finale-end-mark" aria-hidden>
            <span />
            <b aria-hidden>·</b>
            <span />
          </div>
        </section>
      </article>

      {/* 루트 요약 */}
      <section className="finale-summary">
        <div className="section-head">
          <div>
            <p className="eyebrow">My route</p>
            <h2 className="section-title">내가 만든 루트</h2>
            <p className="mt-1.5 text-[12px]" style={{ color: 'var(--ink-mute)' }}>
              {finale.stats.picks}번의 갈래, {finale.stats.applied}개의 대사, 그리고 {finale.stats.endingName}.
            </p>
          </div>
          <span className="chip chip-accent">
            {flow.endings.length}개 엔딩 중 1개
          </span>
        </div>

        <ol className="finale-route">
          {flow.scenes.map((scene, index) => {
            const pick = session.picks[index]
            return (
              <li key={scene.id}>
                <span className="finale-route-no">{scene.no}</span>
                <span className="finale-route-scene">{scene.title}</span>
                <span className="finale-route-pick">{pick ? `“${pick.label}”` : ''}</span>
              </li>
            )
          })}
        </ol>

        {finale.stats.appliedByCharacter.length > 0 && (
          <p className="finale-applied-note">
            소설에 들어간 대사 —{' '}
            {finale.stats.appliedByCharacter
              .map((item) => `${item.name} ${item.count}개`)
              .join(' · ')}
          </p>
        )}

        <div className="finale-actions">
          <button type="button" className="btn btn-primary" onClick={rewriteLast}>
            다른 선택지로 다시 써보기
          </button>
          <button type="button" className="btn btn-secondary" onClick={rewriteAll}>
            처음부터 새로 쓰기
          </button>
          <Link to="/library" className="btn btn-ghost">
            다른 작품 고르기
          </Link>
        </div>

        <p className="finale-note">
          엔딩은 마지막 장면에서 고른 선택이 정합니다. 마지막 선택 하나만 바꿔도 엔딩이 달라집니다.
        </p>
      </section>
    </div>
  )
}
