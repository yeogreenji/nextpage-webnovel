/**
 * 장면 연속성 패치.
 * — lead: 직전 선택의 결(A/B)에 따라 본문 앞에 붙는 이음 문단
 * — body: 이전 선택과 무관하게 읽히도록 다시 쓴 본문 (생략하면 원문 유지)
 */
export interface ScenePatch {
  lead?: { A: string[]; B: string[] }
  body?: string[]
  /** 선택지 id → 다시 쓴 결과 문단 */
  results?: Record<string, string[]>
  /** 엔딩 id → 다시 쓴 본문 (엔딩 패치일 때) */
  endingBody?: string[]
}

export type PatchMap = Record<string, ScenePatch>
