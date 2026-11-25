import type { LongformArc } from './types'
import type { FlowPart } from '../../../types'
import { campusScenesA } from './campus-a'
import { campusScenesB, campusEndings } from './campus-b'

const parts: FlowPart[] = [
  {
    title: '1부 · 노트 맨 뒤 137쪽',
    kicker: '좋아하는 사람의 이름은, 노트 맨 뒤에 쓴다. 그 문장이 남의 소설 첫 줄이 된다.',
    from: 1,
    to: 6,
  },
  {
    title: '2부 · 표절인가, 인용인가',
    kicker: '제보자 있음. 세 문장의 주인을 두고, 한 학기가 흔들린다.',
    from: 7,
    to: 12,
  },
  {
    title: '3부 · 2년 뒤',
    kicker: '출판사 인턴, 신인상, 그리고 아직 비어 있는 마지막 장.',
    from: 13,
    to: 17,
  },
  {
    title: '4부 · 첫 장',
    kicker: '인용 없는 소설. 이번엔 내가 첫 장을 쓴다.',
    from: 18,
    to: 22,
  },
]

export const campusArc: LongformArc = {
  novelId: 'nv-campus',
  parts,
  scenes: [...campusScenesA, ...campusScenesB],
  endings: campusEndings,
  serial: {
    target: 100,
    premise: [
      '중앙도서관 3층 창가, 문예창작과 강당. 차유림은 필기하는 2학년, 정한결은 4학년, 배수아는 같은 과 절친, 문지호는 지도교수.',
      '노트 맨 뒤 137쪽 — 좋아하는 사람의 이름을 쓰는 자리. 인용과 표기, 그리고 회수에 관한 두 사람의 규칙.',
      '2년 뒤, 유림은 출판사 편집자, 한결은 신인 작가, 수아는 결혼한 회사원.',
    ],
    beats: [
      '두 사람이 만든 인용·회수 규칙이 다른 학교에서 문제가 된다',
      '유림의 첫 소설이 표절 의혹에 휘말린다',
      '한결의 두 번째 소설이 유림의 원고와 너무 닮는다',
      '수아가 출판사에서 편집자로 유림과 같은 팀이 된다',
      '문지호의 20년 전 원고가 정식으로 출판된다',
      '137쪽 노트를 두고 두 사람이 처음으로 다툰다',
      '유림이 다른 도시로 이주를 제안받는다',
      '학교 앞 국밥집이 문을 닫고, 세 사람이 마지막으로 간다',
      '한결이 유림의 원고에 각주를 달아 돌려준다',
      '두 사람이 첫 장을 함께 쓰는 날',
    ],
  },
}
