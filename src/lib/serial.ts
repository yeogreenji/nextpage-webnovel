import type {
  Character,
  ChoiceTone,
  Novel,
  PlaySession,
  SerialChapter,
  SerialState,
  StoryFlow,
} from '../types'
import { withSubjectParticle, withTopicParticle } from './format'
import { povIdOf } from './cast'
import { SERIAL_BEATS } from '../data/flows/longform/beats'

/**
 * 장편 이어쓰기 — 정적 아크가 끝난 뒤에도 25화 → 50화 → 100화까지 계속 집필합니다.
 * — 내 선택과 캐릭터 톡에서 소설에 넣은 대사를 누적 기억해 다음 화를 씁니다.
 * — Vercel 배포: /api/continue (Gemini) / 정적·오프라인: 기기 안 집필.
 * — 저장 키를 v2로 새로 잡아 구버전 캐시와 섞이지 않게 했습니다.
 */
const STORE_KEY = 'np.serial.v2'

export const SERIAL_TARGET = 100

type SerialMap = Record<string, SerialState>

function readAll(): SerialMap {
  try {
    const raw = window.localStorage.getItem(STORE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as SerialMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(map: SerialMap) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(map))
  } catch {
    // 저장 공간이 없으면 이번 화면에만 남습니다.
  }
}

export function loadSerial(novelId: string): SerialState | null {
  const state = readAll()[novelId]
  if (!state) return null
  return {
    novelId,
    baseChapters: state.baseChapters ?? 0,
    chapters: Array.isArray(state.chapters) ? state.chapters : [],
    updatedAt: state.updatedAt ?? new Date().toISOString(),
  }
}

export function emptySerial(novelId: string, baseChapters: number): SerialState {
  return { novelId, baseChapters, chapters: [], updatedAt: new Date().toISOString() }
}

export function saveSerial(state: SerialState): SerialState {
  const next = { ...state, updatedAt: new Date().toISOString() }
  const map = readAll()
  map[next.novelId] = next
  writeAll(map)
  return next
}

export function clearSerial(novelId: string) {
  const map = readAll()
  delete map[novelId]
  writeAll(map)
}

export function nextSerialNo(state: SerialState): number {
  return state.baseChapters + state.chapters.length + 1
}

export function lastSerialChapter(state: SerialState): SerialChapter | null {
  return state.chapters[state.chapters.length - 1] ?? null
}

export function serialTotal(state: SerialState): number {
  return state.baseChapters + state.chapters.length
}

/* ───────────────────────── 이어쓰기 재료 ───────────────────────── */

export interface ContinueBrief {
  novel: { id: string; title: string; synopsis: string; genres: string[] }
  cast: { name: string; role: string; tag: string; quote: string }[]
  nextNo: number
  target: number
  /** 작품별 다음 화 씨앗 (AI가 비틀어 씁니다) */
  beat: string
  premise: string[]
  /** 최근 화 3개 — 제목·장소·마지막 문단·고른 갈래 */
  recent: { no: number; title: string; place: string; tail: string; picked: string | null }[]
  /** 누적 기억 — 내 선택과 소설에 넣은 대사 */
  memory: { picks: string[]; dialogues: string[] }
  /** 지금까지의 결 — 자동 집필이 같은 결을 유지합니다 */
  dominantTone: ChoiceTone
  /** 서술자(독자의 화자) 이름 — 대화 상대로 부르지 않습니다 */
  povName: string
}

function dominantToneOf(tones: ChoiceTone[]): ChoiceTone {
  const counts: Record<ChoiceTone, number> = { A: 0, B: 0, C: 0 }
  for (const tone of tones) counts[tone] += 1
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as ChoiceTone) ?? 'A'
}

/** 작품 데이터에서 다음 화 씨앗을 고릅니다 (없으면 화 제목들을 씨앗으로). */
export function blueprintFor(flow: StoryFlow, novel: Novel) {
  const premise = flow.serial?.premise ?? [
    `${novel.title} — ${novel.synopsis}`,
    `등장인물: ${(novel.characters ?? []).map((item) => `${item.name}(${item.role})`).join(', ')}`,
  ]
  const beats = flow.serial?.beats ?? SERIAL_BEATS[novel.id] ?? [
    ...flow.scenes.slice(0, 6).map((scene) => `${scene.title} 뒤에 남은 일`),
    '아직 말하지 않은 사정이 하나 드러난다',
  ]
  const target = flow.serial?.target ?? SERIAL_TARGET
  return { premise, beats, target }
}

