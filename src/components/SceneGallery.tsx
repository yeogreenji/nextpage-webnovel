import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { imageUrl } from '../data/art'

export interface SceneItem {
  image: string
  caption: string
  episodeNo: number
  episodeTitle: string
  /** 카드에서 '회차로 이동'에 쓰는 링크 */
  href: string
}

interface Props {
  items: SceneItem[]
  /** grid: 작품 페이지 3열 / rail: 홈 가로 스크롤 */
  layout?: 'grid' | 'rail'
}

/**
 * '명장면 일러스트 갤러리'.
 * 삽화 카드를 누르면 원본 크기로 볼 수 있는 라이트박스를 엽니다.
 */
export function SceneGallery({ items, layout = 'grid' }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const current = openIndex !== null ? items[openIndex] : null

  useEffect(() => {
    if (openIndex === null) return undefined
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenIndex(null)
      if (event.key === 'ArrowRight') setOpenIndex((index) => (index === null ? null : (index + 1) % items.length))
      if (event.key === 'ArrowLeft')
        setOpenIndex((index) => (index === null ? null : (index - 1 + items.length) % items.length))
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [openIndex, items.length])

  if (items.length === 0) return null

  return (
    <>
      <div className="scene-grid" data-layout={layout}>
        {items.map((item, index) => {
          const image = imageUrl(item.image)
          return (
            <button
              type="button"
              key={`${item.image}-${index}`}
              className="scene-card"
              onClick={() => setOpenIndex(index)}
              aria-label={`${item.caption} — 크게 보기`}
            >
              <span className="scene-media block">
                {image ? (
                  <img src={image} alt={item.caption} loading="lazy" decoding="async" />
                ) : (
                  <span
                    className="block w-full h-full"
                    style={{ backgroundImage: 'linear-gradient(150deg, var(--surface-3), var(--surface-2))' }}
                  />
                )}
                <span className="scene-ep">EP.{String(item.episodeNo).padStart(2, '0')}</span>
                <span className="scene-zoom" aria-hidden>
                  ⤢
                </span>
              </span>
              <span className="scene-body block">
                <span className="scene-caption block">{item.caption}</span>
                <span className="scene-sub block">{item.episodeTitle}</span>
              </span>
            </button>
          )
        })}
      </div>

      {current && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={current.caption}
          onClick={() => setOpenIndex(null)}
        >
          <button type="button" className="lightbox-close" onClick={() => setOpenIndex(null)} aria-label="닫기">
            ✕
          </button>
          <div className="lightbox-inner" onClick={(event) => event.stopPropagation()}>
            {imageUrl(current.image) && (
              <img src={imageUrl(current.image)} alt={current.caption} />
            )}
            <p className="lightbox-cap">{current.caption}</p>
            <p className="lightbox-sub">
              {current.episodeNo}화 · {current.episodeTitle}
            </p>
            <div className="mt-4 flex justify-center">
              <Link className="btn btn-light btn-sm" to={current.href} onClick={() => setOpenIndex(null)}>
                이 회차 읽기 →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
