/**
 * 스토리라인 전수 감사 스크립트.
 * — 25작품의 모든 회차·선택지·분기·인물 흐름을 그래프로 세우고,
 *   끊긴 갈래·고아 회차·순환·도달 불가·연속성(인물명·시점·따옴표·문장 중복)을 검사합니다.
 * — 결과는 사람이 읽을 수 있는 형태로 stdout 에 찍습니다.
 *
 *   npx esbuild scripts/story-audit.ts --bundle --platform=node --format=esm --outfile=scripts/.audit.mjs --log-level=error \
 *     --define:import.meta.env.BASE_URL='"./"' && node scripts/.audit.mjs
 */
import { buildSeed } from '../src/data/seed'
import { attachArt } from '../src/data/art'
import { ALL_FLOWS } from '../src/data/flows'
import { presentCast, povIdOf } from '../src/lib/cast'
import { SERIAL_BEATS } from '../src/data/flows/longform/beats'
import type { Episode, Novel, StoryFlow } from '../src/types'

const raw = buildSeed(Date.now())
const art = attachArt(raw.novels, raw.episodes)
const novels: Novel[] = art.novels
const episodes: Episode[] = art.episodes

const problems: { level: 'error' | 'warn' | 'info'; where: string; detail: string }[] = []
const err = (where: string, detail: string) => problems.push({ level: 'error', where, detail })
const warn = (where: string, detail: string) => problems.push({ level: 'warn', where, detail })
const info = (where: string, detail: string) => problems.push({ level: 'info', where, detail })

/* ───────────────────────── 인덱스 ───────────────────────── */

const novelById = new Map(novels.map((n) => [n.id, n]))
const epById = new Map<string, Episode>()
const dupeEpisodeIds: string[] = []
const dupeNovelIds: string[] = []
for (const n of novels) if (novels.filter((x) => x.id === n.id).length > 1) dupeNovelIds.push(n.id)
for (const ep of episodes) {
  if (epById.has(ep.id)) dupeEpisodeIds.push(ep.id)
  else epById.set(ep.id, ep)
}
const epsOf = (novelId: string) => episodes.filter((e) => e.novelId === novelId)

if (dupeNovelIds.length) err('전체', `중복 작품 id: ${[...new Set(dupeNovelIds)].join(', ')}`)
if (dupeEpisodeIds.length) err('전체', `중복 회차 id: ${[...new Set(dupeEpisodeIds)].join(', ')}`)

/* ───────────────────────── 회차 그래프 ───────────────────────── */

interface GraphStat {
  reachable: Set<string>
  cycles: string[][]
}

function walkGraph(novel: Novel): GraphStat {
  const start = epById.get(novel.startEpisodeId)
  const reachable = new Set<string>()
  const cycles: string[][] = []
  const state = new Map<string, 0 | 1 | 2>()
  const stack: string[] = []

  const visit = (id: string) => {
    const ep = epById.get(id)
    if (!ep) return
    const st = state.get(id) ?? 0
    if (st === 1) {
      const at = stack.indexOf(id)
      cycles.push([...stack.slice(at), id])
      return
    }
    if (st === 2) return
    state.set(id, 1)
    stack.push(id)
    reachable.add(id)
    for (const c of ep.choices) if (c.targetEpisodeId) visit(c.targetEpisodeId)
    stack.pop()
    state.set(id, 2)
  }
  if (start) visit(start.id)
  return { reachable, cycles }
}

const graphStats = new Map<string, GraphStat>()
const episodeParagraphs = new Map<string, Map<string, string[]>>() // paragraph -> episode ids

