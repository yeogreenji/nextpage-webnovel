/**
 * 넥스트페이지 ✍️ 장편 이어쓰기 — Vercel Serverless Function
 *
 * POST /api/continue
 * {
 *   novel, cast[], nextNo, target, beat, premise[],
 *   recent[{no,title,tail,picked}], memory{picks[],dialogues[]}, dominantTone
 * }
 * 응답: { chapter: { title, place, body[], teaser, choices[{label,hint}] }, model }
 *
 * 모델 우선순위:
 *   1. GEMINI_API_KEY  → gemini-3.5-flash-lite (GEMINI_MODEL 로 교체 가능)
 *   2. OPENAI_API_KEY  → gpt-4o-mini 계열
 * 키가 없으면 200 + { chapter: null } 로 답하고, 화면은 기기 안 집필로 이어 씁니다.
 */

interface ContinueBody {
  novel?: { title?: string; synopsis?: string; genres?: string[] }
  cast?: { name?: string; role?: string; tag?: string; quote?: string }[]
  nextNo?: number
  target?: number
  beat?: string
  premise?: string[]
  recent?: { no?: number; title?: string; tail?: string; picked?: string | null }[]
  memory?: { picks?: string[]; dialogues?: string[] }
  dominantTone?: string
}

const MAX_BODY_TOKENS = 1600

function clamp(value: unknown, length: number): string {
  return typeof value === 'string' ? value.slice(0, length) : ''
}

function list(value: unknown, length: number, count: number): string[] {
  return Array.isArray(value) ? value.slice(-count).map((item) => clamp(item, length)).filter(Boolean) : []
}

function buildPrompt(body: ContinueBody): string {
  const novel = body.novel ?? {}
  const cast = Array.isArray(body.cast) ? body.cast.slice(0, 8) : []
  const recent = Array.isArray(body.recent) ? body.recent.slice(-3) : []
  const premise = list(body.premise, 300, 4)
  const picks = list(body.memory?.picks, 160, 8)
  const dialogues = list(body.memory?.dialogues, 200, 8)
  const nextNo = Number(body.nextNo) || 1
  const target = Number(body.target) || 100
  const genres = Array.isArray(novel.genres) ? novel.genres.join(', ') : ''

  const lines: string[] = []
  lines.push('당신은 한국 웹소설 플랫폼 "넥스트페이지"의 연재 작가입니다.')
  lines.push(`${target}화까지 이어지는 장편의 ${nextNo}화를 새로 씁니다. 독자는 화마다 갈래를 고르며 읽고 있습니다.`)
  lines.push('')
  lines.push(`[작품] ${clamp(novel.title, 120)}`)
  if (genres) lines.push(`[장르] ${clamp(genres, 80)}`)
  lines.push(`[시놉시스] ${clamp(novel.synopsis, 700)}`)
  lines.push('')
  lines.push('[이 작품의 인물 — 이 이름들만 등장시킬 수 있습니다]')
  cast.forEach((character) => {
    lines.push(`- ${clamp(character.name, 40)} / ${clamp(character.role, 100)} / 대표 대사: "${clamp(character.quote, 120)}"`)
  })
  if (premise.length > 0) {
    lines.push('')
    lines.push('[세계관·관계]')
    premise.forEach((item) => lines.push(`- ${item}`))
  }
  if (recent.length > 0) {
    lines.push('')
    lines.push('[직전 화 — 반드시 이어서 쓰세요]')
    recent.forEach((chapter) => {
      lines.push(`- ${chapter.no}화 ${clamp(chapter.title, 60)} / 마지막 문장: ${clamp(chapter.tail, 200)}`)
      if (chapter.picked) lines.push(`  독자가 고른 갈래: ${clamp(chapter.picked, 120)}`)
    })
  }
  if (picks.length > 0) {
    lines.push('')
    lines.push('[독자가 지금까지 고른 갈래 — 성격과 관계에 반영]')
    picks.forEach((pick) => lines.push(`- ${pick}`))
  }
  if (dialogues.length > 0) {
    lines.push('')
    lines.push('[독자가 캐릭터와 나눠 소설에 넣은 대사 — 이번 화에서 반드시 회수하세요]')
    dialogues.forEach((line) => lines.push(`- ${line}`))
  }
  lines.push('')
  lines.push(`[이번 화의 씨앗] ${clamp(body.beat, 200) || '새 사건 하나가 관계를 흔든다'}`)
  lines.push(`[독자가 지금까지 끌어온 결] ${clamp(body.dominantTone, 4) || 'A'}`)
  lines.push('')
  lines.push('[규칙]')
  lines.push('1. 4~6문단, 700~1100자. 문단은 빈 줄로 나누고, 각 문단은 완결된 문장으로 씁니다.')
  lines.push('2. 첫 문단은 직전 화의 마지막 문장을 이어받아 시작합니다. 인물·장소·시간이 갑자기 바뀌지 않게 하세요.')
  lines.push('3. 마지막 문단은 다음 화가 궁금해지는 훅(절단신공)으로 끝냅니다.')
  lines.push('4. 위 인물 목록에 없는 이름을 만들지 마세요. 목록에 없는 사람을 부르거나 대화 상대로 세우지 마세요.')
  lines.push('5. 이번 화에서 고를 갈래 2개를 만듭니다. 서로 다른 결(A=직진·고백·행동, B=유보·관찰·거리두기)이어야 합니다.')
  lines.push('6. 대사는 큰따옴표(“ ”)로 쓰고, 직선 따옴표(")는 쓰지 마세요. 설명·머리말 없이 JSON만 출력합니다.')
  lines.push('')
  lines.push('출력 형식(JSON):')
  lines.push('{"chapter":{"title":"한 줄 제목","place":"요일·시간 · 장소","body":["문단1","문단2"],"teaser":"다음 화 예고 한 줄","choices":[{"label":"갈래 A 문장","hint":"한 줄"},{"label":"갈래 B 문장","hint":"한 줄"}]}}')

  return lines.join('\n')
}

