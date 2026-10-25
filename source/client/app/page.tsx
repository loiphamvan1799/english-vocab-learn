'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { TopicCard } from '@/components/topics/topic-card';
import { ErrorState } from '@/components/ui/error-state';
import { getDashboard } from '@/features/topics/dashboard-api';
import type { DashboardSummary } from '@/features/topics/dashboard-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

function imageSource(source: string | null): string | null {
  if (!source) return null;
  return source.startsWith('/uploads/') ? `${API_BASE_URL}${source}` : source;
}

function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-[#fff9fc]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-5 w-36 animate-pulse rounded-full bg-pink-100" />
        <div className="mt-5 h-72 animate-pulse rounded-[34px] bg-white shadow-sm" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-3xl bg-white" />)}</div>
        <div className="mt-10 h-8 w-60 animate-pulse rounded bg-pink-100" />
        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-80 animate-pulse rounded-[26px] bg-white" />)}</div>
      </div>
    </main>
  );
}

function MetricCard({ label, value, detail, icon, tint }: { label: string; value: string | number; detail: string; icon: string; tint: string }) {
  return (
    <section className="flex min-w-0 items-center gap-4 rounded-[24px] border border-white bg-white/90 p-5 shadow-[0_8px_26px_rgba(60,30,50,0.045)] sm:p-6">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${tint}`} aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-extrabold leading-none tabular-nums text-slate-900">{value}</p>
        <p className="mt-1.5 truncate text-xs text-slate-500">{detail}</p>
      </div>
    </section>
  );
}

function EmptyDashboard() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-pink-100/70 via-[#fffafd] to-violet-50/60">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="relative overflow-hidden rounded-[36px] border border-white bg-white/80 p-7 shadow-[0_24px_70px_rgba(190,24,93,0.09)] backdrop-blur sm:p-12 lg:p-16">
          <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border-[44px] border-pink-100/60" aria-hidden="true" />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-pink-100 bg-pink-50 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-pink-800"><span className="h-2 w-2 rounded-full bg-pink-500" /> Bắt đầu hành trình</span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl">Một chủ đề nhỏ,<br /><span className="text-pink-600">một bước tiến lớn.</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">Thêm bộ từ vựng đầu tiên để tạo không gian học của riêng bạn. Mỗi ngày một ít, bạn sẽ ngạc nhiên với những gì mình nhớ được.</p>
            <Link href="/topics/new" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-500 px-6 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(219,39,119,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(219,39,119,0.32)] focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2">Thêm chủ đề đầu tiên <span aria-hidden="true">→</span></Link>
          </div>
          <div className="relative mt-10 grid max-w-2xl grid-cols-3 gap-3 sm:mt-12">
            {[['01', 'Chọn chủ đề'], ['02', 'Học theo cụm'], ['03', 'Tiến bộ mỗi ngày']].map(([number, label]) => <div key={number} className="rounded-2xl border border-pink-100/80 bg-white/85 p-3 shadow-sm sm:p-4"><span className="text-xs font-extrabold text-pink-600">{number}</span><p className="mt-1 text-xs font-semibold leading-5 text-slate-700 sm:text-sm">{label}</p></div>)}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function HomePage() {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getDashboard()
      .then((result) => { if (active) setDashboard(result); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Không thể tải tổng quan học tập.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return <main className="min-h-screen bg-[#fff9fc] px-4 py-12"><div className="mx-auto max-w-3xl"><ErrorState title="Chưa tải được trang chủ" message={error} onRetry={() => window.location.reload()} /></div></main>;
  if (!dashboard || dashboard.topics.length === 0) return <EmptyDashboard />;

  const { overview, resume, topics } = dashboard;
  const focusTopic = resume ? topics.find((topic) => topic.id === resume.topicId) : topics.find((topic) => topic.word_count > 0);
  const progressPercent = overview.dailyWordGoal > 0 ? Math.min(100, Math.round((overview.studiedToday / overview.dailyWordGoal) * 100)) : 0;
  const remainingWords = Math.max(overview.dailyWordGoal - overview.studiedToday, 0);
  const resumeImage = imageSource(resume?.imageUrl ?? focusTopic?.image_url ?? null);
  const resumeHref = resume ? `/topics/${encodeURIComponent(resume.topicId)}#word-${resume.position}` : focusTopic ? `/topics/${encodeURIComponent(focusTopic.id)}#vocabulary` : '/topics';

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-pink-100/60 via-[#fffafd] to-violet-50/45 pb-16">
      <div className="pointer-events-none fixed -right-24 top-56 h-80 w-80 rounded-full bg-pink-200/25 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-pink-600">Không gian học tập của bạn</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Chào bạn, hôm nay mình học nhé!</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">Một chút tập trung hôm nay sẽ thành sự tự tin ngày mai.</p>
          </div>
          <Link href="/topics/new" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-pink-200 bg-white/90 px-4 text-sm font-bold text-pink-700 shadow-sm transition hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 sm:self-auto"><span aria-hidden="true">＋</span> Thêm chủ đề</Link>
        </header>

        <section className="relative overflow-hidden rounded-[32px] border border-white/90 bg-white shadow-[0_20px_60px_rgba(190,24,93,0.09)] sm:rounded-[38px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_5%,rgba(251,207,232,0.72),transparent_42%),radial-gradient(circle_at_90%_100%,rgba(237,233,254,0.72),transparent_42%)]" aria-hidden="true" />
          <div className="relative grid items-center gap-7 p-6 sm:p-9 lg:grid-cols-[1.15fr_0.85fr] lg:p-11">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-100 bg-white/80 px-3 py-1.5 text-xs font-bold text-pink-800 shadow-sm"><span className="h-2 w-2 rounded-full bg-pink-500" /> {resume?.hasProgress ? 'Tiếp tục hành trình' : 'Sẵn sàng khám phá'}</div>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl">{resume?.hasProgress ? 'Bạn đang học rất tốt.' : 'Chọn một chủ đề để bắt đầu.'}<br /><span className="text-pink-600">Cứ đều đặn là sẽ giỏi!</span></h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">{resume?.hasProgress ? 'Tiếp tục từ đúng vị trí lần trước và giữ nhịp học thật nhẹ nhàng.' : 'Các bộ từ vựng của bạn đã sẵn sàng. Chọn một chủ đề và bắt đầu với cụm từ đầu tiên.'}</p>
              {resume || focusTopic ? (
                <div className="mt-6 flex flex-col gap-4 rounded-[24px] border border-pink-100 bg-white/85 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-pink-100 to-orange-50 text-2xl" aria-hidden="true">✿{resumeImage ? <img src={resumeImage} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.remove(); }} /> : null}</div>
                    <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-pink-600">{resume?.hasProgress ? `Tiếp tục · từ ${resume.position}` : 'Gợi ý bắt đầu'}</p><p className="mt-1 truncate text-base font-extrabold text-slate-900">{resume?.title ?? focusTopic?.title}</p><p className="mt-0.5 text-xs text-slate-500">{resume?.wordCount ?? focusTopic?.word_count ?? 0} từ vựng</p></div>
                  </div>
                  <Link href={resumeHref} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 px-5 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(219,39,119,0.22)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2">{resume?.hasProgress ? 'Học tiếp' : 'Bắt đầu học'} <span aria-hidden="true">→</span></Link>
                </div>
              ) : null}
            </div>

            <div className="relative mx-auto w-full max-w-md lg:ml-auto">
              <div className="absolute -inset-3 rounded-[30px] bg-gradient-to-br from-pink-200/70 to-violet-200/70 blur-xl" aria-hidden="true" />
              <div className="relative grid grid-cols-[1.1fr_0.9fr] grid-rows-2 gap-3 rounded-[27px] border border-white bg-white/65 p-3 shadow-[0_18px_50px_rgba(35,25,45,0.11)] backdrop-blur">
                <div className="relative row-span-2 flex min-h-[205px] items-end overflow-hidden rounded-[21px] bg-gradient-to-br from-rose-200 via-pink-100 to-orange-100 p-4 sm:min-h-[240px]">
                  {resumeImage ? <img src={resumeImage} alt={resume?.title ?? focusTopic?.title ?? 'Chủ đề học'} className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.remove(); }} /> : <span className="absolute inset-0 flex items-center justify-center text-7xl" aria-hidden="true">✿</span>}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
                  <div className="relative rounded-xl border border-white/30 bg-white/85 px-3 py-2 shadow-sm backdrop-blur"><p className="text-[10px] font-bold uppercase tracking-wide text-pink-700">Hôm nay</p><p className="text-sm font-extrabold text-slate-900">Học theo nhịp của bạn</p></div>
                </div>
                <div className="flex min-h-[96px] flex-col justify-center rounded-[21px] bg-gradient-to-br from-pink-100 to-rose-50 p-4"><span className="text-[10px] font-extrabold uppercase tracking-wide text-pink-700">Đã thuộc</span><span className="mt-1 text-2xl font-extrabold text-slate-900">{overview.masteredTotal}<span className="ml-1 text-xs font-semibold text-slate-500">từ</span></span></div>
                <div className="flex min-h-[96px] flex-col justify-center rounded-[21px] bg-gradient-to-br from-violet-100 to-fuchsia-50 p-4"><span className="text-[10px] font-extrabold uppercase tracking-wide text-violet-700">Chủ đề xong</span><span className="mt-1 text-2xl font-extrabold text-slate-900">{overview.completedTopics}<span className="ml-1 text-xs font-semibold text-slate-500">chủ đề</span></span></div>
                <span className="absolute -bottom-3 -right-2 flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-pink-500 to-rose-500 text-lg text-white shadow-lg" aria-hidden="true">✦</span>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Tổng quan học tập" className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Từ đã học" value={overview.studiedTotal} detail="Từ bạn đã bắt đầu ghi nhớ" icon="✎" tint="bg-pink-50 text-pink-700" />
          <MetricCard label="Đã thuộc" value={overview.masteredTotal} detail="Những cụm từ bạn đã làm chủ" icon="✦" tint="bg-rose-50 text-rose-700" />
          <MetricCard label="Mục tiêu hôm nay" value={`${overview.studiedToday}/${overview.dailyWordGoal}`} detail={remainingWords === 0 ? 'Bạn đã hoàn thành mục tiêu!' : `Còn ${remainingWords} từ để chạm mục tiêu`} icon="◎" tint="bg-violet-50 text-violet-700" />
          <MetricCard label="Chuỗi học" value={`${overview.currentStreak} ngày`} detail={overview.currentStreak > 0 ? 'Giữ nhịp học thật đều nhé' : 'Hôm nay là ngày đẹp để bắt đầu'} icon="⌁" tint="bg-orange-50 text-orange-700" />
        </section>

        <section className="mt-5 rounded-[26px] border border-pink-100 bg-white/90 p-5 shadow-[0_8px_26px_rgba(60,30,50,0.04)] sm:flex sm:items-center sm:gap-6 sm:p-6">
          <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-pink-700">Mục tiêu mỗi ngày</p><p className="mt-1 text-sm font-semibold text-slate-800">{remainingWords === 0 ? 'Tuyệt vời, bạn đã hoàn thành hôm nay.' : 'Tiến từng bước nhỏ, bạn sắp chạm mục tiêu rồi.'}</p></div><span className="shrink-0 text-sm font-extrabold tabular-nums text-pink-700">{progressPercent}%</span></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-pink-50" role="progressbar" aria-label="Tiến độ mục tiêu hôm nay" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}><div className="h-full rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-orange-300 transition-all duration-700" style={{ width: `${progressPercent}%` }} /></div></div>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-pink-50 to-violet-50 px-4 py-3 sm:mt-0 sm:w-64 sm:shrink-0"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl text-pink-600 shadow-sm" aria-hidden="true">♡</span><p className="text-xs font-semibold leading-5 text-slate-600">{overview.dailyWordGoal} từ mỗi ngày<br /><span className="font-normal text-slate-500">Vừa đủ để duy trì đà học</span></p></div>
        </section>

        <section className="mt-10 sm:mt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-extrabold uppercase tracking-[0.17em] text-pink-600">Thư viện của bạn</p><h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Chọn điều muốn khám phá</h2><p className="mt-1.5 text-sm text-slate-500">Mỗi chủ đề là một cánh cửa mới để bạn luyện tiếng Anh.</p></div>
            <Link href="/topics" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-pink-700 transition hover:bg-pink-50">Tất cả chủ đề <span aria-hidden="true">→</span></Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{topics.map((topic, index) => <TopicCard key={topic.id} topic={topic} index={index} />)}</div>
        </section>
      </div>
    </main>
  );
}
