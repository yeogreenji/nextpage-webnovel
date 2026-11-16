import type { Choice, Episode, Novel, VoteRecord } from '../types'
import { tallyVotes } from './vote'

/** 정주행 모드에서 한 회차를 어떤 선택으로 지나왔는지 */
export interface PathStep {
  episode: Episode
  /** 이 회차로 들어온 선택지 (첫 회차면 null) */
  choice: Choice | null
  /** 그 선택을 누가 정했는지 — 내 투표 / 현재 다수파 / 기본값 */
  pickedBy: 'me' | 'majority' | 'first' | 'start'
}

/**
 * 읽을 경로를 계산합니다.
 * - 내가 투표한 선택지가 있으면 그쪽으로,
 * - 없으면 지금 다수파가 고른 쪽으로,
 * - 그것도 없으면 첫 번째 선택지로 이어집니다.
 * 집필 중(pending) 노드를 만나면 거기서 멈춥니다.
 */
export function resolveReadPath(
  novel: Novel,
  episodes: Episode[],
  votes: VoteRecord[],
): PathStep[] {
  const byId = new Map(episodes.map((episode) => [episode.id, episode]))
  const fallbackStart = episodes
    .filter((episode) => episode.novelId === novel.id && episode.status === 'published')
    .sort((a, b) => a.no - b.no)[0]

  const path: PathStep[] = []
  const visited = new Set<string>()

  let current = byId.get(novel.startEpisodeId) ?? fallbackStart
  let choice: Choice | null = null
  let pickedBy: PathStep['pickedBy'] = 'start'

  while (current && current.status === 'published' && !visited.has(current.id) && path.length < 60) {
    visited.add(current.id)
    path.push({ episode: current, choice, pickedBy })

    if (current.choices.length === 0) break

    const mine = votes.find((vote) => vote.episodeId === current.id)
    const tally = tallyVotes(current, votes)
    const chosen =
      current.choices.find((item) => item.id === mine?.choiceId) ??
      current.choices.find((item) => item.id === tally.leaderId) ??
      current.choices[0]

    if (!chosen || !chosen.targetEpisodeId) break
    const next = byId.get(chosen.targetEpisodeId)
    if (!next || next.status !== 'published') break

    choice = chosen
    pickedBy = mine ? 'me' : tally.leaderId === chosen.id ? 'majority' : 'first'
    current = next
  }

  return path
}

/** 회차 본문을 문단 배열로 */
export function paragraphsOf(episode: Episode): string[] {
  return episode.body.split(/\n{2,}/).filter((line) => line.trim().length > 0)
}

/** 내가 고른 분기 요약 — 캐릭터 톡의 맥락으로 쓰입니다. */
export function describeChoices(
  novel: Novel,
  episodes: Episode[],
  votes: VoteRecord[],
): string[] {
  const path = resolveReadPath(novel, episodes, votes)
  return path
    .filter((step) => step.choice)
    .map((step) => {
      const who =
        step.pickedBy === 'me'
          ? '내가 고름'
          : step.pickedBy === 'majority'
            ? '다수파를 따름'
            : '기본 분기'
      return `${step.episode.no}화 《${step.episode.title}》로 이어지는 선택: “${step.choice?.label}” (${who})`
    })
}

/** 마지막으로 읽은 회차 (정주행 → 선택 모드로 돌아갈 때) */
export function lastEpisodeOf(path: PathStep[]): Episode | null {
  return path.length > 0 ? path[path.length - 1].episode : null
}

/** 정주행 모드에서 현재 회차의 위치 */
export function indexOfEpisode(path: PathStep[], episodeId?: string | null): number {
  if (!episodeId) return 0
  const index = path.findIndex((step) => step.episode.id === episodeId)
  return index < 0 ? 0 : index
}
