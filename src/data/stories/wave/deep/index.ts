import type { Episode, InlineScene } from '../../../../types'
import { secretaryDeepEpisodes } from './secretary'
import { nextdoorDeepEpisodes } from './nextdoor'
import { youngerDeepEpisodes } from './younger'
import { villainessDeepEpisodes } from './villainess'
import { duchessDeepEpisodes } from './duchess'
import { magetowerDeepEpisodes } from './magetower'
import { exDeepEpisodes } from './ex'
import { ramenDeepEpisodes } from './ramen'
import { ceoDeepEpisodes } from './ceo'
import { academyDeepEpisodes } from './academy'

export { WAVE_COMMENTS } from './comments'

/**
 * 신작 10편의 정식 연재본.
 * — 1화(`ep-*-1`)를 상용 연재 분량으로 다시 쓰고, 1화의 두 갈래(`ep-*-2a`·`ep-*-2b`)를 완결합니다.
 * — 2a·2b는 그 루트의 마지막 화입니다(선택지 없음 → 화면에서 'End of route' 안내).
 * — 원본 1화 파일은 그대로 두고, 여기서 같은 id로 덮어씁니다(기존 expansions 와 같은 방식).
 */
export const WAVE_DEEP_EPISODES: Episode[] = [
  ...secretaryDeepEpisodes,
  ...nextdoorDeepEpisodes,
  ...youngerDeepEpisodes,
  ...villainessDeepEpisodes,
  ...duchessDeepEpisodes,
  ...magetowerDeepEpisodes,
  ...exDeepEpisodes,
  ...ramenDeepEpisodes,
  ...ceoDeepEpisodes,
  ...academyDeepEpisodes,
]

/**
 * 갈래 회차의 본문 삽화.
 * — 각 작품의 6장면 일러스트 중 톤이 맞는 컷을 재사용합니다.
 * — anchor 는 새 본문의 문장 일부이고, 못 찾으면 fallbackAfter 문단 뒤에 놓입니다.
 */
