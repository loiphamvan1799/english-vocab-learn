'use client';

import Link from 'next/link';

import type { TopicSummary } from '@/features/topics/topic-types';

type TopicSwitcherProps = {
  topics: TopicSummary[];
};

export function TopicSwitcher({ topics }: TopicSwitcherProps) {
  if (topics.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
        Chưa có chủ đề nào.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {topics.map((topic) => (
        <Link
          key={topic.id}
          href={`/topics/${encodeURIComponent(topic.id)}`}
          className={[
            'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
            topic.status === 'completed'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : topic.status === 'in_progress'
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
          ].join(' ')}
          aria-label={`Mở chủ đề ${topic.title}`}
        >
          {topic.title}
        </Link>
      ))}
    </div>
  );
}
