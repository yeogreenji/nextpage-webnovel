import type { Character, PlayScene, SceneInteraction } from '../types'

/**
 * 말 걸기 지점 계산.
 * — 작품 데이터에 적힌 말 걸기 지점(scene.interaction)을 우선 씁니다.
 * — 적혀 있지 않은 화는, 그 화의 본문 대사·장소·제목에서만 힌트를 만듭니다.
 *   같은 추천 멘트가 모든 작품·모든 화에 복붙되던 문제를 없애기 위해서입니다.
 *   (힌트는 '보조'이고, 실제 대화는 독자가 직접 타자로 칩니다)
 */

function placeShort(scene: PlayScene): string {
  const parts = scene.place.split('·')
  return (parts[parts.length - 1] ?? scene.place).trim()
}

function unique(list: string[]): string[] {
  return list.filter((item, index) => item.trim().length > 0 && list.indexOf(item) === index)
}

/** 본문에 실제로 나온 대사(따옴표 안 문장) — 이 화에서만 쓰이는 힌트의 재료 */
function quotedLines(scene: PlayScene): string[] {
  const text = scene.body.join('\n')
  const found: string[] = []
  for (const match of text.matchAll(/[“"]([^”"\n]{6,70})[”"]/g)) {
    const line = match[1].trim()
    if (line.length >= 6) found.push(line)
  }
  return unique(found)
}

function hashOf(key: string): number {
  let sum = 0
  for (let index = 0; index < key.length; index += 1) sum = (sum * 31 + key.charCodeAt(index)) % 9973
  return sum
}

/**
 * 이 화에서만 통하는 힌트 3개.
 * — 작품에 적힌 대사가 있으면 그것을 먼저 씁니다.
 * — 모자란 자리는 이 화의 실제 대사·장소·제목으로 채워, 다른 화와 겹치지 않게 합니다.
 */
export function promptsFor(scene: PlayScene, speaker?: Character): string[] {
  const name = speaker?.name ?? '당신'
  const place = placeShort(scene)
  const authored = scene.interaction?.prompts ?? []
  if (authored.length >= 3) return unique(authored).slice(0, 3)

  const lines = quotedLines(scene)
  const options: string[] = [...authored]
  const seed = hashOf(scene.id)

  if (lines.length > 0) {
    const line = lines[seed % lines.length]
    options.push(`“${line}” — 그 말, 지금도 유효한가요?`)
  }
  if (lines.length > 1) {
    const second = lines[(seed + 1) % lines.length]
    if (second !== lines[seed % lines.length]) options.push(`“${second}” — 그건 어떤 뜻이었어요?`)
  }
  if (options.length < 3) {
    options.push(`${place}에서, 지금 제일 위험한 건 뭐예요?`)
  }
  if (options.length < 3) {
    options.push(`${name}, 이 화에서 제가 놓치고 있는 게 있어요?`)
  }
  if (options.length < 3) {
    options.push(`“${scene.title}” — 이 장면, 당신은 어떻게 보고 있어요?`)
  }

  return unique(options).slice(0, 3)
}

/** 말을 걸었을 때 소설에 남는 행동 문단 */
export function actionFor(scene: PlayScene, speaker?: Character): string {
  const name = speaker?.name ?? '그'
  const template = scene.interaction?.action
  if (template) return template.replace(/\{name\}/g, name)
  return `${placeShort(scene)}에서, 나는 ${name}에게 먼저 말을 걸었다.`
}

/** 이 화의 말 걸기 지점 (항상 하나) */
export function interactionFor(scene: PlayScene, speaker?: Character): SceneInteraction {
  const authored = scene.interaction
  const last = Math.max(0, scene.body.length - 1)
  return {
    after: authored ? Math.max(0, Math.min(authored.after, last)) : last,
    cue:
      authored?.cue ??
      `잠깐의 침묵. ${placeShort(scene)}에서 지금 말을 걸면, 이 화의 다음 문장이 달라진다.`,
    prompts: promptsFor(scene, speaker),
    action: actionFor(scene, speaker),
  }
}
