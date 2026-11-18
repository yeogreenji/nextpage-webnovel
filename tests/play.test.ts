import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ALL_FLOWS } from '../src/data/flows'
import {
  addAppliedLine,
  appliedFor,
  buildFinale,
  emptySession,
  leadOf,
  pickChoice,
  progressOf,
  resolveEnding,
} from '../src/lib/play'
import {
  withAndParticle,
  withObjectParticle,
  withSubjectParticle,
  withTopicParticle,
} from '../src/lib/format'
import type { PlaySession, StoryFlow } from '../src/types'

/** 주어진 개수만큼 선택합니다 (0=A, 1=B). */
function playSteps(flow: StoryFlow, picks: number[]): PlaySession {
  let session: PlaySession = emptySession(flow.novelId)
  picks.forEach((pick, index) => {
    const scene = flow.scenes[index]
    session = pickChoice(flow, session, scene.id, scene.choices[pick].id)
  })
  return session
}

/** 6번의 양자택일 = 64경로 전부 */
function everyPath(): number[][] {
  const paths: number[][] = []
  for (let mask = 0; mask < 64; mask += 1) {
    paths.push(Array.from({ length: 6 }, (_, index) => (mask >> index) & 1))
  }
  return paths
}

describe('15작품 엔딩 판정 — 마지막 선택과 100% 일치', () => {
  it('작품마다 A·B 엔딩이 하나씩 있다', () => {
    assert.equal(ALL_FLOWS.length, 15)
    for (const flow of ALL_FLOWS) {
      assert.equal(flow.scenes.length, 6, flow.novelId)
      const tones = flow.endings.map((ending) => ending.tone).sort().join('')
      assert.equal(tones, 'AB', `${flow.novelId} endings: ${tones}`)
    }
  })

  it('64경로 전부에서 엔딩의 결이 마지막(6장) 선택의 결과 같다', () => {
    const mismatches: string[] = []
    for (const flow of ALL_FLOWS) {
      for (const path of everyPath()) {
        const session = playSteps(flow, path)
        const lastPick = session.picks[session.picks.length - 1]
        const ending = resolveEnding(flow, session)
        if (!ending) {
          mismatches.push(`${flow.novelId} ${path.join('')} → 엔딩 없음`)
          continue
        }
        if (ending.tone !== lastPick.tone) {
          mismatches.push(
            `${flow.novelId} ${path.join('')} → 마지막 ${lastPick.tone}인데 엔딩 ${ending.tone}`,
          )
        }
      }
    }
    assert.deepEqual(mismatches, [])
  })

  it('마지막 선택만 바꾸면 엔딩도 반드시 바뀐다', () => {
    for (const flow of ALL_FLOWS) {
      for (const path of everyPath().slice(0, 32)) {
        const withA = playSteps(flow, [...path.slice(0, 5), 0])
        const withB = playSteps(flow, [...path.slice(0, 5), 1])
        const endingA = resolveEnding(flow, withA)
        const endingB = resolveEnding(flow, withB)
        assert.notEqual(endingA?.id, endingB?.id, flow.novelId)
        assert.equal(endingA?.tone, 'A')
        assert.equal(endingB?.tone, 'B')
      }
    }
  })

  it('완성본의 엔딩도 같은 규칙을 따른다', () => {
    for (const flow of ALL_FLOWS) {
      for (const path of everyPath()) {
        const session = playSteps(flow, path)
        const finale = buildFinale(flow, session)
        assert.ok(finale, flow.novelId)
        assert.equal(finale?.ending.tone, session.picks[5].tone)
        assert.equal(finale?.stats.picks, 6)
      }
    }
  })

  it('6장 앞에서는 아직 엔딩이 정해지지 않는다', () => {
    for (const flow of ALL_FLOWS) {
      const session = playSteps(flow, [0, 0, 0, 0, 0])
      assert.equal(resolveEnding(flow, session), null)
      assert.equal(progressOf(flow, session).complete, false)
    }
  })
})

describe('이음 문단(lead) — 선택 결과가 다음 장면 첫머리에 붙는다', () => {
  it('2장부터 6장까지 A/B 이음 문단이 모두 있다', () => {
    const missing: string[] = []
    for (const flow of ALL_FLOWS) {
      assert.deepEqual(leadOf(flow, emptySession(flow.novelId), 0), [])
      flow.scenes.forEach((scene, index) => {
        if (index === 0) return
        if (!scene.lead?.A?.length || !scene.lead?.B?.length) missing.push(scene.id)
      })
    }
    assert.deepEqual(missing, [])
  })

  it('직전 선택의 결에 따라 다른 이음 문단이 붙는다', () => {
    for (const flow of ALL_FLOWS) {
      for (let index = 1; index < flow.scenes.length; index += 1) {
        const base = new Array(6).fill(0)
        const sessionA = playSteps(flow, base.map((_, i) => (i === index - 1 ? 0 : 0)))
        const sessionB = playSteps(flow, base.map((_, i) => (i === index - 1 ? 1 : 0)))
        const leadA = leadOf(flow, sessionA, index)
        const leadB = leadOf(flow, sessionB, index)
        assert.ok(leadA.length > 0, `${flow.novelId} ${index}A`)
        assert.ok(leadB.length > 0, `${flow.novelId} ${index}B`)
        assert.notEqual(leadA.join(''), leadB.join(''), `${flow.novelId} ${index}`)
      }
    }
  })
})