export function buildContinueBrief(input: {
  novel: Novel
  flow: StoryFlow
  session: PlaySession | null
  state: SerialState
}): ContinueBrief {
  const { novel, flow, session, state } = input
  const blueprint = blueprintFor(flow, novel)
  const nextNo = nextSerialNo(state)
  const beats = blueprint.beats
  const beat = beats.length > 0 ? beats[(nextNo - state.baseChapters - 1) % beats.length] : '다음 화'

  const pickedLabels: { label: string; tone: ChoiceTone }[] = [
    ...(session?.picks ?? []).map((pick) => ({ label: pick.label, tone: pick.tone })),
    ...state.chapters
      .filter((chapter) => chapter.picked)
      .map((chapter) => ({ label: chapter.picked!.label, tone: chapter.picked!.tone })),
  ]
  const dialogues = (session?.applied ?? [])
    .filter((line) => line.kind !== 'action')
    .map((line) => `${line.characterName}: ${line.text}`)

  const recent = [
    ...flow.scenes.slice(-2).map((scene, index, list) => ({
      no: scene.no,
      title: scene.title,
      place: scene.place,
      tail: scene.body[scene.body.length - 1] ?? '',
      picked:
        session?.picks[flow.scenes.length - list.length + index]?.label ?? null,
    })),
    ...state.chapters.slice(-3).map((chapter) => ({
      no: chapter.no,
      title: chapter.title,
      place: chapter.place,
      tail: chapter.body[chapter.body.length - 1] ?? '',
      picked: chapter.picked?.label ?? null,
    })),
  ].slice(-3)

  return {
    novel: {
      id: novel.id,
      title: novel.title,
      synopsis: novel.synopsis,
      genres: novel.genres,
    },
    cast: (novel.characters ?? []).map((character) => ({
      name: character.name,
      role: character.role,
      tag: character.tag,
      quote: character.quote,
    })),
    nextNo,
    target: blueprint.target,
    beat,
    premise: blueprint.premise,
    recent,
    memory: {
      picks: pickedLabels.slice(-8).map((pick) => pick.label),
      dialogues: dialogues.slice(-8),
    },
    dominantTone: dominantToneOf(pickedLabels.map((pick) => pick.tone)),
    povName: (novel.characters ?? []).find((character) => character.id === povIdOf(novel))?.name ?? '',
  }
}

/* ───────────────────────── AI 집필 (/api/continue) ───────────────────────── */

export interface SerialDraft {
  title: string
  place: string
  body: string[]
  teaser: string
  choices: { label: string; hint: string; tone: ChoiceTone }[]
}

export type SerialFailure = 'network' | 'timeout' | 'server' | 'bad-response'

export async function requestSerialChapter(
  brief: ContinueBrief,
  options: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<{ draft: SerialDraft | null; failure: SerialFailure | null }> {
  const timeoutMs = options.timeoutMs ?? 30_000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const onAbort = () => controller.abort()
  options.signal?.addEventListener('abort', onAbort)
  try {
    const response = await fetch('/api/continue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brief),
      signal: controller.signal,
    })
    if (!response.ok) return { draft: null, failure: response.status === 429 ? 'timeout' : 'server' }
    const data = (await response.json()) as { chapter?: unknown }
    const draft = normalizeDraft(data.chapter)
    if (!draft) return { draft: null, failure: 'bad-response' }
    return { draft, failure: null }
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError'
    return { draft: null, failure: aborted ? 'timeout' : 'network' }
  } finally {
    clearTimeout(timer)
    options.signal?.removeEventListener('abort', onAbort)
  }
}

