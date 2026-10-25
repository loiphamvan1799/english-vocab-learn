'use client';

import { useRef, useState } from 'react';

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
const ALLOWED_MEDIA = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp3', '.wav', '.ogg', '.m4a']);

export function ImportDropzone({
  htmlFile,
  assetFiles,
  onHtmlChange,
  onAssetsChange,
}: {
  htmlFile: File | null;
  assetFiles: File[];
  onHtmlChange: (file: File | null) => void;
  onAssetsChange: (files: File[]) => void;
}) {
  const htmlInput = useRef<HTMLInputElement>(null);
  const assetsInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState('');

  function acceptHtml(file?: File) {
    if (!file) return;
    if (!/\.html?$/i.test(file.name)) return setLocalError('Vui lòng chọn tệp .html hoặc .htm.');
    if (file.size > MAX_HTML_BYTES) return setLocalError('Tệp HTML vượt quá 2 MB.');
    setLocalError('');
    onHtmlChange(file);
  }

  function acceptAssets(list: FileList | File[]) {
    const files = Array.from(list);
    const invalid = files.find((file) => {
      const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
      return !ALLOWED_MEDIA.has(ext) || file.size > MAX_MEDIA_BYTES;
    });
    if (invalid) return setLocalError(`Tệp “${invalid.name}” không được hỗ trợ hoặc vượt quá 10 MB.`);
    setLocalError('');
    onAssetsChange([...assetFiles, ...files]);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); const files = Array.from(event.dataTransfer.files); const html = files.filter((file) => /\.html?$/i.test(file.name)); const assets = files.filter((file) => !/\.html?$/i.test(file.name)); if (html.length > 1) setLocalError('Vui lòng thả một tệp HTML mỗi lần.'); else { if (html[0]) acceptHtml(html[0]); if (assets.length) acceptAssets(assets); } }}
        className={`rounded-[28px] border-2 border-dashed p-7 text-center transition sm:p-10 ${dragging ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50/30'}`}
      >
        <input ref={htmlInput} type="file" accept=".html,.htm,text/html" className="sr-only" onChange={(event) => { acceptHtml(event.target.files?.[0]); event.target.value = ''; }} aria-label="Chọn tệp HTML" />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5a1 1 0 001 1h12a1 1 0 001-1v-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h2 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">Kéo tệp HTML vào đây</h2>
        <p className="mt-2 text-sm text-slate-500">Chúng tôi sẽ đọc nội dung an toàn mà không chạy script trong tệp.</p>
        <button type="button" onClick={() => htmlInput.current?.click()} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2">
          {htmlFile ? 'Thay tệp HTML' : 'Chọn tệp HTML'}
        </button>
        <p className="mt-3 text-xs text-slate-400">HTML hoặc HTM · tối đa 2 MB</p>
      </div>

      {htmlFile ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-xs font-bold text-violet-700">HTML</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{htmlFile.name}</span><span className="text-xs text-slate-500">{(htmlFile.size / 1024).toFixed(0)} KB · sẵn sàng kiểm tra</span></span>
          <button type="button" onClick={() => onHtmlChange(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Bỏ tệp HTML">×</button>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="text-sm font-semibold text-slate-800">Ảnh đi kèm <span className="font-normal text-slate-400">(không bắt buộc)</span></h3><p className="mt-1 text-xs leading-5 text-slate-500">Chọn ảnh nếu HTML dùng đường dẫn tương đối. Ảnh từ URL ngoài sẽ được tải có kiểm soát.</p></div>
          <input ref={assetsInput} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,audio/mpeg,audio/wav,audio/ogg,audio/mp4" className="sr-only" onChange={(event) => { if (event.target.files) acceptAssets(event.target.files); event.target.value = ''; }} aria-label="Chọn ảnh đi kèm" />
          <button type="button" onClick={() => assetsInput.current?.click()} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2">Thêm ảnh</button>
        </div>
        {assetFiles.length ? <ul className="mt-4 grid gap-2 sm:grid-cols-2">{assetFiles.map((file, index) => <li key={`${file.name}-${index}`} className="flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600"><span className="truncate">{file.name}</span><button type="button" className="ml-auto text-slate-400 hover:text-rose-600" onClick={() => onAssetsChange(assetFiles.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Bỏ ${file.name}`}>×</button></li>)}</ul> : null}
      </div>
      {localError ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{localError}</p> : null}
    </div>
  );
}
