import { Link } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'

export function AboutPage() {
  const { resetAll, notify, votes } = useStore()

  return (
    <div className="page-shell pt-8 max-w-[760px]">
      <p className="eyebrow">About</p>
      <h1 className="text-[24px] font-extrabold mt-1 tracking-tight">넥스트페이지 운영 안내</h1>
      <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
        넥스트페이지는 <b>내가 선택하는 대로 소설이 완성되는</b> 인터랙티브 웹소설 플랫폼입니다.
        작품마다 여섯 장면, 장면마다 3~4개의 갈래, 그리고 세 개의 엔딩이 있습니다. 고른 문장이 곧 소설이 됩니다. 마지막에는
        내가 고른 분기와 내가 넣은 대사만으로 이뤄진 한 편의 소설을 읽습니다.
      </p>

      <section className="card p-5 mt-6">
        <h2 className="text-[15px] font-extrabold">내가 선택하는 대로 완성되는 소설</h2>
        <ol className="mt-3 grid gap-2.5 text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          <li>
            <b>1.</b> 장면이 끝날 때마다 3~4개의 갈래가 열립니다. 한 작품에 여섯 장면.
          </li>
          <li>
            <b>2.</b> 고르는 즉시 그 결과가 본문에 붙고 다음 장면이 열립니다. 한 편의 소설이 그렇게
            쌓입니다.
          </li>
          <li>
            <b>3.</b> 장면 중간에 등장인물과 대화할 수 있고, 마음에 드는 대사는 「이 대사 소설에
            적용」으로 본문에 대화 블록으로 들어갑니다.
          </li>
          <li>
            <b>4.</b> 마지막 여섯 번째 선택이 엔딩을 정합니다. 마지막에 무엇을 하느냐에 따라 두 개의
            엔딩 중 하나에 도달하고, 그 결말은 마지막 선택과 어긋나지 않습니다.
          </li>
          <li>
            <b>5.</b> 「내가 완성한 소설 읽기」에서 선택한 분기·넣은 대사·엔딩이 버튼 없이 한 편으로
            이어집니다. 다른 선택지로 다시 써 보거나 처음부터 다시 읽을 수 있습니다.
          </li>
        </ol>
      </section>

      <section className="card p-5 mt-4">
        <h2 className="text-[15px] font-extrabold">회차 읽기와 캐릭터 톡</h2>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          회차 화면의 <b>📖 소설로 쭉 읽기</b> 버튼을 누르면 선택지 없이 내가 고른 분기가 한 편의
          웹소설로 이어집니다. 작품 페이지의 <b>💬 캐릭터 톡</b>에서는 등장인물과 직접 대화할 수 있고,
          인물은 작품 세계관과 내가 고른 선택지를 기억합니다. AI 키가 연결된 배포에서는 실시간
          응답으로, 연결되지 않은 배포에서는 기기 안의 상황 응답으로 대화합니다. 캐릭터 톡의 대화
          기록은 이 기기에만 저장되며, 대화 지우기 버튼으로 언제든 지울 수 있습니다.
        </p>
      </section>

      <section className="card p-5 mt-4">
        <h2 className="text-[15px] font-extrabold">데이터는 어디에 저장되나요</h2>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          현재 버전은 서버 없이 동작합니다. 내가 고른 분기, 소설에 넣은 대사, 한 줄 댓글, 읽기 설정,
          작가 스튜디오에서 발행한 회차가 모두 <b>이 브라우저(이 기기)</b>에만 저장됩니다. 캐릭터 톡의
          AI 응답만 배포에 연결된 키로 실시간 생성됩니다. 브라우저 저장소를 지우면 기록도 함께
          사라집니다.
        </p>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          여러 독자가 같은 집계를 함께 보려면 Supabase 같은 백엔드를 붙이면 됩니다. 저장소 계층을
          분리해 두었기 때문에 <code className="chip">NovelRepository</code> 구현만 바꾸면 화면 코드는
          그대로 동작합니다. 자세한 스키마는 저장소의 <code className="chip">docs/BACKEND.md</code>를
          참고하세요.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={async () => {
              const ok = window.confirm(
                '이 기기의 투표·댓글·발행 기록을 모두 지우고 샘플 작품으로 되돌릴까요?',
              )
              if (!ok) return
              await resetAll()
              notify('이 기기 기록을 초기화했어요')
            }}
          >
            이 기기 기록 초기화
          </button>
          <span className="text-[11.5px]" style={{ color: 'var(--ink-mute)' }}>
            현재 참여 기록 {votes.length}건
          </span>
        </div>
      </section>

      <section className="card p-5 mt-4">
        <h2 className="text-[15px] font-extrabold">작가를 위한 안내</h2>
        <ul className="mt-2 grid gap-1.5 text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          <li>· 필명으로 연재해 주세요. 실명·소속이 드러나는 정보는 작품에 쓰지 않습니다.</li>
          <li>· 회차 본문은 빈 줄로 문단을 구분하면 읽기 화면에서 자연스럽게 나뉩니다.</li>
          <li>· 선택지는 3~4개이며, 각 선택에는 ‘다음 화’로 이어지는 문장을 따로 설계하는 편이 좋습니다.</li>
          <li>· 투표 마감을 비워 두면 마감 없이 계속 참여할 수 있습니다.</li>
        </ul>
        <Link to="/studio" className="btn btn-primary btn-sm mt-4">
          작가 스튜디오 열기
        </Link>
      </section>

      <section className="card p-5 mt-4">
        <h2 className="text-[15px] font-extrabold">일러스트 안내</h2>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          표지·인물 카드·선택지 장면 그림은 모두 AI로 생성한 가상의 이미지입니다. 실존 인물이나 실제
          작품의 표지를 사용하지 않았고, 그림 파일은{' '}
          <code className="chip">public/images/</code> 아래에 있습니다.
        </p>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          지금 들어 있는 그림은 표지 15종과 키 비주얼 15종, 인물 카드 60인, 선택지 장면과 회차
          본문 삽화 70컷입니다. 본문 삽화는 줄거리의 결정적인 장면에서 한 번씩 크게
          펼쳐지고, 작품 페이지의 <b>명장면 일러스트 갤러리</b>에서 모아 볼 수 있습니다.
        </p>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          읽기 화면은 라이트·세피아·다크 세 가지 배경을 제공하고, 플랫폼 기본 화면은 어두운
          플럼·옵시디언 바탕에 로즈·인디고 포인트를 쓰는 다크 테마로 시작합니다.
        </p>
      </section>

      <section className="card p-5 mt-4">
        <h2 className="text-[15px] font-extrabold">만든 방식</h2>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          React 19 · TypeScript · Vite · Tailwind CSS로 만들었고, GitHub Pages에 그대로 배포할 수
          있습니다. 라우팅은 해시 기반이라 어떤 정적 호스팅에서도 새로고침 문제가 없습니다.
        </p>
        <p className="mt-2 text-[12px]" style={{ color: 'var(--ink-mute)' }}>
          수록된 작품·인물·필명은 모두 가상이며 실제 인물과 무관합니다. © 넥스트페이지 · MIT License
        </p>
      </section>
    </div>
  )
}
