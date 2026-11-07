import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: {
    default: 'Lá Số Tử Vi · Hệ Thống An Sao & Luận Giải Chính Tông Nghê Hải Hạ 《Thiên Kỷ》',
    template: '%s | Tử Vi Đẩu Số Nghê Hải Hạ',
  },
  description: 'Nền tảng an sao và lập lá số Tử Vi Đẩu Số cổ truyền chính tông theo hệ phái danh sư Nghê Hải Hạ 《Thiên Kỷ》. Lập lá số tức thì, 14 chính tinh miếu hãm, Tứ Hóa phi tinh, luận giải 13 chủ đề chuyên sâu và hợp bàn duyên phận.',
  keywords: [
    'Tử Vi Đẩu Số',
    'Lá số tử vi',
    'Lập lá số tử vi online',
    'Nghê Hải Hạ',
    'Thiên Kỷ',
    'Tử Vi Toàn Thư',
    '14 chính tinh',
    'Tứ Hóa phi tinh',
    'Tử vi hợp bàn',
    'Luận giải tử vi',
    'Xem tử vi trọn đời',
    'Đại hạn lưu niên',
  ],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Lá Số Tử Vi · Hệ Thống An Sao & Luận Giải Chính Tông Nghê Hải Hạ',
    description: 'Hệ thống an sao và lập lá số Tử Vi Đẩu Số chính tông theo phương pháp của thầy Nghê Hải Hạ (Thiên Kỷ). Lập lá số tức thì, luận giải 13 chủ đề và hợp bàn duyên phận.',
    url: SITE_URL,
    siteName: 'Tử Vi Đẩu Số Chính Tông',
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lá Số Tử Vi · Chính Tông Nghê Hải Hạ 《Thiên Kỷ》',
    description: 'Nền tảng an sao và lập lá số Tử Vi Đẩu Số cổ truyền chính tông theo hệ phái danh sư Nghê Hải Hạ.',
  },
  // 站长平台验证（拿到 verification code 后填入对应字段，重新部署即可）
  verification: {
    // Google Search Console: 在 https://search.google.com/search-console 添加站点后获取
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
    // Bing Webmaster Tools: 在 https://www.bing.com/webmasters 添加站点后获取
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || '808FFC6023A2C359B375DD860FEDA856',
      // 百度站长（等执照下来后）
      'baidu-site-verification': process.env.NEXT_PUBLIC_BAIDU_VERIFICATION || '',
      // 360 站长（等执照下来后）
      '360-site-verification': process.env.NEXT_PUBLIC_360_VERIFICATION || '',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'Lá Số Tử Vi · Chính Tông Nghê Hải Hạ',
        description: 'Hệ thống an sao và luận giải Tử Vi Đẩu Số cổ truyền chính tông theo hệ phái danh sư Nghê Hải Hạ 《Thiên Kỷ》.',
        inLanguage: 'vi-VN',
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Tử Vi Đẩu Số Chính Tông',
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.ico`,
      },
    ],
  };

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ziwei-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);else document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