for (const n of novels) {
  const eps = epsOf(n.id)
  if (!eps.length) {
    err(n.id, '회차가 하나도 없습니다')
    continue
  }
  const start = epById.get(n.startEpisodeId)
  if (!start) err(n.id, `startEpisodeId(${n.startEpisodeId}) 가 존재하지 않습니다`)
  else if (start.novelId !== n.id) err(n.id, `startEpisodeId 가 다른 작품 소속입니다: ${start.id}(${start.novelId})`)

  // 회차 번호는 갈래마다 같은 번호를 씁니다(2화 A/B). 그래서 번호 중복은 오류가 아닙니다.
  // 선택지 목표
  const children = new Map<string, string[]>()
  for (const ep of eps) {
    for (const c of ep.choices) {
      if (!c.targetEpisodeId) {
        if (ep.status === 'published' && ep.choices.every((x) => !x.targetEpisodeId)) {
          // 갈래가 모두 집필 중이면 루트 미완결
        }
        continue
      }
      const t = epById.get(c.targetEpisodeId)
      if (!t) {
        err(n.id, `${ep.id} '${c.label}' → 없는 회차 ${c.targetEpisodeId}`)
        continue
      }
      if (t.novelId !== n.id) err(n.id, `${ep.id} '${c.label}' → 다른 작품 회차 ${t.id}(${t.novelId})`)
      children.set(ep.id, [...(children.get(ep.id) ?? []), t.id])
      // 자식의 부모 표기 일치
      if (t.parentEpisodeId !== ep.id) {
        warn(n.id, `${t.id} 의 parentEpisodeId(${t.parentEpisodeId}) 가 실제 부모(${ep.id}) 와 다릅니다`)
      }
      if (t.branchLabel && t.branchLabel !== c.label) {
        warn(n.id, `${t.id} 의 branchLabel('${t.branchLabel}') 이 선택지 문구('${c.label}') 와 다릅니다`)
      }
    }
  }

  // 부모가 가리키는 실제 부모 검증
  for (const ep of eps) {
    if (!ep.parentEpisodeId) continue
    const p = epById.get(ep.parentEpisodeId)
    if (!p) err(n.id, `${ep.id} 의 부모 ${ep.parentEpisodeId} 가 없습니다`)
    else if (!p.choices.some((c) => c.targetEpisodeId === ep.id)) {
      err(n.id, `${ep.id} 의 부모 ${p.id} 에 이 회차로 오는 선택지가 없습니다`)
    }
  }

  const stat = walkGraph(n)
  graphStats.set(n.id, stat)
  if (stat.cycles.length) err(n.id, `분기 순환: ${stat.cycles.map((c) => c.join(' → ')).join(' / ')}`)

  for (const ep of eps) {
    if (!stat.reachable.has(ep.id)) err(n.id, `도달 불가 회차: ${ep.id} (${ep.no}화 ${ep.title})`)
  }

  // 막다른 갈래: 선택지는 있는데 전부 집필 중 → 독자가 다음 화로 못 감
  for (const ep of eps) {
    if (!ep.choices.length) continue
    const alive = ep.choices.filter((c) => c.targetEpisodeId)
    if (!alive.length) err(n.id, `${ep.id}(${ep.no}화) 선택지 ${ep.choices.length}개가 모두 집필 중(null)`)
  }

  // 발행 회차인데 선택지 없음 = 루트 마지막 화. 자식이 있으면 모순.
  for (const ep of eps) {
    if (ep.status === 'published' && !ep.choices.length && (children.size && children.get(ep.id)?.length)) {
      err(n.id, `${ep.id} 는 선택지가 없는데 자식 회차가 있습니다`)
    }
  }

  // 본문 검사
  for (const ep of eps) {
    const body = ep.body
    if (!body.trim()) {
      err(n.id, `${ep.id} 본문이 비어 있습니다`)
      continue
    }
    const paras = body.split('\n\n')
    if (paras.some((p) => !p.trim())) warn(n.id, `${ep.id} 빈 문단이 있습니다`)
    if (ep.status === 'published' && body.replace(/\s/g, '').length < 600) {
      warn(n.id, `${ep.id}(${ep.no}화) 본문 짧음 ${body.replace(/\s/g, '').length}자`)
    }
    for (const p of paras) {
      const key = p.replace(/\s+/g, ' ').trim()
      if (key.length < 40) continue
      if (!episodeParagraphs.has(key)) episodeParagraphs.set(key, new Map())
      episodeParagraphs.get(key)!.set(ep.id, n.id)
    }
    // 곧은 따옴표
    if (/"|'(?![^']*')/.test(body) && /["]/.test(body)) warn(n.id, `${ep.id} 본문에 곧은 따옴표(")가 남아 있습니다`)
    // 문장이 끊긴 채 끝남
    const last = paras[paras.length - 1].trim()
    if (ep.status === 'published' && !/[.!?…”’"'」』)\]]$/.test(last)) {
      warn(n.id, `${ep.id} 마지막 문단이 문장부호 없이 끝납니다: …${last.slice(-24)}`)
    }
    if (/[—–-]$/.test(last) || /[…]$/.test(last)) {
      info(n.id, `${ep.id} 마지막 문단이 여운형으로 끝납니다: …${last.slice(-24)}`)
    }
    // 시점 섞임: 한 회차 안에서 3인칭 인물 서술과 1인칭 서술이 반반
    const first = (body.match(/(^|[^가-힣])(나는|내가|내 |나를|나의)/g) ?? []).length
    const third = (body.match(/(은|는|이|가) [가-힣]{2,}/g) ?? []).length
    if (first > 6 && third > first * 2.2) info(n.id, `${ep.id} 1인칭/3인칭 서술 비율 확인 필요 (1인칭 ${first} / 3인칭 ${third})`)
  }
}

