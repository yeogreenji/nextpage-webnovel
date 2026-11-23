import type { PlayEnding, StoryFlow } from '../types'
import { allSessions } from './play'

/**
 * 독자 서재 — 읽던 자리, 찜한 작품, 모은 엔딩.
 * — 모두 이 기기의 localStorage 에 저장됩니다(로그인 없이 바로 쓰는 구조).
 * — play.ts(내가 쓰는 소설)와 키를 분리해 서로 덮어쓰지 않습니다.
 */

/* ───────────────────────── 최근 본 / 이어보기 ───────────────────────── */

export interface ReadingEntry {
  novelId: string
  episodeId: string
  episodeNo: number
  episodeTitle: string
  /** 그 회차를 얼마나 읽었는지 (0~1) */
  percent: number
  /** 마지막으로 읽은 시각 (ISO) */
  at: string
}

// 최근 본 순서를 그대로 보존하기 위해 배열(최신 먼저)로 저장합니다.
const READING_KEY = 'np.reading.v2'
const READING_LEGACY_KEY = 'np.reading.v1'
const SHELF_KEY = 'np.shelf.v1'
const ENDING_KEY = 'np.endings.v1'

type ReadingMap = Record<string, ReadingEntry>

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장 공간이 없으면 이번 화면에서만 유지됩니다.
  }
}

/** 최신 먼저 정렬된 목록. 예전(v1) 저장분은 시각 순으로 옮겨 읽습니다. */
function readingList(): ReadingEntry[] {
  const stored = readJson<ReadingEntry[] | null>(READING_KEY, null)
  if (Array.isArray(stored)) return stored
  const legacy = readJson<ReadingMap>(READING_LEGACY_KEY, {})
  return Object.values(legacy).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}

export function allReading(): ReadingMap {
  const map: ReadingMap = {}
  for (const entry of readingList()) map[entry.novelId] = entry
  return map
}

/** 회차를 읽기 시작/진행할 때마다 호출합니다. */
export function recordReading(input: {
  novelId: string
  episodeId: string
  episodeNo: number
  episodeTitle: string
  percent: number
}): void {
  const list = readingList()
  const previous = list.find((entry) => entry.novelId === input.novelId)
  // 같은 회차를 다시 열어 0% 로 덮어쓰지 않도록, 진행률은 큰 값을 남깁니다.
  const percent =
    previous && previous.episodeId === input.episodeId
      ? Math.max(previous.percent, Math.min(1, Math.max(0, input.percent)))
      : Math.min(1, Math.max(0, input.percent))
  const entry: ReadingEntry = {
    novelId: input.novelId,
    episodeId: input.episodeId,
    episodeNo: input.episodeNo,
    episodeTitle: input.episodeTitle,
    percent,
    at: new Date().toISOString(),
  }
  // 방금 읽은 작품을 맨 앞으로 (같은 밀리초에 여러 번 읽어도 순서가 유지됩니다)
  writeJson(READING_KEY, [entry, ...list.filter((item) => item.novelId !== input.novelId)])
}

export function readingOf(novelId: string): ReadingEntry | null {
  return allReading()[novelId] ?? null
}

/** 최근에 읽은 순서대로 */
export function recentReading(limit = 12): ReadingEntry[] {
  return readingList().slice(0, limit)
}

export function clearReading(): void {
  writeJson(READING_KEY, [])
  writeJson(READING_LEGACY_KEY, {})
}

/* ───────────────────────── 내 서재 (찜) ───────────────────────── */

export interface ShelfEntry {
  novelId: string
  at: string
}

export function shelfEntries(): ShelfEntry[] {
  const list = readJson<ShelfEntry[]>(SHELF_KEY, [])
  return Array.isArray(list) ? list : []
}

export function shelfIds(): string[] {
  return shelfEntries().map((entry) => entry.novelId)
}

export function isOnShelf(novelId: string): boolean {
  return shelfEntries().some((entry) => entry.novelId === novelId)
}

/** 담기/빼기 — 담았으면 true */
export function toggleShelf(novelId: string): boolean {
  const list = shelfEntries()
  const exists = list.some((entry) => entry.novelId === novelId)
  const next = exists
    ? list.filter((entry) => entry.novelId !== novelId)
    : [...list, { novelId, at: new Date().toISOString() }]
  writeJson(SHELF_KEY, next)
  return !exists
}

export function clearShelf(): void {
  writeJson(SHELF_KEY, [])
}

/* ───────────────────────── 엔딩 도감 ───────────────────────── */

export interface EndingRecord {
  endingId: string
  name: string
  tone: PlayEnding['tone']
  at: string
}

type EndingMap = Record<string, EndingRecord[]>

export function unlockedEndings(): EndingMap {
  return readJson<EndingMap>(ENDING_KEY, {})
}

/** 엔딩에 도달하면 한 번 기록합니다(이미 모은 엔딩은 시각을 유지). */
export function unlockEnding(novelId: string, ending: PlayEnding): EndingRecord[] {
  const map = unlockedEndings()
  const list = map[novelId] ?? []
  if (list.some((entry) => entry.endingId === ending.id)) return list
  const record: EndingRecord = {
    endingId: ending.id,
    name: ending.name,
    tone: ending.tone,
    at: new Date().toISOString(),
  }
  const next = [...list, record]
  map[novelId] = next
  writeJson(ENDING_KEY, map)
  return next
}

export interface EndingSlot {
  ending: PlayEnding
  unlocked: boolean
  at: string | null
}

export interface EndingProgress {
  items: EndingSlot[]
  unlocked: number
  total: number
  complete: boolean
}

/**
 * 한 작품의 엔딩 도감.
 * — 이 기기에서 도달한 엔딩(기록)과, 진행 중인 세션의 마지막 엔딩도 함께 반영합니다.
 * — 아직 못 본 엔딩은 이름을 감춥니다(스포일러 방지).
 */
export function endingProgress(novelId: string, flow: StoryFlow | undefined): EndingProgress {
  const records = unlockedEndings()[novelId] ?? []
  const session = allSessions()[novelId]
  const liveEndingId =
    flow && session && session.picks.length >= flow.scenes.length
      ? flow.endings.find((ending) => ending.tone === session.picks[session.picks.length - 1]?.tone)?.id
      : undefined

  const endings = flow?.endings ?? []
  const items: EndingSlot[] = endings.map((ending) => {
    const record = records.find((entry) => entry.endingId === ending.id)
    return {
      ending,
      unlocked: Boolean(record) || liveEndingId === ending.id,
      at: record?.at ?? null,
    }
  })
  const unlockedCount = items.filter((item) => item.unlocked).length
  return {
    items,
    unlocked: unlockedCount,
    total: items.length,
    complete: items.length > 0 && unlockedCount === items.length,
  }
}

/** 모든 작품의 엔딩 수집 현황 — 서재 상단 요약에 씁니다. */
export function endingTotals(flows: { novelId: string; flow?: StoryFlow }[]): { unlocked: number; total: number } {
  let unlocked = 0
  let total = 0
  for (const item of flows) {
    const progress = endingProgress(item.novelId, item.flow)
    unlocked += progress.unlocked
    total += progress.total
  }
  return { unlocked, total }
}

export function clearEndings(): void {
  writeJson(ENDING_KEY, {})
}
