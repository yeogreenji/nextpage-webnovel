import { Link } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'

export function AboutPage() {
  const { resetAll, notify, votes } = useStore()

  return (
    <div className="page-shell pt-8 max-w-[760px]">
      <p className="eyebrow">About</p>
      <h1 className="text-[24px] font-extrabold mt-1 tracking-tight">넥스트페이지 운영 안내</h1>
      <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
        넥스트페이지는 회차마다 독자가 두 갈래 중 하나를 고르고, 다수가 고른 방향으로 이야기가
        이어지는 선택형 웹소설 플랫폼입니다. 필명으로 연재하는 작가와, 다음 화를 직접 고르고 싶은
        독자를 위해 만들었습니다.
      </p>

      <section className="card p-5 mt-6">
        <h2 className="text-[15px] font-extrabold">이야기가 이어지는 방식</h2>
        <ol className="mt-3 grid gap-2.5 text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          <li>
            <b>1.</b> 회차 끝에서 A/B 선택지가 열립니다. 마감 전까지 한 번 참여할 수 있습니다.
          </li>
          <li>
            <b>2.</b> 투표 즉시 선택지별 비율과 내가 다수파인지 소수파인지 보여 줍니다.
          </li>
          <li>
            <b>3.</b> 다수파 루트의 다음 화가 정식 연재로 이어지고, 미채택 루트도 읽을 수 있습니다.
          </li>
          <li>
            <b>4.</b> 결과는 1080×1920 스토리 카드 이미지로 저장하거나 복사해 공유할 수 있습니다.
          </li>
        </ol>
      </section>

      <section className="card p-5 mt-4">
        <h2 className="text-[15px] font-extrabold">데이터는 어디에 저장되나요</h2>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          현재 버전은 서버 없이 동작합니다. 투표, 한 줄 댓글, 읽기 설정, 작가 스튜디오에서 발행한
          회차가 모두 <b>이 브라우저(이 기기)</b>에만 저장됩니다. 다른 사람의 투표와는 아직
          연결되지 않으며, 브라우저 저장소를 지우면 기록도 함께 사라집니다.
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
          <li>· 선택지는 두 개(A/B)이며, 하나는 반드시 ‘다음 화’로 이어지도록 설계하는 편이 좋습니다.</li>
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
