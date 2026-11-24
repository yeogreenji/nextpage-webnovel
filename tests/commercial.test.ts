import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

/** localStorage 가 없는 실행(로직 검사 단독)에서도 돌도록 최소 DOM 을 준비합니다. */
if (typeof window === 'undefined') {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
  const define = (key: string, value: unknown) =>
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
  define('window', dom.window)
  define('document', dom.window.document)
  define('localStorage', dom.window.localStorage)
}

import { buildSeed } from '../src/data/seed'
import { ALL_FLOWS } from '../src/data/flows'
import { CURATIONS, MOODS, inCuration, inMood, moodsOf } from '../src/lib/genres'
import {
  clearEndings,
  clearReading,
  clearShelf,
  endingProgress,
  endingTotals,
  isOnShelf,
  recentReading,
  recordReading,
  shelfIds,
  toggleShelf,
  unlockEnding,
} from '../src/lib/library'
import { affinityOf, suggestReplies } from '../src/lib/chat'
import { DEFAULT_SETTINGS } from '../src/lib/repository'
import type { ChatMessage, Episode, Novel } from '../src/types'

const seed = buildSeed()

const WAVE_IDS = [
  'nv-secretary',
  'nv-nextdoor',
  'nv-younger',
  'nv-villainess',
  'nv-duchess',
  'nv-magetower',
  'nv-ex',
  'nv-ramen',
  'nv-ceo',
  'nv-academy-ta',
]

const waveEpisodes = (novelId: string): Episode[] => seed.episodes.filter((e) => e.novelId === novelId)

describe('신작 10편 — 상용 연재 분량과 완결된 분기', () => {
  it('모든 신작의 1화가 1,200자 이상이다', () => {
    for (const novelId of WAVE_IDS) {
      const first = waveEpisodes(novelId).find((episode) => episode.no === 1)
      assert.ok(first, `${novelId}: 1화 없음`)
      assert.ok(first!.body.length >= 1200, `${novelId} 1화 ${first!.body.length}자`)
    }
  })

  it('1화의 두 갈래가 모두 집필되어 있고, 마지막 화로 끝난다', () => {
    for (const novelId of WAVE_IDS) {
      const episodes = waveEpisodes(novelId)
      const first = episodes.find((episode) => episode.no === 1)!
      assert.equal(first.choices.length, 2, `${novelId}: 1화 갈래`)
      for (const choice of first.choices) {
        assert.ok(choice.targetEpisodeId, `${novelId}: 갈래 대상 없음 (${choice.label})`)
        const target = episodes.find((episode) => episode.id === choice.targetEpisodeId)
        assert.ok(target, `${novelId}: 갈래 대상 회차 없음`)
        assert.equal(target!.status, 'published', `${novelId}: 갈래 회차 미공개`)
        assert.ok(target!.body.length >= 900, `${novelId} ${target!.id} ${target!.body.length}자`)
        assert.equal(target!.parentEpisodeId, first.id, `${novelId}: 부모 회차`)
        assert.equal(target!.branchLabel, choice.label, `${novelId}: 갈래 이름`)
      }
    }
  })

  it('모든 회차의 갈래가 실제 회차를 가리키고, 집필 중으로 남은 갈래가 없다', () => {
    const dead: string[] = []
    for (const episode of seed.episodes) {
      for (const choice of episode.choices) {
        if (!choice.targetEpisodeId) {
          dead.push(`${episode.id}:${choice.label}`)
          continue
        }
        if (!seed.episodes.some((item) => item.id === choice.targetEpisodeId)) {
          dead.push(`${episode.id}:${choice.label} → 없는 회차`)
        }
      }
    }
    assert.deepEqual(dead, [])
  })

  it('신작 10편 모두 댓글이 3개 이상이다', () => {
    for (const novelId of WAVE_IDS) {
      const comments = seed.comments.filter((comment) => comment.novelId === novelId)
      assert.ok(comments.length >= 3, `${novelId}: 댓글 ${comments.length}`)
      // 댓글은 실제로 존재하는 회차에 달려 있어야 합니다.
      for (const comment of comments) {
        assert.ok(
          seed.episodes.some((episode) => episode.id === comment.episodeId),
          `${novelId}: 없는 회차 댓글 ${comment.episodeId}`,
        )
      }
    }
  })
})

describe('무드 · 기획전 탐색', () => {
  const novels: Novel[] = seed.novels

  it('모든 무드에 최소 한 편이 걸린다', () => {
    for (const mood of MOODS) {
      const matches = novels.filter((novel) => inMood(novel, mood.name))
      assert.ok(matches.length > 0, `${mood.name}: 0편`)
    }
  })

  it('기획전 4종이 모두 비어 있지 않고, 로판은 판타지 로맨스만 담는다', () => {
    for (const curation of CURATIONS) {
      const matches = novels.filter((novel) => inCuration(novel, curation))
      assert.ok(matches.length > 0, `${curation.title}: 0편`)
    }
    const fantasy = novels.filter((novel) =>
      inCuration(novel, CURATIONS.find((item) => item.id === 'fantasy-romance')!),
    )
    for (const novel of fantasy) {
      assert.ok(
        novel.genres.some((genre) => ['로맨스 판타지', '궁중 로맨스', '회귀'].includes(genre)),
        `${novel.title}: 로판 아님`,
      )
    }
  })

  it('한 작품은 여러 무드에 걸릴 수 있다', () => {
    const moods = moodsOf(novels.find((novel) => novel.id === 'nv-secretary')!)
    assert.ok(moods.length >= 1)
  })
})

