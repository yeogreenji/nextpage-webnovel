import { ALL_FLOWS } from '../src/data/flows'
import { buildFinale, emptySession, leadOf, pickChoice } from '../src/lib/play'

/**
 * 인터랙티브 소설 데이터 점검.
 * — 25작품 · 6장면 · 3~4갈래 · 3엔딩
 * — 마지막이 아닌 장면의 모든 갈래는 다음 장면으로 이어지는 이음 문단을 가진다
 *   (갈래에 직접 붙은 lead 또는 다음 장면의 결별 lead)
 * — 직선 따옴표·톤 오류·결과 없는 갈래가 없다
 */
let bad = 0
const fail = (message: string) => {
  console.log('✗', message)
  bad += 1
}

for (const flow of ALL_FLOWS) {
  if (flow.scenes.length !== 6) fail(`${flow.novelId}: 장면 ${flow.scenes.length}`)
  if (flow.endings.map((ending) => ending.tone).sort().join('') !== 'ABC') {
    fail(`${flow.novelId}: 엔딩 ${flow.endings.map((ending) => ending.tone).join('')}`)
  }

  flow.scenes.forEach((scene, index) => {
    if (scene.choices.length < 3 || scene.choices.length > 4) {
      fail(`${scene.id}: 선택지 ${scene.choices.length}`)
    }
    const texts = [
      ...scene.body,
      ...scene.choices.flatMap((choice) => [...choice.result, ...(choice.lead ?? [])]),
    ]
    texts.forEach((text) => {
      if (text.includes('"')) fail(`${scene.id}: 직선 따옴표`)
    })

    const next = flow.scenes[index + 1]
    scene.choices.forEach((choice) => {
      if (choice.result.length === 0) fail(`${choice.id}: 결과 없음`)
      if (index < flow.scenes.length - 1) {
        if (choice.tone === 'C') fail(`${choice.id}: 마지막이 아닌 장면에 C`)
        const ownLead = (choice.lead?.length ?? 0) > 0
        const toneLead = (next?.lead?.[choice.tone]?.length ?? 0) > 0
        if (!ownLead && !toneLead) fail(`${choice.id}: 이음 문단 없음`)
      }
    })
  })

  // 표본 경로 — 갈래를 하나씩 바꿔 가며 이음 문단과 완성본을 확인
  for (let m = 0; m < 4; m += 1) {
    let session = emptySession(flow.novelId)
    flow.scenes.forEach((scene, index) => {
      const choice = scene.choices[index === flow.scenes.length - 1 ? m % scene.choices.length : m % scene.choices.length]
      session = pickChoice(flow, session, scene.id, choice.id)
    })
    if (!buildFinale(flow, session)) fail(`${flow.novelId}: 완성본 없음 (${m})`)
    flow.scenes.forEach((_, index) => {
      if (index > 0 && leadOf(flow, session, index).length === 0) {
        fail(`${flow.novelId}: 이음 문단 비어 있음 (${index}장, ${m})`)
      }
    })
  }
}

console.log(bad === 0 ? 'ALL OK' : `ISSUES ${bad}`)
