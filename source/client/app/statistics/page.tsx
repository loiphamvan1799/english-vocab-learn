import { PageContainer } from '@/components/layout/page-container';
import { ProgressBar } from '@/components/ui/progress-bar';

export default function StatisticsPage() {
  return (
    <PageContainer title="Thống kê" description="Theo dõi tiến độ học tập của bạn.">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Tiến độ học</h2>
          <div className="space-y-4">
            <ProgressBar value={65} label="Từ mới" />
            <ProgressBar value={84} label="Đã thuộc" />
            <ProgressBar value={52} label="Chủ đề hoàn thành" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Biểu đồ thống kê sẽ được bổ sung cùng API tiến độ khi phase tiếp theo triển khai.
        </div>
      </div>
    </PageContainer>
  );
}
