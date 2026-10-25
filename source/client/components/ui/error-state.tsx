type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = 'Đã xảy ra lỗi',
  message = 'Không thể tải dữ liệu lúc này.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-left">
      <h3 className="text-base font-semibold text-red-700">{title}</h3>
      <p className="mt-2 text-sm text-red-700/80">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          Thử lại
        </button>
      ) : null}
    </div>
  );
}