// 문단 복붙(회차 간)
for (const [para, map] of episodeParagraphs) {
  if (map.size < 2) continue
  const entries = [...map.entries()]
  const novelSet = new Set(entries.map(([, nid]) => nid))
  if (novelSet.size > 1) {
    warn('전체', `다른 작품 회차에 같은 문단: ${entries.map(([id, nid]) => `${nid}/${id}`).join(', ')} → "${para.slice(0, 40)}…"`)
  } else {
    warn(entries[0][1], `같은 작품 여러 회차에 같은 문단: ${entries.map(([id]) => id).join(', ')} → "${para.slice(0, 40)}…"`)
  }
}

/* ───────────────────────── 인물·연속성 ───────────────────────── */

const allNames = new Map<string, string[]>() // 이름 -> [novelId]
for (const n of novels) for (const c of n.characters ?? []) allNames.set(c.name, [...(allNames.get(c.name) ?? []), n.id])

for (const n of novels) {
  const chars = n.characters ?? []
  if (chars.length < 3) warn(n.id, `인물 카드 ${chars.length}명`)
  const ids = new Set<string>()
  for (const c of chars) {
    if (ids.has(c.id)) err(n.id, `인물 id 중복: ${c.id}`)
    ids.add(c.id)
    if (!c.quote?.trim()) warn(n.id, `${c.name} 대표 대사 없음`)
  }
  const body = epsOf(n.id).map((e) => e.body).join('\n')
  // 다른 작품 인물 이름이 본문에 등장 (이 작품 인물 이름의 일부인 경우는 제외)
  for (const [name, owners] of allNames) {
    if (owners.includes(n.id)) continue
    if (chars.some((c) => c.name.includes(name))) continue
    const count = (body.match(new RegExp(`(^|[^가-힣])${name}`, 'g')) ?? []).length
    if (count >= 2) warn(n.id, `다른 작품 인물 이름 '${name}' 이(가) 본문에 ${count}회 등장`)
  }
  // 시놉시스에 인물 이름이 본문과 다르게? (인물 카드 이름이 시놉시스에 없음) — info
  const start = epById.get(n.startEpisodeId)
  if (start && !start.branchLabel) {
    const firstPara = start.body.split('\n\n')[0]
    if (!firstPara.trim()) err(n.id, `${start.id} 첫 문단이 비었습니다`)
  }
}

/* ───────────────────────── 선택지 ↔ 다음 회차 이음 ───────────────────────── */

/* ───────────────────────── 인터랙티브 흐름 ───────────────────────── */

