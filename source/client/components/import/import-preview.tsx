'use client';

import type { TopicImportPreview } from '@/features/topics/topic-types';

const apiOrigin = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

function previewImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  return imageUrl.startsWith('/uploads/') ? `${apiOrigin}${imageUrl}` : imageUrl;
}

function friendlyWarning(message: string): string {
  return message.replace(/https?:\/\/[^\s]+/g, (value) => {
    try {
      return new URL(value.replace(/[.,]+$/, '')).hostname;
    } catch {
      return 'liên kết bên ngoài';
    }
  }).replace('Liên kết gốc sẽ được giữ lại.', 'Hệ thống sẽ giữ liên kết gốc.');
}

export function ImportPreview({ preview }: { preview: TopicImportPreview }) {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_36px_rgba(30,20,40,0.06)]">
        <div className="bg-gradient-to-br from-rose-50 via-white to-violet-50 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0"><div className="inline-flex rounded-full border border-rose-100 bg-white/80 px-3 py-1 text-xs font-semibold text-rose-700">{preview.topic.category ?? 'Chủ đề từ vựng'}{preview.topic.level ? ` · ${preview.topic.level}` : ''}</div><h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{preview.topic.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{preview.topic.description || 'Chủ đề được trích xuất từ tệp HTML của bạn.'}</p></div>
            <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-3xl bg-white shadow-sm"><span className="text-2xl font-bold text-rose-700">{preview.itemCount}</span><span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">từ vựng</span></div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-slate-600"><span className="rounded-full bg-white px-3 py-1.5">Mã: {preview.topic.id}</span>{preview.topic.lang ? <span className="rounded-full bg-white px-3 py-1.5">Ngôn ngữ: {preview.topic.lang}</span> : null}<span className="rounded-full bg-white px-3 py-1.5">Thứ tự nguồn được giữ nguyên</span></div>
        </div>
        {preview.conflict ? <div className="flex gap-3 border-t border-amber-100 bg-amber-50 px-6 py-4 text-sm text-amber-900"><span className="mt-0.5">!</span><p><strong>Chủ đề này đã tồn tại.</strong> Ở bước tiếp theo, chọn ghi đè để đồng bộ và giữ tiến độ từ trùng mã, hoặc tạo bản sao.</p></div> : null}
      </section>

      {preview.warnings.length ? <section className="space-y-2" aria-label="Cảnh báo import">{preview.warnings.map((warning, index) => <div key={`${warning.code}-${index}`} className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-900"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold">!</span><span>{friendlyWarning(warning.message)}</span></div>)}</section> : <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white font-bold">✓</span>Đã kiểm tra cấu trúc và các trường bắt buộc. Có thể xác nhận import.</div>}

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="font-semibold text-slate-900">Nội dung được tìm thấy</h3><p className="mt-0.5 text-xs text-slate-500">Hiển thị đúng thứ tự trong HTML · không chạy hoặc render HTML nguồn</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{preview.itemCount} mục</span></div>
        <ol className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
          {preview.items.map((item) => { const imageUrl = previewImageUrl(item.imageUrl); return <li key={item.sourceId} className="flex items-center gap-3 px-5 py-3.5"><span className="w-8 shrink-0 text-xs font-semibold tabular-nums text-slate-400">{String(item.position).padStart(2, '0')}</span><span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-rose-100 to-amber-50 text-sm font-bold text-rose-700"><span>{item.nameVi.slice(0, 1)}</span>{imageUrl ? <img src={imageUrl} alt={item.nameVi} className="absolute inset-0 h-full w-full object-cover" loading="lazy" onError={(event) => { event.currentTarget.remove(); }} /> : null}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{item.chunk}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{item.nameVi} · {item.meaningVi}</span></span><span className="hidden rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-400 sm:inline">{item.sourceId}</span></li>; })}
        </ol>
      </section>
    </div>
  );
}
