import './globals.css';
import { ThemeProvider } from '@/components/theme-provider.js';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Skillary — AI Agent Skills & Templates Registry',
  description:
    'Store, discover, install, and bundle versioned AI Agent skills, agents, commands, and MCPs securely.',
  icons: {
    icon: [{ url: '/favicon.ico' }, { url: '/favicon.png', type: 'image/png' }],
    apple: [{ url: '/apple-icon.png' }],
    shortcut: '/favicon.png',
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#090d16' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="overflow-x-clip" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased selection:bg-primary/20 selection:text-primary overflow-x-clip">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
