'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { DeleteTopicButton } from '@/components/topics/delete-topic-button';
import { ErrorState } from '@/components/ui/error-state';
import { getTopic } from '@/features/topics/topics-api';
import type { TopicDetail } from '@/features/topics/topic-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

function mediaUrl(source: string | null): string | null {
  if (!source) return null;
  if (source.startsWith('/uploads/')) return `${API_BASE_URL}${source}`;
  return source;
}

function WordImage({ src, alt, className = '' }: { src: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const resolved = mediaUrl(src);
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-rose-100 via-pink-50 to-orange-50 ${className}`}>
      <span className="select-none text-5xl drop-shadow-sm" aria-hidden="true">🍓</span>
      {resolved && !failed ? <img src={resolved} alt={alt} loading="lazy" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : null}
      {failed ? <span className="absolute bottom-2 right-2 rounded-full bg-white/80 px-2 py-1 text-[10px] font-medium text-slate-600">Ảnh minh họa</span> : null}
    </div>
  );
}

function SpeakButton({ text, audioSrc, lang = 'en-US', label = 'Nghe phát âm', compact = false }: { text: string; audioSrc: string | null; lang?: string; label?: string; compact?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => () => {
    audioRef.current?.pause();
    if (speechRef.current && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  async function play() {
    audioRef.current?.pause();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setPlaying(true);
    const source = mediaUrl(audioSrc);
    if (source) {
      const audio = new Audio(source);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => {
        audioRef.current = null;
        speakWithBrowser();
      };
      try {
        await audio.play();
        return;
      } catch {
        speakWithBrowser();
        return;
      }
    }
    speakWithBrowser();
  }

  function speakWithBrowser() {
    if (!('speechSynthesis' in window)) {
      setPlaying(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang || 'en-US';
    utterance.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((item) => item.lang.toLowerCase() === utterance.lang.toLowerCase()) ?? voices.find((item) => item.lang.toLowerCase().startsWith('en'));
    if (voice) utterance.voice = voice;
    utterance.onend = utterance.onerror = () => setPlaying(false);
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <button type="button" onClick={play} className={`group/speak inline-flex shrink-0 items-center justify-center gap-2 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${compact ? 'h-10 w-10 rounded-full bg-pink-50 text-pink-700 hover:bg-pink-100' : 'min-h-10 rounded-xl border border-pink-100 bg-white px-3 text-xs font-semibold text-pink-700 shadow-sm hover:border-pink-200 hover:bg-pink-50'}`} aria-label={`${playing ? 'Đang phát' : label}: ${text}`} title={audioSrc ? 'Phát âm thanh nguồn' : 'Phát âm bằng giọng đọc của trình duyệt'}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>
      {!compact ? <span>{playing ? 'Đang nghe' : label}</span> : null}
    </button>
  );
}

function HighlightedExample({ text }: { text: string }) {
  const parts = text.split(/\[\[(.*?)\]\]/g);
  return <>{parts.map((part, index) => index % 2 === 1 ? <mark key={index} className="rounded-md bg-pink-100 px-1.5 py-0.5 font-semibold text-pink-900">{part}</mark> : <span key={index}>{part}</span>)}</>;
}

export default function TopicDetailPage() {
  const params = useParams<{ topicId: string }>();
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getTopic(params.topicId).then((result) => { if (active) setTopic(result); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Không thể tải chủ đề.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.topicId]);

  const visibleWords = useMemo(() => {
    if (!topic) return [];
    const query = search.trim().toLocaleLowerCase();
    if (!query) return topic.words;
    return topic.words.filter((word) => `${word.chunk} ${word.name_vi} ${word.meaning_vi} ${word.example_en} ${word.example_vi}`.toLocaleLowerCase().includes(query));
  }, [search, topic]);

  if (loading) return <main className="min-h-screen bg-[#fff8fb]"><div className="mx-auto max-w-7xl px-4 py-12"><div className="h-8 w-32 animate-pulse rounded-full bg-pink-100" /><div className="mt-6 h-72 animate-pulse rounded-[36px] bg-white shadow-sm" /><div className="mt-8 grid gap-5 md:grid-cols-2">{[0, 1, 2, 3].map((item) => <div key={item} className="h-64 animate-pulse rounded-[28px] bg-white" />)}</div></div></main>;
  if (error || !topic) return <main className="mx-auto max-w-5xl px-4 py-12"><ErrorState title="Không thể mở chủ đề" message={error || 'Không tìm thấy chủ đề này.'} onRetry={() => { setError(''); setLoading(true); getTopic(params.topicId).then(setTopic).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Không thể tải chủ đề.')).finally(() => setLoading(false)); }} /></main>;

  const imageCount = topic.words.filter((word) => word.image_url).length;
  const sourceAudioCount = topic.words.filter((word) => word.audio_url || word.audio_uk_url || word.audio_us_url).length;

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-pink-100/70 via-[#fffafd] to-violet-50/50 pb-16">
      <div className="pointer-events-none fixed -right-24 top-48 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/topics" className="inline-flex items-center gap-2 rounded-full border border-white bg-white/75 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur transition hover:-translate-x-0.5 hover:text-pink-700">
            <span aria-hidden="true">←</span> Thư viện chủ đề
          </Link>
          <DeleteTopicButton topicId={topic.id} topicTitle={topic.title} />
        </div>

        <header className="relative mt-5 overflow-hidden rounded-[32px] border border-white/90 bg-white/85 shadow-[0_24px_70px_rgba(190,24,93,0.10)] backdrop-blur sm:rounded-[40px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(251,207,232,0.7),transparent_38%),radial-gradient(circle_at_85%_85%,rgba(237,233,254,0.75),transparent_38%)]" aria-hidden="true" />
          <div className="relative grid items-center gap-8 p-6 sm:p-9 lg:grid-cols-[1.15fr_0.85fr] lg:p-12">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-100 bg-white/80 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-pink-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-pink-500 shadow-[0_0_0_4px_rgba(236,72,153,0.12)]" />
                Góc học tập của bạn
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {topic.category ? <span className="rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold text-pink-800">{topic.category}</span> : null}
                {topic.level ? <span className="rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold text-violet-800">{topic.level}</span> : null}
                {topic.lang ? <span className="rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-600">{topic.lang}</span> : null}
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">{topic.title}</h1>
              {topic.description ? <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">{topic.description}</p> : null}
              <p className="mt-3 text-sm font-medium text-slate-500">Mỗi cụm từ mới là một bước tiến. Học theo nhịp của riêng bạn nhé!</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a href="#vocabulary" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-500 px-6 text-sm font-bold text-white shadow-[0_10px_24px_rgba(219,39,119,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(219,39,119,0.34)] focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2">
                  Bắt đầu học <span aria-hidden="true">✦</span>
                </a>
                <span className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white bg-white/80 px-4 text-sm font-semibold text-slate-600 shadow-sm">
                  <span className="text-pink-600">♫</span> Có thể nghe phát âm
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
              <div className="absolute -inset-4 rounded-[34px] bg-gradient-to-br from-pink-200/60 to-violet-200/50 blur-xl" aria-hidden="true" />
              <div className="relative grid grid-cols-[1.15fr_0.85fr] grid-rows-2 gap-3 rounded-[30px] border border-white bg-white/65 p-3 shadow-[0_18px_55px_rgba(30,20,40,0.12)] backdrop-blur">
                <WordImage src={topic.words[0]?.image_url ?? null} alt={topic.words[0]?.name_vi ?? topic.title} className="group row-span-2 min-h-[230px] rounded-[23px] sm:min-h-[280px]" />
                <WordImage src={topic.words[1]?.image_url ?? null} alt={topic.words[1]?.name_vi ?? topic.title} className="group min-h-[108px] rounded-[23px] sm:min-h-[132px]" />
                <div className="flex min-h-[108px] flex-col justify-center rounded-[23px] bg-gradient-to-br from-pink-100 to-rose-50 p-4 sm:min-h-[132px] sm:p-5">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-pink-700">Hôm nay</span>
                  <span className="mt-2 text-lg font-extrabold leading-tight text-slate-900">Bạn học thêm được bao nhiêu?</span>
                  <span className="mt-1 text-xs text-slate-600">Chỉ cần bắt đầu với một từ.</span>
                </div>
                <div className="absolute -bottom-4 -left-4 flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-pink-500 to-rose-500 text-xl text-white shadow-lg" aria-hidden="true">✿</div>
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-2 border-t border-pink-100/80 bg-white/65 sm:grid-cols-4">
            <div className="border-b border-r border-pink-100/80 px-5 py-4 sm:border-b-0 sm:px-7 sm:py-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Từ vựng</p><p className="mt-1 text-xl font-extrabold text-slate-900">{topic.words.length}<span className="ml-1 text-sm font-semibold text-slate-500">mục</span></p></div>
            <div className="border-b border-pink-100/80 px-5 py-4 sm:border-b-0 sm:border-r sm:px-7 sm:py-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Có hình ảnh</p><p className="mt-1 text-xl font-extrabold text-slate-900">{imageCount}<span className="ml-1 text-sm font-semibold text-slate-500">ảnh</span></p></div>
            <div className="border-r border-pink-100/80 px-5 py-4 sm:px-7 sm:py-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Audio nguồn</p><p className="mt-1 text-xl font-extrabold text-slate-900">{sourceAudioCount}<span className="ml-1 text-sm font-semibold text-slate-500">tệp</span></p></div>
            <div className="px-5 py-4 sm:px-7 sm:py-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Phát âm</p><p className="mt-1 text-xl font-extrabold text-pink-700">Speech <span className="text-sm">ready</span></p></div>
          </div>
        </header>

        <section id="vocabulary" className="scroll-mt-28 pt-10 sm:pt-14">
          <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-pink-600">Từ vựng của bạn</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Khám phá từng cụm từ</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Hình ảnh giúp ghi nhớ, ví dụ giúp hiểu cách dùng — hãy nghe và đọc thành tiếng.</p>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <span className="sr-only">Tìm từ trong chủ đề</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm cụm từ, nghĩa…" className="h-12 w-full rounded-2xl border border-pink-100 bg-white/90 pl-11 pr-4 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-pink-300 focus:ring-4 focus:ring-pink-100" />
            </label>
          </div>

          {visibleWords.length ? (
            <ol className="grid grid-cols-1 gap-5">
              {visibleWords.map((word) => (
                <li id={`word-${word.position}`} key={word.id} className="group overflow-hidden rounded-[28px] border border-pink-100/80 bg-white shadow-[0_8px_28px_rgba(60,30,50,0.055)] transition duration-300 hover:-translate-y-1 hover:border-pink-200 hover:shadow-[0_18px_42px_rgba(190,24,93,0.12)]">
                  <article className="grid h-full sm:grid-cols-[190px_minmax(0,1fr)]">
                    <div className="relative min-h-[205px] sm:min-h-full">
                      <WordImage src={word.image_url} alt={word.name_vi} className="group h-full min-h-[205px] sm:absolute sm:inset-0" />
                      <span className="absolute left-4 top-4 inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-white/60 bg-slate-950/65 px-2 text-xs font-extrabold tabular-nums text-white shadow backdrop-blur">{String(word.position).padStart(2, '0')}</span>
                      {word.audio_url || word.audio_uk_url || word.audio_us_url ? <span className="absolute bottom-4 left-4 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-pink-700 shadow-sm">Audio nguồn</span> : null}
                    </div>
                    <div className="flex min-w-0 flex-col p-5 sm:p-6">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <div className="min-w-0">
                          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-pink-600">Cụm từ · {String(word.position).padStart(2, '0')}</p>
                          <h3 className="mt-2 break-words text-xl font-extrabold leading-snug tracking-tight text-slate-950 sm:text-[22px]">{word.chunk}</h3>
                        </div>
                        <SpeakButton text={word.chunk} audioSrc={word.audio_url ?? word.audio_us_url ?? word.audio_uk_url} lang={topic.lang ?? 'en-US'} compact />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {word.ipa ? <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800">{word.ipa}</span> : null}
                        {word.ipa_us ? <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500">US {word.ipa_us}</span> : null}
                        {word.ipa_uk ? <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500">UK {word.ipa_uk}</span> : null}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-pink-100 bg-pink-50 px-3 py-1.5 text-xs font-bold text-pink-800">{word.name_vi}</span>
                        {word.part_of_speech ? <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{word.part_of_speech}</span> : null}
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{word.meaning_vi}</p>

                      <div className="mt-4 rounded-2xl border border-pink-100/80 bg-gradient-to-br from-pink-50/90 to-rose-50/50 p-4">
                        <div className="flex items-center justify-start gap-2">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-pink-700">Trong ngữ cảnh</p>
                          <SpeakButton text={word.example_en.replace(/\[\[(.*?)\]\]/g, '$1')} audioSrc={word.audio_url ?? word.audio_us_url ?? word.audio_uk_url} lang={topic.lang ?? 'en-US'} label="Nghe ví dụ" compact />
                        </div>
                        <p className="mt-2 text-sm font-medium leading-6 text-slate-800"><HighlightedExample text={word.example_en} /></p>
                        <p className="mt-1.5 border-t border-pink-100/80 pt-2 text-xs leading-5 text-slate-600">{word.example_vi}</p>
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ol>
          ) : (
            <div className="rounded-[28px] border border-dashed border-pink-200 bg-white/80 px-6 py-14 text-center shadow-sm">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-2xl" aria-hidden="true">⌕</span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Không tìm thấy cụm từ phù hợp</h3>
              <p className="mt-1 text-sm text-slate-500">Thử một từ khóa khác hoặc xóa nội dung tìm kiếm.</p>
              {search ? <button type="button" onClick={() => setSearch('')} className="mt-4 rounded-xl bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700">Xóa tìm kiếm</button> : null}
            </div>
          )}
        </section>

        <footer className="mt-10 rounded-[28px] border border-pink-100 bg-gradient-to-r from-pink-100/80 via-rose-50 to-violet-100/70 p-6 text-center sm:p-8">
          <span className="text-2xl" aria-hidden="true">🌸</span>
          <p className="mt-2 text-lg font-extrabold text-slate-900">Bạn đang tiến bộ từng chút một</p>
          <p className="mt-1 text-sm text-slate-600">Ôn lại vài cụm từ hôm nay sẽ giúp bạn ghi nhớ lâu hơn.</p>
          <a href="#vocabulary" className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl border border-pink-200 bg-white px-4 text-sm font-bold text-pink-700 shadow-sm transition hover:bg-pink-50">Tiếp tục ôn tập ↑</a>
        </footer>
      </div>
    </main>
  );
}
