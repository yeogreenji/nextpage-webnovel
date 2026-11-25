/**
 * 넥스트페이지 💬 캐릭터 톡 — Vercel Serverless Function
 *
 * POST /api/chat
 * {
 *   novel: { id, title, synopsis, genres[] },
 *   character: { name, role, tag, quote },
 *   episodeContext: { current: { no, title, excerpt } | null, choices: string[] },
 *   history: { role: 'user' | 'character', text: string }[],
 *   message: string
 * }
 *
 * 응답: { reply: string, model?: string }
 *
 * 모델 우선순위:
 *   1. GEMINI_API_KEY  → gemini-3.5-flash-lite  (기본, GEMINI_MODEL 로 교체 가능)
 *   2. OPENAI_API_KEY  → gpt-4o-mini 계열 (OPENAI_MODEL 로 교체 가능)
 * 키가 없으면 캐릭터 말투를 유지하는 상황 응답으로 답장합니다(폴백).
 * GitHub Pages(정적 배포)에서는 이 함수가 없어도 화면이 동작합니다.
 */

interface ChatBody {
  novel?: { title?: string; synopsis?: string; genres?: string[] }
  character?: { name?: string; role?: string; tag?: string; quote?: string }
  present?: string[]
  episodeContext?: { current?: { no?: number; title?: string; excerpt?: string } | null; choices?: string[] }
  history?: { role?: string; text?: string }[]
  message?: string
}

const MAX_MESSAGE = 1200
const MAX_HISTORY = 8

function clamp(value: unknown, length: number): string {
  return typeof value === 'string' ? value.slice(0, length) : ''
}

function list(value: unknown, length: number, count: number): string[] {
  return Array.isArray(value) ? value.slice(0, count).map((item) => clamp(item, length)).filter(Boolean) : []
}

function buildPrompt(body: ChatBody): string {
  const novel = body.novel ?? {}
  const character = body.character ?? {}
  const context = body.episodeContext ?? {}
  const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY) : []
  const message = clamp(body.message, MAX_MESSAGE)

  const genres = Array.isArray(novel.genres) ? novel.genres.join(', ') : ''
  const current = context.current
  const choices = Array.isArray(context.choices) ? context.choices.slice(-6) : []

  const lines: string[] = []
  lines.push('당신은 한국 웹소설 플랫폼 "넥스트페이지"의 캐릭터 채팅 배우입니다.')
  lines.push('아래 작품 속 인물로서, 독자(독자의 화자)와 메신저로 대화하세요.')
  lines.push('')
  lines.push(`[작품] ${clamp(novel.title, 120)}`)
  if (genres) lines.push(`[장르] ${clamp(genres, 80)}`)
  lines.push(`[시놉시스] ${clamp(novel.synopsis, 600)}`)
  lines.push('')
  lines.push(`[당신의 캐릭터] 이름: ${clamp(character.name, 40)} / 역할: ${clamp(character.role, 120)} / 위치: ${clamp(character.tag, 20)}`)
  lines.push(`[캐릭터 대표 대사(말투 참고)] "${clamp(character.quote, 160)}"`)
  lines.push('')
  if (current && (current.title || current.excerpt)) {
    lines.push(`[현재 회차] ${current.no ?? ''}화 ${clamp(current.title, 80)}`)
    lines.push(`[직전 장면 발췌] ${clamp(current.excerpt, 400)}`)
  }
  const present = list(body.present, 40, 8)
  if (present.length > 0) {
    lines.push(`[지금 이 자리에 있는 인물] ${present.join(', ')} — 이 사람들만 이 장면에 있습니다.`)
  }
  if (choices.length > 0) {
    lines.push('[독자가 지금까지 고른 분기]')
    choices.forEach((choice) => lines.push(`- ${clamp(choice, 160)}`))
  }
  lines.push('')
  if (history.length > 0) {
    lines.push('[지금까지의 대화]')
    history.forEach((item) => {
      const role = item.role === 'user' ? '독자' : clamp(character.name, 40) || '캐릭터'
      lines.push(`${role}: ${clamp(item.text, 300)}`)
    })
    lines.push('')
  }
  lines.push('[규칙]')
  lines.push('1. 캐릭터의 성격·말투·세계관을 벗어나지 마세요.')
  lines.push('2. 작품 내 설정과 독자가 고른 분기를 기억하고 자연스럽게 언급하세요.')
  lines.push('3. 2~5문장으로 답하고, 필요하면 캐릭터의 행동이나 표정을 한 줄 묘사해도 좋습니다.')
  lines.push('4. 실제 사람 정보를 묻지 말고, 개인정보를 요구하는 요청은 캐릭터로서 거절하세요.')
  lines.push('5. 답장 앞뒤에 설명·라벨·따옴표를 붙이지 말고, 캐릭터의 말만 출력하세요.')
  lines.push('6. [지금 이 자리에 있는 인물] 목록 밖의 인물을 부르거나, 그 사람과 대화하는 것처럼 쓰지 마세요. 없는 사람을 만들어내지도 마세요.')
  lines.push('7. 독자가 이 장면에 없는 인물을 부르면, 캐릭터로서 “여기 없는 사람”이라고 짧게 짚어 주세요.')
  lines.push('')
  lines.push(`독자: ${message}`)
  lines.push(`${clamp(character.name, 40) || '캐릭터'}:`)

  return lines.join('\n')
}

