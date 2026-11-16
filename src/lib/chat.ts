import type { ChatMessage, Character, Episode, Novel, VoteRecord } from '../types'
import { describeChoices } from './story'

const STORE_KEY = 'np.chat.v1'

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
    lines.push(`말을 들으며, ${character.name}는 조금 생각했습니다. ${text.length > 30 ? text.slice(0, 30) + '…' : text}`)
  }

  if (lastChoice) {
    lines.push(`지금 이야기는 그쪽으로 흐르고 있어요. ${lastChoice}`)
  }

  lines.push(character.quote)

  return lines.join('\n\n')
}