describe('내 서재 — 최근 본 · 찜 · 엔딩 도감', () => {
  const flow = (novelId: string) => ALL_FLOWS.find((item) => item.novelId === novelId)

  it('읽은 회차를 최근 순으로 돌려준다', () => {
    window.localStorage.clear()
    recordReading({ novelId: 'nv-office', episodeId: 'ep-office-1', episodeNo: 1, episodeTitle: '엘리베이터', percent: 0.3 })
    recordReading({ novelId: 'nv-cafe', episodeId: 'ep-cafe-1', episodeNo: 1, episodeTitle: '새벽', percent: 0.9 })
    const list = recentReading()
    assert.equal(list.length, 2)
    assert.equal(list[0].novelId, 'nv-cafe', '마지막으로 읽은 작품이 먼저')
    assert.equal(list[1].novelId, 'nv-office')

    // 같은 회차를 다시 열어도 진행률은 줄지 않는다.
    recordReading({ novelId: 'nv-office', episodeId: 'ep-office-1', episodeNo: 1, episodeTitle: '엘리베이터', percent: 0 })
    const office = recentReading().find((entry) => entry.novelId === 'nv-office')
    assert.equal(office?.percent, 0.3)
    clearReading()
  })

  it('찜은 담기·빼기가 모두 되고, 다시 담으면 맨 뒤에 붙는다', () => {
    window.localStorage.clear()
    assert.equal(toggleShelf('nv-office'), true)
    assert.equal(toggleShelf('nv-cafe'), true)
    assert.deepEqual(shelfIds(), ['nv-office', 'nv-cafe'])
    assert.equal(isOnShelf('nv-office'), true)
    assert.equal(toggleShelf('nv-office'), false)
    assert.deepEqual(shelfIds(), ['nv-cafe'])
    assert.equal(isOnShelf('nv-office'), false)
    clearShelf()
  })

  it('엔딩을 모으면 도감이 채워지고, 못 본 엔딩은 잠금으로 남는다', () => {
    window.localStorage.clear()
    clearEndings()
    const target = flow('nv-secretary')!
    const first = target.endings[0]
    unlockEnding('nv-secretary', first)
    unlockEnding('nv-secretary', first) // 중복 기록은 무시

    const progress = endingProgress('nv-secretary', target)
    assert.equal(progress.total, 3)
    assert.equal(progress.unlocked, 1)
    assert.equal(progress.complete, false)
    const slot = progress.items.find((item) => item.ending.id === first.id)!
    assert.equal(slot.unlocked, true)
    assert.equal(slot.at !== null, true)
    const locked = progress.items.filter((item) => !item.unlocked)
    assert.equal(locked.length, 2)
    for (const item of locked) assert.equal(item.at, null)

    clearEndings()
  })

  it('모든 작품의 엔딩 총합은 흐름의 엔딩 수와 같다', () => {
    window.localStorage.clear()
    clearEndings()
    const totals = endingTotals(ALL_FLOWS.map((item) => ({ novelId: item.novelId, flow: item })))
    assert.equal(totals.total, ALL_FLOWS.reduce((sum, item) => sum + item.endings.length, 0))
    assert.equal(totals.unlocked, 0)
    clearEndings()
  })
})

describe('캐릭터 톤 — 호감도 · 추천 대사', () => {
  const character = seed.novels.find((novel) => novel.id === 'nv-secretary')!.characters![1]
  const message = (role: ChatMessage['role'], text: string): ChatMessage => ({
    id: `${role}-${text}`,
    role,
    text,
    at: new Date().toISOString(),
  })

  it('대화가 쌓일수록 호감도가 오르고 단계 이름이 바뀐다', () => {
    const empty = affinityOf({ messages: [] })
    const many = affinityOf({
      messages: Array.from({ length: 12 }, (_, index) =>
        message(index % 2 === 0 ? 'user' : 'character', '이야기'),
      ),
      appliedCount: 3,
      picks: 4,
    })
    assert.ok(many.score > empty.score)
    assert.ok(many.score <= 100)
    assert.equal(empty.tier, '낯섦')
    assert.notEqual(many.tier, empty.tier)
    assert.ok(many.mood.length > 0)
  })

  it('추천 대사는 언제나 3개이고, 대화가 시작되면 문장이 달라진다', () => {
    const first = suggestReplies({ character, messages: [] })
    assert.equal(first.length, 3)
    const later = suggestReplies({
      character,
      messages: [message('user', '안녕하세요'), message('character', '……그래서, 무슨 일입니까?')],
      lastPickLabel: '사유부터 말한다',
    })
    assert.equal(later.length, 3)
    assert.notDeepEqual(first, later)
    for (const chip of later) assert.ok(chip.trim().length > 0)
  })
})

