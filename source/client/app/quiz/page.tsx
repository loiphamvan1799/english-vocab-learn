import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';

export default function QuizPage() {
  return (
    <PageContainer
      title="Quiz"
      description="Làm bài kiểm tra và xem lại đáp án đúng."
      action={<Button variant="primary">Bắt đầu quiz</Button>}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Màn hình quiz sẽ được hiển thị sau khi API quiz được triển khai.
      </div>
    </PageContainer>
  );
}
