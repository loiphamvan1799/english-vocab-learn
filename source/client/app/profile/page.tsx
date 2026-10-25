import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  return (
    <PageContainer
      title="Hồ sơ"
      description="Cài đặt cá nhân và mục tiêu học tập hằng ngày."
      action={<Button variant="secondary">Lưu thay đổi</Button>}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Trang hồ sơ đang chờ dữ liệu profile từ server để hiển thị đầy đủ.
      </div>
    </PageContainer>
  );
}
