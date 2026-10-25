import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';

export default function CollectionsPage() {
  return (
    <PageContainer
      title="Bộ sưu tập"
      description="Lưu các từ bạn muốn ôn luyện nhiều lần."
      action={<Button variant="secondary">Tạo bộ sưu tập</Button>}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Bộ sưu tập đang trong giai đoạn thiết lập.
      </div>
    </PageContainer>
  );
}