describe('티키타카 둘 다 넣기 — 두 줄이 모두 남는다', () => {
  it('같은 틱에 두 번 적용해도 내 대사와 캐릭터 대사가 모두 저장된다', () => {
    const flow = ALL_FLOWS.find((item) => item.novelId === 'nv-cafe')
    assert.ok(flow)
    const scene = flow.scenes[1]
    let session = playSteps(flow, [0, 0, 0, 0, 0, 0])

    // React 상태 함수형 업데이트와 같은 순서: 이전 상태를 받아 이어 붙입니다.
    session = addAppliedLine(session, {
      sceneId: scene.id,
      characterId: 'ch-myeongsuk',
      characterName: '명숙',
      kind: 'user',
      text: '할머니, 그 장부 아직 있어요?',
    })
    session = addAppliedLine(session, {
      sceneId: scene.id,
      characterId: 'ch-myeongsuk',
      characterName: '명숙',
      kind: 'character',
      text: '있지. 별이 안 붙은 이름이 아직 스물몇 개는 될 거야.',
    })

    const lines = appliedFor(session, scene.id)
    assert.equal(lines.length, 2)
    assert.deepEqual(
      lines.map((line) => line.kind),
      ['user', 'character'],
    )

    const finale = buildFinale(flow, session)
    assert.ok(finale)
    const chapter = finale.chapters.find((item) => item.id === scene.id)
    assert.ok(chapter)
    const says = chapter.blocks.filter((block) => block.kind === 'say')
    assert.equal(says.length, 2)
    assert.equal(says[0].mine, true)
    assert.equal(says[1].who, '명숙')
    assert.equal(finale.stats.applied, 2)
  })

  it('같은 대사를 두 번 넣으면 중복 저장되지 않는다', () => {
    const flow = ALL_FLOWS[0]
    const scene = flow.scenes[0]
    let session = playSteps(flow, [0, 0, 0, 0, 0, 0])
    const line = {
      sceneId: scene.id,
      characterId: 'x',
      characterName: '서준',
      kind: 'user' as const,
      text: '같은 대사',
    }
    session = addAppliedLine(session, line)
    session = addAppliedLine(session, line)
    assert.equal(appliedFor(session, scene.id).length, 1)
  })
})

describe('한국어 조사 — 받침으로 고른다', () => {
  it('은/는', () => {
    assert.equal(withTopicParticle('서준'), '서준은')
    assert.equal(withTopicParticle('유나'), '유나는')
    assert.equal(withTopicParticle('명숙'), '명숙은')
  })

  it('이/가', () => {
    assert.equal(withSubjectParticle('서준'), '서준이')
    assert.equal(withSubjectParticle('유나'), '유나가')
    assert.equal(withSubjectParticle('명숙'), '명숙이')
  })

  it('을/를', () => {
    assert.equal(withObjectParticle('정한결'), '정한결을')
    assert.equal(withObjectParticle('유나'), '유나를')
  })

  it('와/과', () => {
    assert.equal(withAndParticle('정한결'), '정한결과')
    assert.equal(withAndParticle('유나'), '유나와')
    assert.equal(withAndParticle('리아'), '리아와')
  })

  it('한글이 아닌 이름은 두 표기를 함께 쓴다', () => {
    assert.equal(withTopicParticle('A'), 'A은(는)')
    assert.equal(withSubjectParticle('B'), 'B이(가)')
    assert.equal(withAndParticle('C'), 'C과(와)')
    assert.equal(withObjectParticle('D'), 'D을(를)')
  })
})

describe('스토리 데이터 린트', () => {
  it('무협이 아닌 작품에 무협 지명(낙양)이 남아 있지 않다', () => {
    const offenders = ALL_FLOWS.filter((flow) => flow.novelId !== 'nv-murim')
      .filter((flow) => JSON.stringify(flow).includes('낙양'))
      .map((flow) => flow.novelId)
    assert.deepEqual(offenders, [])
  })

  it('모든 장면에 양자택일 두 개와 결과 문단이 있다', () => {
    const problems: string[] = []
    for (const flow of ALL_FLOWS) {
      for (const scene of flow.scenes) {
        if (scene.choices.length !== 2) problems.push(`${scene.id}: 선택지 ${scene.choices.length}`)
        for (const choice of scene.choices) {
          if (choice.result.length === 0) problems.push(`${choice.id}: 결과 없음`)
          if (choice.tone !== 'A' && choice.tone !== 'B') problems.push(`${choice.id}: tone ${choice.tone}`)
        }
        if (scene.body.length < 2) problems.push(`${scene.id}: 본문 짧음`)
      }
    }
    assert.deepEqual(problems, [])
  })

  it('structure 문구가 실제 엔딩 수와 맞는다', () => {
    for (const flow of ALL_FLOWS) {
      assert.equal(flow.structure, '여섯 번의 선택 · 두 개의 엔딩')
    }
    assert.equal(JSON.stringify(ALL_FLOWS).includes('mixed'), false)
  })

  it('소스에 이름+조사 하드코딩이 없다', () => {
    const files: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name)
        if (statSync(path).isDirectory()) walk(path)
        else if (/\.(ts|tsx)$/.test(name)) files.push(path)
      }
    }
    walk('src')
    const offenders: string[] = []
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      const matches = text.match(/(character|speaker|line)\.name\}[는은이가을를와과]|\$\{[^}]*\.name\}[는은이가을를와과]/g)
      if (matches) offenders.push(`${file}: ${matches.join(', ')}`)
    }
    assert.deepEqual(offenders, [])
  })
})
