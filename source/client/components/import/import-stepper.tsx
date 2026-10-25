'use client';

const steps = [
  { id: 1, label: 'Chọn tệp', detail: 'Tải HTML và ảnh đi kèm' },
  { id: 2, label: 'Xem trước', detail: 'Kiểm tra nội dung import' },
  { id: 3, label: 'Hoàn tất', detail: 'Lưu vào thư viện' },
];

export function ImportStepper({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Các bước import">
      {steps.map((step) => {
        const complete = step.id < currentStep;
        const active = step.id === currentStep;
        return (
          <li key={step.id} aria-current={active ? 'step' : undefined} className="relative min-w-0">
            <div className={`flex h-full items-start gap-3 rounded-2xl border p-3 sm:p-4 ${active ? 'border-rose-200 bg-rose-50 shadow-sm' : complete ? 'border-emerald-100 bg-emerald-50/70' : 'border-slate-200 bg-white'}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${active ? 'bg-rose-600 text-white' : complete ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {complete ? '✓' : step.id}
              </span>
              <span className="min-w-0">
                <span className={`block truncate text-sm font-semibold ${active ? 'text-rose-900' : 'text-slate-800'}`}>{step.label}</span>
                <span className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">{step.detail}</span>
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
