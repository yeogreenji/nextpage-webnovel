import { useMemo, useState } from 'react'
import type { Character, Episode, Novel } from '../types'
import { CharacterChat } from './CharacterChat'
import { Icon } from './Icon'
import { imageUrl } from '../data/art'
import { CHAT_FREE_TURNS } from '../lib/commerce'
import { castForEpisode, povIdOf } from '../lib/cast'

interface Props {
  novel: Novel
  characters: Character[]
  /** 정주행 모드 등에서 돌아왔을 때 미리 선택해 둘 캐릭터 */
  initialCharacterId?: string | null
  currentEpisode: Episode | null
}

/**
 * 💬 캐릭터 톡 섹션 — 지금 읽는 화에 실제로 나오는 인물과만 대화합니다.
 * — 예전에는 이 화에 없는 인물도 탭에 떠서, 없는 사람에게 말을 거는 일이 있었습니다.
 * — 이 화에 없는 인물은 탭에 남겨 두되 '이 화에는 없음'으로 잠급니다.
 */
export function CharacterTalkSection({ novel, characters, initialCharacterId, currentEpisode }: Props) {
  const present = useMemo(() => castForEpisode(novel, currentEpisode), [novel, currentEpisode])
  const presentIds = useMemo(() => new Set(present.map((item) => item.id)), [present])
  // 서술자(독자의 화자)는 자기 자신과 대화하는 셈이므로 탭에서 빠집니다.
  const visible = useMemo(() => {
    const pov = povIdOf(novel)
    const list = characters.filter((character) => character.id !== pov)
    return list.length > 0 ? list : characters
  }, [characters, novel])
  const ordered = useMemo(
    () => [...visible].sort((a, b) => Number(presentIds.has(b.id)) - Number(presentIds.has(a.id))),
    [visible, presentIds],
  )
  const fallbackId =
    (initialCharacterId && presentIds.has(initialCharacterId) ? initialCharacterId : null) ??
    present.find((item) => item.id !== povIdOf(novel))?.id ??
    ordered[0]?.id ??
    ''
  const [characterId, setCharacterId] = useState<string>(fallbackId)
  const activeId = presentIds.has(characterId) ? characterId : fallbackId
  const character = visible.find((item) => item.id === activeId) ?? visible[0]

  if (!character) return null

  const episodeLabel = currentEpisode ? `${currentEpisode.no}화` : '첫 화'

  return (
    <section id="chat" className="mt-8 scroll-mt-24">
      <div className="section-head">
        <div>
          <p className="eyebrow">Character Talk</p>
          <h2 className="section-title">캐릭터 톡</h2>
          <p className="section-sub">
            {episodeLabel}에 실제로 나오는 인물과 직접 대화하세요. 하고 싶은 말을 타자로 쓰면, 세계관과 내가
            고른 선택지, 이 화의 장면을 기억하고 인물의 말투로 답합니다. 인물당 {CHAT_FREE_TURNS}번까지 무료,
            이후 넥스트패스로 무제한입니다.
          </p>
        </div>
        <span className="chip chip-accent">
          <Icon name="chat" size={13} /> {present.length}명
        </span>
      </div>

      <div className="chat-tabs" role="tablist" aria-label="대화할 캐릭터 선택">
        {ordered.map((item) => {
          const image = imageUrl(item.image)
          const active = item.id === character.id
          const here = presentIds.has(item.id)
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-disabled={!here}
              disabled={!here}
              title={here ? `${episodeLabel}에 나오는 인물` : `${episodeLabel}에는 나오지 않는 인물입니다`}
              className="chat-tab"
              data-active={active}
              data-absent={!here}
              onClick={() => here && setCharacterId(item.id)}
            >
              <span className="chat-tab-media">
                {image ? <img src={image} alt="" loading="lazy" /> : <span>{item.name.slice(0, 1)}</span>}
              </span>
              <span className="chat-tab-name">{item.name}</span>
              {!here && <span className="chat-tab-note">이 화에는 없음</span>}
            </button>
          )
        })}
      </div>

      <CharacterChat
        novel={novel}
        character={character}
        currentEpisode={currentEpisode}
        present={present}
      />
    </section>
  )
}
