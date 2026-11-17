import type { Episode } from '../../../types'
import type { FilledMap } from './types'
import { curly } from '../../flows/patches'
import { cafeFilled } from './cafe'

const FILLED: FilledMap = {
  ...cafeFilled,
}

const HOUR = 60 * 60 * 1000

/** 집필 중(pending)이던 회차에 본문이 있으면 정식 연재 회차로 바꿉니다. 선택지가 없는 회차는 그 루트의 마지막 화입니다. */
export function fillPending(episodes: Episode[], nowMs: number): Episode[] {
  return episodes.map((episode) => {
    const paragraphs = FILLED[episode.id]
    if (episode.status !== 'pending' || !paragraphs) return episode
    return {
      ...episode,
      status: 'published',
      publishedAt: new Date(nowMs - 3 * HOUR).toISOString(),
      voteClosesAt: null,
      body: paragraphs.map(curly).join('\n\n'),
      choices: [],
    }
  })
}
