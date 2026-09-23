import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://stockflow.example.com'),
  title: {
    default: 'StockFlow Pro - Modern POS & ERP Solution',
    template: '%s | StockFlow Pro',
  },
  description: 'Commercial-grade Point of Sale, Inventory Management, and Baki Khata ERP platform with offline resilience and instant thermal printing.',
  keywords: ['POS', 'Point of Sale', 'ERP', 'Inventory Management', 'Baki Khata', 'Retail Software', 'Thermal Receipt Printing', 'Barcode Scanner'],
  authors: [{ name: 'StockFlow Systems' }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'StockFlow Pro - Modern POS & ERP Solution',
    description: 'High-speed Point of Sale, live inventory catalog, customer credit ledger, and financial reporting.',
    url: 'https://stockflow.example.com',
    siteName: 'StockFlow Pro',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StockFlow Pro - Modern POS & ERP Solution',
    description: 'Commercial-grade Point of Sale, Inventory, and Baki Khata ERP platform.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Ignore harmless third-party browser extension content script errors (e.g. Urban VPN M_ID)
                window.addEventListener('error', function(e) {
                  if ((e.filename && e.filename.includes('chrome-extension://')) || 
                      (e.message && (e.message.includes('M_ID') || e.message.includes('chrome-extension://')))) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                  }
                }, true);
                window.addEventListener('unhandledrejection', function(e) {
                  if (e.reason && e.reason.stack && e.reason.stack.includes('chrome-extension://')) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                  }
                }, true);

                const saved = localStorage.getItem('stockflow-theme');
                if (saved === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else if (saved === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-[#f8f7f4] dark:bg-[#111215] text-[#191817] dark:text-[#f3f3f5] antialiased selection:bg-[#6b21a8] dark:selection:bg-[#9333ea] selection:text-[#fef08a] transition-colors duration-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
