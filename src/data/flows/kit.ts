import type { ChoiceTone, PlayChoice, PlayEnding, PlayScene, StoryFlow } from '../../types'

/**
 * 인터랙티브 소설 집필 키트.
 * — 장면·선택지·엔딩을 짧은 데이터로 적고, 화면이 쓰는 구조로 펼칩니다.
 * — 선택지마다 '다음 장면 첫머리(lead)'를 따로 적어, 어떤 선택을 해도
 *   바로 다음 문장이 그 행동을 받아 이어지게 합니다.
 */

export interface ChoiceSeed {
  /** 선택의 결 — 마지막 장면에서는 이 결이 곧 엔딩입니다 */
  tone: ChoiceTone
  /** 선택지 문구 — 소설의 문장처럼 */
  label: string
  /** 한 줄 부연 */
  hint: string
  /** 고른 직후 본문에 붙는 결과 문단 */
  result: string[]
  /** 이 선택을 골랐을 때 다음 장면 첫머리에 붙는 이음 문단 */
  lead?: string[]
}

export interface SceneSeed {
  id: string
  no: number
  title: string
  place: string
  speakerId: string
  body: string[]
  /** 이 화에 실제로 서 있는 인물 (없으면 본문에 이름이 나오는 인물로 계산) */
  cast?: string[]
  /** 다음 화 예고 한 줄 */
  teaser?: string
  /** 직전 화에서 고른 결(A/B/C)에 따라 이 화 첫머리에 붙는 이음 문단 */
  lead?: Partial<Record<ChoiceTone, string[]>>
  /** 지금 말을 걸 만한 이유 */
  cue: string
  /** 말을 걸었을 때 소설에 남는 행동 문단 ({name} 치환) */
  action: string
  /** 추천 대사 (2개 이상. 나머지는 본문 대사로 채워집니다) */
  prompts?: string[]
  /** 말 걸기 지점 — 본문 몇 번째 문단 뒤 (기본: 마지막 문단) */
  after?: number
  choices: ChoiceSeed[]
}

const LETTERS = ['A', 'B', 'C', 'D']

export function makeScenes(seeds: SceneSeed[]): PlayScene[] {
  return seeds.map((seed) => {
    const scene: PlayScene = {
      id: seed.id,
      no: seed.no,
      title: seed.title,
      place: seed.place,
      speakerId: seed.speakerId,
      body: seed.body,
      choices: seed.choices.map((choice, index) => {
        const id = `${seed.id}-${LETTERS[index].toLowerCase()}`
        const built: PlayChoice = {
          id,
          label: choice.label,
          hint: choice.hint,
          result: choice.result,
          tone: choice.tone,
        }
        if (choice.lead && choice.lead.length > 0) built.lead = choice.lead
        return built
      }),
      interaction: {
        after: seed.after ?? Math.max(0, seed.body.length - 1),
        cue: seed.cue,
        prompts: seed.prompts ?? [],
        action: seed.action,
      },
    }
    if (seed.cast && seed.cast.length > 0) scene.cast = seed.cast
    if (seed.lead) scene.lead = seed.lead
    if (seed.teaser) scene.teaser = seed.teaser
    return scene
  })
}

export const FLOW_STRUCTURE = '여섯 화 · 화마다 3~4개의 갈래 · 세 개의 엔딩'

export function makeFlow(
  novelId: string,
  scenes: SceneSeed[],
  endings: PlayEnding[],
): StoryFlow {
  return {
    novelId,
    structure: FLOW_STRUCTURE,
    scenes: makeScenes(scenes),
    endings,
  }
}
