import type { Character, Episode, Novel, PlayScene } from '../types'

/**
 * '이 자리에 있는 사람' 계산.
 * — 캄캐릭터 톡이 엉뚱한 인물을 불러내던 문제를 원천 차단합니다.
 * — 화면(장면)마다 실제로 그 자리에 있는 인물만 대화 상대로 열고,
 *   그 목록은 작품 데이터(scene.cast)나 본문에 적힌 이름에서만 나옵니다.
 */

/** 이름에서 본문에 등장할 수 있는 표기들 (전체 이름·이름·성 제외) */
export function nameTokens(name: string): string[] {
  const clean = name.replace(/\s+/g, ' ').trim()
  const tokens = new Set<string>()
  if (clean) tokens.add(clean)
  const first = clean.split(' ')[0]
  if (first && first.length >= 2) tokens.add(first)
  if (clean.length >= 3 && !clean.includes(' ')) tokens.add(clean.slice(1))
  return [...tokens].filter((token) => token.length >= 2)
}

/** 글 안에 이름이 나오는 인물 */
export function charactersInText(text: string, characters: Character[]): Character[] {
  return characters.filter((character) =>
    nameTokens(character.name).some((token) => text.includes(token)),
  )
}

/**
 * 서술자(독자의 화자) — 이 사람은 '나'이므로 대화 상대로 열지 않습니다.
 * 대부분의 작품은 여주가 서술자이고, 예외만 여기에 적습니다.
 */
const POV_OVERRIDES: Record<string, string> = {
  'nv-parcel': 'ch-yunjae',
}

export function povIdOf(novel: Novel): string | null {
  const override = POV_OVERRIDES[novel.id]
  if (override) return override
  return (novel.characters ?? []).find((character) => character.tag === '여주')?.id ?? null
}

/** 이 화에 실제로 있는 인물. */
export function presentCast(novel: Novel, scene: PlayScene, _scenes?: PlayScene[]): Character[] {
  const characters = novel.characters ?? []
  if (characters.length === 0) return []
  const byId = new Map(characters.map((character) => [character.id, character]))
  const speaker = byId.get(scene.speakerId) ?? null
  const narrator = povIdOf(novel)

  const withoutNarrator = (list: Character[]) =>
    list.filter((character) => character.id !== narrator || character.id === scene.speakerId)

  if (scene.cast && scene.cast.length > 0) {
    const listed = scene.cast
      .map((id) => byId.get(id))
      .filter((character): character is Character => Boolean(character))
    if (speaker && !listed.some((character) => character.id === speaker.id)) listed.unshift(speaker)
    if (listed.length > 0) return withoutNarrator(listed)
  }

  const text = [scene.title, scene.place, ...scene.body].join('\n')
  const found = withoutNarrator(charactersInText(text, characters))
  if (speaker && !found.some((character) => character.id === speaker.id)) found.unshift(speaker)
  if (found.length > 0) return found
  return speaker ? [speaker] : characters.slice(0, 1)
}

/** 이 화에 없는 인물 — 화면에서 '이 화에는 없음'으로 표시합니다. */
export function absentCast(novel: Novel, scene: PlayScene, scenes?: PlayScene[]): Character[] {
  const present = new Set(presentCast(novel, scene, scenes).map((character) => character.id))
  return (novel.characters ?? []).filter((character) => !present.has(character.id))
}

/** 연재 회차(읽기 화면)에 실제로 나오는 인물 */
export function castForEpisode(novel: Novel, episode: Episode | null): Character[] {
  const characters = novel.characters ?? []
  if (characters.length === 0) return []
  const narrator = povIdOf(novel)
  const withoutNarrator = characters.filter((character) => character.id !== narrator)
  if (!episode) return withoutNarrator.slice(0, 1)
  const text = [episode.title, episode.body, ...episode.choices.map((choice) => choice.label)].join('\n')
  const found = charactersInText(text, withoutNarrator.length > 0 ? withoutNarrator : characters)
  return found.length > 0 ? found : (withoutNarrator.length > 0 ? withoutNarrator : characters).slice(0, 1)
}

/** 대화 요청에 실어 보낼 '이 자리에 있는 인물' 이름들 */
export function presentNames(novel: Novel, scene: PlayScene, scenes?: PlayScene[]): string[] {
  return presentCast(novel, scene, scenes).map((character) => character.name)
}