describe('읽기 설정 기본값', () => {
  it('기본은 고딕 18px · 줄간격 1.9 · 화이트', () => {
    assert.deepEqual(DEFAULT_SETTINGS, { theme: 'light', fontSize: 18, lineHeight: 1.9, font: 'sans' })
  })
})

describe('플로우 — 엔딩 수집이 가능한 구조', () => {
  it('25작품 모두 엔딩 3개, 결이 A·B·C 하나씩', () => {
    for (const flow of ALL_FLOWS) {
      assert.equal(flow.endings.length, 3, flow.novelId)
      assert.deepEqual(flow.endings.map((ending) => ending.tone).sort(), ['A', 'B', 'C'])
      assert.equal(new Set(flow.endings.map((ending) => ending.name)).size, 3, `${flow.novelId}: 엔딩 이름 중복`)
    }
  })
})

describe('기존 독자 저장분 — 연재본 교체', () => {
  it('짧던 1화는 새 연재본으로 교체되고, 내 댓글은 그대로 남는다', async () => {
    const { LocalRepository } = await import('../src/lib/repository')
    window.localStorage.clear()
    const seed = buildSeed()
    const first = seed.episodes.find((episode) => episode.id === 'ep-secretary-1')!
    const oldEpisode: Episode = {
      ...first,
      body: first.body.slice(0, 220),
      choices: first.choices.map((choice) => ({ ...choice, targetEpisodeId: null })),
    }
    const myComment = {
      id: 'cm-mine',
      novelId: 'nv-secretary',
      episodeId: 'ep-secretary-1',
      author: '나',
      text: '내가 남긴 댓글',
      createdAt: new Date().toISOString(),
      likes: 0,
    }

    window.localStorage.setItem('np.novels.v1', JSON.stringify(seed.novels))
    window.localStorage.setItem('np.episodes.v1', JSON.stringify([oldEpisode]))
    window.localStorage.setItem('np.comments.v1', JSON.stringify([myComment]))
    window.localStorage.setItem('np.seed.version.v1', '1')

    const snapshot = await new LocalRepository().load()
    const refreshed = snapshot.episodes.find((episode) => episode.id === 'ep-secretary-1')!
    assert.ok(refreshed.body.length >= 1200, `교체된 1화 ${refreshed.body.length}자`)
    assert.equal(refreshed.choices[0].targetEpisodeId, 'ep-secretary-2a')
    assert.equal(refreshed.choices[1].targetEpisodeId, 'ep-secretary-2b')
    assert.ok(
      snapshot.episodes.some((episode) => episode.id === 'ep-secretary-2a'),
      '갈래 회차가 추가됨',
    )
    assert.ok(snapshot.comments.some((comment) => comment.id === 'cm-mine'), '내 댓글 유지')
    window.localStorage.clear()
  })

  it('v10 문장·제목 교정이 저장분에도 적용되고, 내가 덧붙인 문장은 남는다', async () => {
    const { LocalRepository } = await import('../src/lib/repository')
    window.localStorage.clear()
    const seed = buildSeed()
    const office = seed.episodes.find((episode) => episode.id === 'ep-office-1')!
    const palace = seed.episodes.find((episode) => episode.id === 'ep-palace-1')!

    const storedOffice: Episode = {
      ...office,
      body: office.body.replace(
        '강남대로는 이미 만원이었고, 그 위를 걷는 사람들의 아침도 그랬다.',
        '강남대로는 이미 만원이었고, 내 인생도 그랬다.',
      ) + '\n\n내가 덧붙인 문장.',
    }
    const storedPalace: Episode = { ...palace, title: '두 번째 첫 출근' }

    window.localStorage.setItem('np.novels.v1', JSON.stringify(seed.novels))
    window.localStorage.setItem('np.episodes.v1', JSON.stringify([storedOffice, storedPalace]))
    window.localStorage.setItem('np.seed.version.v1', '9')

    const snapshot = await new LocalRepository().load()
    const fixedOffice = snapshot.episodes.find((episode) => episode.id === 'ep-office-1')!
    assert.ok(
      fixedOffice.body.includes('그 위를 걷는 사람들의 아침도 그랬다.'),
      '1인칭으로 남아 있던 문장이 3인칭으로 교정됨',
    )
    assert.ok(fixedOffice.body.includes('내가 덧붙인 문장.'), '독자가 덧붙인 문장은 유지')
    const fixedPalace = snapshot.episodes.find((episode) => episode.id === 'ep-palace-1')!
    assert.equal(fixedPalace.title, '다시, 서고의 아침')
    window.localStorage.clear()
  })
})