export const WAVE_DEEP_SCENES: Record<string, InlineScene[]> = {
  'ep-secretary-2a': [
    {
      image: 'images/scenes/wf-secretary-2.jpg',
      caption: '대표실 책상 위, 아직 뜯기지 않은 봉투와 취임 합의서.',
      anchor: '취임 합의서 사본이었다',
      fallbackAfter: 3,
    },
  ],
  'ep-secretary-2b': [
    {
      image: 'images/scenes/wf-secretary-3.jpg',
      caption: '인수인계 목록 47개. 8년이 문서가 되는 시간.',
      anchor: '첫 주에 서아가 만든 목록은',
      fallbackAfter: 4,
    },
  ],
  'ep-nextdoor-2a': [
    {
      image: 'images/scenes/wf-nextdoor-2.jpg',
      caption: '두 도면을 맞붙이면, 하나의 벽이 나온다.',
      anchor: '두 도면을 맞붙이면',
      fallbackAfter: 8,
    },
  ],
  'ep-nextdoor-2b': [
    {
      image: 'images/scenes/wf-nextdoor-3.jpg',
      caption: '문 아래로 들어온 도면 봉투.',
      anchor: '문 아래로 종이 한 장이',
      fallbackAfter: 2,
    },
  ],
  'ep-younger-2a': [
    {
      image: 'images/scenes/wf-younger-2.jpg',
      caption: '본심 심사, 이름이 지워진 원고 다섯 편.',
      anchor: '037은 세 번째에 있었다',
      fallbackAfter: 0,
    },
  ],
  'ep-younger-2b': [
    {
      image: 'images/scenes/wf-younger-3.jpg',
      caption: '8시 45분의 카페, 식지 않는 아메리카노.',
      anchor: '하린은 다음 날 아침 8시 45분에',
      fallbackAfter: 0,
    },
  ],
  'ep-villainess-2a': [
    {
      image: 'images/scenes/wf-villainess-2.jpg',
      caption: '재무부 장부와 대조한 47줄의 표.',
      anchor: '장부는 9번째 줄에서',
      fallbackAfter: 2,
    },
  ],
  'ep-villainess-2b': [
    {
      image: 'images/scenes/wf-villainess-3.jpg',
      caption: '3년 뒤의 연회 목록, 마지막 줄의 이름.',
      anchor: '와인 목록 마지막 줄에',
      fallbackAfter: 2,
    },
  ],
  'ep-duchess-2a': [
    {
      image: 'images/scenes/wf-duchess-2.jpg',
      caption: '눈을 퍼내자 온실 바닥이 보였다.',
      anchor: '세 시간 뒤, 온실 바닥이 보였다',
      fallbackAfter: 2,
    },
  ],
  'ep-duchess-2b': [
    {
      image: 'images/scenes/wf-duchess-3.jpg',
      caption: '20년 동안 공작의 서랍에 있던 온실 열쇠.',
      anchor: '낡고 무거운 쇠였다',
      fallbackAfter: 8,
    },
  ],
  'ep-magetower-2a': [
    {
      image: 'images/scenes/wf-magetower-2.jpg',
      caption: '규칙이 없는 3층, 아직 쓰이지 않은 책.',
      anchor: '규칙이 없는 층에',
      fallbackAfter: 9,
    },
  ],
  'ep-magetower-2b': [
    {
      image: 'images/scenes/wf-magetower-3.jpg',
      caption: '340개의 이름이 지워진 벽의 마법진.',
      anchor: '340개의 이름',
      fallbackAfter: 3,
    },
  ],
  'ep-ex-2a': [
    {
      image: 'images/scenes/wf-ex-2.jpg',
      caption: '첫 촬영, 이별 장면의 카페 세트.',
      anchor: '첫 촬영은 화요일이었다',
      fallbackAfter: 4,
    },
  ],
  'ep-ex-2b': [
    {
      image: 'images/scenes/wf-ex-3.jpg',
      caption: '두 사람만 남은 회의실, 2년 만의 첫 사적인 문장.',
      anchor: '회의실에 두 사람만 남았다',
      fallbackAfter: 1,
    },
  ],
  'ep-ramen-2a': [
    {
      image: 'images/scenes/wf-ramen-2.jpg',
      caption: '새벽 세 시의 진료실, 두부를 받아 든 손.',
      anchor: '민오가 두부를 받아 들었다',
      fallbackAfter: 0,
    },
  ],
  'ep-ramen-2b': [
    {
      image: 'images/scenes/wf-ramen-3.jpg',
      caption: '여덟 개의 항목이 적힌 낡은 수첩.',
      anchor: '수첩은 낡았다',
      fallbackAfter: 1,
    },
  ],
  'ep-ceo-2a': [
    {
      image: 'images/scenes/wf-ceo-2.jpg',
      caption: '열두 조항이 된 계약서, 제3조의 아래.',
      anchor: '유진은 그날 밤 12층 법무팀에서',
      fallbackAfter: 0,
    },
  ],
  'ep-ceo-2b': [
    {
      image: 'images/scenes/wf-ceo-3.jpg',
      caption: '결혼 계약서가 아닌, 회사를 살리는 계약서.',
      anchor: '이건 결혼 계약서가 아닙니다',
      fallbackAfter: 4,
    },
  ],
  'ep-academy-ta-2a': [
    {
      image: 'images/scenes/wf-academy-ta-2.jpg',
      caption: '여섯 시, 3년 만에 본 해.',
      anchor: '여섯 시, 리제는 정말로 퇴근했다',
      fallbackAfter: 3,
    },
  ],
  'ep-academy-ta-2b': [
    {
      image: 'images/scenes/wf-academy-ta-3.jpg',
      caption: '세 번째 고리에 맺힌 이슬.',
      anchor: '세 번째 고리에 이슬이 맺혔습니다',
      fallbackAfter: 3,
    },
  ],
}
