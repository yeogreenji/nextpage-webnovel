import type {
  AppliedLine,
  PlayEnding,
  PlayPick,
  PlayScene,
  PlaySession,
  StoryFlow,
} from '../types'

/**
 * 인터랙티브 소설 진행 저장소.
 * — 한 작품의 '내가 쓰는 중인 소설'을 이 기기에 남깁니다.
 * — 키를 새로 잡아(np.play.v1) 예전 투표 데이터와 섞이지 않게 했습니다.
 */
const STORE_KEY = 'np.play.v1'

type SessionMap = Record<string, PlaySession>

function readAll(): SessionMap {
  try {
    const raw = window.localStorage.getItem(STORE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as SessionMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(map: SessionMap): void {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(map))
  } catch {
    // 저장 공간이 없으면 이번 읽기 동안만 유지됩니다.
  }
}

export function emptySession(novelId: string): PlaySession {
  return {
    novelId,
    picks: [],
    applied: [],
    updatedAt: new Date().toISOString(),
    endedAt: null,
  }
}

export function loadSession(novelId: string): PlaySession | null {
  const session = readAll()[novelId]
  if (!session) return null
  return {
    novelId,
    picks: Array.isArray(session.picks) ? session.picks : [],
    applied: Array.isArray(session.applied) ? session.applied : [],
    updatedAt: session.updatedAt ?? new Date().toISOString(),
    endedAt: session.endedAt ?? null,
  }
}

export function ensureSession(novelId: string): PlaySession {
  return loadSession(novelId) ?? emptySession(novelId)
}

export function saveSession(session: PlaySession): PlaySession {
  const next: PlaySession = { ...session, updatedAt: new Date().toISOString() }
  const map = readAll()
  map[next.novelId] = next
  writeAll(map)
  return next
}

export function clearSession(novelId: string): void {
  const map = readAll()
  delete map[novelId]
  writeAll(map)
}

export function allSessions(): SessionMap {
  return readAll()
}

/** '처음부터' 초기화 — 이 기기의 모든 플레이 진행을 지웁니다. */
export function clearAllSessions(): void {
  try {
    window.localStorage.removeItem(STORE_KEY)
  } catch {
    // 무시
  }
}

export interface PlayProgress {
  /** 지금까지 내린 선택 수 */
  done: number
  /** 이 작품의 전체 양자택일 수 */
  total: number
  percent: number
  complete: boolean
}

export function progressOf(flow: StoryFlow | undefined, session: PlaySession | null): PlayProgress {
  const total = flow?.scenes.length ?? 0
  const done = Math.min(session?.picks.length ?? 0, total)
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    complete: total > 0 && done >= total,
  }
}

/** 지금 열려 있는 장면 (0-based). 마지막 선택까지 마쳤으면 scenes.length */
export function currentIndex(session: PlaySession): number {
  return session.picks.length
}

export function currentScene(flow: StoryFlow, session: PlaySession): PlayScene | null {
  return flow.scenes[currentIndex(session)] ?? null
}

/** 선택 하나를 기록하고 다음 장면을 엽니다. */
export function pickChoice(
  flow: StoryFlow,
  session: PlaySession,
  sceneId: string,
  choiceId: string,
): PlaySession {
  const scene = flow.scenes.find((item) => item.id === sceneId)
  const choice = scene?.choices.find((item) => item.id === choiceId)
  if (!scene || !choice) return session

  const already = session.picks.findIndex((pick) => pick.sceneId === sceneId)
  const pick: PlayPick = {
    sceneId,
    choiceId,
    label: choice.label,
    tone: choice.tone,
    at: new Date().toISOString(),
  }

  // 같은 장면을 다시 고른 경우: 그 뒤의 선택과 대사는 지우고 새 길로 갑니다.
  const kept = already >= 0 ? session.picks.slice(0, already) : session.picks
  const picks = [...kept, pick]
  const keptSceneIds = new Set(flow.scenes.slice(0, picks.length).map((item) => item.id))

  const applied = session.applied.filter((line) => keptSceneIds.has(line.sceneId))
  const complete = picks.length >= flow.scenes.length

  return {
    ...session,
    picks,
    applied,
    endedAt: complete ? new Date().toISOString() : null,
  }
}

