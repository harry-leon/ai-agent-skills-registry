import Link from 'next/link';
import { Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
        <Search className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">404 - Không tìm thấy trang</h1>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Nội dung bạn đang tìm kiếm không tồn tại, đã bị xoá, hoặc bạn không có quyền truy cập.
      </p>
      <div className="flex items-center space-x-3">
        <Link
          href="/"
          className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
        >
          Trang chủ
        </Link>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Kho kỹ năng
        </Link>
      </div>
    </div>
  );
}
