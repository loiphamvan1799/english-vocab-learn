import type { ReactNode } from 'react';

type PageContainerProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function PageContainer({ title, description, action, children }: PageContainerProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            Không gian học tập
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-500">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </div>
  );
}
