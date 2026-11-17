import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Novel } from '../types'
import { imageUrl } from '../data/art'
import { flowFor } from '../data/flows'
import { allSessions, progressOf } from '../lib/play'
import { novelGroup } from '../lib/genres'

interface Props {
  novels: Novel[]
  /** 작품별 공개 회차 수 */
  publishedCount: (novelId: string) => number
}

/**
 * 🎞 메인 최상단 작품 선택 슬라이드.
 * - 데스크톱: 좌우 버튼 · 키보드(←/→) · 드래그 · 하단 썸네일
 * - 모바일: 손가락으로 가로 스와이프 (touch-action: pan-y 로 세로 스크롤은 그대로)
 */
export function NovelCarousel({ novels, publishedCount }: Props) {
  const slides = useMemo(
    () =>
      [...novels].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [novels],
  )
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState(0)
  const [dragging, setDragging] = useState(false)
  // 터치·마우스 드래그 상태는 ref 로 둡니다. (한 프레임 안에 down→move→up 이 와도 놓치지 않도록)
  const gesture = useRef({ active: false, startX: 0, startY: 0, axis: 'none' as 'none' | 'x' | 'y', dx: 0 })
  const viewportRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const sessions = useMemo(() => allSessions(), [])

  const count = slides.length
  const go = useCallback(
    (next: number) => {
      if (count === 0) return
      setIndex(((next % count) + count) % count)
    },
    [count],
  )

  useEffect(() => {
    const node = thumbRef.current
    if (!node) return
    const active = node.querySelector<HTMLElement>('[data-active="true"]')
    if (!active) return
    const left = active.offsetLeft - node.clientWidth / 2 + active.clientWidth / 2
    node.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
  }, [index])

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    gesture.current = { active: true, startX: event.clientX, startY: event.clientY, axis: 'none', dx: 0 }
    setDragging(true)
    setDrag(0)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = gesture.current
    if (!state.active) return
    const dx = event.clientX - state.startX
    const dy = event.clientY - state.startY
    if (state.axis === 'none') {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      state.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (state.axis === 'x') {
        try {
          viewportRef.current?.setPointerCapture(event.pointerId)
        } catch {
          // 합성 이벤트 등 캐처가 불가능한 경우에도 드래그는 계속됩니다.
        }
      }
    }
    if (state.axis !== 'x') return
    event.preventDefault()
    const width = viewportRef.current?.clientWidth ?? 1
    const limit = width * 0.9
    state.dx = Math.max(-limit, Math.min(limit, dx))
    setDrag(state.dx)
  }

  const endDrag = () => {
    const state = gesture.current
    if (!state.active) return
    const width = viewportRef.current?.clientWidth ?? 1
    const threshold = Math.min(72, width * 0.14)
    if (state.axis === 'x') {
      if (state.dx <= -threshold) go(index + 1)
      else if (state.dx >= threshold) go(index - 1)
    }
    gesture.current = { ...state, active: false, axis: 'none', dx: 0 }
    setDrag(0)
    setDragging(false)
  }

  if (count === 0) return null

  return (
    <section
      className="novel-carousel rise"
      aria-roledescription="캐러셀"
      aria-label="작품 고르기"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          go(index + 1)
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault()
          go(index - 1)
        }
      }}
    >
      <div className="carousel-head">
        <div>
          <p className="eyebrow">Choose your story</p>
          <h2 className="carousel-title">
            내가 선택하는 대로 완성되는 소설 <span>{count}편</span>
          </h2>
        </div>
        <div className="carousel-nav">
          <span className="carousel-counter" aria-live="polite">
            {index + 1} / {count}
          </span>
          <button type="button" onClick={() => go(index - 1)} aria-label="이전 작품">
            ‹
          </button>
          <button type="button" onClick={() => go(index + 1)} aria-label="다음 작품">
            ›
          </button>
        </div>
      </div>

      <div
        className="carousel-viewport"
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => {
          if (gesture.current.active && gesture.current.axis === 'x') endDrag()
        }}
        style={{ touchAction: 'pan-y' }}
      >
        <div
          className="carousel-track"
          style={{
            transform: `translate3d(calc(${-index * 100}% + ${drag}px), 0, 0)`,
            transition: dragging ? 'none' : 'transform 520ms cubic-bezier(.22,.61,.24,1)',
          }}
        >
          {slides.map((novel, slideIndex) => {
            const flow = flowFor(novel.id)
            const session = sessions[novel.id]
            const progress = progressOf(flow, session ?? null)
            const cover = imageUrl(novel.coverImage)
            const hero = imageUrl(novel.heroImage ?? novel.coverImage)
            const characters = novel.characters ?? []
            const active = slideIndex === index

            return (
              <article
                key={novel.id}
                className="carousel-slide"
                aria-hidden={!active}
                data-active={active}
              >
                <div className="carousel-slide-art" aria-hidden>
                  {hero && <img src={hero} alt="" draggable={false} loading={slideIndex < 2 ? 'eager' : 'lazy'} />}
                </div>
                <div className="carousel-slide-scrim" aria-hidden />

                <div className="carousel-slide-inner">
                  <div className="carousel-cover">
                    {cover ? (
                      <img src={cover} alt={`${novel.title} 표지`} draggable={false} />
                    ) : (
                      <div
                        className="carousel-cover-fallback"
                        style={{
                          backgroundImage: `linear-gradient(150deg, ${novel.cover.from}, ${novel.cover.to})`,
                        }}
                      >
                        <span aria-hidden>{novel.cover.glyph}</span>
                      </div>
                    )}
                  </div>

                  <div className="carousel-copy">
                    <div className="carousel-badges">
                      <span className="pill pill-ghost">{novelGroup(novel)}</span>
                      {novel.genres[0] && novel.genres[0] !== novelGroup(novel) && (
                        <span className="pill pill-ghost">#{novel.genres[0].replace(/\s/g, '')}</span>
                      )}
                      {progress.done > 0 && !progress.complete && (
                        <span className="pill pill-dday">쓰는 중 {progress.done}/{progress.total}</span>
                      )}
                      {progress.complete && <span className="pill pill-hot">완성함</span>}
                    </div>

                    <h3 className="carousel-slide-title">{novel.title}</h3>
                    <p className="carousel-slide-hook">{novel.tagline}</p>
                    <p className="carousel-slide-synopsis">{novel.synopsis}</p>

                    <dl className="carousel-facts">
                      <div>
                        <dt>선택</dt>
                        <dd>{flow ? `${flow.scenes.length}번` : '—'}</dd>
                      </div>
                      <div>
                        <dt>엔딩</dt>
                        <dd>{flow ? `${flow.endings.length}개` : '—'}</dd>
                      </div>
                      <div>
                        <dt>등장인물</dt>
                        <dd>{characters.length}인</dd>
                      </div>
                      <div>
                        <dt>연재</dt>
                        <dd>{publishedCount(novel.id)}화</dd>
                      </div>
                    </dl>

                    <div className="carousel-actions">
                      <Link
                        to={`/novel/${novel.id}/play`}
                        className="btn btn-light"
                        tabIndex={active ? 0 : -1}
                      >
                        이 소설 시작하기 →
                      </Link>
                      <Link
                        to={`/novel/${novel.id}`}
                        className="btn btn-glass"
                        tabIndex={active ? 0 : -1}
                      >
                        작품 정보
                      </Link>
                    </div>

                    <p className="carousel-hint">
                      {flow
                        ? `${flow.structure} · 매 장면 끝에서 A/B를 고르면, 그 문장이 곧 소설이 됩니다.`
                        : '작품 정보에서 회차를 읽을 수 있습니다.'}
                    </p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <div className="carousel-thumbs" ref={thumbRef} role="tablist" aria-label="작품 바로 가기">
        {slides.map((novel, slideIndex) => {
          const cover = imageUrl(novel.coverImage)
          return (
            <button
              key={novel.id}
              type="button"
              role="tab"
              aria-selected={slideIndex === index}
              aria-label={`${novel.title}로 이동`}
              data-active={slideIndex === index}
              className="carousel-thumb"
              onClick={() => go(slideIndex)}
            >
              {cover ? (
                <img src={cover} alt="" loading="lazy" draggable={false} />
              ) : (
                <span
                  aria-hidden
                  style={{
                    backgroundImage: `linear-gradient(150deg, ${novel.cover.from}, ${novel.cover.to})`,
                  }}
                />
              )}
              <span className="carousel-thumb-label">{novel.title}</span>
            </button>
          )
        })}
      </div>

      <p className="carousel-swipe-hint">
        <span className="md:hidden">← 좌우로 밀어 작품을 고르세요 →</span>
        <span className="hidden md:inline">
          ← → 키, 드래그, 아래 썸네일로도 넘길 수 있어요
        </span>
      </p>
    </section>
  )
}
