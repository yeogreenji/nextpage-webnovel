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
 * — 여섯 번의 선택 중 결이 더 많은 쪽의 엔딩으로.
 * — 정확히 반반이면 'mixed' 엔딩(세 번째 엔딩)으로.
 */
export function resolveEnding(flow: StoryFlow, session: PlaySession): PlayEnding | null {
  if (session.picks.length < flow.scenes.length) return null
  const a = session.picks.filter((pick) => pick.tone === 'A').length
  const b = session.picks.filter((pick) => pick.tone === 'B').length
  const tone: PlayEnding['tone'] = a > b ? 'A' : b > a ? 'B' : 'mixed'
  const found = flow.endings.find((ending) => ending.tone === tone)
  return found ?? flow.endings[0] ?? null
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

export function removeAppliedLine(session: PlaySession, id: string): PlaySession {
  return { ...session, applied: session.applied.filter((line) => line.id !== id) }
}

/* ───────────────────────── 완성된 소설 ───────────────────────── */

export type FinaleBlockKind = 'p' | 'pick' | 'say' | 'result'

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

    scene.body.forEach((text) => blocks.push({ kind: 'p', text }))

    appliedFor(session, scene.id).forEach((line) => {
      blocks.push({ kind: 'say', text: line.text, who: line.characterName, mine: line.kind === 'user' })
    })

    if (choice) {
      blocks.push({ kind: 'pick', text: choice.label })
      choice.result.forEach((text) => blocks.push({ kind: 'result', text }))
    }

    return { id: scene.id, no: scene.no, title: scene.title, place: scene.place, blocks }
  })

  const toneA = session.picks.filter((pick) => pick.tone === 'A').length
  const toneB = session.picks.filter((pick) => pick.tone === 'B').length

  const byCharacter = new Map<string, number>()
  session.applied.forEach((line) => {
    byCharacter.set(line.characterName, (byCharacter.get(line.characterName) ?? 0) + 1)
  })

  return {
    chapters,
    ending,
    stats: {
      picks: session.picks.length,
      applied: session.applied.length,
      scenes: flow.scenes.length,
      endingName: ending.name,
      toneA,
      toneB,
      appliedByCharacter: Array.from(byCharacter.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    },
    finishedAt: session.endedAt ?? session.updatedAt,
  }
}
