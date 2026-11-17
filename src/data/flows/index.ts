import type { StoryFlow } from '../../types'
import { applyPatches } from './patches'
import { campusFlow, marryFlow, officeFlow } from './romance-core'
import { idolFlow, palaceFlow, rivalFlow } from './romance-stage'
import { academyFlow, contractFlow, regressFlow } from './fantasy'
import { cafeFlow, memoryFlow, murimFlow } from './drama'
import { lodgeFlow, occultFlow, parcelFlow } from './thriller'

/**
 * 인터랙티브 소설 흐름 — 15작품 전부.
 * — 작품마다 여섯 번의 양자택일, 세 개의 엔딩.
 * — 마지막 선택까지 마치면 '내가 완성한 소설'로 한 편이 됩니다.
 */
const BASE_FLOWS: StoryFlow[] = [
  officeFlow,
  campusFlow,
  marryFlow,
  idolFlow,
  palaceFlow,
  rivalFlow,
  contractFlow,
  academyFlow,
  regressFlow,
  cafeFlow,
  murimFlow,
  memoryFlow,
  parcelFlow,
  lodgeFlow,
  occultFlow,
]

export const ALL_FLOWS: StoryFlow[] = BASE_FLOWS.map(applyPatches)

const FLOW_MAP: Record<string, StoryFlow> = Object.fromEntries(
  ALL_FLOWS.map((flow) => [flow.novelId, flow]),
)

export function flowFor(novelId: string | undefined | null): StoryFlow | undefined {
  if (!novelId) return undefined
  return FLOW_MAP[novelId]
}

export function hasFlow(novelId: string): boolean {
  return Boolean(FLOW_MAP[novelId])
}

/** 작품 하나의 양자택일 수 (없으면 0) */
export function sceneCountOf(novelId: string): number {
  return FLOW_MAP[novelId]?.scenes.length ?? 0
}

export { officeFlow, campusFlow, marryFlow, idolFlow, palaceFlow, rivalFlow }
export { contractFlow, academyFlow, regressFlow, cafeFlow, murimFlow, memoryFlow }
export { parcelFlow, lodgeFlow, occultFlow }
