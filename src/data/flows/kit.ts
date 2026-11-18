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
  return seeds.map((seed) => ({
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
  }))
}

export const FLOW_STRUCTURE = '여섯 장면 · 장면마다 3~4개의 갈래 · 세 개의 엔딩'

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
