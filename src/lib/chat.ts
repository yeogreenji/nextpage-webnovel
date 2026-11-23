import type {
  AppliedLine,
  ChatMessage,
  Character,
  Episode,
  Novel,
  PlayPick,
  PlayScene,
  VoteRecord,
} from '../types'
import { describeChoices } from './story'
import { withSubjectParticle } from './format'

const STORE_KEY = 'np.chat.v1'
const SCENE_STORE_KEY = 'np.scenechat.v1'

type ChatLog = Record<string, ChatMessage[]>

function readLog(): ChatLog {
  try {
    const raw = window.localStorage.getItem(STORE_KEY)
    return raw ? (JSON.parse(raw) as ChatLog) : {}
  } catch {
    return {}
  }
}

function writeLog(log: ChatLog): void {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(log))
  } catch {
    // 저장 공간이 없으면 대화는 화면에만 남습니다.
  }
}

export function chatKey(novelId: string, characterId: string): string {
  return `${novelId}::${characterId}`
}

export function loadMessages(novelId: string, characterId: string): ChatMessage[] {
  return readLog()[chatKey(novelId, characterId)] ?? []
}

export function saveMessages(novelId: string, characterId: string, messages: ChatMessage[]): void {
  const log = readLog()
  log[chatKey(novelId, characterId)] = messages.slice(-40)
  writeLog(log)
}

export function clearMessages(novelId: string, characterId: string): void {
  const log = readLog()
  delete log[chatKey(novelId, characterId)]
  writeLog(log)
}

export function makeMessage(role: ChatMessage['role'], text: string, source?: ChatMessage['source']): ChatMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    text: text.trim(),
    at: new Date().toISOString(),
    source,
  }
}

/** api/chat.ts 로 보내는 요청 본문 */
export interface ChatRequest {
  novel: { id: string; title: string; synopsis: string; genres: string[] }
  character: { name: string; role: string; tag: string; quote: string }
  episodeContext: {
    current: { no: number; title: string; excerpt: string } | null
    choices: string[]
  }
  history: { role: 'user' | 'character'; text: string }[]
  message: string
}

/**
 * 캐릭터 톡의 맥락을 만듭니다.
 * - 현재 작품 세계관(제목·시놉시스·장르)
 * - 지금까지 내가 고른 선택지
 * - 캐릭터 성격·말투(역할·대표 대사)
 */
export function buildChatRequest(input: {
  novel: Novel
  character: Character
  episodes: Episode[]
  votes: VoteRecord[]
  currentEpisode: Episode | null
  message: string
  history: ChatMessage[]
}): ChatRequest {
  const { novel, character, episodes, votes, currentEpisode, message, history } = input
  const choices = describeChoices(novel, episodes, votes)

  return {
    novel: {
      id: novel.id,
      title: novel.title,
      synopsis: novel.synopsis,
      genres: novel.genres,
    },
    character: {
      name: character.name,
      role: character.role,
      tag: character.tag,
      quote: character.quote,
    },
    episodeContext: {
      current: currentEpisode
        ? {
            no: currentEpisode.no,
            title: currentEpisode.title,
            excerpt: currentEpisode.body.slice(0, 400),
          }
        : null,
      choices,
    },
    history: history.slice(-8).map((item) => ({ role: item.role, text: item.text })),
    message,
  }
}

/* ─────────────── 장면(플레이) 중간 대화 ─────────────── */

function readSceneLog(): ChatLog {
  try {
    const raw = window.localStorage.getItem(SCENE_STORE_KEY)
    return raw ? (JSON.parse(raw) as ChatLog) : {}
  } catch {
    return {}
  }
}

export function sceneChatKey(novelId: string, sceneId: string, characterId: string): string {
  return `${novelId}::${sceneId}::${characterId}`
}

export function loadSceneMessages(
  novelId: string,
  sceneId: string,
  characterId: string,
): ChatMessage[] {
  return readSceneLog()[sceneChatKey(novelId, sceneId, characterId)] ?? []
}