export function normalizeDraft(value: unknown): SerialDraft | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  const place = typeof raw.place === 'string' ? raw.place.trim() : ''
  const body = Array.isArray(raw.body)
    ? raw.body.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : typeof raw.body === 'string'
      ? raw.body.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean)
      : []
  if (!title || body.length < 2) return null
  const teaser = typeof raw.teaser === 'string' ? raw.teaser.trim() : ''
  const rawChoices = Array.isArray(raw.choices) ? raw.choices : []
  const choices = rawChoices
    .map((item) => {
      const choice = item as Record<string, unknown>
      const label = typeof choice.label === 'string' ? choice.label.trim() : ''
      const hint = typeof choice.hint === 'string' ? choice.hint.trim() : ''
      return label ? { label, hint } : null
    })
    .filter((item): item is { label: string; hint: string } => Boolean(item))
    .slice(0, 3)
  const tones: ChoiceTone[] = ['A', 'B', 'C']
  return {
    title,
    place: place || '이야기 속 어느 하루',
    body: body.slice(0, 10).map((part) => part.trim()),
    teaser,
    choices:
      choices.length >= 2
        ? choices.map((choice, index) => ({ ...choice, tone: tones[index] ?? 'B' }))
        : [
            { label: '그 자리에서 답을 고른다', hint: '숨기지 않는다', tone: 'A' },
            { label: '한 걸음 물러나 상황을 본다', hint: '오늘은 정리한다', tone: 'B' },
          ],
  }
}

/* ───────────────────────── 기기 안 집필 (오프라인) ───────────────────────── */

const OPENERS = [
  (place: string, teaser: string) => `${place}. ${teaser || '어제의 문장이 아직 공기에 남아 있었다.'}`,
  (place: string, teaser: string) => `${place}의 불은 어제보다 늦게 꺼졌다. ${teaser}`,
  (place: string, teaser: string) => `다음 날, ${place}. ${teaser || '아무도 먼저 말을 꺼내지 않았다.'}`,
  (place: string, teaser: string) => `${place}에 도착했을 때, 어제의 마지막 문장이 나를 기다리고 있었다. ${teaser}`,
]

const MIDDLES = [
  (name: string) => `${withTopicParticle(name)} 창밖을 보다가 말을 꺼냈다. “어제 일, 나는 아직 정리 중입니다.” 그 문장은 사과도 변명도 아니어서, 오히려 오래 남았다.`,
  (name: string) => `${name}의 책상 위에는 어제와 같은 서류가 놓여 있었다. 달라진 것은 하나, 서류 옆에 이름 하나가 더 적혀 있었다는 것.`,
  (name: string) => `“한 번 더 확인하죠.” ${withSubjectParticle(name)} 말했다. 두 사람은 같은 종이를 사이에 두고 앉았다. 숫자는 틀리지 않았고, 그래서 더 곤란했다.`,
  (name: string) => `${withTopicParticle(name)} 대답 대신 손목시계를 봤다. 시간은 충분했고, 핑계도 충분했다. 그런데도 그 자리를 떠나지 않았다.`,
]

const HOOKS = [
  (subject: string) => `문이 닫히고 나서야, ${subject}가 남긴 말이 뒤늦게 도착했다.`,
  (subject: string) => `그때 ${subject}의 휴대전화가 울렸다. 화면에 뜬 이름은, 이 자리에 있어서는 안 될 사람이었다.`,
  (subject: string) => `${subject}가 봉투 하나를 밀어 왔다. “이건, 오늘 읽지 마세요.”`,
  (subject: string) => `복도 끝에서 발소리가 멈췄다. 돌아보니, ${subject}가 서 있었다.`,
]

const CHOICE_POOL: { label: string; hint: string; tone: ChoiceTone }[][] = [
  [
    { label: '그 자리에서 먼저 말을 꺼낸다', hint: '오늘 안에 정리한다', tone: 'A' },
    { label: '답을 미루고, 서류부터 확인한다', hint: '근거가 먼저다', tone: 'B' },
  ],
  [
    { label: '상대의 손을 잡아 세운다', hint: '놓치면 다시 오지 않는다', tone: 'A' },
    { label: '한 걸음 물러나, 혼자 생각한다', hint: '감정은 내일 판단한다', tone: 'B' },
  ],
]