/** n번째 선택으로 되돌아갑니다 (그 선택은 취소되고 다시 고를 수 있습니다). */
export function rewindTo(flow: StoryFlow, session: PlaySession, sceneIndex: number): PlaySession {
  const index = Math.max(0, Math.min(sceneIndex, session.picks.length))
  const picks = session.picks.slice(0, index)
  const keptSceneIds = new Set(flow.scenes.slice(0, index).map((scene) => scene.id))
  return {
    ...session,
    picks,
    applied: session.applied.filter((line) => keptSceneIds.has(line.sceneId)),
    endedAt: null,
  }
}

/** '다른 선택지로 다시 써보기' — 마지막 선택만 취소합니다. */
export function undoLastPick(flow: StoryFlow, session: PlaySession): PlaySession {
  return rewindTo(flow, session, Math.max(0, session.picks.length - 1))
}

/**
 * 엔딩 판정.
 * — 마지막 장면에서 고른 선택의 결이 엔딩을 정합니다.
 *   앞선 선택은 이미 본문(이음 문단·결과 문단)에 반영되어 있으므로,
 *   결말은 독자가 마지막에 한 행동과 절대 어긋나지 않아야 합니다.
 */
export function resolveEnding(flow: StoryFlow, session: PlaySession): PlayEnding | null {
  if (session.picks.length < flow.scenes.length) return null
  const tone = session.picks[session.picks.length - 1]?.tone
  if (!tone) return null
  return flow.endings.find((ending) => ending.tone === tone) ?? null
}

/** 앞선 선택의 결 — 엔딩 화면에서 여정을 한 줄로 되짚을 때 씁니다. */
export function toneCounts(session: PlaySession): Record<'A' | 'B' | 'C', number> {
  return {
    A: session.picks.filter((pick) => pick.tone === 'A').length,
    B: session.picks.filter((pick) => pick.tone === 'B').length,
    C: session.picks.filter((pick) => pick.tone === 'C').length,
  }
}

/** 이 장면에서 말을 걸 수 있는 지점 — 본문 몇 번째 문단 뒤인지 (0-based). */
export function interactionAnchorOf(scene: PlayScene): number {
  const last = Math.max(0, scene.body.length - 1)
  const after = scene.interaction?.after
  if (after === undefined) return last
  return Math.max(0, Math.min(after, last))
}

/** n번째 장면(0-based) 앞에 붙는 이음 문단 — 직전 선택의 결에 따라 달라집니다. */
export function leadOf(flow: StoryFlow, session: PlaySession, sceneIndex: number): string[] {
  if (sceneIndex <= 0) return []
  const previousPick = session.picks[sceneIndex - 1]
  const tone = previousPick?.tone
  const scene = flow.scenes[sceneIndex]
  if (!tone || !scene) return []

  // 선택지마다 행동이 다르므로, 그 선택에 붙은 이음 문단을 먼저 씁니다.
  const previousScene = flow.scenes[sceneIndex - 1]
  const pickedChoice = previousScene?.choices.find((choice) => choice.id === previousPick?.choiceId)
  if (pickedChoice?.lead && pickedChoice.lead.length > 0) return pickedChoice.lead

  return scene.lead?.[tone] ?? []
}

export function appliedFor(session: PlaySession, sceneId: string): AppliedLine[] {
  return session.applied.filter((line) => line.sceneId === sceneId)
}

