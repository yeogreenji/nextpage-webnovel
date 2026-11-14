import type { Character } from '../types'
import { imageUrl } from '../data/art'

interface Props {
  characters?: Character[]
  /** poster: 큰 인물 포스터 카드 / compact: 회차 하단의 작은 카드 */
  variant?: 'poster' | 'compact'
}

/**
 * 등장인물 카드.
 * 인물 일러스트를 3:4 포스터로 크게 깔고, 역할 배지·이름·한 줄 대사를 붙입니다.
 */
export function CharacterStrip({ characters, variant = 'poster' }: Props) {
  if (!characters || characters.length === 0) return null

  if (variant === 'compact') {
    return (
      <div className="char-strip">
        {characters.map((character) => {
          const image = imageUrl(character.image)
          return (
            <article className="char-card" key={character.id} data-tag={character.tag}>
              <div className="char-media">
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
                    style={{ backgroundImage: 'linear-gradient(150deg, var(--surface-3), var(--surface-2))' }}
                  />
                )}
                <span className="char-tag" data-tag={character.tag}>
                  {character.badge ?? character.tag}
                </span>
              </div>
              <div className="char-body">
                <h3 className="char-name">{character.name}</h3>
                <p className="char-role">{character.role}</p>
                <p className="char-quote">{character.quote}</p>
              </div>
            </article>
          )
        })}
      </div>
    )
  }

  return (
    <div className="char-poster-grid">
      {characters.map((character) => {
        const image = imageUrl(character.image)
        return (
          <article className="char-poster" key={character.id} data-tag={character.tag}>
            <div className="char-poster-media">
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
                  style={{ backgroundImage: 'linear-gradient(150deg, var(--surface-3), var(--surface-2))' }}
                />
              )}
              <span className="char-tag" data-tag={character.tag}>
                {character.badge ?? character.tag}
              </span>
            </div>
            <div className="char-poster-body">
              <h3 className="char-poster-name">{character.name}</h3>
              <p className="char-poster-role">{character.role}</p>
              <p className="char-poster-quote">{character.quote}</p>
            </div>
          </article>
        )
      })}
    </div>
  )
}
