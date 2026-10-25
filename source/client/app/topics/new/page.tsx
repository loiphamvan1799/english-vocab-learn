'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ImportDropzone } from '@/components/import/import-dropzone';
import { ImportPreview } from '@/components/import/import-preview';
import { ImportStepper } from '@/components/import/import-stepper';
import { confirmTopicImport, previewTopicImport } from '@/features/topics/topics-api';
import type { TopicImportPreview } from '@/features/topics/topic-types';

function readableError(error: unknown): string {
  if (!(error instanceof Error)) return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
  if (error.message === 'Failed to fetch' || error.message === 'Load failed') return 'Không thể kết nối tới máy chủ. Hãy kiểm tra API đang chạy rồi thử lại.';
  return error.message || 'Không thể xử lý tệp lúc này. Vui lòng thử lại.';
}

export default function NewTopicImportPage() {
  const router = useRouter();
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [assetFiles, setAssetFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<TopicImportPreview | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'overwrite' | 'create-copy'>('create-copy');

  async function runPreview() {
    if (!htmlFile) return;
    setError('');
    setBusy(true);
    try {
      const result = await previewTopicImport(htmlFile, assetFiles);
      setPreview(result);
      setMode(result.conflict ? 'create-copy' : 'create-copy');
      setStep(2);
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setBusy(false);
    }
  }

  async function cancelPreview() {
    if (preview) {
      try { await confirmTopicImport(preview.previewId, 'cancel'); } catch { /* best-effort cleanup; expiry handles failures */ }
    }
    setPreview(null);
    setStep(1);
    setError('');
  }

  async function confirmImport() {
    if (!preview) return;
    setError('');
    setBusy(true);
    try {
      const result = await confirmTopicImport(preview.previewId, preview.conflict ? mode : 'create-copy');
      if (result.cancelled) {
        setPreview(null);
        setStep(1);
        return;
      }
      setStep(3);
      const topicId = result.topicId ?? preview.topic.id;
      window.setTimeout(() => router.push(`/topics/${encodeURIComponent(topicId)}`), 1200);
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-76px)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-50/80 via-[#fbfaff] to-slate-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Link href="/topics" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-rose-700"><span aria-hidden="true">←</span> Quay lại chủ đề</Link>
        <header className="mt-7 max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.13em] text-rose-700 shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Nhập nội dung an toàn</div><h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Thêm chủ đề học tập</h1><p className="mt-3 text-base leading-7 text-slate-600">Đưa bộ từ vựng của bạn vào thư viện. Hãy xem lại nội dung trước khi lưu — tệp HTML sẽ không được thực thi.</p></header>

        <div className="mt-8"><ImportStepper currentStep={step} /></div>

        {step === 1 ? <section className="mt-6 rounded-[32px] border border-white/80 bg-white/80 p-4 shadow-[0_20px_70px_rgba(41,29,48,0.08)] backdrop-blur sm:p-7"><ImportDropzone htmlFile={htmlFile} assetFiles={assetFiles} onHtmlChange={setHtmlFile} onAssetsChange={setAssetFiles} />{error ? <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}<div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-500">Chỉ hỗ trợ HTML theo cấu trúc dữ liệu chủ đề. Media được kiểm tra riêng.</p><button type="button" disabled={!htmlFile || busy} onClick={runPreview} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(190,24,93,0.2)] transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2">{busy ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Đang kiểm tra…</> : <>Kiểm tra và xem trước <span aria-hidden="true">→</span></>}</button></div></section> : null}

        {step === 2 && preview ? <div className="mt-6 space-y-5"><ImportPreview preview={preview} />{preview.conflict ? <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h3 className="font-semibold text-slate-900">Cách xử lý chủ đề trùng</h3><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${mode === 'create-copy' ? 'border-rose-300 bg-rose-50/60 ring-1 ring-rose-200' : 'border-slate-200 hover:bg-slate-50'}`}><input type="radio" name="duplicate-mode" value="create-copy" checked={mode === 'create-copy'} onChange={() => setMode('create-copy')} className="mt-1 accent-rose-600" /><span><span className="block text-sm font-semibold text-slate-900">Tạo bản mới</span><span className="mt-1 block text-xs leading-5 text-slate-500">Giữ nguyên chủ đề hiện tại và tạo một bản sao độc lập.</span></span></label><label className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${mode === 'overwrite' ? 'border-rose-300 bg-rose-50/60 ring-1 ring-rose-200' : 'border-slate-200 hover:bg-slate-50'}`}><input type="radio" name="duplicate-mode" value="overwrite" checked={mode === 'overwrite'} onChange={() => setMode('overwrite')} className="mt-1 accent-rose-600" /><span><span className="block text-sm font-semibold text-slate-900">Ghi đè và đồng bộ</span><span className="mt-1 block text-xs leading-5 text-slate-500">Các từ cùng mã nguồn sẽ giữ tiến độ học hiện có.</span></span></label></div></section> : null}{error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}<div className="sticky bottom-3 flex flex-col-reverse gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:justify-between"><button type="button" disabled={busy} onClick={cancelPreview} className="min-h-11 rounded-xl px-5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Hủy và chọn lại</button><button type="button" disabled={busy} onClick={confirmImport} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:bg-slate-300">{busy ? 'Đang lưu…' : 'Xác nhận và lưu chủ đề'} <span aria-hidden="true">→</span></button></div></div> : null}

        {step === 3 ? <section className="mt-8 overflow-hidden rounded-[32px] border border-emerald-100 bg-white text-center shadow-[0_20px_70px_rgba(41,29,48,0.08)]"><div className="bg-gradient-to-b from-emerald-50 to-white px-6 py-14"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">✓</div><p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Đã hoàn tất</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Chủ đề đã sẵn sàng</h2><p className="mt-2 text-sm text-slate-500">Đang đưa bạn đến trang học…</p></div></section> : null}
      </div>
    </div>
  );
}
