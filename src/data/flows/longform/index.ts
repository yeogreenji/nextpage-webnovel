import type { StoryFlow } from '../../../types'
import type { LongformArc } from './types'
import { extendFlow } from './types'
import { officeArc } from './office'
import { secretaryArc } from './secretary'
import { villainessArc } from './villainess'
import { ceoArc } from './ceo'
import { campusArc } from './campus'

/**
 * 장편 아크가 붙는 대표작 목록.
 * — 6화에서 끝나던 흐름을 20화 이상으로 늘리고, 그 뒤는 이어쓰기로 100화까지 갑니다.
 * — 나머지 작품도 같은 이어쓰기 엔진을 쓰므로 6화에서 '끝나지' 않습니다.
 */
export const LONGFORM_ARCS: LongformArc[] = [
  officeArc,
  secretaryArc,
  villainessArc,
  ceoArc,
  campusArc,
]

export const LONGFORM_MAP: Record<string, LongformArc> = Object.fromEntries(
  LONGFORM_ARCS.map((arc) => [arc.novelId, arc]),
)

/** 장편 아크가 있으면 1부 뒤에 2~4부를 이어 붙입니다. */
export function applyLongform(flow: StoryFlow): StoryFlow {
  const arc = LONGFORM_MAP[flow.novelId]
  const extended = arc ? extendFlow(flow, arc) : flow
  // 화면·감사가 같은 문구를 읽도록, 구조 설명은 화 수에서 다시 만듭니다.
  return {
    ...extended,
    structure: `${extended.scenes.length}화 · ${extended.parts?.length ?? 1}부 · 화마다 2~3개의 갈래 · 세 개의 엔딩`,
  }
}
