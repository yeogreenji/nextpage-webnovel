import { ALL_FLOWS } from '../src/data/flows'
import { buildFinale, emptySession, leadOf, pickChoice } from '../src/lib/play'
let bad = 0
for (const f of ALL_FLOWS) {
  f.scenes.forEach((s, i) => {
    if (i > 0 && (!s.lead || !s.lead.A.length || !s.lead.B.length)) { console.log('NO LEAD', s.id); bad++ }
    const all = [...s.body, ...s.choices.flatMap((c) => c.result), ...(s.lead ? [...s.lead.A, ...s.lead.B] : [])]
    all.forEach((t) => { if (/"/.test(t)) { console.log('STRAIGHT QUOTE', s.id, t.slice(0, 40)); bad++ } })
  })
  // 64 paths
  for (let m = 0; m < 64; m++) {
    let ses = emptySession(f.novelId)
    f.scenes.forEach((s, i) => {
      const tone = (m >> i) & 1 ? 'B' : 'A'
      const c = s.choices.find((x) => x.tone === tone)!
      ses = pickChoice(f, ses, s.id, c.id)
    })
    const fin = buildFinale(f, ses)
    if (!fin) { console.log('NO FINALE', f.novelId, m); bad++ }
    f.scenes.forEach((_, i) => { if (i > 0 && leadOf(f, ses, i).length === 0) { console.log('EMPTY LEAD', f.novelId, i, m); bad++ } })
  }
}
console.log(bad === 0 ? 'ALL OK' : 'ISSUES ' + bad)