const flowByNovel = new Map<string, StoryFlow>()
for (const f of ALL_FLOWS) {
  if (flowByNovel.has(f.novelId)) err(f.novelId, '인터랙티브 흐름이 2개 이상')
  flowByNovel.set(f.novelId, f)
  const n = novelById.get(f.novelId)
  if (!n) {
    err(f.novelId, '작품이 없는 흐름')
    continue
  }
  const charIds = new Set((n.characters ?? []).map((c) => c.id))
  if (f.scenes.length < 3) err(f.novelId, `장면 ${f.scenes.length}개`)
  if (!f.structure?.trim()) warn(f.novelId, 'structure 문구 없음')
  // 장편 아크 — 20화 이상이면 부 구분이 있어야 하고, 부는 화 번호를 빈틈없이 덮어야 합니다.
  if (f.scenes.length >= 20) {
    if (!f.parts || f.parts.length < 2) err(f.novelId, '장편 아크인데 부(part) 구분이 없습니다')
    else {
      let cursor = 1
      for (const part of f.parts) {
        if (part.from !== cursor) err(f.novelId, `부 '${part.title}' 시작 화 ${part.from} (기대 ${cursor})`)
        if (part.to < part.from) err(f.novelId, `부 '${part.title}' 범위 ${part.from}~${part.to}`)
        if (!part.title?.trim() || !part.kicker?.trim()) warn(f.novelId, `부 '${part.title}' 제목/설명 없음`)
        cursor = part.to + 1
      }
      if (cursor !== f.scenes.length + 1) {
        err(f.novelId, `부 구분이 마지막 화(${f.scenes.length})까지 닿지 않습니다 (${cursor - 1}화에서 끝남)`)
      }
    }
    if (!f.serial || f.serial.beats.length < 4) err(f.novelId, '장편 이어쓰기 씨앗(serial.beats)이 부족합니다')
    if (f.serial && f.serial.premise.length < 2) warn(f.novelId, '이어쓰기 세계관(premise)이 부족합니다')
  } else if (!f.serial && !SERIAL_BEATS[f.novelId] && f.scenes.length >= 6) {
    info(f.novelId, `정적 아크 ${f.scenes.length}화 — 이어쓰기 씨앗은 기본값을 씁니다`)
  }

  // 서술자(독자의 화자)는 대화 상대가 아니므로, 본문에 이름이 나와도 경고하지 않습니다.
  const povId = povIdOf(n)
  const povIds = new Set<string>(povId ? [povId] : [])

  const sceneIds = new Set<string>()
  const titles = new Map<string, number>()
  f.scenes.forEach((s, i) => {
    if (sceneIds.has(s.id)) err(f.novelId, `장면 id 중복 ${s.id}`)
    sceneIds.add(s.id)
    if (s.no !== i + 1) warn(f.novelId, `${s.id} 장면 번호 ${s.no} (순서 ${i + 1})`)
    titles.set(s.title, (titles.get(s.title) ?? 0) + 1)
    if (!s.place?.trim()) warn(f.novelId, `${s.id} place 없음`)
    if (!s.body?.length) err(f.novelId, `${s.id} 본문 없음`)
    const bodyText = (s.body ?? []).join(' ').replace(/\s/g, '')
    if (bodyText.length < 150) warn(f.novelId, `${s.id} 본문 짧음 ${bodyText.length}자`)
    if (s.choices.length < 2 || s.choices.length > 4) err(f.novelId, `${s.id} 선택지 ${s.choices.length}개`)
    if (!charIds.has(s.speakerId)) err(f.novelId, `${s.id} speakerId(${s.speakerId}) 가 인물 카드에 없음`)
    // 이 화에 실제로 있는 사람 — 말을 거는 상대도, 대화 상대로 열리는 사람도 여기서만 나옵니다.
    const present = presentCast(n, s)
    const presentIds = new Set(present.map((c) => c.id))
    if (present.length === 0) err(f.novelId, `${s.id} 이 화에 있는 인물이 한 명도 없습니다`)
    if (!presentIds.has(s.speakerId)) err(f.novelId, `${s.id} 말을 거는 인물(${s.speakerId})이 이 화에 없습니다`)
    if (s.cast) {
      if (s.cast.length === 0) err(f.novelId, `${s.id} cast 가 비어 있습니다`)
      for (const id of s.cast) {
        const who = (n.characters ?? []).find((c) => c.id === id)
        if (!who) err(f.novelId, `${s.id} cast 에 없는 인물 id ${id}`)
        else if (!presentIds.has(id)) err(f.novelId, `${s.id} cast 의 ${who.name} 이(가) 이 화에 없습니다`)
      }
    }    const sceneText = [s.title, s.place, ...(s.body ?? [])].join(' ')
    const actionText = s.interaction?.action ?? ''
    const promptText = [s.interaction?.cue ?? '', ...(s.interaction?.prompts ?? [])].join(' ')
    for (const other of n.characters ?? []) {
      if (presentIds.has(other.id) || povIds.has(other.id)) continue
      const tokens = [other.name.replace(/\s+/g, ' '), other.name.split(' ')[0]]
      if (tokens.some((token) => token.length >= 2 && actionText.includes(token))) {
        err(f.novelId, `${s.id} 말 걸기 행동 지문이 이 화에 없는 ${other.name} 을(를) 부릅니다`)
      }
      if (tokens.some((token) => token.length >= 2 && promptText.includes(token))) {
        warn(f.novelId, `${s.id} 힌트가 이 화에 없는 ${other.name} 을(를) 언급합니다`)
      }
      if (tokens.some((token) => token.length >= 3 && sceneText.includes(token))) {
        warn(f.novelId, `${s.id} 이 화에 없는 ${other.name} 이름이 본문에 나옵니다`)
      }
    }
    // 말 걸기 지점
    if (s.interaction) {
      const it = s.interaction
      if (it.after < 0 || it.after >= (s.body?.length ?? 0)) err(f.novelId, `${s.id} interaction.after(${it.after}) 범위 밖`)
      if (!it.cue?.trim()) warn(f.novelId, `${s.id} interaction.cue 없음`)
      if ((it.prompts?.length ?? 0) < 2) warn(f.novelId, `${s.id} 추천 대사 ${it.prompts?.length ?? 0}개`)
      if (!it.action?.includes('{name}')) warn(f.novelId, `${s.id} interaction.action 에 {name} 없음`)
    }
    // 선택지
    const choiceIds = new Set<string>()
    for (const c of s.choices) {
      if (choiceIds.has(c.id)) err(f.novelId, `${s.id} 선택지 id 중복 ${c.id}`)
      choiceIds.add(c.id)
      if (!c.label?.trim()) err(f.novelId, `${s.id} ${c.id} 선택지 문구 없음`)
      if (!c.result?.length) err(f.novelId, `${s.id} ${c.id} result 없음`)
      if (!c.hint?.trim()) warn(f.novelId, `${s.id} ${c.id} hint 없음`)
      if (!['A', 'B', 'C'].includes(c.tone)) err(f.novelId, `${s.id} ${c.id} tone 이상 ${c.tone}`)
      if (c.lead && !c.lead.length) warn(f.novelId, `${s.id} ${c.id} 빈 lead`)
      const resultText = (c.result ?? []).join('').replace(/\s/g, '')
      if (resultText && resultText.length < 40) warn(f.novelId, `${s.id} ${c.id} 결과 문단 짧음 ${resultText.length}자`)
    }
    // 장면 lead 키
    for (const k of Object.keys(s.lead ?? {})) {
      if (!['A', 'B', 'C'].includes(k)) err(f.novelId, `${s.id} scene.lead 키 이상 ${k}`)
    }
    // 마지막 장면 tone 요건
    const tones = new Set(s.choices.map((c) => c.tone))
    if (i < f.scenes.length - 1) {
      if (!tones.has('A') || !tones.has('B')) warn(f.novelId, `${s.id} A/B 결이 모두 있지 않음 (${[...tones].join('')})`)
    } else {
      for (const tone of f.endings.map((e) => e.tone)) {
        if (!tones.has(tone)) warn(f.novelId, `마지막 장면 ${s.id} 에 ${tone} 결 선택지가 없는데 ${tone} 엔딩이 있음`)
      }
    }
  })
  for (const [title, count] of titles) if (count > 1) warn(f.novelId, `장면 제목 중복 '${title}' x${count}`)

  // 엔딩
  if (f.endings.length !== 3) warn(f.novelId, `엔딩 ${f.endings.length}개`)
  const tones = new Set(f.endings.map((e) => e.tone))
  for (const t of ['A', 'B', 'C'] as const) if (!tones.has(t)) warn(f.novelId, `엔딩 결 ${t} 없음`)
  const toneCount = new Map<string, number>()
  for (const e of f.endings) {
    toneCount.set(e.tone, (toneCount.get(e.tone) ?? 0) + 1)
    if (!e.name?.trim()) err(f.novelId, `${e.id} 엔딩 이름 없음`)
    if (!e.kicker?.trim()) warn(f.novelId, `${e.id} 엔딩 kicker 없음`)
    if (!e.body?.length) err(f.novelId, `${e.id} 엔딩 본문 없음`)
    const len = (e.body ?? []).join('').replace(/\s/g, '').length
    if (len < 120) warn(f.novelId, `${e.id} 엔딩 본문 짧음 ${len}자`)
  }
  for (const [t, c] of toneCount) if (c > 1) err(f.novelId, `엔딩 결 ${t} 가 ${c}개`)
  const endingNames = new Set(f.endings.map((e) => e.name))
  if (endingNames.size !== f.endings.length) warn(f.novelId, '엔딩 이름 중복')

  // 마지막 장면 선택지의 tone 별 엔딩 존재
  const last = f.scenes[f.scenes.length - 1]
  if (last) {
    for (const c of last.choices) {
      if (!f.endings.some((e) => e.tone === c.tone)) err(f.novelId, `마지막 장면 ${c.id}(${c.tone}) 에 닿을 엔딩이 없음`)
    }
  }

  // 결(tone) 중복 — 같은 결의 선택지가 둘이면 이음 문단(lead)이 어느 쪽 행동인지 알 수 없습니다.
  f.scenes.forEach((s) => {
    const tones = s.choices.map((c) => c.tone)
    const dup = tones.filter((t, i) => tones.indexOf(t) !== i)
    if (dup.length) info(f.novelId, `${s.id} 결(tone) 공유: ${s.choices.filter((c) => dup.includes(c.tone)).map((c) => `${c.id}(${c.tone})`).join(', ')}`)
  })

  // 이음 문단 누락 — 앞 장면에서 고를 수 있는 결인데, 다음 장면에 그 결의 이음이 없는 경우
  f.scenes.forEach((s, i) => {
    if (i === 0) return
    const prev = f.scenes[i - 1]
    const prevTones = new Set(prev.choices.map((c) => c.tone))
    for (const tone of ['A', 'B', 'C'] as const) {
      if (!prevTones.has(tone)) continue
      const sceneLead = s.lead?.[tone]
      const choiceLeads = prev.choices.filter((c) => c.tone === tone)
      const covered = choiceLeads.every((c) => (c.lead?.length ?? 0) > 0)
      if (!sceneLead?.length && !covered) warn(f.novelId, `${s.id} 에 ${tone} 결 이음 문단이 없음 (${prev.id} → ${s.id})`)
    }
  })

  // 말을 거는 인물이 장면에 실제로 있는지
  f.scenes.forEach((s) => {
    const present = presentCast(n, s)
    const speaker = present.find((c) => c.id === s.speakerId)
    if (!speaker) return
    const text = [...(s.body ?? []), ...s.choices.flatMap((c) => c.result ?? [])].join(' ')
    const names = new Set([speaker.name, ...speaker.name.split(/\s+/)])
    if (speaker.name.replace(/\s/g, '').length >= 3) names.add(speaker.name.slice(1))
    if ([...names].every((nm) => nm.length < 2)) return
    if (![...names].some((nm) => nm.length >= 2 && text.includes(nm))) {
      warn(f.novelId, `${s.id} 대화 상대 ${speaker.name} 이(가) 화 본문에 나오지 않음`)
    }
  })

  // 장면 제목·본문이 흐름 안에서 겹치는지
  const bodySeen = new Map<string, string>()
  f.scenes.forEach((s) => {
    for (const p of s.body ?? []) {
      const key = p.replace(/\s+/g, ' ').trim()
      if (key.length < 30) continue
      const prev = bodySeen.get(key)
      if (prev) warn(f.novelId, `${prev} 와 ${s.id} 에 같은 장면 문단`)
      else bodySeen.set(key, s.id)
    }
  })
}

