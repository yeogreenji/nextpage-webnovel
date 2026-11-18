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

/**
 * 2026 리뉴얼 신작 10편 — 20·30·40대 여성을 위한 로맨스 중심 라인업.
 * 작품 · 1화 · 인터랙티브 흐름을 한 묶음으로 내보냅니다.
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

export const WAVE_NOVELS: Novel[] = WAVE_WORKS.map((work) => work.novel)
export const WAVE_EPISODES: Episode[] = WAVE_WORKS.map((work) => work.episode)
export const WAVE_FLOWS: StoryFlow[] = WAVE_WORKS.map((work) => work.flow)
