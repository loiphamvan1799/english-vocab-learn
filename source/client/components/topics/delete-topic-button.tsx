'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { deleteTopic } from '@/features/topics/topics-api';

export function DeleteTopicButton({ topicId, topicTitle }: { topicId: string; topicTitle: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const cancelButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, busy]);

  async function confirmDelete() {
    setBusy(true);
    setError('');
    try {
      await deleteTopic(topicId);
      router.replace('/topics');
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể xóa chủ đề lúc này.');
      setBusy(false);
    }
  }

  return <>
    <button type="button" onClick={() => { setOpen(true); setError(''); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"><span aria-hidden="true">⌫</span>Xóa chủ đề</button>
    {open ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setOpen(false); }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="delete-topic-title" aria-describedby="delete-topic-description" className="w-full max-w-md rounded-[28px] border border-white/60 bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-xl text-rose-700" aria-hidden="true">!</div>
        <h2 id="delete-topic-title" className="mt-5 text-xl font-semibold tracking-tight text-slate-950">Xóa “{topicTitle}”?</h2>
        <p id="delete-topic-description" className="mt-2 text-sm leading-6 text-slate-600">Chủ đề, từ vựng, tiến độ học và liên kết bộ sưu tập của các từ sẽ bị xóa vĩnh viễn. Lịch sử quiz vẫn được giữ nhưng không còn liên kết với chủ đề này.</p>
        {error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button ref={cancelButton} type="button" disabled={busy} onClick={() => setOpen(false)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Hủy, giữ lại</button><button type="button" disabled={busy} onClick={confirmDelete} className="min-h-11 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:bg-rose-300">{busy ? 'Đang xóa…' : 'Xóa chủ đề'}</button></div>
      </section>
    </div> : null}
  </>;
}
