import type { Episode } from '../../../types'
import type { FilledMap } from './types'
import { curly } from '../../flows/patches'
import { cafeFilled } from './cafe'
import { marryFilled } from './marry'
import { campusFilled } from './campus'
import { idolFilled } from './idol'
import { palaceFilled } from './palace'
import { rivalFilled } from './rival'
import { regressFilled } from './regress'
import { academyFilled } from './academy'
import { murimFilled } from './murim'
import { memoryFilled } from './memory'
import { lodgeFilled } from './lodge'
import { occultFilled } from './occult'
import { officeFilled } from './office'
import { contractFilled } from './contract'
import { parcelFilled } from './parcel'

const FILLED: FilledMap = {
  ...cafeFilled,
  ...marryFilled,
  ...campusFilled,
  ...idolFilled,
  ...palaceFilled,
  ...rivalFilled,
  ...regressFilled,
  ...academyFilled,
  ...murimFilled,
  ...memoryFilled,
  ...lodgeFilled,
  ...occultFilled,
  ...officeFilled,
  ...contractFilled,
  ...parcelFilled
}

const HOUR = 60 * 60 * 1000

/** 집필 중(pending)이던 회차에 본문이 있으면 정식 연재 회차로 바꿉니다. 선택지가 없는 회차는 그 루트의 마지막 화입니다. */
export function fillPending(episodes: Episode[], nowMs: number): Episode[] {
  return episodes.map((rawEpisode) => {
    // 기존 회차 본문의 직선 따옴표도 둥근 따옴표로 통일합니다.
    const episode: Episode = { ...rawEpisode, body: curly(rawEpisode.body).replace(/'([^'\n]+)'/g, '‘$1’') }
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