export function saveSceneMessages(
  novelId: string,
  sceneId: string,
  characterId: string,
  messages: ChatMessage[],
): void {
  try {
    const log = readSceneLog()
    log[sceneChatKey(novelId, sceneId, characterId)] = messages.slice(-30)
    window.localStorage.setItem(SCENE_STORE_KEY, JSON.stringify(log))
  } catch {
    // 저장 공간이 없으면 대화는 화면에만 남습니다.
  }
}

/**
 * 장면 맥락을 담은 캐릭터 톡 요청.
 * API 계약(api/chat)은 그대로 쓰고, 현재 장면·선택·적용한 대사를 episodeContext 로 넘깁니다.
 */
export function buildSceneChatRequest(input: {
  novel: Novel
  character: Character
  scene: PlayScene
  picks: PlayPick[]
  applied: AppliedLine[]
  message: string
  history: ChatMessage[]
}): ChatRequest {
  const { novel, character, scene, picks, applied, message, history } = input
  const lastPick = picks[picks.length - 1]
  const choices = [
    ...picks.map((pick, index) => `${index + 1}장면에서 “${pick.label}”를 골랐다`),
    ...(lastPick ? [] : [`${scene.no}장면에서 아직 선택하지 않았다`]),
    ...applied.map(
      (line) => `소설에 넣은 대사 — ${line.characterName}: “${line.text.replace(/\n+/g, ' ')}”`,
    ),
  ]

  return {
    novel: {
      id: novel.id,
      title: novel.title,
      synopsis: novel.synopsis,
      genres: novel.genres,
    },
    character: {
      name: character.name,
      role: character.role,
      tag: character.tag,
      quote: character.quote,
    },
    episodeContext: {
      current: {
        no: scene.no,
        title: `${scene.title} · ${scene.place}`,
        excerpt: scene.body.join('\n').slice(0, 600),
      },
      choices,
    },
    history: history.slice(-8).map((item) => ({ role: item.role, text: item.text })),
    message,
  }
}

/** 장면 맥락을 반영한 오프라인 응답 (AI 키가 없을 때) */
export function sceneOfflineReply(
  character: Character,
  message: string,
  scene: PlayScene,
  picks: PlayPick[],
): string {
  const text = message.trim()
  const lastPick = picks[picks.length - 1]
  const place = scene.place.split('·').pop()?.trim() ?? scene.place

  const lines: string[] = []

  if (text.includes('?') || /까$|니$|요\?$/.test(text)) {
    lines.push(`“${text.replace(/\?+$/, '')}…”`)
    lines.push(`${withSubjectParticle(character.name)} ${place}에서 잠깐 대답을 골랐다. “지금은, 제가 아는 것만 말할 수 있어요.”`)
  } else if (text.length <= 12) {
    lines.push(`“${text}”`)
    lines.push(`짧은 말이 ${place}의 공기에 오래 남았다. ${withSubjectParticle(character.name)} 고개를 끄덕였다.`)
  } else {
    lines.push(`${withSubjectParticle(character.name)} 말을 들으며 손끝을 멈췄다. “그렇게 말해 주는 사람은, 처음이에요.”`)
  }

  if (lastPick) {
    lines.push(`“${lastPick.label}” — 그 선택이 이 장면을 여기까지 데려왔어요.`)
  }

  lines.push(character.quote)
  return lines.join('\n\n')
}

/**
 * AI 키가 연결되어 있지 않을 때 쓰는 상황별 응답.
 * 캐릭터별 말투와 현재 회차·선택지 맥락을 반영해서, 템플릿처럼 보이지 않게 만듭니다.
 */
