import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ALL_FLOWS } from '../src/data/flows'
import { buildSeed } from '../src/data/seed'
import { attachArt } from '../src/data/art'
import {
  addAppliedLine,
  appliedFor,
  buildFinale,
  emptySession,
  interactionAnchorOf,
  leadOf,
  pickChoice,
  progressOf,
  resolveEnding,
} from '../src/lib/play'
import { interactionFor } from '../src/lib/interaction'
import {
  withAndParticle,
  withObjectParticle,
  withSubjectParticle,
  withTopicParticle,
} from '../src/lib/format'
import type { PlaySession, StoryFlow } from '../src/types'

/** 주어진 선택 인덱스들로 진행합니다. */
function playSteps(flow: StoryFlow, picks: number[]): PlaySession {
  let session: PlaySession = emptySession(flow.novelId)
  picks.forEach((pick, index) => {
    const scene = flow.scenes[index]
    session = pickChoice(flow, session, scene.id, scene.choices[pick % scene.choices.length].id)
  })
  return session
}

/** 마지막 장면만 바꿔 보는 표본 경로 — 3^6 전부 대신 앞선 선택을 몇 가지로 고정합니다. */
function samplePaths(flow: StoryFlow): number[][] {
  const patterns = [
    [0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
    [2, 1, 0, 2, 1],
    [1, 2, 2, 0, 2],
    [0, 2, 1, 1, 0],
    [2, 0, 2, 1, 2],
  ]
  const paths: number[][] = []
  for (const pattern of patterns) {
    flow.scenes[flow.scenes.length - 1].choices.forEach((_, lastIndex) => {
      paths.push([...pattern, lastIndex])
    })
  }
  return paths
}

describe('25작품 — 장면·갈래·엔딩 구조', () => {
  it('작품은 25편, 모두 여섯 장면에 3~4개의 갈래와 세 개의 엔딩을 가진다', () => {
    assert.equal(ALL_FLOWS.length, 25)
    for (const flow of ALL_FLOWS) {
      assert.equal(flow.scenes.length, 6, flow.novelId)
      for (const scene of flow.scenes) {
        assert.ok(
          scene.choices.length >= 3 && scene.choices.length <= 4,
          `${scene.id}: 선택지 ${scene.choices.length}`,
        )
      }
      assert.equal(flow.endings.map((ending) => ending.tone).sort().join(''), 'ABC', flow.novelId)
    }
  })

  it('마지막 장면에는 A·B·C 갈래가 하나씩 있다', () => {
    for (const flow of ALL_FLOWS) {
      const last = flow.scenes[5]
      assert.equal(last.choices.map((choice) => choice.tone).sort().join(''), 'ABC', last.id)
    }
  })

  it('모든 경로에서 엔딩의 결이 마지막 선택의 결과 같다', () => {
    const mismatches: string[] = []
    for (const flow of ALL_FLOWS) {
      for (const path of samplePaths(flow)) {
        const session = playSteps(flow, path)
        const lastPick = session.picks[session.picks.length - 1]
        const ending = resolveEnding(flow, session)
        if (!ending) {
          mismatches.push(`${flow.novelId} ${path.join('')} → 엔딩 없음`)
          continue
        }
        if (ending.tone !== lastPick.tone) {
          mismatches.push(`${flow.novelId} ${path.join('')} → ${lastPick.tone} / ${ending.tone}`)
        }
      }
    }
    assert.deepEqual(mismatches, [])
  })

  it('마지막 선택을 바꾸면 엔딩도 반드시 바뀐다', () => {
    for (const flow of ALL_FLOWS) {
      const paths = samplePaths(flow)
      const endings = paths.map((path) => resolveEnding(flow, playSteps(flow, path))?.id)
      const lastTones = paths.map((path) => path[5])
      const byTone = new Map<number, Set<string | undefined>>()
      lastTones.forEach((tone, index) => {
        const set = byTone.get(tone) ?? new Set<string | undefined>()
        set.add(endings[index])
        byTone.set(tone, set)
      })
      for (const [tone, ids] of byTone) {
        assert.equal(ids.size, 1, `${flow.novelId}: 마지막 ${tone}이 여러 엔딩`)
        const sample = [...ids][0]
        assert.ok(sample, `${flow.novelId}: 엔딩 없음`)
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

describe('이음 문단 — 선택 결과가 다음 장면 첫머리에 붙는다', () => {
  it('모든 선택에 이음 문단이 있다 (선택지별 또는 결별)', () => {
    const missing: string[] = []
    for (const flow of ALL_FLOWS) {
      flow.scenes.forEach((scene, index) => {
        if (index === flow.scenes.length - 1) return
        const next = flow.scenes[index + 1]
        for (const choice of scene.choices) {
          const own = (choice.lead?.length ?? 0) > 0
          const byTone = (next.lead?.[choice.tone]?.length ?? 0) > 0
          if (!own && !byTone) missing.push(`${choice.id}`)
        }
      })
    }
    assert.deepEqual(missing, [])
  })

  it('선택지별 이음 문단이 결별 이음 문단보다 먼저 쓰인다', () => {
    for (const flow of ALL_FLOWS) {
      const first = flow.scenes[0]
      const ownLead = first.choices.find((choice) => (choice.lead?.length ?? 0) > 0)
      if (!ownLead) continue
      const session = pickChoice(flow, emptySession(flow.novelId), first.id, ownLead.id)
      assert.deepEqual(leadOf(flow, session, 1), ownLead.lead)
    }
  })
})

describe('말 걸기 지점 — 장면 안에서만 열린다', () => {
  it('장면마다 추천 대사 4개와 행동 요약이 준비된다', () => {
    for (const flow of ALL_FLOWS) {
      for (const scene of flow.scenes) {
        const interaction = interactionFor(scene, { id: 'x', name: '서준', role: '', tag: '남주', quote: '' })
        assert.equal(interaction.prompts.length, 4, scene.id)
        assert.ok(interaction.cue.length > 10, scene.id)
        assert.ok(interaction.action.length > 5, scene.id)
        assert.equal(interaction.action.includes('{name}'), false, scene.id)
        const anchor = interactionAnchorOf(scene)
        assert.ok(anchor >= 0 && anchor < scene.body.length, scene.id)
      }
    }
  })

  it('말 건 행동 요약과 대사가 그 자리에, 완성본에서도 같은 순서로 들어간다', () => {
    const flow = ALL_FLOWS.find((item) => item.novelId === 'nv-secretary')
    assert.ok(flow)
    const scene = flow.scenes[1]
    let session = playSteps(flow, [0, 0, 0, 0, 0, 0])
    session = addAppliedLine(session, {
      sceneId: scene.id,
      characterId: 'ch-sec-iden',
      characterName: '강이든',
      kind: 'action',
      text: '나는 강이든에게 먼저 말을 걸었다.',
    })
    session = addAppliedLine(session, {
      sceneId: scene.id,
      characterId: 'ch-sec-iden',
      characterName: '강이든',
      kind: 'user',
      text: '왜 저를 남기시려 합니까?',
    })

    const finale = buildFinale(flow, session)
    assert.ok(finale)
    const chapter = finale.chapters[1]
    const kinds = chapter.blocks.map((block) => block.kind)
    const actionIndex = kinds.indexOf('action')
    const sayIndex = kinds.indexOf('say')
    assert.ok(actionIndex > -1 && sayIndex > -1)
    assert.equal(actionIndex < sayIndex, true)
    // 행동 요약은 대사 개수에 포함하지 않는다
    assert.equal(finale.stats.applied, 1)
  })
})

describe('티키타카 둘 다 넣기 — 두 줄이 모두 남는다', () => {
  it('같은 틱에 두 번 적용해도 내 대사와 캐릭터 대사가 모두 저장된다', () => {
    const flow = ALL_FLOWS.find((item) => item.novelId === 'nv-cafe')
    assert.ok(flow)
    const scene = flow.scenes[1]
    let session = playSteps(flow, [0, 0, 0, 0, 0, 0])

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
    assert.deepEqual(lines.map((line) => line.kind), ['user', 'character'])

    const finale = buildFinale(flow, session)
    assert.ok(finale)
    const chapter = finale.chapters.find((item) => item.id === scene.id)
    assert.ok(chapter)
    const says = chapter.blocks.filter((block) => block.kind === 'say')
    assert.equal(says.length, 2)
    assert.equal(says[0].mine, true)
    assert.equal(says[1].who, '명숙')
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

  it('모든 선택지에 결과 문단이 있고, 직선 따옴표가 없다', () => {
    const problems: string[] = []
    for (const flow of ALL_FLOWS) {
      for (const scene of flow.scenes) {
        if (scene.body.length < 3) problems.push(`${scene.id}: 본문 짧음`)
        for (const choice of scene.choices) {
          if (choice.result.length === 0) problems.push(`${choice.id}: 결과 없음`)
          if (choice.tone !== 'A' && choice.tone !== 'B' && choice.tone !== 'C') {
            problems.push(`${choice.id}: tone ${choice.tone}`)
          }
        }
        const texts = [
          ...scene.body,
          ...scene.choices.flatMap((choice) => [...choice.result, ...(choice.lead ?? [])]),
        ]
        texts.forEach((text) => {
          if (text.includes('"')) problems.push(`${scene.id}: 직선 따옴표`)
        })
      }
    }
    assert.deepEqual(problems, [])
  })

  it('작품마다 등장인물이 있고, 대화 인물 id가 작품 안에 있다', () => {
    const seed = buildSeed()
    const art = attachArt(seed.novels, seed.episodes)
    const characters = new Map(
      art.novels.map((novel) => [novel.id, new Set((novel.characters ?? []).map((item) => item.id))]),
    )
    const allIds = art.novels.flatMap((novel) => (novel.characters ?? []).map((item) => item.id))
    assert.equal(new Set(allIds).size, allIds.length, '등장인물 id가 작품을 넘어 겹칩니다')

    for (const flow of ALL_FLOWS) {
      const cast = characters.get(flow.novelId)
      assert.ok(cast && cast.size >= 3, `${flow.novelId}: 등장인물 부족`)
      for (const scene of flow.scenes) {
        assert.ok(cast?.has(scene.speakerId), `${scene.id}: ${scene.speakerId}`)
      }
    }
  })

  it('structure 문구가 실제 구조와 맞는다', () => {
    for (const flow of ALL_FLOWS) {
      assert.equal(flow.structure, '여섯 장면 · 장면마다 3~4개의 갈래 · 세 개의 엔딩')
    }
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