for (const n of novels) if (!flowByNovel.has(n.id)) err(n.id, '인터랙티브 흐름 없음')

/* ───────────────────────── 힌트 복붙 검사 ───────────────────────── */

// 같은 추천 멘트가 여러 화·여러 작품에 복붙되면, 독자는 결국 아무것도 고르지 않게 됩니다.
const promptSeen = new Map<string, string[]>()
for (const f of ALL_FLOWS) {
  for (const s of f.scenes) {
    for (const prompt of s.interaction?.prompts ?? []) {
      const key = prompt.replace(/\s+/g, ' ').trim()
      if (key.length < 6) continue
      promptSeen.set(key, [...(promptSeen.get(key) ?? []), `${f.novelId}/${s.id}`])
    }
  }
}
for (const [prompt, where] of promptSeen) {
  if (where.length > 1) {
    warn('전체', `같은 추천 멘트가 ${where.length}곳에 복붙됨: ${where.join(', ')} → “${prompt.slice(0, 30)}…”`)
  }
}

/* ───────────────────────── 이어쓰기 씨앗 검사 ───────────────────────── */

for (const f of ALL_FLOWS) {
  const beats = f.serial?.beats ?? []
  const dupBeats = beats.filter((beat, index) => beats.indexOf(beat) !== index)
  if (dupBeats.length > 0) err(f.novelId, `이어쓰기 씨앗 중복: ${dupBeats[0]}`)
  if (f.parts) {
    const titles = f.parts.map((part) => part.title)
    if (new Set(titles).size !== titles.length) warn(f.novelId, '부 제목 중복')
  }
}

