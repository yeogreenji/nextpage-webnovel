import type { Episode, Novel, StoryFlow } from '../../../types'
import { secretaryEpisode, secretaryFlow, secretaryNovel } from './secretary'
import { nextdoorEpisode, nextdoorFlow, nextdoorNovel } from './nextdoor'
import { youngerEpisode, youngerFlow, youngerNovel } from './younger'
import { villainessEpisode, villainessFlow, villainessNovel } from './villainess'
import { duchessEpisode, duchessFlow, duchessNovel } from './duchess'
import { magetowerEpisode, magetowerFlow, magetowerNovel } from './magetower'
import { exEpisode, exFlow, exNovel } from './ex'
import { ramenEpisode, ramenFlow, ramenNovel } from './ramen'
import { ceoEpisode, ceoFlow, ceoNovel } from './ceo'
import { academyEpisode, academyFlow, academyNovel } from './academy'
import { WAVE_DEEP_EPISODES } from './deep'
import { WAVE_COMMENTS } from './deep/comments'

/**
 * 2026 리뉴얼 신작 10편 — 20·30·40대 여성을 위한 로맨스 중심 라인업.
 * 작품 · 1화 · 인터랙티브 흐름을 한 묶음으로 내보냅니다.
 *
 * 1화와 갈래 회차(2a·2b)는 `deep/`의 정식 연재본으로 덮어씁니다.
 * — 원본 파일은 초안, deep/가 연재본입니다. 같은 episode id 면 deep 쪽이 이깁니다.
 */
export interface WaveWork {
  novel: Novel
  episode: Episode
  flow: StoryFlow
}

export const WAVE_WORKS: WaveWork[] = [
  { novel: secretaryNovel, episode: secretaryEpisode, flow: secretaryFlow },
  { novel: nextdoorNovel, episode: nextdoorEpisode, flow: nextdoorFlow },
  { novel: youngerNovel, episode: youngerEpisode, flow: youngerFlow },
  { novel: villainessNovel, episode: villainessEpisode, flow: villainessFlow },
  { novel: duchessNovel, episode: duchessEpisode, flow: duchessFlow },
  { novel: magetowerNovel, episode: magetowerEpisode, flow: magetowerFlow },
  { novel: exNovel, episode: exEpisode, flow: exFlow },
  { novel: ramenNovel, episode: ramenEpisode, flow: ramenFlow },
  { novel: ceoNovel, episode: ceoEpisode, flow: ceoFlow },
  { novel: academyNovel, episode: academyEpisode, flow: academyFlow },
]

const DEEP = new Map(WAVE_DEEP_EPISODES.map((episode) => [episode.id, episode]))
const FIRST_EPISODE_IDS = new Set(WAVE_WORKS.map((work) => work.episode.id))

export const WAVE_NOVELS: Novel[] = WAVE_WORKS.map((work) => work.novel)

export const WAVE_EPISODES: Episode[] = [
  ...WAVE_WORKS.map((work) => DEEP.get(work.episode.id) ?? work.episode),
  ...WAVE_DEEP_EPISODES.filter((episode) => !FIRST_EPISODE_IDS.has(episode.id)),
]

export const WAVE_FLOWS: StoryFlow[] = WAVE_WORKS.map((work) => work.flow)

export { WAVE_COMMENTS }