export function offlineReply(
  character: Character,
  userText: string,
  currentEpisode: Episode | null,
  choices: string[],
): string {
  const text = userText.trim()
  const ep = currentEpisode ? `${currentEpisode.no}화 《${currentEpisode.title}》` : '아직 펼쳐지지 않은 장면'
  const lastChoice = choices.length > 0 ? choices[choices.length - 1] : null

  const question = text.includes('?') || text.endsWith('까') || text.endsWith('니')
  const short = text.length <= 8

  const lines: string[] = []

  if (question) {
    lines.push(`"${text.replace(/\?+$/, '')}… 그 질문은, ${character.role}인 제가 아니라 ${ep}의 제가 답하는 게 맞겠죠."`)
  } else if (short) {
    lines.push(`"${text}"… 그렇게 짧게 말하는 것도, ${character.name}에게는 답이 됩니다.`)
  } else {
    lines.push(`말을 들으며, ${withSubjectParticle(character.name)} 조금 생각했습니다. ${text.length > 30 ? text.slice(0, 30) + '…' : text}`)
  }

  if (lastChoice) {
    lines.push(`지금 이야기는 그쪽으로 흐르고 있어요. ${lastChoice}`)
  }

  lines.push(character.quote)

  return lines.join('\n\n')
}


/* ───────────────────────── AI 호출 · 실패 처리 ───────────────────────── */

export type ChatFailure = 'network' | 'timeout' | 'rate' | 'server' | 'bad-response'

export interface ChatCallResult {
  reply: string | null
  /** null 이면 정상. 값이 있으면 화면에 '기기 안 응답' 안내를 띄웁니다. */
  failure: ChatFailure | null
}

export const CHAT_FAILURE_TEXT: Record<ChatFailure, string> = {
  network: 'AI 연결이 끊겨 기기 안 응답으로 답했어요.',
  timeout: 'AI 응답이 늦어 기기 안 응답으로 답했어요.',
  rate: '지금 대화가 몰려 기기 안 응답으로 답했어요. 잠시 뒤 다시 시도해 주세요.',
  server: 'AI 서버가 잠시 불안정해 기기 안 응답으로 답했어요.',
  'bad-response': 'AI 응답을 읽지 못해 기기 안 응답으로 답했어요.',
}

/**
 * /api/chat 호출 — 12초 안에 답이 없으면 끊고, 실패 종류를 구분해 돌려줍니다.
 * 정적 배포(GitHub Pages)에서는 fetch 자체가 실패하므로 'network' 로 떨어집니다.
 */
export async function requestChat(
  body: ChatRequest,
  options: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<ChatCallResult> {
  const timeoutMs = options.timeoutMs ?? 12_000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const onAbort = () => controller.abort()
  options.signal?.addEventListener('abort', onAbort)

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!response.ok) {
      return { reply: null, failure: response.status === 429 ? 'rate' : 'server' }
    }
    const data = (await response.json()) as { reply?: unknown }
    const reply = typeof data.reply === 'string' ? data.reply.trim() : ''
    if (!reply) return { reply: null, failure: 'bad-response' }
    return { reply, failure: null }
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError'
    return { reply: null, failure: aborted ? 'timeout' : 'network' }
  } finally {
    clearTimeout(timer)
    options.signal?.removeEventListener('abort', onAbort)
  }
}

/* ───────────────────────── 호감도 · 기분 ───────────────────────── */

export interface Affinity {
  /** 0~100 */
  score: number
  /** 단계 이름 (낯섦 → 애틋함) */
  tier: string
  /** 지금 이 인물의 기분 한 줄 */
  mood: string
  /** 게이지 색 (CSS 변수) */
  color: string
}

const TIERS: { min: number; tier: string; color: string }[] = [
  { min: 82, tier: '애틋함', color: 'var(--accent)' },
  { min: 60, tier: '가까움', color: 'var(--vs-a)' },
  { min: 38, tier: '마음의 문', color: 'var(--gold)' },
  { min: 16, tier: '호기심', color: 'var(--vs-b)' },
  { min: 0, tier: '낯섦', color: 'var(--ink-mute)' },
]

/**
 * 대화·선택·소설에 넣은 대사로 호감도를 계산합니다.
 * — 대화를 오래 나눌수록, 내 선택을 많이 할수록, 대사를 소설에 넣을수록 올라갑니다.
 * — 서버 없이 이 기기에서만 계산·저장되는 값입니다(다른 독자와 비교하지 않음).
 */
