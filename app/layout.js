import './globals.css';

export const metadata = {
  title: 'SkillVault — Thư viện kỹ năng cho AI Agent',
  description:
    'Lưu trữ, tổ chức, tìm kiếm và nhân bản Agent Skills cho AI Agent an toàn và có phiên bản.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
