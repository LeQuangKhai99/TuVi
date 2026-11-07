import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Tử Vi Hợp Bàn · Xem Độ Tương Hợp Duyên Phận, Hôn Nhân & Hợp Tác | Phái Nghê Hải Hạ',
  description: 'Hệ thống phân tích Tử Vi Hợp Bàn chuyên sâu 8 tầng theo phương pháp danh sư Nghê Hải Hạ 《Thiên Kỷ》. Soi chiếu Cung Phu Thê, Cung Phúc Đức, ngũ hành cục, thiên can địa chi và Tứ Hóa phi tinh hai chiều.',
  keywords: [
    'tử vi hợp bàn',
    'hợp hôn tử vi',
    'xem tuổi kết hôn tử vi',
    'xem bói tình duyên tử vi',
    'hợp tác làm ăn tử vi',
    'cung phu thê',
    'cung phúc đức',
    'nghê hải hạ thiên kỷ',
    'tứ hóa phi tinh',
    'xem duyên nợ vợ chồng',
    'tử vi đẩu số toàn thư',
    'tương hợp lá số tử vi',
  ],
  alternates: {
    canonical: `${SITE_URL}/heming`,
  },
  openGraph: {
    title: 'Tử Vi Hợp Bàn · Soi Chiếu Duyên Phận & Hôn Nhân | Phái Nghê Hải Hạ',
    description: 'Phân tích độ tương hợp 8 tầng thực chứng: Khí vận Can Chi, Cung Phu Thê, Cung Phúc Đức và Tứ Hóa phi tinh hai chiều theo 《Thiên Kỷ》.',
    url: `${SITE_URL}/heming`,
    siteName: 'Tử Vi Đẩu Số Chính Tông',
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tử Vi Hợp Bàn · Soi Chiếu Duyên Phận & Hôn Nhân | Phái Nghê Hải Hạ',
    description: 'Động cơ hợp bàn chuyên sâu 8 tầng theo hệ phái chính tông danh sư Nghê Hải Hạ 《Thiên Kỷ》.',
  },
};

export default function HemingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Tử Vi Hợp Bàn - Hệ Thống Nghê Hải Hạ',
            applicationCategory: 'LifestyleApplication',
            operatingSystem: 'All',
            url: `${SITE_URL}/heming`,
            description: 'Công cụ đối chiếu Tử Vi Hợp Bàn 8 tầng chuyên sâu theo phương pháp danh sư Nghê Hải Hạ 《Thiên Kỷ》. Phân tích Cung Phu Thê, Phúc Đức và Tứ Hóa phi tinh.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'VND',
            },
            featureList: [
              'Đối chiếu Cung Phu Thê và Cung Mệnh hai chiều',
              'Song cung liên tham Cung Phúc Đức',
              'Tứ Hóa phi tinh tương trợ nhân duyên',
              'Chấm điểm hòa hợp duyên phận tiên thiên',
              'Hỗ trợ song ngữ Hán - Việt nguyên bản',
            ],
          }),
        }}
      />
      {children}
    </>
  );
}

