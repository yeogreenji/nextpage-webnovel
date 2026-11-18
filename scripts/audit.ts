import { existsSync } from 'node:fs'
import { buildSeed } from '../src/data/seed'
import { attachArt } from '../src/data/art'
import { ALL_FLOWS } from '../src/data/flows'

const raw = buildSeed(Date.now())
const art = attachArt(raw.novels, raw.episodes)
const seed = { ...raw, novels: art.novels, episodes: art.episodes }
const pub = (p?: string) => (p ? existsSync('public' + (p.startsWith('/') ? p : '/' + p)) : false)
const len = (a: string[]) => a.join('').length
const out: string[] = []
const warn = (s: string) => out.push('  ! ' + s)

console.log(`novels ${seed.novels.length} · episodes ${seed.episodes.length} · comments ${seed.comments.length} · flows ${ALL_FLOWS.length}`)
for (const n of seed.novels) {
  const eps = seed.episodes.filter((e) => e.novelId === n.id)
  const pub_ = eps.filter((e) => e.status === 'published')
  const pend = eps.filter((e) => e.status === 'pending')
  const dead = eps.flatMap((e) => e.choices.filter((c) => !c.targetEpisodeId).map((c) => `${e.no}화:${c.label}`))
  const avg = Math.round(pub_.reduce((s, e) => s + e.body.length, 0) / Math.max(1, pub_.length))
  const short = pub_.filter((e) => e.body.length < 700).map((e) => `${e.no}화(${e.body.length})`)
  const cm = seed.comments.filter((c) => c.novelId === n.id).length
  const chars = n.characters ?? []
  const flow = ALL_FLOWS.find((f) => f.novelId === n.id)
  console.log(`\n[${n.id}] ${n.title} · ${n.genres.join('/')} · ${n.status}`)
  console.log(`  eps ${eps.length} (pub ${pub_.length}, pending ${pend.length}) avgLen ${avg} · chars ${chars.length} · comments ${cm}`)
  console.log(`  synopsis ${n.synopsis.length}자 · tagline ${n.tagline.length}자 · cover ${pub(n.coverImage)} hero ${pub(n.heroImage)}`)
  if (!n.coverImage || !pub(n.coverImage)) warn('표지 이미지 없음')
  if (!n.heroImage || !pub(n.heroImage)) warn('히어로 이미지 없음')
  if (n.synopsis.length < 80) warn('시놉시스 짧음')
  if (chars.length < 4) warn(`인물 ${chars.length}명`)
  for (const c of chars) if (!c.image || !pub(c.image)) warn(`인물 이미지 없음: ${c.name}`)
  if (dead.length) warn(`집필 중 분기 ${dead.length}개: ${dead.slice(0, 3).join(' | ')}`)
  if (short.length) warn(`짧은 회차 ${short.join(', ')}`)
  if (cm < 3) warn(`댓글 ${cm}개`)
  if (!flow) warn('인터랙티브 흐름 없음')
  else {
    const sb = flow.scenes.map((s) => len(s.body))
    const res = flow.scenes.flatMap((s) => s.choices.map((c) => len(c.result)))
    const eb = flow.endings.map((e) => len(e.body))
    console.log(`  flow scenes ${flow.scenes.length} bodyLen ${Math.min(...sb)}-${Math.max(...sb)} resultLen ${Math.min(...res)}-${Math.max(...res)} endings ${flow.endings.length} endLen ${Math.min(...eb)}-${Math.max(...eb)} total ${sb.reduce((a, b) => a + b, 0) + res.reduce((a, b) => a + b, 0) + eb.reduce((a, b) => a + b, 0)}`)
    for (const s of flow.scenes) {
      if (s.image && !pub(s.image)) warn(`장면 이미지 없음 ${s.id}`)
      if (!s.image) warn(`장면 이미지 미지정 ${s.id}`)
    }
    if (flow.scenes.some((s) => s.choices.length < 3 || s.choices.length > 4)) warn('갈래 수가 3~4가 아닌 장면')
    if (flow.endings.length !== 3) warn(`엔딩 ${flow.endings.length}개`)
  }
  console.log(out.splice(0).join('\n') || '  ok')
}
