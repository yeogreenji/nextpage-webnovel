import type { LongformArc } from './types'
import type { FlowPart } from '../../../types'
import { officeScenesA } from './office-a'
import { officeScenesB, officeEndings } from './office-b'

const parts: FlowPart[] = [
  {
    title: '1부 · 반씩 나눈 커피',
    kicker: '캠페인 하나, 숫자 하나, 3분의 지각. 6화 동안의 첫 여섯 번의 선택.',
    from: 1,
    to: 6,
  },
  {
    title: '2부 · 추천서',
    kicker: '한 팀에 추천서는 한 장. 승진 심사가 두 사람을 같은 문 앞에 세운다.',
    from: 7,
    to: 12,
  },
  {
    title: '3부 · 오해의 값',
    kicker: '5년 전의 이름, 새벽 3시 40분의 결재. 늦은 이유가 늦은 사람보다 오래 남는다.',
    from: 13,
    to: 17,
  },
  {
    title: '4부 · 이름표',
    kicker: '이름을 부르는 데는 돈이 들지 않는다. 다만 용기가 든다.',
    from: 18,
    to: 22,
  },
]

export const officeArc: LongformArc = {
  novelId: 'nv-office',
  parts,
  scenes: [...officeScenesA, ...officeScenesB],
  endings: officeEndings,
  serial: {
    target: 100,
    premise: [
      '마케팅팀 대리 하윤과 신임 팀장 서준의 오피스 로맨스. 회사는 강남 12층, 두 사람은 같은 층 다른 팀.',
      '하윤은 보고서의 각주까지 책임지는 3년 차. 서준은 사람을 승진시키는 일을 무서워하는 팀장. 유나는 콘텐츠전략팀 팀장이자 같은 해 입사 동기. 민재는 네 살 연하 인턴.',
      '캠페인 이름표 — 회사에서 직함으로만 불리는 사람들의 이름을 부르는 프로젝트.',
    ],
    beats: [
      '이름표 캠페인이 광고가 되지 않도록, 두 번째 시즌의 원칙을 다시 세운다',
      '서준의 새 회사와 하윤의 팀이 같은 고객을 두고 입찰에서 만난다',
      '민재가 처음으로 자기 이름으로 캠페인을 맡고, 첫 실수를 한다',
      '유나가 본부장 자리를 제안받고, 두 팀의 예산이 다시 흔들린다',
      '표절 건으로 회사를 떠났던 정민호가 나타나, 사과 대신 제안을 들고 온다',
      '하윤에게 해외 지사 제안이 오고, 서준은 아무 말도 하지 않는다',
      '12층 엘리베이터가 멈추고, 두 사람이 계단에서 마주친다',
      '서준의 어머니가 퇴원하고, 하윤이 처음으로 병원 밖에서 그를 만난다',
      '첫 수상식. 수상 소감에서 누구 이름을 부를지가 문제가 된다',
      '회사가 이름표 캠페인을 상품으로 팔려 하고, 하윤이 반대한다',
    ],
  },
}
