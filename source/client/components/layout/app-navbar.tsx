'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { TopicSwitcher } from '@/components/layout/topic-switcher';
import { getTopics, searchWords } from '@/features/topics/topics-api';
import type { TopicSummary, WordItem } from '@/features/topics/topic-types';

const navItems = [
  { href: '/', label: 'Trang chủ' },
  { href: '/topics', label: 'Chủ đề' },
  { href: '/collections', label: 'Bộ sưu tập' },
  { href: '/quiz', label: 'Quiz' },
  { href: '/statistics', label: 'Thống kê' },
  { href: '/profile', label: 'Hồ sơ' },
];

export function AppNavbar() {
  const pathname = usePathname();
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<WordItem[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useEffect(() => {
    getTopics()
      .then(setTopics)
      .catch(() => setTopics([]));
  }, []);

  useEffect(() => {
    const trimmed = search.trim();

    if (!trimmed) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      searchWords(trimmed)
        .then(setResults)
        .catch(() => setResults([]));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[76px] flex-wrap items-center gap-4 py-2 xl:gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-3 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
              EV
            </span>
            <div className="hidden leading-tight sm:block">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Study app
              </div>
              <div className="whitespace-nowrap text-sm font-bold text-slate-900">English Vocabulary</div>
            </div>
          </Link>

          <nav className="order-last hidden basis-full items-center justify-center gap-1 border-t border-slate-100 py-2 md:flex">
            {navItems.map((item) => {
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-semibold transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                  ].join(' ')}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="relative hidden w-56 shrink-0 md:block">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm từ vựng..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              aria-label="Tìm từ vựng"
            />
            <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              ⌕
            </span>
            {search.trim() ? (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                {results.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-500">Không có kết quả nào.</div>
                ) : (
                  <ul className="max-h-64 overflow-auto p-1">
                    {results.map((result) => (
                      <li key={result.id}>
                        <Link
                          href={`/topics/${encodeURIComponent(result.topic_id)}`}
                          className="block rounded-xl px-3 py-2 text-left text-sm transition hover:bg-slate-100"
                        >
                          <div className="font-semibold text-slate-800">{result.chunk}</div>
                          <div className="text-slate-500">{result.meaning_vi}</div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>

          <Link
            href="/topics/new"
            className="hidden shrink-0 whitespace-nowrap rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 md:inline-flex"
          >
            Thêm chủ đề
          </Link>

          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
            aria-expanded={isMenuOpen}
            aria-label="Mở menu điều hướng"
          >
            <span aria-hidden="true" className="text-base leading-none">☰</span>
            Menu
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-sm md:hidden">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 sm:grid-cols-3">
            {navItems.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={[
                    'rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100',
                  ].join(' ')}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mx-auto mt-4 max-w-7xl border-t border-slate-100 pt-4">
            <Link
              href="/topics/new"
              onClick={() => setIsMenuOpen(false)}
              className="mb-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              + Thêm chủ đề
            </Link>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Chủ đề</div>
            <TopicSwitcher topics={topics} />
          </div>
        </div>
      ) : null}
    </header>
  );
}
