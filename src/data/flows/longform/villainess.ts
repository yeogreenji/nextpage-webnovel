import type { LongformArc } from './types'
import type { FlowPart } from '../../../types'
import { villainessScenesA } from './villainess-a'
import { villainessScenesB, villainessEndings } from './villainess-b'

const parts: FlowPart[] = [
  {
    title: '1부 · 처형 3일 전',
    kicker: '회귀한 악녀의 첫 목표는 하나, 살아서 퇴근하는 것.',
    from: 1,
    to: 6,
  },
  {
    title: '2부 · 기록관의 봄',
    kicker: '성을 지운 이름, 성을 가진 편지. 무죄 이후에도 기록은 사람을 부른다.',
    from: 7,
    to: 12,
  },
  {
    title: '3부 · 세 번째 봄',
    kicker: '같은 3월 4일이 두 번 왔다. 반복되는 날에도 기록은 새로 쓰인다.',
    from: 13,
    to: 17,
  },
  {
    title: '4부 · 두 개의 촛불',
    kicker: '가장 높은 자리보다, 가장 오래 남는 자리.',
    from: 18,
    to: 22,
  },
]

export const villainessArc: LongformArc = {
  novelId: 'nv-villainess',
  parts,
  scenes: [...villainessScenesA, ...villainessScenesB],
  endings: villainessEndings,
  serial: {
    target: 100,
    premise: [
      '아르덴 제국 황궁. 처형당한 악녀 리아나가 3년 전으로 회귀해 황궁 서기, 그리고 기록관으로 살아남는다.',
      '카이엔은 황태자에서 황제로. 마리는 리아나의 시녀. 리안은 리아나의 이복오빠이자 전 재무대신.',
      '기록은 사람을 지우지 않는다 — 리아나가 세운 규정 제7조. 성 없이 남은 이름 하나.',
    ],
    beats: [
      '기록관 규정 제7조의 첫 개정 시도가 일어난다',
      '리아나가 죽기 전날의 기억을 처음으로 자세히 떠올린다',
      '황제 카이엔이 다른 나라 사절과 기록 조약을 맺는다',
      '마리가 리아나를 대신해 첫 심문관이 된다',
      '유배에서 돌아온 리안이 재무부 개혁안을 들고 온다',
      '리아나의 첫 기록이 누군가에 의해 위조된다',
      '성 밖 서당에 첫 제자가 들어온다',
      '황후 자리를 두고 황실 친척이 움직인다',
      '두 사람이 3월 4일이 아닌 날을 함께 보낸다',
      '리아나가 마지막 장에 쓸 문장을 미리 정해 둔다',
    ],
  },
}
