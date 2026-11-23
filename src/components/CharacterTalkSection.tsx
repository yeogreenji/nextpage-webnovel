import { useState } from 'react'
import type { Character, Episode, Novel } from '../types'
import { CharacterChat } from './CharacterChat'
import { Icon } from './Icon'
import { imageUrl } from '../data/art'
import { CHAT_FREE_TURNS } from '../lib/commerce'

interface Props {
  novel: Novel
  characters: Character[]
  /** 정주행 모드 등에서 돌아왔을 때 미리 선택해 둘 캐릭터 */
  initialCharacterId?: string | null
  currentEpisode: Episode | null
}

/**
 * 💬 캐릭터 톡 섹션 — 작품 페이지에서 인물을 골라 바로 대화합니다.
 */
export function CharacterTalkSection({ novel, characters, initialCharacterId, currentEpisode }: Props) {
  const [characterId, setCharacterId] = useState<string>(initialCharacterId ?? characters[0]?.id ?? '')
  const character = characters.find((item) => item.id === characterId) ?? characters[0]

  if (!character) return null

  return (
    <section id="chat" className="mt-8 scroll-mt-24">
      <div className="section-head">
        <div>
          <p className="eyebrow">Character Talk</p>
          <h2 className="section-title">캐릭터 톡</h2>
          <p className="section-sub">
            이 작품의 인물과 직접 대화하세요. 세계관과 내가 고른 선택지를 기억하고, 인물의 말투로
            답장합니다. 인물당 {CHAT_FREE_TURNS}번까지 무료, 이후 넥스트패스로 무제한입니다.
          </p>
        </div>
        <span className="chip chip-accent">
          <Icon name="chat" size={13} /> {characters.length}명
        </span>
      </div>

      <div className="chat-tabs" role="tablist" aria-label="대화할 캐릭터 선택">
        {characters.map((item) => {
          const image = imageUrl(item.image)
          const active = item.id === character.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              className="chat-tab"
              data-active={active}
              onClick={() => setCharacterId(item.id)}
            >
              <span className="chat-tab-media">
                {image ? <img src={image} alt="" loading="lazy" /> : <span>{item.name.slice(0, 1)}</span>}
              </span>
              <span className="chat-tab-name">{item.name}</span>
            </button>
          )
        })}
      </div>

      <CharacterChat novel={novel} character={character} currentEpisode={currentEpisode} />
    </section>
  )
}
