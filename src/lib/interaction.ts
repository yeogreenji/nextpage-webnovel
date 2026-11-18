import type { Character, PlayScene, SceneInteraction } from '../types'

/**
 * 말 걸기 지점 계산.
 * — 작품 데이터에 적힌 말 걸기 지점(scene.interaction)을 우선 씁니다.
 * — 적혀 있지 않은 장면은 본문 속 대사·장소·인물로 그 장면에 맞는 지점을 만듭니다.
 *   (아무 때나 뜨는 버튼이 아니라, 이 장면의 이 문단 뒤에서만 말을 걸 수 있게 하기 위함)
 */

function placeShort(scene: PlayScene): string {
  const parts = scene.place.split('·')
  return (parts[parts.length - 1] ?? scene.place).trim()
}

function unique(list: string[]): string[] {
  return list.filter((item, index) => item.trim().length > 0 && list.indexOf(item) === index)
}

/** 장면에 맞는 추천 대사 4개 — 실제 본문 대사와 지금 서 있는 자리를 재료로 씁니다. */
export function promptsFor(scene: PlayScene, speaker?: Character): string[] {
  const name = speaker?.name ?? '당신'
  const place = placeShort(scene)

  const authored = scene.interaction?.prompts ?? []

  // 작품에 적힌 추천 대사가 있으면 그것을 먼저 쓰고,
  // 모자란 자리는 이 장면에서 자연스러운 말로 채웁니다.
  const pool = authored.length > 0
    ? [
        ...authored,
        `${name}, 지금 무슨 생각을 하고 있어요?`,
        `${place}에서, 제가 모르는 게 있어요?`,
        `제가 여기서 뭘 하면 좋을까요?`,
        `${name}은 지금 어떤 선택을 하고 싶어요?`,
      ]
    : [
        `${name}, 지금 무슨 생각을 하고 있어요?`,
        `“${scene.title}” — 여기서 제가 뭘 놓치고 있죠?`,
        `제가 여기서 뭘 하면 좋을까요?`,
        `${name}은 지금 어떤 선택을 하고 싶어요?`,
      ]

  return unique(pool).slice(0, 4)
}

/** 말을 걸었을 때 소설에 남는 행동 문단 */
export function actionFor(scene: PlayScene, speaker?: Character): string {
  const name = speaker?.name ?? '그'
  const template = scene.interaction?.action
  if (template) return template.replace(/\{name\}/g, name)
  return `${placeShort(scene)}에서, 나는 ${name}에게 먼저 말을 걸었다.`
}

/** 이 장면의 말 걸기 지점 (항상 하나) */
export function interactionFor(scene: PlayScene, speaker?: Character): SceneInteraction {
  const authored = scene.interaction
  const last = Math.max(0, scene.body.length - 1)
  return {
    after: authored ? Math.max(0, Math.min(authored.after, last)) : last,
    cue:
      authored?.cue ??
      `잠깐의 침묵. ${placeShort(scene)}에서 지금 말을 걸면, 이 장면의 다음 문장이 달라진다.`,
    prompts: promptsFor(scene, speaker),
    action: actionFor(scene, speaker),
  }
}
