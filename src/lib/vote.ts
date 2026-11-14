import type { Choice, Episode, VoteRecord, VoteTally } from '../types'

/** 선택지별 득표를 합산합니다. (시드 누적표 + 이 기기의 투표) */
export function tallyVotes(episode: Episode, votes: VoteRecord[]): VoteTally {
  const local = votes.filter((vote) => vote.episodeId === episode.id)
  const counts: Record<string, number> = {}
  let total = 0

  for (const choice of episode.choices) {
    const localCount = local.filter((vote) => vote.choiceId === choice.id).length
    counts[choice.id] = choice.baseVotes + localCount
    total += counts[choice.id]
  }

  const percents = toPercents(episode.choices, counts, total)
  let leaderId: string | null = null
  let best = -1
  for (const choice of episode.choices) {
    if (counts[choice.id] > best) {
      best = counts[choice.id]
      leaderId = choice.id
    }
  }

  return { total, counts, percents, leaderId }
}

/** 반올림 오차 없이 합이 100이 되도록 최대잔여법으로 퍼센트를 계산합니다. */
function toPercents(
  choices: Choice[],
  counts: Record<string, number>,
  total: number,
): Record<string, number> {
  const result: Record<string, number> = {}
  if (total === 0 || choices.length === 0) {
    choices.forEach((choice) => {
      result[choice.id] = 0
    })
    return result
  }

  const raw = choices.map((choice) => ({
    id: choice.id,
    exact: (counts[choice.id] / total) * 100,
  }))
  const floors = raw.map((item) => ({ ...item, floor: Math.floor(item.exact) }))
  let remainder = 100 - floors.reduce((sum, item) => sum + item.floor, 0)

  const order = [...floors].sort((a, b) => (b.exact % 1) - (a.exact % 1))
  const bumped = new Set<string>()
  for (const item of order) {
    if (remainder <= 0) break
    bumped.add(item.id)
    remainder -= 1
  }

  floors.forEach((item) => {
    result[item.id] = item.floor + (bumped.has(item.id) ? 1 : 0)
  })
  return result
}

/** 내가 이 회차에서 고른 선택지 id */
export function myChoiceId(episodeId: string, votes: VoteRecord[]): string | null {
  return votes.find((vote) => vote.episodeId === episodeId)?.choiceId ?? null
}

/** 작품 전체 누적 참여 수 (선택이 있는 회차들의 득표 합) */
export function novelParticipants(episodes: Episode[]): number {
  return episodes.reduce(
    (sum, episode) => sum + episode.choices.reduce((acc, choice) => acc + choice.baseVotes, 0),
    0,
  )
}

/** 아직 마감되지 않은 가장 가까운 투표 */
export function nextOpenVote(episodes: Episode[]): Episode | null {
  const now = Date.now()
  const open = episodes
    .filter(
      (episode) =>
        episode.status === 'published' &&
        episode.choices.length > 0 &&
        episode.voteClosesAt !== null &&
        new Date(episode.voteClosesAt).getTime() > now,
    )
    .sort(
      (a, b) =>
        new Date(a.voteClosesAt as string).getTime() - new Date(b.voteClosesAt as string).getTime(),
    )
  return open[0] ?? null
}
