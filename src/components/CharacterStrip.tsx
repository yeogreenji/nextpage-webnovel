import type { Character } from '../types'
import { imageUrl } from '../data/art'

/** 작품 페이지의 등장인물 카드 스트립 */
export function CharacterStrip({ characters }: { characters?: Character[] }) {
  if (!characters || characters.length === 0) return null

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
                {character.tag}
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
