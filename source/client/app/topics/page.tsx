'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { ErrorState } from '@/components/ui/error-state';
import { getTopics } from '@/features/topics/topics-api';
import type { TopicSummary } from '@/features/topics/topic-types';

export default function TopicsPage() {
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setLoading(true);
    setError('');
    getTopics().then(setTopics).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Không thể tải danh sách chủ đề.')).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  return <PageContainer title="Chủ đề" description="Không gian lưu trữ và khám phá các bộ từ vựng của bạn." action={<Link href="/topics/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"><span aria-hidden="true">＋</span>Thêm chủ đề</Link>}>
    {error ? <ErrorState title="Không tải được chủ đề" message={error} onRetry={load} /> : loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-52 animate-pulse rounded-3xl border border-slate-100 bg-white" />)}</div> : topics.length === 0 ? <section className="rounded-[32px] border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-2xl text-rose-700">✦</span><h2 className="mt-5 text-xl font-semibold text-slate-900">Thư viện của bạn đang chờ chủ đề đầu tiên</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Import bộ từ vựng từ tệp HTML để bắt đầu học và theo dõi tiến độ.</p><Link href="/topics/new" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-700">Import chủ đề đầu tiên <span className="ml-2">→</span></Link></section> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{topics.map((topic, index) => <Link key={topic.id} href={`/topics/${encodeURIComponent(topic.id)}`} className="group overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-1 hover:border-rose-200 hover:shadow-[0_16px_40px_rgba(30,20,40,0.09)] focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"><div className={`relative h-28 overflow-hidden ${['bg-gradient-to-br from-rose-100 via-orange-50 to-amber-50', 'bg-gradient-to-br from-violet-100 via-fuchsia-50 to-rose-50', 'bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-50'][index % 3]}`}><div className="absolute -right-3 -top-10 h-36 w-36 rounded-full border-[18px] border-white/30"/><div className="absolute bottom-4 left-5 flex gap-2">{topic.category ? <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">{topic.category}</span> : null}{topic.level ? <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">{topic.level}</span> : null}</div></div><div className="p-5"><div className="flex items-start justify-between gap-3"><h2 className="text-lg font-semibold tracking-tight text-slate-900 group-hover:text-rose-800">{topic.title}</h2><span aria-hidden="true" className="mt-1 text-slate-300 transition group-hover:translate-x-1 group-hover:text-rose-600">→</span></div>{topic.description ? <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{topic.description}</p> : <p className="mt-2 min-h-10 text-sm text-slate-400">Bắt đầu học chủ đề này.</p>}<div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-sm font-medium text-slate-600">{topic.word_count} từ vựng</span><span className="text-xs font-semibold text-rose-700">Mở chủ đề</span></div></div></Link>)}</div>}
  </PageContainer>;
}
