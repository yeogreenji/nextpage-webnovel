import type { LongformArc } from './types'
import type { FlowPart } from '../../../types'
import { secretaryScenesA } from './secretary-a'
import { secretaryScenesB, secretaryEndings } from './secretary-b'

const parts: FlowPart[] = [
  {
    title: '1부 · 8년 4개월',
    kicker: '사직서 한 장으로 시작된 3개월. 사표를 찢는 것도, 이름을 부르는 것도 결정이었다.',
    from: 1,
    to: 6,
  },
  {
    title: '2부 · 유언장의 계절',
    kicker: '존재하지 않는 팀, 이름 없는 봉투. 회장이 쓰러지고 기록이 증거가 된다.',
    from: 7,
    to: 12,
  },
  {
    title: '3부 · 비자금 장부',
    kicker: '매달 25일, 8년 동안. 이름 없이 나간 돈에는 이름이 있었다.',
    from: 13,
    to: 17,
  },
  {
    title: '4부 · 퇴근 시간',
    kicker: '기록을 남긴 사람의 이름을 지우지 않는다. 그 이름이 누구인지는, 기록이 말한다.',
    from: 18,
    to: 22,
  },
]

export const secretaryArc: LongformArc = {
  novelId: 'nv-secretary',
  parts,
  scenes: [...secretaryScenesA, ...secretaryScenesB],
  endings: secretaryEndings,
  serial: {
    target: 100,
    premise: [
      '한성그룹 비서실 8년 차 윤서아와 신임 대표 강이든. 27층 대표실과 12층 비서실, 29층 회장실.',
      '윤서아는 기록을 남기는 사람. 강이든은 사람을 지키려는 대표. 박정후는 비서실장이자 서아의 첫 상사. 오하린은 같은 시기 입사한 인사전략팀 과장.',
      '비서실 업무일지 8년 치와 사규 12조 3항 — 기록을 남긴 사람의 이름을 지우지 않는다.',
    ],
    beats: [
      '기록관리실 전사 확대 뒤, 첫 번째 기록 분쟁이 생긴다',
      '강이든이 다른 회사에서 스카우트 제안을 받는다',
      '윤서아의 아버지 사고에 대한 유족 재심이 열린다',
      '하린이 맡은 기록 교육이 사내 정치에 휘말린다',
      '박정후의 정년퇴임 날, 그가 남긴 마지막 문서가 문제가 된다',
      '27층 엘리베이터가 47초 동안 멈추고, 두 사람이 갇힌다',
      '회장이 남긴 세 번째 장부가 발견된다',
      '다른 회사가 기록관리실을 통째로 스카우트하려 한다',
      '사규 12조 3항이 개정 위기에 놓인다',
      '윤서아의 사직서 사유란이, 마침내 채워진다',
    ],
  },
}
