import type { LongformArc } from './types'
import type { FlowPart } from '../../../types'
import { ceoScenesA } from './ceo-a'
import { ceoScenesB, ceoEndings } from './ceo-b'

const parts: FlowPart[] = [
  {
    title: '1부 · 6개월 계약',
    kicker: '을이 비어 있던 계약서. 서명 한 번으로 시작된 결혼.',
    from: 1,
    to: 6,
  },
  {
    title: '2부 · 해지 확인서',
    kicker: '계약은 끝났다. 조건은 남았다. 승계와 8억이 같은 조항에 걸려 있다.',
    from: 7,
    to: 12,
  },
  {
    title: '3부 · 유언장',
    kicker: '필체가 다른 세 부의 초안. 회장이 하지 않은 말이 유언이 될 뻔했다.',
    from: 13,
    to: 17,
  },
  {
    title: '4부 · 새 계약서',
    kicker: '조항 하나, 서명란 두 개. 이번 계약서는 내가 쓴다.',
    from: 18,
    to: 22,
  },
]

export const ceoArc: LongformArc = {
  novelId: 'nv-ceo',
  parts,
  scenes: [...ceoScenesA, ...ceoScenesB],
  endings: ceoEndings,
  serial: {
    target: 100,
    premise: [
      '백산그룹 법무팀 변호사 노유진과 대표 백재이. 6개월 계약 결혼으로 시작해, 계약이 끝난 뒤에도 이어지는 관계.',
      '차현우는 비서실장, 윤서아는 재이의 전 약혼녀이자 갤러리 대표. 제7조 — 계약에 없는 감정은 계약 종료 후에 당사자가 직접 정한다.',
      '유진은 계약서를 쓰는 사람, 재이는 계약으로 사람을 붙잡던 사람.',
    ],
    beats: [
      '제7조를 둘러싼 첫 번째 해석 분쟁이 생긴다',
      '백산이 다른 회사를 인수하고, 유진이 그 계약을 맡는다',
      '재이의 동생이 경영에 참여하려 한다',
      '유진의 로펌에 첫 대형 사건이 들어온다',
      '서아의 갤러리가 재정난에 빠진다',
      '두 사람이 결혼식 날짜를 두고 처음으로 다툰다',
      '회장의 옛 비서가 찾아와 마지막 문서를 건넨다',
      '백산 노조가 단체교섭을 요구한다',
      '유진이 백산을 상대로 소송을 맡게 된다',
      '두 사람이 계약서 없이 하루를 보낸다',
    ],
  },
}
