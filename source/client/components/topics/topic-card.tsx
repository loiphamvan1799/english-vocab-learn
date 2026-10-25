import Link from 'next/link';

import type { DashboardTopic } from '@/features/topics/dashboard-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

const statusLabels = {
  not_started: 'Chưa bắt đầu',
  in_progress: 'Đang học',
  completed: 'Hoàn thành',
} as const;

const statusStyles = {
  not_started: 'border-slate-200 bg-white text-slate-600',
  in_progress: 'border-pink-200 bg-pink-50 text-pink-800',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
} as const;

function imageSource(source: string | null): string | null {
  if (!source) return null;
  return source.startsWith('/uploads/') ? `${API_BASE_URL}${source}` : source;
}

export function TopicCard({ topic, index }: { topic: DashboardTopic; index: number }) {
  const image = imageSource(topic.image_url);
  const backgrounds = [
    'from-pink-100 via-rose-50 to-orange-50',
    'from-violet-100 via-fuchsia-50 to-pink-50',
    'from-emerald-100 via-teal-50 to-cyan-50',
    'from-amber-100 via-orange-50 to-rose-50',
  ];

  return (
    <Link
      href={`/topics/${encodeURIComponent(topic.id)}`}
      className="group overflow-hidden rounded-[26px] border border-pink-100/80 bg-white shadow-[0_8px_28px_rgba(60,30,50,0.045)] transition duration-200 hover:-translate-y-1 hover:border-pink-200 hover:shadow-[0_16px_38px_rgba(190,24,93,0.11)] focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
    >
      <div className={`relative h-36 overflow-hidden bg-gradient-to-br ${backgrounds[index % backgrounds.length]}`}>
        <div className="absolute -right-7 -top-12 h-40 w-40 rounded-full border-[22px] border-white/35" aria-hidden="true" />
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
          {topic.category ? <span className="rounded-full border border-white/70 bg-white/85 px-3 py-1 text-[11px] font-bold text-slate-700 shadow-sm backdrop-blur">{topic.category}</span> : null}
          {topic.level ? <span className="rounded-full border border-white/70 bg-white/85 px-3 py-1 text-[11px] font-bold text-slate-700 shadow-sm backdrop-blur">{topic.level}</span> : null}
        </div>
        <div className="absolute right-4 top-4 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 text-xs font-extrabold text-pink-800 shadow-sm backdrop-blur">
          {topic.word_count} từ
        </div>
        {image ? <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-80 transition duration-500 group-hover:scale-105" onError={(event) => { event.currentTarget.remove(); }} /> : null}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 break-words text-lg font-extrabold leading-snug text-slate-900 transition group-hover:text-pink-800">{topic.title}</h3>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyles[topic.status]}`}>{statusLabels[topic.status]}</span>
        </div>
        {topic.description ? <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{topic.description}</p> : <p className="mt-2 min-h-10 text-sm leading-5 text-slate-400">Một chủ đề mới đang chờ bạn khám phá.</p>}

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">Đã thuộc</span>
            <span className="font-bold tabular-nums text-slate-700">{topic.mastered_count}/{topic.word_count} <span className="text-pink-700">· {topic.progress}%</span></span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-pink-50" role="progressbar" aria-label={`Tiến độ ${topic.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={topic.progress}>
            <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-500" style={{ width: `${topic.progress}%` }} />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs font-medium text-slate-500">{topic.studied_count} từ đã học</span>
          <span className="inline-flex items-center gap-1 text-sm font-extrabold text-pink-700 transition group-hover:gap-2">Mở chủ đề <span aria-hidden="true">→</span></span>
        </div>
      </div>
    </Link>
  );
}