export function addAppliedLine(
  session: PlaySession,
  input: { sceneId: string; characterId: string; characterName: string; kind: AppliedLine['kind']; text: string },
): PlaySession {
  const text = input.text.trim()
  if (!text) return session
  const id = `ap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const exists = session.applied.some(
    (line) => line.sceneId === input.sceneId && line.kind === input.kind && line.text === text,
  )
  if (exists) return session
  const line: AppliedLine = {
    id,
    sceneId: input.sceneId,
    characterId: input.characterId,
    characterName: input.characterName,
    kind: input.kind,
    text,
    at: new Date().toISOString(),
  }
  return { ...session, applied: [...session.applied, line] }
}

export interface AppliedInput {
  characterId: string
  characterName: string
  kind: AppliedLine['kind']
  text: string
}

/**
 * 여러 줄을 한 번에 소설에 넣습니다.
 * — 「티키타카 둘 다 넣기」처럼 내 대사와 캐릭터 대사가 함께 들어와도
 *   한 번의 상태 갱신으로 모두 저장됩니다 (뒤엣것이 앞엣것을 덮지 않습니다).
 */
export function addAppliedLines(
  session: PlaySession,
  sceneId: string,
  inputs: AppliedInput[],
): PlaySession {
  return inputs.reduce(
    (current, input) => addAppliedLine(current, { sceneId, ...input }),
    session,
  )
}

export function removeAppliedLine(session: PlaySession, id: string): PlaySession {
  return { ...session, applied: session.applied.filter((line) => line.id !== id) }
}

/* ───────────────────────── 완성된 소설 ───────────────────────── */

export type FinaleBlockKind = 'p' | 'pick' | 'say' | 'action' | 'result'

export interface FinaleBlock {
  kind: FinaleBlockKind
  text: string
  /** 대사 블록의 화자 */
  who?: string
  /** 캐릭터 대사인지 내 대사인지 */
  mine?: boolean
}

export interface FinaleChapter {
  id: string
  no: number
  title: string
  place: string
  blocks: FinaleBlock[]
}

export interface FinaleStats {
  picks: number
  applied: number
  scenes: number
  endingName: string
  toneA: number
  toneB: number
  toneC: number
  appliedByCharacter: { name: string; count: number }[]
}

export interface FinaleNovel {
  chapters: FinaleChapter[]
  ending: PlayEnding
  stats: FinaleStats
  finishedAt: string
}

/**
 * 내가 고른 분기 + 내가 넣은 대사 + 엔딩을 한 편의 소설로 묶습니다.
 * — 화면에는 아무 버튼도 없이 문단만 이어집니다.
 */
export function buildFinale(flow: StoryFlow, session: PlaySession): FinaleNovel | null {
  const ending = resolveEnding(flow, session)
  if (!ending) return null

  const chapters: FinaleChapter[] = flow.scenes.map((scene, index) => {
    const pick = session.picks[index]
    const choice = scene.choices.find((item) => item.id === pick?.choiceId)
    const blocks: FinaleBlock[] = []

    leadOf(flow, session, index).forEach((text) => blocks.push({ kind: 'p', text }))

    // 말을 건 자리(interaction point)에 행동 요약과 대사가 그대로 놓입니다.
    const anchor = interactionAnchorOf(scene)
    const pushApplied = () => {
      appliedFor(session, scene.id).forEach((line) => {
        if (line.kind === 'action') {
          blocks.push({ kind: 'action', text: line.text })
        } else {
          blocks.push({ kind: 'say', text: line.text, who: line.characterName, mine: line.kind === 'user' })
        }
      })
    }
    scene.body.forEach((text, bodyIndex) => {
      blocks.push({ kind: 'p', text })
      if (bodyIndex === anchor) pushApplied()
    })

    if (choice) {
      blocks.push({ kind: 'pick', text: choice.label })
      choice.result.forEach((text) => blocks.push({ kind: 'result', text }))
    }

    return { id: scene.id, no: scene.no, title: scene.title, place: scene.place, blocks }
  })

  const tones = toneCounts(session)

  const byCharacter = new Map<string, number>()
  session.applied.forEach((line) => {
    if (line.kind === 'action') return
    byCharacter.set(line.characterName, (byCharacter.get(line.characterName) ?? 0) + 1)
  })

  return {
    chapters,
    ending,
    stats: {
      picks: session.picks.length,
      applied: session.applied.filter((line) => line.kind !== 'action').length,
      scenes: flow.scenes.length,
      endingName: ending.name,
      toneA: tones.A,
      toneB: tones.B,
      toneC: tones.C,
      appliedByCharacter: Array.from(byCharacter.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    },
    finishedAt: session.endedAt ?? session.updatedAt,
  }
}
