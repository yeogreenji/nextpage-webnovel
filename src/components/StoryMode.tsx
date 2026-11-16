import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Novel } from '../types'
import { useStore } from '../store/StoreProvider'
import { ReaderToolbar } from './ReaderToolbar'
import { ReadingProgress } from './ReadingProgress'
import { imageUrl, placeScenes } from '../data/art'
import { indexOfEpisode, paragraphsOf, resolveReadPath } from '../lib/story'

interface Props {
  novel: Novel
  /** 어디까지 읽었는지 — 보통 회차 화면에서 넘어옵니다 */
  fromEpisodeId?: string | null
  onExit: (episodeId: string) => void
}

/**
 * 📖 소설로 쭉 읽기 — 선택지·버튼 없이 한 편의 웹소설로 정주행하는 모드.
 * - 내가 투표한 선택지가 있으면 그쪽으로, 없으면 다수파 루트로 이어집니다.
 * - 분기가 만나는 지점마다 조용한 구분선만 놓고, 회차 제목은 작게 표시합니다.
 */
export function StoryMode({ novel, fromEpisodeId, onExit }: Props) {
  const { episodes, votes, ready } = useStore()
  const [showChapterTitles, setShowChapterTitles] = useState(true)
  const [expanded, setExpanded] = useState(false)

  const path = useMemo(() => (ready ? resolveReadPath(novel, episodes, votes) : []), [
    episodes,
    novel,
    ready,
    votes,
  ])

  const startIndex = Math.max(indexOfEpisode(path, fromEpisodeId), 0)
  const steps = expanded ? path : path.slice(startIndex, startIndex + 3)
  const hasMore = !expanded && path.length > steps.length

  useEffect(() => {
    setExpanded(false)
  }, [novel.id, fromEpisodeId])

  useEffect(() => {
    document.title = `${novel.title} — 소설로 쭉 읽기`
    return () => {
      document.title = '넥스트페이지 · 선택형 웹소설'
    }
  }, [novel.title])

  if (!ready) {
    return (
      <div className="page-shell py-24 text-center text-[13px]" style={{ color: 'var(--ink-mute)' }}>
        이야기를 펼치는 중…
      </div>
    )
  }

  if (path.length === 0) {
    return (
      <div className="page-shell py-20 text-center">
        <p className="text-[15px] font-bold">아직 정주행할 수 있는 회차가 없습니다.</p>
        <Link to={`/novel/${novel.id}`} className="btn btn-primary btn-sm mt-4">
          작품 페이지로
        </Link>
      </div>
    )
  }

  return (
    <div className="page-shell pt-4 pb-6">
      <ReadingProgress />

      <div className="reader-shell">
        {/* 상단 고정 토글 */}
        <div className="story-mode-bar">
          <Link to={`/novel/${novel.id}`} className="story-mode-back">
            ‹ {novel.title}
          </Link>
          <span className="story-mode-title">📖 소설로 쭉 읽기</span>
          <button
            type="button"
            className="story-mode-exit"
            onClick={() => onExit(steps[steps.length - 1]?.episode.id ?? novel.startEpisodeId)}
          >
            선택 모드로
          </button>
        </div>

        <div className="reader-toolbar mt-3">
          <ReaderToolbar />
        </div>

        <div className="story-mode-meta mt-3">
          <button
            type="button"
            className="story-mode-toggle"
            data-active={showChapterTitles}
            onClick={() => setShowChapterTitles((value) => !value)}
          >
            {showChapterTitles ? '☑' : '☐'} 회차 제목 표시
          </button>
          <span>
            {path.length}화 · 내 선택 {path.filter((step) => step.pickedBy === 'me').length}번 반영
          </span>
        </div>

        <article className="chapter-frame story-mode-body reader-body mt-3 px-5 py-8 sm:px-12 sm:py-12">
          {steps.map((step, stepIndex) => {
            const paragraphs = paragraphsOf(step.episode)
            const blocks = placeScenes(step.episode.id, paragraphs)
            const showHeader = showChapterTitles && (stepIndex === 0 || step.choice !== null)

            return (
              <div key={step.episode.id}>
                {step.choice && (
                  <div className="story-mode-divider" aria-hidden>
                    <span className="story-mode-divider-label">
                      {step.pickedBy === 'me'
                        ? '내가 고른 길'
                        : step.pickedBy === 'majority'
                          ? '다수파가 고른 길'
                          : '이야기는 여기서 이어집니다'}
                    </span>
                  </div>
                )}

                {showHeader && (
                  <header className="story-mode-chapter">
                    <p className="eyebrow">
                      {step.choice
                        ? `EP.${String(step.episode.no).padStart(2, '0')}`
                        : `EP.${String(step.episode.no).padStart(2, '0')} · 1화`}
                    </p>
                    <h2>{step.episode.title}</h2>
                    {step.choice && <p className="story-mode-branch">“{step.choice.label}”</p>}
                  </header>
                )}

                {blocks.map((block, index) => {
                  if (block.scene) {
                    return (
                      <figure className="inline-scene" key={`scene-${step.episode.id}-${index}`}>
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
              </div>
            )
          })}

          <div className="mt-10 flex items-center justify-center gap-3" aria-hidden>
            <span className="h-px w-10" style={{ background: 'var(--line-strong)' }} />
            <span className="text-[13px]" style={{ color: 'var(--accent)' }}>
              ❖
            </span>
            <span className="h-px w-10" style={{ background: 'var(--line-strong)' }} />
          </div>
        </article>

        {hasMore ? (
          <div className="story-mode-more mt-4">
            <button type="button" className="btn btn-primary" onClick={() => setExpanded(true)}>
              이어서 읽기 ({steps.length}/{path.length})
            </button>
          </div>
        ) : (
          <div className="story-mode-end mt-4">
            <p>여기까지가 지금 공개된 이야기입니다.</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onExit(steps[steps.length - 1]?.episode.id ?? novel.startEpisodeId)}
              >
                마지막 회차에서 선택 이어가기
              </button>
              <Link to={`/novel/${novel.id}`} className="btn btn-secondary btn-sm">
                작품 페이지
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
