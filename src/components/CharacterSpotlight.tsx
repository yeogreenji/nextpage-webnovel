import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Character } from '../types'
import { imageUrl } from '../data/art'

export interface SpotlightItem {
  character: Character
  novelId: string
  novelTitle: string
  /** 작품 태그 (예: 오피스 로코) */
  workLabel: string
}

/**
 * 홈의 '인기 캐릭터 스포트라이트'.
 * 10명이 넘는 인물 카드를 작품별로 걸러 가로 레일로 훑어보고, 카드를 누르면 그 작품으로 이동합니다.
 */
export function CharacterSpotlight({ items }: { items: SpotlightItem[] }) {
  const works = useMemo(() => {
    const seen: string[] = []
    items.forEach((item) => {
      if (!seen.includes(item.workLabel)) seen.push(item.workLabel)
    })
    return ['전체', ...seen]
  }, [items])

  const [active, setActive] = useState<string>('전체')
  const railRef = useRef<HTMLDivElement | null>(null)

  const visible = active === '전체' ? items : items.filter((item) => item.workLabel === active)

  const scrollRail = (direction: 1 | -1) => {
    const rail = railRef.current
    if (!rail) return
    rail.scrollBy({ left: direction * Math.max(240, rail.clientWidth * 0.7), behavior: 'smooth' })
  }

  if (items.length === 0) return null

  return (
    <section id="characters">
      <div className="section-head flex-wrap">
        <div>
          <p className="eyebrow">Character Spotlight</p>
          <h2 className="section-title">✨ 인기 캐릭터 스포트라이트</h2>
          <p className="mt-1.5 text-[12px]" style={{ color: 'var(--ink-mute)' }}>
            남주·여주부터 서브남주, 라이벌까지 — 카드를 누르면 그 인물의 이야기로 바로 갑니다.
          </p>
        </div>
        <span className="chip chip-accent hidden sm:inline-flex">총 {items.length}명</span>
      </div>

      <div className="spot-toolbar mb-2" role="tablist" aria-label="작품별 캐릭터 필터">
        {works.map((work) => (
          <button
            key={work}
            type="button"
            role="tab"
            aria-selected={active === work}
            className="spot-tab"
            data-active={active === work}
            onClick={() => {
              setActive(work)
              railRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
            }}
          >
            {work === '전체' ? '전체 보기' : work}
          </button>
        ))}
      </div>

      <div className="spot-rail-wrap">
        <button
          type="button"
          className="rail-btn"
          data-dir="prev"
          onClick={() => scrollRail(-1)}
          aria-label="이전 캐릭터"
        >
          ‹
        </button>
        <div className="spot-rail" ref={railRef}>
          {visible.map(({ character, novelId, novelTitle, workLabel }) => {
            const image = imageUrl(character.image)
            return (
              <Link
                key={character.id}
                to={`/novel/${novelId}#characters`}
                className="spot-card"
                data-tag={character.tag}
                aria-label={`${character.name} — ${novelTitle}`}
              >
                <div className="spot-media">
                  {image ? (
                    <img
                      src={image}
                      alt={`${character.name} 인물 일러스트`}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{ backgroundImage: 'linear-gradient(160deg, var(--surface-3), var(--surface-2))' }}
                    />
                  )}
                  <span className="spot-badge">{character.badge ?? character.tag}</span>
                  <span className="spot-work">{workLabel}</span>
                  <span className="spot-name-block">
                    <span className="spot-name block">{character.name}</span>
                    <span className="spot-role block">{character.role}</span>
                  </span>
                </div>
                <p className="spot-quote">{character.quote}</p>
                <span className="spot-jump">
                  <span className="truncate">이야기 보기</span>
                  <span aria-hidden>→</span>
                </span>
              </Link>
            )
          })}
        </div>
        <button
          type="button"
          className="rail-btn"
          data-dir="next"
          onClick={() => scrollRail(1)}
          aria-label="다음 캐릭터"
        >
          ›
        </button>
      </div>
    </section>
  )
}