/* ───────────────────────── 장면 본문 복붙 (작품 간) ───────────────────────── */

const sceneParas = new Map<string, Set<string>>()
for (const f of ALL_FLOWS) {
  for (const s of f.scenes) {
    for (const p of s.body ?? []) {
      const key = p.replace(/\s+/g, ' ').trim()
      if (key.length < 40) continue
      if (!sceneParas.has(key)) sceneParas.set(key, new Set())
      sceneParas.get(key)!.add(f.novelId)
    }
  }
}
for (const [p, set] of sceneParas) if (set.size > 1) warn('전체', `여러 작품 흐름에 같은 장면 문단: ${[...set].join(', ')} → "${p.slice(0, 40)}…"`)

/* ───────────────────────── 리포트 ───────────────────────── */

const byNovel = new Map<string, typeof problems>()
for (const p of problems) byNovel.set(p.where, [...(byNovel.get(p.where) ?? []), p])

console.log(`작품 ${novels.length} · 회차 ${episodes.length} · 흐름 ${ALL_FLOWS.length} · 인물 ${novels.reduce((s, n) => s + (n.characters?.length ?? 0), 0)}`)
console.log(`오류 ${problems.filter((p) => p.level === 'error').length} · 경고 ${problems.filter((p) => p.level === 'warn').length} · 참고 ${problems.filter((p) => p.level === 'info').length}\n`)

