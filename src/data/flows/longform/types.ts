import type { FlowPart, PlayEnding, SerialBlueprint, StoryFlow } from '../../../types'
import type { SceneSeed } from '../kit'
import { makeScenes } from '../kit'

/**
 * 장편 아크 — 대표작 5편의 1부(1~6화) 뒤에 이어 붙는 2~4부.
 * 6화에서 끝나던 데모를 20화 이상의 장편으로 늘리고,
 * 그 끝에서AI·기기 안 이어쓰기(25화 → 100화)로 계속 이어집니다.
 */
export interface LongformArc {
  novelId: string
  /** 부 구분 — 1부부터 마지막 부까지 */
  parts: FlowPart[]
  /** 7화부터의 화 (SceneSeed.no 를 실제 화 번호로 적습니다) */
  scenes: SceneSeed[]
  /** 마지막 화에서 고른 결이 닿는 세 엔딩 */
  endings: PlayEnding[]
  /** 이어쓰기 재료 — 세계관과 다음 화 씨앗 */
  serial: SerialBlueprint
}

export function extendFlow(base: StoryFlow, arc: LongformArc): StoryFlow {
  const scenes = [...base.scenes, ...makeScenes(arc.scenes)]
  return {
    ...base,
    structure: `${scenes.length}화 · ${arc.parts.length}부 · 화마다 2~3개의 갈래 · 세 개의 엔딩`,
    scenes,
    endings: arc.endings,
    parts: arc.parts,
    serial: arc.serial,
  }
}