export function affinityOf(input: {
  messages: ChatMessage[]
  appliedCount?: number
  picks?: number
}): Affinity {
  const mine = input.messages.filter((message) => message.role === 'user').length
  const theirs = input.messages.filter((message) => message.role === 'character').length
  const score = Math.min(
    100,
    Math.round(mine * 8 + theirs * 5 + (input.appliedCount ?? 0) * 4 + (input.picks ?? 0) * 2),
  )
  const tier = TIERS.find((item) => score >= item.min) ?? TIERS[TIERS.length - 1]
  const last = [...input.messages].reverse().find((message) => message.role === 'character')
  let mood = '조용히 당신을 보고 있어요.'
  if (!last) mood = '아직 당신을 경계하는 눈빛이에요.'
  else if (last.text.includes('?')) mood = '되묻고 싶은 게 있는 얼굴이에요.'
  else if (last.text.includes('…')) mood = '말끝을 흐리며 마음을 고르는 중이에요.'
  else if (last.source === 'offline') mood = '말을 아끼지만, 옆에 있어 주는 중이에요.'
  else if (score >= 60) mood = '당신 쪽으로 조금 기울어져 있어요.'
  return { score, tier: tier.tier, color: tier.color, mood }
}

/* ───────────────────────── 추천 대사 3개 ───────────────────────── */

const OPENERS: string[][] = [
  ['지금 뭐 하고 계세요?', '조금 더 가까이, 이야기해 줄래요?', '오늘 하루는 어땠어요?'],
  ['이 장면, 당신은 어떻게 보고 있어요?', '솔직히 말해도 돼요?', '제가 뭘 물으면 대답해 줄래요?'],
  ['여기서 잠깐만, 같이 있어도 될까요?', '당신은 지금 무슨 생각을 해요?', '아까 그 말, 마음에 남았어요.'],
]

/** 문자 코드 합으로 작품·인물마다 다른 첫 대사를 고릅니다. */
function pickOpeners(key: string): string[] {
  let sum = 0
  for (let index = 0; index < key.length; index += 1) sum += key.charCodeAt(index)
  return OPENERS[sum % OPENERS.length]
}

/**
 * 지금 대화에 바로 쓸 수 있는 추천 대사 3개.
 * — 첫 대화 / 대화 중 / 선택을 마친 뒤에 따라 달라집니다.
 * — 화면에서 누르면 그대로 전송됩니다.
 */
export function suggestReplies(input: {
  character: Character
  messages: ChatMessage[]
  lastPickLabel?: string | null
  scenePlace?: string
}): string[] {
  const { character, messages } = input
  const last = [...messages].reverse().find((message) => message.role === 'character')
  const chips: string[] = []

  if (!last) {
    chips.push(...pickOpeners(character.id + character.name))
  } else if (last.text.includes('?')) {
    chips.push('그건, 제가 답해도 되는 질문인가요?')
    chips.push('글쎄요. 지금은 잘 모르겠어요.')
    chips.push('당신은 어떻게 생각해요?')
  } else if (last.text.includes('…')) {
    chips.push('말끝을 흐리지 말아 주세요.')
    chips.push('기다릴게요. 천천히 말해도 돼요.')
    chips.push('그 침묵, 무슨 뜻이에요?')
  } else {
    chips.push('그 말, 조금 더 듣고 싶어요.')
    chips.push('지금 표정, 어떤지 궁금해요.')
    chips.push('나도 같은 생각이에요.')
  }

  if (input.lastPickLabel) {
    chips.push(`“${input.lastPickLabel}” — 그 선택은 후회하지 않아요.`)
  } else if (input.scenePlace) {
    chips.push(`${input.scenePlace.split('·').pop()?.trim() ?? '여기'}에서, 무슨 일이 있었어요?`)
  }

  const unique = Array.from(new Set(chips.map((chip) => chip.trim()).filter(Boolean)))
  return unique.slice(0, 3)
}