const order = ['error', 'warn', 'info'] as const
for (const level of order) {
  const list = problems.filter((p) => p.level === level)
  if (!list.length) continue
  console.log(`\n=== ${level.toUpperCase()} (${list.length}) ===`)
  for (const [where, items] of byNovel) {
    const mine = items.filter((p) => p.level === level)
    if (!mine.length) continue
    const name = novelById.get(where)?.title ?? where
    console.log(`\n[${where}] ${name}`)
    for (const it of mine) console.log(`  - ${it.detail}`)
  }
}

/* 작품별 요약 */
console.log('\n=== 작품별 요약 ===')
for (const n of novels) {
  const eps = epsOf(n.id)
  const pub = eps.filter((e) => e.status === 'published')
  const pend = eps.filter((e) => e.status === 'pending')
  const reach = graphStats.get(n.id)?.reachable.size ?? 0
  const f = flowByNovel.get(n.id)
  const avg = Math.round(pub.reduce((s, e) => s + e.body.replace(/\s/g, '').length, 0) / Math.max(1, pub.length))
  const issues = problems.filter((p) => p.where === n.id)
  console.log(
    `${n.id.padEnd(16)} 회차 ${String(eps.length).padStart(3)} (발행 ${pub.length}/집필 ${pend.length}) 도달 ${reach} 평균 ${avg}자 · 흐름 ${f ? `${f.scenes.length}화/${f.parts?.length ?? 1}부/${f.endings.length}엔딩` : '없음'} · 문제 ${issues.length}`,
  )
}

process.exit(problems.some((p) => p.level === 'error') ? 1 : 0)