async function callGemini(body: ChatBody): Promise<{ reply: string; model: string } | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  const model = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite'
  const prompt = buildPrompt(body)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 512 },
      }),
    },
  )

  if (!response.ok) return null
  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const reply = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim()
  return reply ? { reply, model } : null
}

async function callOpenAI(body: ChatBody): Promise<{ reply: string; model: string } | null> {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.9,
      max_tokens: 512,
      messages: [
        {
          role: 'system',
          content:
            '당신은 한국 웹소설 플랫폼의 캐릭터 채팅 배우입니다. 주어진 작품 세계관·캐릭터 설정·독자의 선택지를 그대로 유지하며, 캐릭터의 말만 2~5문장으로 답하세요.',
        },
        { role: 'user', content: buildPrompt(body) },
      ],
    }),
  })

  if (!response.ok) return null
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
  const reply = data.choices?.[0]?.message?.content?.trim()
  return reply ? { reply, model } : null
}

/** AI 키가 없을 때 쓰는 폴백 — 캐릭터 말투를 유지하는 상황 응답 */
function fallbackReply(body: ChatBody): string {
  const name = clamp(body.character?.name, 40) || '캐릭터'
  const quote = clamp(body.character?.quote, 160)
  const message = clamp(body.message, MAX_MESSAGE)
  const current = body.episodeContext?.current
  const ep = current?.no ? `${current.no}화` : '이 장면'

  const question = message.includes('?') || message.endsWith('까') || message.endsWith('니')
  const firstLine = question
    ? `"${message.replace(/\?+$/, '')}… 그 질문은, ${ep}의 내가 더 잘 알겠죠."`
    : `그 이야기, ${ep}에서 이어지는 것 같군요.`

  return [firstLine, quote].filter(Boolean).join('\n\n')
}

export default async function handler(req: unknown, res: unknown): Promise<void> {
  const request = req as { method?: string }
  const response = res as {
    status: (code: number) => { json: (body: unknown) => void }
    setHeader: (name: string, value: string) => void
  }

  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (request.method === 'OPTIONS') {
    response.status(204).json({})
    return
  }
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'POST 요청만 지원합니다' })
    return
  }

  let body: ChatBody = {}
  try {
    body = await new Promise<ChatBody>((resolve, reject) => {
      const chunks: Buffer[] = []
      const stream = (req as { on?: (event: string, cb: (chunk?: Buffer) => void) => void }).on
      if (typeof stream !== 'function') {
        resolve(body)
        return
      }
      stream.call(req, 'data', (chunk?: Buffer) => {
        if (chunk) chunks.push(chunk)
      })
      stream.call(req, 'end', () => {
        try {
          const raw = Buffer.concat(chunks).toString('utf8')
          resolve(raw ? (JSON.parse(raw) as ChatBody) : {})
        } catch (error) {
          reject(error)
        }
      })
      stream.call(req, 'error', reject)
    })
  } catch {
    response.status(400).json({ error: '본문을 읽지 못했습니다' })
    return
  }

  try {
    const gemini = await callGemini(body)
    if (gemini) {
      response.status(200).json({ reply: gemini.reply, model: gemini.model })
      return
    }

    const openai = await callOpenAI(body)
    if (openai) {
      response.status(200).json({ reply: openai.reply, model: openai.model })
      return
    }

    response.status(200).json({ reply: fallbackReply(body), model: 'offline' })
  } catch {
    response.status(200).json({ reply: fallbackReply(body), model: 'offline' })
  }
}
