import type { StoryFlow } from '../../types'
import { applyPatches } from './patches'
import { applyExtras } from './extras'
import { campusFlow, marryFlow, officeFlow } from './romance-core'
import { idolFlow, palaceFlow, rivalFlow } from './romance-stage'
import { academyFlow, contractFlow, regressFlow } from './fantasy'
import { cafeFlow, memoryFlow, murimFlow } from './drama'
import { lodgeFlow, occultFlow, parcelFlow } from './thriller'
import { WAVE_FLOWS } from '../stories/wave'

/**
 * 인터랙티브 소설 흐름.
 * — 기존 15작품 + 2026 리뉴얼 신작 라인업.
 * — 작품마다 여섯 장면, 장면마다 3~4개의 갈래, 세 개의 엔딩.
 * — 엔딩은 마지막 장면에서 고른 하나가 정합니다.
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

export const ALL_FLOWS: StoryFlow[] = [
  ...BASE_FLOWS.map(applyPatches).map(applyExtras),
  ...WAVE_FLOWS,
]

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

/** 작품 하나의 선택 장면 수 (없으면 0) */
export function sceneCountOf(novelId: string): number {
  return FLOW_MAP[novelId]?.scenes.length ?? 0
}

export { officeFlow, campusFlow, marryFlow, idolFlow, palaceFlow, rivalFlow }
export { contractFlow, academyFlow, regressFlow, cafeFlow, murimFlow, memoryFlow }
export { parcelFlow, lodgeFlow, occultFlow }