async function callGemini(body: ContinueBody): Promise<{ chapter: unknown; model: string } | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  const model = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite'
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(body) }] }],
        generationConfig: {
          temperature: 0.95,
          maxOutputTokens: MAX_BODY_TOKENS,
          responseMimeType: 'application/json',
        },
      }),
    },
  )
  if (!response.ok) return null
  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim()
  const parsed = parseJson(text)
  return parsed ? { chapter: parsed, model } : null
}

async function callOpenAI(body: ContinueBody): Promise<{ chapter: unknown; model: string } | null> {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.95,
      max_tokens: MAX_BODY_TOKENS,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            '당신은 한국 웹소설 연재 작가입니다. 주어진 인물·세계관·직전 화를 그대로 이어 다음 화를 쓰고, 요청한 JSON만 출력하세요.',
        },
        { role: 'user', content: buildPrompt(body) },
      ],
    }),
  })
  if (!response.ok) return null
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
  const parsed = parseJson(data.choices?.[0]?.message?.content ?? '')
  return parsed ? { chapter: parsed, model } : null
}

function parseJson(text: string): unknown {
  if (!text) return null
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  try {
    const value = JSON.parse(cleaned) as { chapter?: unknown }
    return value.chapter ?? value
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start < 0 || end <= start) return null
    try {
      const value = JSON.parse(cleaned.slice(start, end + 1)) as { chapter?: unknown }
      return value.chapter ?? value
    } catch {
      return null
    }
  }
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

  let body: ContinueBody = {}
  try {
    body = await new Promise<ContinueBody>((resolve, reject) => {
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
          resolve(raw ? (JSON.parse(raw) as ContinueBody) : {})
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
      response.status(200).json({ chapter: gemini.chapter, model: gemini.model })
      return
    }
    const openai = await callOpenAI(body)
    if (openai) {
      response.status(200).json({ chapter: openai.chapter, model: openai.model })
      return
    }
    response.status(200).json({ chapter: null, model: 'offline' })
  } catch {
    response.status(200).json({ chapter: null, model: 'offline' })
  }
}