/** AI 키가 없을 때도 다음 화를 씁니다 — 재료(직전 화·내 선택·대화)는 그대로 씁니다. */
export function localChapter(brief: ContinueBrief): SerialDraft {
  const seed = brief.nextNo
  const last = brief.recent[brief.recent.length - 1]
  const place = last?.place || `${brief.novel.title}의 다음 장면`
  const lastTail = last?.tail ?? ''
  const candidates = brief.cast.filter((character) => character.name !== brief.povName)
  const pool = candidates.length > 0 ? candidates : brief.cast
  const speaker = pool[seed % Math.max(1, pool.length)] ?? pool[0]
  const other = pool[(seed + 1) % Math.max(1, pool.length)] ?? speaker
  const name = speaker?.name ?? '그'
  const otherName = other?.name ?? name
  const myLine = brief.memory.dialogues[brief.memory.dialogues.length - 1]
  const lastPick = brief.memory.picks[brief.memory.picks.length - 1]
  const beat = brief.beat.replace(/\.$/, '')
  const opener = OPENERS[seed % OPENERS.length](place, lastTail)
  const middle = MIDDLES[seed % MIDDLES.length](name)
  const body: string[] = [opener]
  if (myLine) {
    body.push(
      `“${myLine}” — 내가 남긴 말이 아직 그 자리에 있었다. ${withSubjectParticle(name)} 그 말을 기억하는 얼굴이었다.`,
    )
  }
  body.push(beat.includes("—") ? `${beat}.` : `${beat} — 그 일이 이 화의 중심에 있었다.`)
  body.push(middle)
  body.push(
    lastPick
      ? `지난번에 고른 “${lastPick}”이 아직 유효했다. 그 선택이 만든 자리에서, 두 사람은 다시 마주 섰다.`
      : `아직 아무것도 고르지 않았다. 그래서 이 화의 마지막 문장은 아직 비어 있었다.`,
  )
  body.push(HOOKS[seed % HOOKS.length](otherName))
  const choices = CHOICE_POOL[seed % CHOICE_POOL.length].map((choice, index) => ({
    ...choice,
    tone: (index === 0 ? brief.dominantTone : brief.dominantTone === 'A' ? 'B' : 'A') as ChoiceTone,
  }))

  return {
    title: beat.split(',')[0].slice(0, 28),
    place,
    body,
    teaser: `${withTopicParticle(name)} ${otherName}에게 말을 걸려는 순간, 이 화가 끝난다.`,
    choices,
  }
}

/* ───────────────────────── 상태 반영 ───────────────────────── */

export function chapterFromDraft(
  no: number,
  draft: SerialDraft,
  basedOn: string[],
  source: 'ai' | 'local',
  picked: SerialChapter['picked'] = null,
): SerialChapter {
  return {
    no,
    title: draft.title,
    place: draft.place,
    body: draft.body,
    teaser: draft.teaser,
    choices: draft.choices,
    picked,
    basedOn,
    source,
    at: new Date().toISOString(),
  }
}

export function appendChapter(state: SerialState, chapter: SerialChapter): SerialState {
  return { ...state, chapters: [...state.chapters, chapter] }
}

export function pickSerial(
  state: SerialState,
  no: number,
  pick: { label: string; tone: ChoiceTone },
): SerialState {
  return {
    ...state,
    chapters: state.chapters.map((chapter) =>
      chapter.no === no ? { ...chapter, picked: pick } : chapter,
    ),
  }
}

/** 지금까지의 결 — 자동 집필이 같은 결을 유지합니다. */
export function memorySummary(brief: ContinueBrief): string[] {
  const lines: string[] = []
  if (brief.memory.picks.length > 0) lines.push(`내 선택 ${brief.memory.picks.length}개`)
  if (brief.memory.dialogues.length > 0) lines.push(`소설에 넣은 대사 ${brief.memory.dialogues.length}줄`)
  if (brief.recent.length > 0) lines.push(`직전 화 ${brief.recent.length}개`)
  return lines
}

export function charactersFor(novel: Novel): Character[] {
  return novel.characters ?? []
}
