'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import StarField from '@/components/StarField';
import { useTheme, type Theme } from '@/components/ThemeProvider';
import AnnouncementModal from '@/components/AnnouncementModal';

// ─── Hiệu ứng cuộn vào mượt mà ─────────────────────────────
function FadeIn({
  children, delay = 0, y = 24, className = '',
}: {
  children: React.ReactNode; delay?: number; y?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function WeakBoundary({ line }: { line: string }) {
  return (
    <div
      className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
      style={{ background: `linear-gradient(to bottom, ${line}, transparent)`, opacity: 0.45 }}
    />
  );
}

// ─── Nút chuyển đổi Theme Sáng / Tối ───────────────────────
function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.93 }}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300"
      style={{
        borderColor: isDark ? 'rgba(212,168,67,0.35)' : 'rgba(140,100,20,0.3)',
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,252,242,0.9)',
      }}
    >
      <div
        className="relative w-9 h-4.5 rounded-full flex-shrink-0"
        style={{
          background: isDark ? 'rgba(15,25,50,0.95)' : 'rgba(230,195,80,0.6)',
        }}
      >
        <motion.div
          animate={{ x: isDark ? 2 : 18 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="absolute top-0.5 w-3.5 h-3.5 rounded-full"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #d4a843, #f0d070)'
              : 'linear-gradient(135deg, #e89010, #f8d050)',
          }}
        />
      </div>
      <span
        className="text-[11px] font-medium tracking-wide select-none"
        style={{ color: isDark ? 'rgba(212,180,100,0.9)' : 'rgba(110,72,8,0.85)' }}
      >
        {isDark ? 'Tối' : 'Sáng'}
      </span>
    </motion.button>
  );
}

// ─── 14 Chính Tinh ─────────────────────────────────────────
const STARS = [
  { name: 'Tử Vi', group: 'ziwei' },
  { name: 'Thiên Cơ', group: 'ziwei' },
  { name: 'Thái Dương', group: 'ziwei' },
  { name: 'Vũ Khúc', group: 'ziwei' },
  { name: 'Thiên Đồng', group: 'ziwei' },
  { name: 'Liêm Trinh', group: 'ziwei' },
  { name: 'Thiên Phủ', group: 'tianfu' },
  { name: 'Thái Âm', group: 'tianfu' },
  { name: 'Tham Lang', group: 'tianfu' },
  { name: 'Cự Môn', group: 'tianfu' },
  { name: 'Thiên Tướng', group: 'tianfu' },
  { name: 'Thiên Lương', group: 'tianfu' },
  { name: 'Thất Sát', group: 'tianfu' },
  { name: 'Phá Quân', group: 'tianfu' },
];

// ─── Thông tin chi tiết 14 Chính Tinh ───────────────────────
const STAR_BRIEF: Record<string, { attr: string; brief: string }> = {
  'Tử Vi': {
    attr: 'Thổ · Đế Vương Tinh',
    brief: 'Đệ nhất tôn tinh, chí tôn quý khí, thống ngự quần diệu. Người mang Tử Vi tọa mệnh có phong thái lãnh tụ bẩm sinh, ý chí kiên định, thích hợp nắm giữ vị trí quản trị và dẫn dắt đội ngũ.',
  },
  'Thiên Cơ': {
    attr: 'Mộc · Trí Tuệ Tinh',
    brief: 'Chủ về trí mưu, cơ biến và suy nghĩ sâu sắc. Người có Thiên Cơ thông minh mẫn tiệp, thích ứng nhanh, khéo léo trong hoạch định chiến lược, nghiên cứu chuyên sâu và cố vấn.',
  },
  'Thái Dương': {
    attr: 'Hỏa · Quan Lộc Chủ',
    brief: 'Chủ về danh vọng, quang minh chính đại và tinh thần cống hiến nhiệt thành. Tượng trưng cho người cha và sự nghiệp, khi miếu vượng mang đến khí phách khoáng đạt, quý nhân hiển đạt.',
  },
  'Vũ Khúc': {
    attr: 'Kim · Tài Bạch Chủ',
    brief: 'Tài tinh cương nghị, chủ về thực lực tài chính và hành động dứt khoát. Tính cách quả cảm, kiên trì tới cùng, rất thích hợp trong lĩnh vực kinh thương, tài chính, công nghệ hoặc lực lượng vũ trang.',
  },
  'Thiên Đồng': {
    attr: 'Thủy · Phúc Đức Chủ',
    brief: 'Phúc tinh đôn hậu, chủ về an lạc, nhân duyên hòa nhã và khiếu thẩm mỹ. Tính tình hòa ái, biết trân trọng cuộc sống, duyên người khác giới tốt, hậu vận gặp nhiều phúc đức viên mãn.',
  },
  'Liêm Trinh': {
    attr: 'Hỏa · Thứ Đào Hoa',
    brief: 'Sao tài hoa uyển chuyển, vừa có sự cương trực kỷ luật vừa giàu cá tính nghệ thuật. Khí chất sắc sảo, tự tôn cao, thích hợp công tác hành chính pháp luật, chính trường hoặc sáng tạo nghệ thuật.',
  },
  'Thiên Phủ': {
    attr: 'Thổ · Tài Khố Tinh',
    brief: 'Kho tàng trời đất, chủ sự tích lũy, điềm đạm và gìn giữ cơ nghiệp dài lâu. Khả năng quản lý tài chính xuất sắc, tính cách vững vàng, là trụ cột bảo đảm sự thịnh vượng bền vững cho gia đạo.',
  },
  'Thái Âm': {
    attr: 'Thủy · Điền Trạch Chủ',
    brief: 'Chủ về đất đai, bất động sản, của cải tích lũy và nội tâm dịu dàng chu đáo. Tượng trưng cho người mẹ, mang năng lượng phong phú về cảm xúc, thích hợp đầu tư điền trạch và các ngành văn hóa, dịch vụ.',
  },
  'Tham Lang': {
    attr: 'Mộc Thủy · Đào Hoa Chủ',
    brief: 'Ngôi sao đa tài đa nghệ, năng lượng giao tế mạnh mẽ, nhạy bén với cơ hội. Dám dấn thân khám phá những chân trời mới, rất thành công trong kinh doanh, ngoại giao, nghệ thuật và giải trí.',
  },
  'Cự Môn': {
    attr: 'Thủy · Hùng Biện Tinh',
    brief: 'Ám tinh hóa khí thành tài hùng biện, tư duy phản biện sắc bén và khả năng quan sát thấu đáo. Thích hợp nghiên cứu khoa học, luật sư, giáo dục, truyền thông, lấy tài năng ngôn luận để lập thân.',
  },
  'Thiên Tướng': {
    attr: 'Thủy · Ấn Tinh Phụ Tá',
    brief: 'Ngôi sao ấn thụ uy tín, đại diện cho lòng chính trực, phụ tá đắc lực và sự chu toàn. Khéo léo trong hòa giải và quản trị, trọng chữ tín, luôn có quý nhân trợ lực trong công việc.',
  },
  'Thiên Lương': {
    attr: 'Thổ · Ấm Tinh Thọ Khảo',
    brief: 'Ngôi sao che chở, phúc thọ và sự uy nghiêm mẫu mực. Đức tính nhân hậu, bao dung, thường gặp dữ hóa lành, có duyên đặc biệt với ngành y dược, giáo dục, pháp luật và công tác xã hội.',
  },
  'Thất Sát': {
    attr: 'Kim Hỏa · Tướng Tinh Khai Phá',
    brief: 'Bản lĩnh thép, dũng cảm phi thường, dám nghĩ dám làm và có khí phách của bậc tướng soái. Không ngại gian khó, khả năng độc lập tác chiến cao, khai sơn phá thạch tạo dựng kỳ tích trong nghịch cảnh.',
  },
  'Phá Quân': {
    attr: 'Thủy · Tiên Phong Đổi Mới',
    brief: 'Ngôi sao tiên phong đổi mới, dám phá bỏ lối mòn cũ để kiến tạo tương lai. Tinh thần dấn thân mãnh liệt, không chịu khuất phục trước khó khăn, thích hợp với môi trường khai mở thị trường và cải cách.',
  },
};

// ─── Tứ Hóa Phi Tinh ─────────────────────────────────────────
const SIHUA_BRIEF: Record<string, { attr: string; brief: string; color: string }> = {
  'Hóa Lộc': {
    attr: 'Cát Hóa · Tăng Ích Tài Phúc',
    brief: 'Đệ nhất cát tinh, mang lại tài lộc dồi dào, phúc khí tăng tiến, vạn sự thuận buồm xuôi gió. Tọa thủ cung nào sẽ gia tăng may mắn và cơ hội hanh thông cho phương diện đó.',
    color: 'rgba(52,211,153,0.85)',
  },
  'Hóa Quyền': {
    attr: 'Cát Hóa · Uy Quyền Nắm Giữ',
    brief: 'Chủ về thực quyền, năng lực chỉ huy, vị thế xã hội và tính quyết đoán dũng mãnh. Đắc địa nhất khi ngự tại Cung Mệnh hoặc Cung Quan Lộc, giúp nắm giữ cương vị trọng yếu.',
    color: 'rgba(96,165,250,0.85)',
  },
  'Hóa Khoa': {
    attr: 'Cát Hóa · Thanh Danh Quý Nhân',
    brief: 'Chủ về danh tiếng, học vấn uyên bác, thi cử đỗ đạt và quý nhân tương trợ lúc nguy nan. Giúp đương số hóa giải tai ách, gặp hung hóa cát, được xã hội nể trọng.',
    color: 'rgba(250,204,21,0.85)',
  },
  'Hóa Kỵ': {
    attr: 'Hung Hóa · Chướng Ngại Thử Thách',
    brief: 'Chủ về chấp niệm sâu sắc, thị phi hoặc chướng ngại cần vượt qua. Đóng tại cung nào là bài học lớn trong đời người cần đương số tu dưỡng tâm tính, biến nghịch cảnh thành bàn đạp trưởng thành.',
    color: 'rgba(248,113,113,0.85)',
  },
};

// ─── 4 Trụ Cột Nền Tảng Tính Năng ───────────────────────────
const FEATURES = [
  {
    tag: 'AN SAO CHÍNH TÔNG',
    title: 'Hệ Thống An Sao\nChính Tông Nghê Hải Hạ',
    subtitle: 'Tuân thủ nghiêm ngặt chuẩn mực cổ bản 《Thiên Kỷ》 và 《Tử Vi Đẩu Số Toàn Thư》',
    points: [
      'Khởi Cục chuẩn xác theo Nạp Âm Ngũ Hành, không dùng thuật toán giản lược trôi nổi',
      'An Mệnh đếm nghịch, an Thân đếm thuận, đối chuẩn chính xác nguyên tắc truyền thừa',
      'Đầy đủ 14 chính tinh, Tứ Hóa phi tinh và hơn 100 phụ tinh, sát tinh chuẩn xác vị trí miếu hãm',
    ],
  },
  {
    tag: 'BỐ CỤC TINH BÀN',
    title: 'Trọn Vẹn 14 Chính Tinh\nVà Tứ Hóa Phi Tinh',
    subtitle: 'Giao diện trực quan, thấu suốt tam phương tứ chính và cung chiếu',
    points: [
      'Hiển thị rõ ràng 12 cung vị, thế đối cung, tam hợp chiếu và giáp cung theo nguyên tắc thầy Nghê',
      'Độ miếu, vượng, đắc, hãm phân định minh bạch, giúp nhận định chuẩn mực cát hung',
      'Nhấp chọn trực tiếp từng cung vị để xem luận đoán chi tiết và sao chủ tọa thủ',
    ],
  },
  {
    tag: 'LUẬN GIẢI CHUYÊN SÂU',
    title: 'Phân Tích 13 Chủ Đề\nThấu Suốt Bản Mệnh',
    subtitle: 'Kho tri thức hệ thống cổ bản kết hợp công nghệ phân tích thông minh',
    points: [
      'Phân tích bản mệnh: Khí chất bản nguyên, ưu khuyết điểm và đại cục cuộc đời',
      'Các phương diện trọng tâm: Sự nghiệp, Tài lộc, Tình duyên hôn nhân, Gia đạo và Sức khỏe',
      'Đại vận 10 năm và Lưu niên từng năm: Nắm bắt tiết tấu thời vận để tiến thoái hợp lý',
    ],
  },
  {
    tag: 'TỰ ĐỘNG NHẬN DIỆN',
    title: 'Nhận Diện Tức Thì\nCác Đại Cách Cục Kinh Điển',
    subtitle: 'Khám phá huyền cơ từ sự phối hợp của các bộ sao tinh hoa',
    points: [
      'Tự động phát hiện các cách cục lớn: Tử Phủ Vũ Tướng, Sát Phá Tham, Cơ Nguyệt Đồng Lương, Cự Nhật, Dương Lương Xương Lộc...',
      'Kiểm chứng chặt chẽ theo tiêu chuẩn cổ thư, phân định cát cách và hung cách',
      'Phát hiện biến cách của Tứ Hóa tại Cung Mệnh và Cung Thiên Di một cách chính xác',
    ],
  },
];

// ─── 4 Phân Hệ Học Thuật 《Thiên - Địa - Nhân Kỷ》 ────────────
const SECTIONS = [
  {
    key: 'ziwei',
    name: 'Tử Vi',
    desc: '14 Chính Tinh · 12 Cung Vị · An Sao Lập Bàn Cổ Truyền',
    status: 'ready' as const,
    when: 'Khả dụng',
    icon: '◉',
  },
  {
    key: 'tianji',
    name: 'Thiên Kỷ',
    desc: 'Tử Vi Đẩu Số · Chu Dịch Bát Quái · Kỳ Môn Độn Giáp',
    status: 'ready' as const,
    when: 'Khả dụng',
    icon: '⊙',
  },
  {
    key: 'diji',
    name: 'Địa Kỷ',
    desc: 'Địa lý phong thủy · Nhân thần cảm ứng · Khảo sát thực địa',
    status: 'soon' as const,
    when: 'Sắp ra mắt',
    icon: '⊞',
  },
  {
    key: 'renji',
    name: 'Nhân Kỷ',
    desc: 'Hoàng Đế Nội Kinh · Thương Hàn Luận · Kim Quỹ · Châm Cứu',
    status: 'soon' as const,
    when: 'Sắp ra mắt',
    icon: '⊕',
  },
];

// ─── Khẩu quyết Nghê Hải Hạ ────────────────────────────────
const NI_TEACHINGS = [
  {
    title: 'Mệnh Cung làm gốc, Tam Phương làm dụng',
    body: 'Thầy Nghê luôn căn dặn: xem mệnh trước hết phải lấy Cung Mệnh làm gốc. Chính tinh Cung Mệnh định hình khí chất và cách cục gốc rễ; còn tam phương (Tài Bạch, Quan Lộc, Thiên Di) quyết định vũ đài thi triển tài năng.',
  },
  {
    title: 'Đối Cung chiếu tinh, không thể xem nhẹ',
    body: 'Điểm đặc sắc của thầy Nghê là hết sức coi trọng Cung chiếu (Đối Cung). Bất kỳ cung nào vô chính diệu đều phải mượn sao đối cung để luận đoán; Mệnh đối diện Thiên Di tương hỗ lẫn nhau tạo thành thế nội ngoại song hành.',
  },
  {
    title: 'Tứ Hóa mới là bàn tay số mệnh',
    body: 'Tinh diệu là cơ sở tĩnh, nhưng Tứ Hóa (Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ) mới là yếu tố quyết định sự biến chuyển động của vận thế. Cùng một ngôi sao, gặp Hóa Lộc hay Hóa Kỵ thì số phận khác hẳn.',
  },
  {
    title: 'Đại Hạn mười năm, vận thế có tiết tấu',
    body: 'Đời người trải qua các đại hạn 10 năm chuyển biến tuần hoàn. Thấu triệt đại hạn hiện tại giúp ta biết lúc nào nên tiến mạnh mẽ, lúc nào nên ẩn nhẫn tích lũy, thuận thời hành đạo mà gặt hái thành công.',
  },
];

// ─── Câu hỏi thường gặp FAQ ─────────────────────────────────
const FAQS = [
  {
    q: 'Tử Vi Đẩu Số theo hệ phái thầy Nghê Hải Hạ có gì đặc sắc so với các trường phái khác?',
    a: 'Phương pháp của thầy Nghê Hải Hạ thuộc Nam Phái Tam Hợp chính tông, chủ trương: "Đại đạo chí giản", lấy Cung Mệnh làm gốc, Tam Phương Tứ Chính làm dụng, Tứ Hóa làm cương lĩnh. Thầy loại bỏ những sao rườm rà thiếu thực chứng, chú trọng tính logic kiểm nghiệm được và ứng dụng thiết thực vào cuộc sống.',
  },
  {
    q: 'Lập lá số Tử Vi cần cung cấp những thông tin gì để đảm bảo độ chính xác?',
    a: 'Bạn chỉ cần cung cấp Họ tên (tùy chọn), Giới tính, Ngày tháng năm sinh (Dương lịch hoặc Âm lịch) và Giờ sinh chính xác. Hệ thống sẽ tự động tính toán giờ can chi, tiết khí và hiệu chỉnh giờ chuẩn xác.',
  },
  {
    q: 'Nếu tôi không nhớ rõ chính xác giờ sinh thì có lập lá số được không?',
    a: 'Hệ thống hỗ trợ tùy chọn "Chưa rõ giờ sinh". Khi đó hệ thống sẽ lập lá số cơ bản dựa trên ngày tháng năm sinh và phân tích các cung cố định, đồng thời hỗ trợ suy đoán đối chiếu để tìm ra giờ sinh tương thích.',
  },
  {
    q: 'Tính năng Tử Vi Hợp Bàn phân tích những yếu tố nào giữa hai người?',
    a: 'Hợp Bàn áp dụng động cơ 8 tầng độc quyền: Can chi năm sinh, ngũ hành cục, Cung Phu Thê đối chiếu Cung Mệnh (chính phối), song cung liên tham Cung Phúc Đức, và đường dây Tứ Hóa phi tinh hỗ trợ nhân duyên hai chiều.',
  },
  {
    q: 'Kho dữ liệu 50.000+ lá số và cổ thư trên trang lấy từ nguồn nào?',
    a: 'Dữ liệu được trích xuất trực tiếp từ các bộ trước tác kinh điển của danh sư Nghê Hải Hạ 《Thiên Kỷ》 và trước tác cổ thư 《Tử Vi Đẩu Số Toàn Thư》 của Hi Di Trần Đoàn, hỗ trợ song ngữ nguyên bản Hán và bản dịch Việt sát nghĩa.',
  },
];

// ─── Màu sắc giao diện ─────────────────────────────────────
function useColors(theme: Theme) {
  const d = theme === 'dark';
  return {
    bgBase:       d ? '#020810'                                : '#faf6ed',
    navBg:        d ? 'rgba(2,8,16,0.85)'                      : 'rgba(250,246,237,0.88)',
    navBorder:    d ? 'rgba(255,255,255,0.08)'                : 'rgba(160,120,30,0.18)',
    goldSolid:    d ? '#d4a843'                               : '#9a6b10',
    goldLine:     d ? 'rgba(212,168,67,0.35)'                 : 'rgba(154,107,16,0.3)',
    tagText:      d ? 'rgba(212,168,67,0.8)'                  : 'rgba(130,85,12,0.85)',
    textPrimary:  d ? '#e8eef6'                               : '#1a1d24',
    textSecond:   d ? '#b8c6df'                               : '#3a3f4a',
    textMuted:    d ? '#8b9bb4'                               : '#666e7d',
    textFaint:    d ? 'rgba(240,246,255,0.45)'                : '#9aa0ad',
    cardBg:       d ? 'rgba(255,255,255,0.04)'                : 'rgba(255,255,255,0.92)',
    cardBorder:   d ? 'rgba(255,255,255,0.08)'                : 'rgba(200,160,60,0.22)',
    cardShadow:   d ? '0 8px 32px rgba(0,0,0,0.45)'          : '0 4px 20px rgba(140,100,20,0.08)',
    featureBg:    d ? 'rgba(255,255,255,0.03)'                : 'rgba(255,255,255,0.85)',
    featureBord:  d ? 'rgba(255,255,255,0.08)'                : 'rgba(200,160,60,0.2)',
    glowTint:     d ? 'rgba(212,168,67,0.08)'                 : 'rgba(180,140,40,0.06)',
    glowBlue:     d ? 'rgba(40,80,160,0.12)'                  : 'rgba(58,90,130,0.06)',
    glowPurple:   d ? 'rgba(120,50,180,0.08)'                 : 'rgba(96,80,140,0.04)',
    starBg:       d ? 'rgba(255,255,255,0.05)'                : 'rgba(255,255,255,0.85)',
    starBorder:   d ? 'rgba(212,168,67,0.25)'                 : 'rgba(160,120,30,0.25)',
    starText:     d ? 'rgba(212,168,67,0.85)'                 : 'rgba(130,85,12,0.85)',
    ctaBg:        d ? 'linear-gradient(135deg,#c8993a,#f0d070,#c8993a)'
                    : 'linear-gradient(135deg,#7a4b08,#aa7512,#7a4b08)',
    ctaText:      d ? '#08080a'                               : '#ffffff',
    footerText:   d ? 'rgba(255,255,255,0.35)'                : '#8c7a52',
    scrollLine:   d ? 'rgba(212,168,67,0.4)'                  : 'rgba(140,100,20,0.35)',
    scrollText:   d ? 'rgba(255,255,255,0.35)'                : '#a08850',
    altSection:   d ? 'rgba(255,255,255,0.02)'                : 'rgba(255,255,255,0.5)',
  };
}

// ─── Tương tác trực quan các tính năng ──────────────────────
function FeatureVisual({ index, colors: c }: { index: number; colors: ReturnType<typeof useColors> }) {
  if (index === 0) {
    // Tinh bàn minh họa
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5">
        <div className="grid grid-cols-4 gap-2 w-72 mx-auto">
          {Array.from({ length: 16 }).map((_, i) => {
            const isCenter = [5, 6, 9, 10].includes(i);
            const isCorner = [0, 3, 12, 15].includes(i);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.025 }}
                className="h-14 rounded-lg flex flex-col items-center justify-center text-xs transition-all duration-300"
                style={{
                  border: `1px solid ${isCorner ? c.goldLine : c.cardBorder}`,
                  background: isCenter ? 'transparent' : isCorner ? c.starBg : c.featureBg,
                  color: isCorner ? c.goldSolid : c.textFaint,
                  opacity: isCenter ? 0 : 1,
                  boxShadow: isCorner ? `0 2px 10px ${c.goldSolid}20` : 'none',
                }}
              >
                {isCorner ? (
                  <>
                    <span className="text-sm font-bold">★</span>
                    <span className="text-[9px] mt-0.5 tracking-wider">{i === 0 ? 'Mệnh' : i === 3 ? 'Tài' : i === 12 ? 'Quan' : 'Di'}</span>
                  </>
                ) : (
                  <span className="text-[10px] opacity-40">☯</span>
                )}
              </motion.div>
            );
          })}
        </div>
        <div className="text-center">
          <p className="text-[11px] tracking-widest uppercase font-medium" style={{ color: c.goldSolid }}>
            Chuẩn Phép An Sao 《Thiên Kỷ》
          </p>
          <p className="text-[10px] mt-1" style={{ color: c.textMuted }}>
            14 Chính Tinh · 12 Cung Vị · Tam Phương Tứ Chính
          </p>
        </div>
      </div>
    );
  }

  if (index === 1) {
    // Tra cứu 14 chính tinh & Tứ hóa
    const [sel, setSel] = useState<string | null>('Tử Vi');
    const selInfo = sel ? (STAR_BRIEF[sel] ?? SIHUA_BRIEF[sel] ?? null) : null;
    return (
      <div className="flex flex-col gap-4 h-full justify-center">
        <div>
          <div className="text-[11px] tracking-widest mb-2 font-medium" style={{ color: c.textMuted }}>
            NAM BẮC ĐẨU 14 CHÍNH TINH
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STARS.map(s => (
              <motion.button
                key={s.name}
                onClick={() => setSel(sel === s.name ? null : s.name)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-xs px-2.5 py-1 rounded-md cursor-pointer transition-all"
                style={{
                  border: `1px solid ${sel === s.name ? c.goldSolid : c.goldLine}`,
                  color: sel === s.name ? '#ffffff' : c.goldSolid,
                  background: sel === s.name ? c.goldSolid : 'transparent',
                  fontWeight: sel === s.name ? 600 : 400,
                }}
              >
                {s.name}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] tracking-widest mb-2 font-medium" style={{ color: c.textMuted }}>
            TỨ HÓA PHI TINH CỔ BẢN
          </div>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(SIHUA_BRIEF).map(([label, item]) => (
              <motion.button
                key={label}
                onClick={() => setSel(sel === label ? null : label)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-xs px-3 py-1 rounded-md cursor-pointer transition-all"
                style={{
                  border: `1px solid ${item.color}`,
                  color: item.color,
                  background: sel === label ? `${item.color.replace('0.85', '0.2')}` : 'transparent',
                  fontWeight: sel === label ? 600 : 400,
                }}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selInfo && (
            <motion.div
              key={sel}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl p-4 mt-1"
              style={{ border: `1px solid ${c.goldLine}`, background: c.cardBg }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-semibold" style={{ color: c.goldSolid }}>{sel}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ color: c.tagText, border: `1px solid ${c.goldLine}` }}>
                  {selInfo.attr}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: c.textSecond }}>
                {selInfo.brief}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (index === 2) {
    // Đối thoại tư vấn AI mẫu
    const msgs = [
      { role: 'user', text: 'Đại vận 10 năm tới sự nghiệp của tôi có cơ hội bứt phá không?' },
      { role: 'ai', text: 'Mệnh Cung Thiên Cơ Hóa Lộc, lưu đại vận tiến vào Cung Quan Lộc có Tả Phụ Hữu Bật hội chiếu. Đây là thời kỳ quý nhân nâng đỡ, thích hợp mở rộng quy mô kinh doanh hoặc đảm nhận chức vụ lãnh đạo.' },
      { role: 'user', text: 'Cung Phu Thê có cát tinh nào hỗ trợ tình cảm gia đạo êm ấm?' },
    ];
    return (
      <div className="flex flex-col gap-2.5 h-full justify-center">
        {msgs.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[88%] text-[11px] px-3.5 py-2.5 rounded-xl leading-relaxed"
              style={{
                border: `1px solid ${m.role === 'user' ? c.goldLine : c.cardBorder}`,
                background: m.role === 'user' ? c.starBg : c.cardBg,
                color: m.role === 'user' ? c.goldSolid : c.textSecond,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              {m.role === 'ai' && (
                <div className="text-[10px] font-semibold mb-1 flex items-center gap-1" style={{ color: c.goldSolid }}>
                  <span>✦</span> Luận giải 《Thiên Kỷ》 AI
                </div>
              )}
              {m.text}
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (index === 3) {
    // Nhận diện cách cục
    const patterns = [
      { name: 'Cách Sát Phá Tham', desc: 'Bản lĩnh khai phá, kiên định vượt nghịch cảnh tạo đại nghiệp', ok: true },
      { name: 'Cách Cơ Nguyệt Đồng Lương', desc: 'Trí tuệ mưu lược sâu sắc, an định phát triển bền vững', ok: true },
      { name: 'Cách Tử Phủ Vũ Tướng', desc: 'Đế vương chi cách, tài khố song toàn, dẫn dắt đội ngũ', ok: true },
      { name: 'Hóa Kỵ Tọa Thủ Cung Mệnh', desc: 'Cần tu dưỡng tâm tính, biến thử thách thành bước ngoặt', ok: false },
    ];
    return (
      <div className="flex flex-col gap-2.5 h-full justify-center">
        {patterns.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all"
            style={{
              border: `1px solid ${p.ok ? 'rgba(96,165,250,0.25)' : 'rgba(251,146,60,0.25)'}`,
              background: p.ok ? 'rgba(96,165,250,0.06)' : 'rgba(251,146,60,0.06)',
            }}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: p.ok ? 'rgba(96,165,250,0.8)' : 'rgba(251,146,60,0.8)' }}
            />
            <div className="flex-1 min-w-0">
              <div
                className="text-[12px] font-medium"
                style={{ color: p.ok ? 'rgba(147,197,253,0.9)' : 'rgba(253,186,116,0.9)' }}
              >
                {p.name}
              </div>
              <div className="text-[10px] truncate" style={{ color: c.textMuted }}>
                {p.desc}
              </div>
            </div>
          </motion.div>
        ))}
        <div className="text-[10px] mt-2 tracking-wider text-center font-medium" style={{ color: c.goldSolid }}>
          Tự động đối chiếu và giải mã 11+ đại cách cục cổ bản
        </div>
      </div>
    );
  }

  return null;
}

// ─── Trang chủ chính ───────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = useColors(theme);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '24%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  // Accordion FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useLayoutEffect(() => {
    document.documentElement.style.background = c.bgBase;
    document.body.style.background = c.bgBase;
    return () => {
      document.documentElement.style.background = '';
      document.body.style.background = '';
    };
  }, [c.bgBase]);

  return (
    <div style={{ background: c.bgBase, transition: 'background 0.35s ease' }} className="overflow-x-hidden min-h-screen">
      {/* Thông báo chào đón người dùng lần đầu */}
      <AnnouncementModal />

      {/* Hiệu ứng bầu trời sao */}
      <StarField />

      {/* Ánh sáng nền huyền ảo */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] rounded-full"
          style={{ background: `radial-gradient(ellipse, ${c.glowTint} 0%, transparent 70%)` }}
        />
        <div
          className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full"
          style={{ background: `radial-gradient(ellipse, ${c.glowBlue} 0%, transparent 70%)` }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
          style={{ background: `radial-gradient(ellipse, ${c.glowPurple} 0%, transparent 70%)` }}
        />
      </div>

      {/* ── Thanh Điều Hướng Header ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 gap-2 backdrop-blur-md"
        style={{
          background: c.navBg,
          borderBottom: `1px solid ${c.navBorder}`,
        }}
      >
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
        >
          <span className="text-base" style={{ color: c.goldSolid }}>☯</span>
          <span
            className="text-xs sm:text-sm tracking-[0.25em] font-bold"
            style={{ color: c.goldSolid }}
          >
            TỬ VI ĐẨU SỐ
          </span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <ThemeToggle />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/heming')}
            className="relative text-[11px] sm:text-xs px-3 sm:px-4 py-1.5 rounded-full transition-all duration-200"
            style={{
              border: `1px solid ${c.navBorder}`,
              color: c.textSecond,
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            Hợp Bàn
            <span
              className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded-full font-bold"
              style={{ background: '#10b981', color: '#ffffff' }}
            >
              Mới
            </span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/knowledge')}
            className="hidden sm:inline-block text-[11px] sm:text-xs px-3.5 py-1.5 rounded-full transition-all duration-200"
            style={{
              border: `1px solid ${c.navBorder}`,
              color: c.textMuted,
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            Kho Tri Thức
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/chart')}
            className="text-[11px] sm:text-xs px-3 sm:px-5 py-1.5 rounded-full font-medium transition-all duration-200 shadow-sm"
            style={{
              background: c.ctaBg,
              color: c.ctaText,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Lập Lá Số
          </motion.button>
        </div>
      </nav>

      {/* ══ HERO BANNER CHÍNH ════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[90svh] flex flex-col items-center justify-center px-6 z-10 pb-20 pt-28">
        <motion.div style={{ y: heroY, opacity: heroOpacity, maxWidth: '960px' }} className="text-center w-full mx-auto">
          {/* Badge nhận diện */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full mb-6 border shadow-sm"
            style={{
              borderColor: c.goldLine,
              background: theme === 'dark' ? 'rgba(212,168,67,0.08)' : 'rgba(212,168,67,0.12)',
            }}
          >
            <span style={{ color: c.goldSolid }}>✦</span>
            <span className="text-[11px] tracking-[0.3em] font-semibold uppercase" style={{ color: c.goldSolid }}>
              CHÍNH TÔNG NGHÊ HẢI HẠ · THIÊN KỶ CỔ BẢN
            </span>
            <span style={{ color: c.goldSolid }}>✦</span>
          </motion.div>

          {/* Tiêu đề chính */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.2 }}
            className="mb-4"
          >
            <h1
              className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold leading-none`}
              style={{
                fontSize: 'clamp(48px, 9vw, 104px)',
                letterSpacing: '0.04em',
              }}
            >
              Lá Số Tử Vi
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="text-base sm:text-lg md:text-xl tracking-[0.12em] mb-2 font-medium"
            style={{ color: c.textSecond }}
          >
            Thấu suốt bản mệnh · Thuận thời hành đạo · Tự tay kiến tạo tương lai
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="text-xs sm:text-sm tracking-[0.25em] mb-6 uppercase"
            style={{ color: c.goldSolid, opacity: 0.9 }}
          >
            14 Chính Tinh · 12 Cung Vị · Tứ Hóa Phi Tinh · Hợp Bàn Duyên Phận
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="text-sm max-w-2xl mx-auto leading-relaxed mb-8"
            style={{ color: c.textMuted }}
          >
            Nhập ngày giờ sinh để lập lá số Tử Vi Đẩu Số tức thì. Hệ thống phân tích 13 chủ đề chuyên sâu, nhận diện cách cục và đối chiếu tương hợp duyên phận chuẩn phái Nghê Hải Hạ.
          </motion.p>

          {/* Nút Kêu Gọi Hành Động (CTA Buttons) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10"
          >
            <motion.button
              whileHover={{ y: -2, filter: 'brightness(1.06)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/chart')}
              className="px-8 sm:px-10 py-3.5 sm:py-4 font-semibold text-sm sm:text-base tracking-wider rounded-full shadow-md transition-all cursor-pointer"
              style={{ background: c.ctaBg, color: c.ctaText }}
            >
              ⚡ Lập Lá Số Của Bạn (Miễn Phí)
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/heming')}
              className="px-6 sm:px-8 py-3.5 sm:py-4 font-medium text-sm sm:text-base tracking-wider rounded-full border transition-all cursor-pointer"
              style={{
                borderColor: c.goldLine,
                background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)',
                color: c.goldSolid,
              }}
            >
              ☯ Tử Vi Hợp Bàn
            </motion.button>
          </motion.div>

          {/* Dải Cam Kết & Ưu Điểm */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs"
            style={{ color: c.textMuted }}
          >
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">✓</span> 100% Hoàn Toàn Miễn Phí
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">✓</span> Không Cần Đăng Ký Tài Khoản
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">✓</span> Luận Giải 13 Chủ Đề Đầy Đủ
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">✓</span> Chuẩn Phép Nghê Hải Hạ 《Thiên Kỷ》
            </span>
          </motion.div>

          {/* Dải 14 Chính Tinh nổi bật */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-10 grid grid-cols-7 gap-1.5 sm:gap-2 max-w-[560px] mx-auto"
          >
            {STARS.map((star, i) => (
              <motion.div
                key={star.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + i * 0.025, duration: 0.3 }}
                whileHover={{ scale: 1.08 }}
                onClick={() => router.push(`/knowledge/star/${star.name.toLowerCase().replace(/\s+/g, '-')}`)}
                className="flex items-center justify-center px-1 sm:px-2 py-1 rounded-full cursor-pointer transition-all"
                style={{
                  background: c.starBg,
                  border: `1px solid ${c.starBorder}`,
                }}
              >
                <span className="text-[10px] sm:text-[11px] font-medium" style={{ color: c.starText }}>
                  {star.name}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Thẻ ghi chú tiện ích nổi bật */}
        <motion.div
          initial={{ opacity: 0, x: 25, rotate: -2 }}
          animate={{ opacity: 1, x: 0, rotate: -3 }}
          transition={{ delay: 1.3, duration: 0.7 }}
          className="hidden xl:block absolute right-[4%] top-[50%] pointer-events-none"
          style={{ maxWidth: '240px' }}
        >
          <div
            className="p-4 rounded-2xl border shadow-lg"
            style={{
              background: theme === 'dark' ? 'rgba(20,25,40,0.85)' : 'rgba(255,250,240,0.95)',
              borderColor: c.goldLine,
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="text-xl mb-1">🎁</div>
            <div className="text-xs font-bold" style={{ color: c.goldSolid }}>
              Trải Nghiệm Toàn Diện
            </div>
            <div className="text-[11px] mt-1 leading-relaxed" style={{ color: c.textSecond }}>
              Mở khóa 100% chức năng: Lập lá số, Luận giải 13 chủ đề, Hợp bàn duyên phận & Tra cứu cổ bản.
            </div>
          </div>
        </motion.div>

        {/* Mũi tên chỉ dẫn cuộn xuống */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none"
        >
          <span className="text-[9px] tracking-[0.35em] uppercase font-semibold" style={{ color: c.scrollText }}>
            KHÁM PHÁ THÊM
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="w-px h-7"
            style={{ background: `linear-gradient(to bottom, ${c.scrollLine}, transparent)` }}
          />
        </motion.div>
      </section>

      {/* ══ DẢI THỐNG KÊ THỰC CHỨNG ═══════════════════════════ */}
      <section className="relative z-10 py-10 border-y" style={{ borderColor: c.cardBorder, background: c.altSection }}>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: c.goldSolid }}>
              14
            </div>
            <div className="text-xs sm:text-sm font-medium mt-1" style={{ color: c.textPrimary }}>
              Chính Tinh Miếu Hãm
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: c.textMuted }}>
              Nam Bắc Đẩu Tinh chuẩn xác
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: c.goldSolid }}>
              100+
            </div>
            <div className="text-xs sm:text-sm font-medium mt-1" style={{ color: c.textPrimary }}>
              Cát Tinh & Sát Tinh
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: c.textMuted }}>
              Lục sát, Lục cát, Tứ Hóa phi tinh
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: c.goldSolid }}>
              13
            </div>
            <div className="text-xs sm:text-sm font-medium mt-1" style={{ color: c.textPrimary }}>
              Chủ Đề Luận Giải
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: c.textMuted }}>
              Bản mệnh, sự nghiệp, tài lộc, hôn nhân
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: c.goldSolid }}>
              50.000+
            </div>
            <div className="text-xs sm:text-sm font-medium mt-1" style={{ color: c.textPrimary }}>
              Bản Mẫu Thực Chứng
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: c.textMuted }}>
              《Thiên Kỷ》 & 《Tử Vi Toàn Thư》
            </div>
          </div>
        </div>
      </section>

      {/* ══ TRIẾT LÝ MỆNH QUAN NGHÊ HẢI HẠ ════════════════════ */}
      <section className="relative z-10 overflow-hidden py-24 px-6 flex items-center">
        <WeakBoundary line={c.navBorder} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span
            className="font-bold opacity-5"
            style={{ fontSize: 'clamp(220px, 36vw, 440px)', color: c.goldSolid, lineHeight: 1 }}
          >
            MỆNH
          </span>
        </div>

        <FadeIn className="relative mx-auto text-center w-full max-w-4xl" y={20}>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-16" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
            <span className="text-[11px] tracking-[0.45em] uppercase font-semibold" style={{ color: c.goldSolid }}>
              TRIẾT LÝ VẬN MỆNH
            </span>
            <div className="h-px w-16" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-base sm:text-xl md:text-2xl tracking-wide font-normal" style={{ color: c.textSecond }}>
              Ý nghĩa của việc sớm thấu hiểu số mệnh
            </p>
            <p className="text-lg sm:text-2xl md:text-3xl tracking-wide font-normal" style={{ color: c.textSecond }}>
              Không phải để hoang mang lo sợ tương lai
            </p>
            <p className="text-xl sm:text-3xl md:text-4xl tracking-wide font-medium" style={{ color: c.textPrimary }}>
              Mà để không ngừng thấu suốt chính mình
            </p>
            <h2
              className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold tracking-tight pt-2`}
              style={{ fontSize: 'clamp(26px, 4vw, 52px)', lineHeight: 1.3 }}
            >
              Và tự tay viết nên kịch bản cuộc đời rực rỡ nhất
            </h2>
          </div>

          <p className="text-xs sm:text-sm max-w-xl mx-auto leading-relaxed" style={{ color: c.textMuted }}>
            «Mệnh do trời định, nhưng Vận tại lòng người. Hiểu rõ quy luật của các vì sao là để thuận thời hành đạo, làm chủ chính mình.»
          </p>
        </FadeIn>
      </section>

      {/* ══ 4 BẬC THANG PHƯƠNG PHÁP LUẬN (Curriculum) ═════════ */}
      <section className="relative z-10 py-20 px-6" style={{ background: c.altSection }}>
        <FadeIn className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
            <span className="text-[10px] tracking-[0.4em] uppercase font-semibold" style={{ color: c.goldSolid }}>
              HỆ THỐNG TRUYỀN THỪA
            </span>
            <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold mb-2 tracking-wide" style={{ color: c.textPrimary }}>
            Phương Pháp Luận Nghê Hải Hạ · Từng Bước Khai Mở
          </h2>
          <p className="text-xs sm:text-sm" style={{ color: c.textMuted }}>
            Từ khởi đầu Tử Vi Đẩu Số, từng bước tiến vào kho tàng Thiên Kỷ, Địa Kỷ và Nhân Kỷ
          </p>
        </FadeIn>

        <div className="max-w-5xl mx-auto relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SECTIONS.map((s, i) => {
              const ready = s.status === 'ready';
              return (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="rounded-2xl p-6 border flex flex-col items-center text-center transition-all duration-300"
                  style={{
                    background: c.cardBg,
                    borderColor: ready ? c.goldLine : c.cardBorder,
                    boxShadow: c.cardShadow,
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-4 text-2xl"
                    style={{
                      background: ready
                        ? `linear-gradient(135deg, ${c.goldSolid} 0%, ${c.goldSolid}cc 100%)`
                        : (theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                      color: ready ? '#ffffff' : c.textMuted,
                      boxShadow: ready ? `0 4px 16px ${c.goldSolid}40` : 'none',
                    }}
                  >
                    {s.icon}
                  </div>

                  <div className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-1" style={{ color: ready ? '#10b981' : c.textMuted }}>
                    {ready ? '✓ ' + s.when : s.when}
                  </div>

                  <h3 className="text-lg font-bold mb-2 tracking-wide" style={{ color: c.textPrimary }}>
                    {s.name}
                  </h3>

                  <p className="text-xs leading-relaxed" style={{ color: c.textSecond }}>
                    {s.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ BENTO GRID 4 ĐẶC TRƯNG VƯỢT TRỘI ═════════════════ */}
      <section className="relative z-10 py-16">
        {FEATURES.map((feature, i) => (
          <div
            key={i}
            className="flex items-center px-6 md:px-12 py-16 md:py-20"
            style={{ background: i % 2 === 1 ? c.altSection : 'transparent' }}
          >
            <div className="max-w-6xl mx-auto w-full">
              <div className={`grid grid-cols-1 ${i % 2 === 0 ? 'lg:grid-cols-[0.48fr_0.52fr]' : 'lg:grid-cols-[0.52fr_0.48fr]'} gap-10 lg:gap-16 items-center ${i % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}>
                {/* Vùng mô tả */}
                <div className={i % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <FadeIn>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px w-8" style={{ background: c.goldLine }} />
                      <span className="text-[11px] tracking-[0.35em] font-semibold" style={{ color: c.goldSolid }}>
                        {feature.tag}
                      </span>
                    </div>

                    <h2
                      className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold leading-tight mb-4`}
                      style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', whiteSpace: 'pre-line' }}
                    >
                      {feature.title}
                    </h2>

                    <p className="text-sm sm:text-base mb-6 leading-relaxed" style={{ color: c.textSecond }}>
                      {feature.subtitle}
                    </p>

                    <div className="space-y-3.5 mb-8">
                      {feature.points.map((pt, j) => (
                        <div key={j} className="flex gap-3 items-start">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.goldSolid }} />
                          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: c.textMuted }}>
                            {pt}
                          </p>
                        </div>
                      ))}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => router.push(i === 2 ? '/heming' : '/chart')}
                      className="px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider cursor-pointer"
                      style={{
                        background: c.ctaBg,
                        color: c.ctaText,
                        border: 'none',
                      }}
                    >
                      {i === 2 ? 'Khám Phá Hợp Bàn →' : 'Trải Nghiệm An Sao →'}
                    </motion.button>
                  </FadeIn>
                </div>

                {/* Vùng demo trực quan */}
                <div className={i % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                  <FadeIn delay={0.15}>
                    <div
                      className="rounded-2xl p-6 sm:p-8 border shadow-lg"
                      style={{
                        background: c.cardBg,
                        borderColor: c.cardBorder,
                        minHeight: i === 0 ? '420px' : i === 1 ? '480px' : '380px',
                      }}
                    >
                      <FeatureVisual index={i} colors={c} />
                    </div>
                  </FadeIn>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ══ TRIẾT LÝ THIÊN · ĐỊA · NHÂN (3 LỰC LƯỢNG) ═════════ */}
      <section className="relative z-10 py-20 px-6" style={{ background: c.altSection }}>
        <WeakBoundary line={c.navBorder} />
        <div className="max-w-6xl mx-auto w-full">
          <FadeIn>
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
                <span className="text-[10px] tracking-[0.45em] uppercase font-semibold" style={{ color: c.goldSolid }}>
                  TAM TÀI TỔNG QUAN
                </span>
                <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
              </div>
              <h2
                className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold mb-4 tracking-tight`}
                style={{ fontSize: 'clamp(32px, 4vw, 50px)' }}
              >
                Thiên · Địa · Nhân
              </h2>
              <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: c.textSecond }}>
                Thầy Nghê Hải Hạ đặc biệt căn dặn: Lá số Tử Vi không phải là toàn bộ cuộc đời.<br />
                Đời người là sự tương tác hài hòa giữa 3 lực lượng có trọng số ngang nhau.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                glyph: 'Thiên',
                label: 'Tiên Thiên Bản Mệnh',
                pct: '⅓',
                color: c.goldSolid,
                borderColor: c.goldLine,
                desc: 'Lá số Tử Vi Đẩu Số phản ánh tinh bàn Tiên Thiên do thời khắc sinh nở hội tụ tinh tú ngũ hành. Đây là 1/3 cuộc đời – khuôn mẫu và khí chất gốc rễ của một con người.',
                sub: 'Lá Số · Ngũ Hành · Tinh Diệu',
              },
              {
                glyph: 'Địa',
                label: 'Địa Lý Môi Trường',
                pct: '⅓',
                color: 'rgba(96,165,250,0.9)',
                borderColor: 'rgba(96,165,250,0.3)',
                desc: 'Nơi sinh sống, quốc gia, hoàn cảnh gia đình, phong thủy dương trạch và thời thế xã hội. Cùng một lá số nhưng sinh tại hai môi trường địa lý khác nhau ắt sẽ có quỹ đạo khác nhau.',
                sub: 'Địa Lý · Phong Thủy · Thời Cuộc',
              },
              {
                glyph: 'Nhân',
                label: 'Nhân Tâm Ý Niệm',
                pct: '⅓',
                color: 'rgba(52,211,153,0.9)',
                borderColor: 'rgba(52,211,153,0.3)',
                desc: 'Ý chí, nỗ lực tu dưỡng, những lựa chọn và hành động thực tế của chính bạn. Thầy Nghê nhấn mạnh: Học mệnh là để làm chủ chính mình, không buông xuôi, lấy nhân tâm kiến tạo kỳ tích.',
                sub: 'Ý Chí · Tu Dưỡng · Quyết Định',
              },
            ].map((item, i) => (
              <FadeIn key={item.glyph} delay={0.1 + i * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="rounded-2xl p-7 h-full flex flex-col border shadow-md transition-all"
                  style={{
                    background: c.cardBg,
                    borderColor: item.borderColor,
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl font-extrabold" style={{ color: item.color }}>
                      {item.glyph}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black" style={{ color: item.color }}>
                        {item.pct}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: c.textMuted }}>
                        Tỷ Trọng Cuộc Đời
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-base font-bold mb-0.5" style={{ color: item.color }}>
                      {item.label}
                    </div>
                    <div className="text-[10px] tracking-wider uppercase font-medium" style={{ color: c.textMuted }}>
                      {item.sub}
                    </div>
                  </div>

                  <div className="h-px mb-4" style={{ background: item.borderColor, opacity: 0.5 }} />

                  <p className="text-xs sm:text-sm leading-relaxed flex-1" style={{ color: c.textSecond }}>
                    {item.desc}
                  </p>
                </motion.div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.3}>
            <div className="mt-12 text-center p-6 rounded-2xl border" style={{ borderColor: c.goldLine, background: c.cardBg }}>
              <p className="text-sm sm:text-base italic leading-relaxed" style={{ color: c.textPrimary }}>
                «Số mệnh không phải là chiếc gông cùm trói buộc con người, mà là một tấm bản đồ. Người hiểu mệnh sẽ biết đường tránh bão, đón gió thuận buồm, dùng nhân tâm kiên định để cải biến vận mệnh.»
              </p>
              <p className="mt-2 text-xs font-semibold tracking-widest" style={{ color: c.goldSolid }}>
                — Danh sư Nghê Hải Hạ (1954 – 2012)
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══ GIỚI THIỆU DANH SƯ NGHÊ HẢI HẠ ═══════════════════ */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
                <span className="text-[10px] tracking-[0.45em] uppercase font-semibold" style={{ color: c.goldSolid }}>
                  BẬC THẦY KINH PHƯƠNG & THUẬT SỐ
                </span>
                <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
              </div>
              <h2
                className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold mb-4 tracking-tight`}
                style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}
              >
                Danh Sư Nghê Hải Hạ (Ni Haisha)
              </h2>
              <p className="max-w-2xl mx-auto leading-relaxed text-xs sm:text-sm" style={{ color: c.textSecond }}>
                Nhà nghiên cứu Kinh Phương Đông y và Thuật số truyền thống lỗi lạc bậc nhất thời hiện đại.<br />
                Sáng lập Học viện Hán Đường Trung Y tại Hoa Kỳ · Tác giả hai bộ trước tác truyền đời:「Nhân Kỷ」và「Thiên Kỷ」.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {NI_TEACHINGS.map((teaching, i) => (
              <FadeIn key={i} delay={0.1 + i * 0.08}>
                <div
                  className="rounded-2xl p-6 h-full border shadow-sm"
                  style={{ background: c.cardBg, borderColor: c.cardBorder }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ borderColor: c.goldLine, color: c.goldSolid }}
                    >
                      {i + 1}
                    </div>
                    <h3 className="text-sm font-bold leading-relaxed" style={{ color: c.goldSolid }}>
                      {teaching.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed pl-9" style={{ color: c.textSecond }}>
                    {teaching.body}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CÂU HỎI THƯỜNG GẶP FAQ (TĂNG SEO & RICH SNIPPETS) ══ */}
      <section className="relative z-10 py-20 px-6 border-t" style={{ borderColor: c.cardBorder, background: c.altSection }}>
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-px w-10" style={{ background: c.goldLine }} />
              <span className="text-[10px] tracking-[0.4em] uppercase font-semibold" style={{ color: c.goldSolid }}>
                GIẢI ĐÁP THẮC MẮC
              </span>
              <div className="h-px w-10" style={{ background: c.goldLine }} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2" style={{ color: c.textPrimary }}>
              Câu Hỏi Thường Gặp Về Tử Vi Đẩu Số
            </h2>
            <p className="text-xs sm:text-sm" style={{ color: c.textMuted }}>
              Tổng hợp những giải đáp hữu ích giúp bạn thấu hiểu tinh thần an sao và luận giải
            </p>
          </FadeIn>

          <div className="space-y-3">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="rounded-xl border transition-all overflow-hidden"
                  style={{
                    background: c.cardBg,
                    borderColor: isOpen ? c.goldLine : c.cardBorder,
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 bg-transparent border-none cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-semibold" style={{ color: isOpen ? c.goldSolid : c.textPrimary }}>
                      {faq.q}
                    </span>
                    <span
                      className="text-base font-bold transition-transform duration-200"
                      style={{
                        color: c.goldSolid,
                        transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      }}
                    >
                      +
                    </span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="px-5 pb-4 pt-1 text-xs sm:text-sm leading-relaxed border-t" style={{ borderColor: c.cardBorder, color: c.textSecond }}>
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ CTA CUỐI TRANG HOÀNG TRÁNG ═══════════════════════ */}
      <section className="relative z-10 py-28 px-6 text-center">
        <FadeIn className="max-w-2xl mx-auto">
          <p className="text-[11px] tracking-[0.4em] uppercase font-semibold mb-4" style={{ color: c.goldSolid }}>
            BẮT ĐẦU HÀNH TRÌNH KHÁM PHÁ BẢN THÂN
          </p>
          <h2
            className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold mb-6 tracking-tight leading-tight`}
            style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}
          >
            Lá Số Tử Vi Của Bạn<br />Đang Chờ Khám Phá
          </h2>
          <p className="text-xs sm:text-base mb-8 leading-relaxed" style={{ color: c.textSecond }}>
            Nhập ngày tháng năm và giờ sinh, chỉ trong vài giây hệ thống sẽ lập lá số chuyên sâu và phân tích toàn diện 13 chủ đề dành riêng cho bạn.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/chart')}
              className="px-10 py-4 font-semibold text-sm sm:text-base tracking-wider rounded-full shadow-lg cursor-pointer"
              style={{ background: c.ctaBg, color: c.ctaText, border: 'none' }}
            >
              Lập Lá Số Miễn Phí Ngay
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/heming')}
              className="px-8 py-4 font-medium text-sm sm:text-base tracking-wider rounded-full border cursor-pointer"
              style={{
                borderColor: c.goldLine,
                background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                color: c.goldSolid,
              }}
            >
              ☯ Đối Chiếu Hợp Bàn
            </motion.button>
          </div>

          <div className="flex flex-wrap gap-3 justify-center text-xs">
            <a
              href="/knowledge"
              className="px-4 py-2 rounded-full border transition-all text-xs"
              style={{ color: c.goldSolid, borderColor: c.goldLine, textDecoration: 'none' }}
            >
              ✦ Kho Tri Thức 14 Chính Tinh →
            </a>
            <a
              href="/library"
              className="px-4 py-2 rounded-full border transition-all text-xs"
              style={{ color: c.goldSolid, borderColor: c.goldLine, textDecoration: 'none' }}
            >
              📜 Cổ Thư Tử Vi Toàn Thư →
            </a>
          </div>
        </FadeIn>
      </section>

      {/* ══ FOOTER HIỆN ĐẠI & TRANG TRỌNG ═════════════════════ */}
      <footer className="relative z-10 py-12 px-6 border-t" style={{ borderColor: c.cardBorder }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 text-center">
            {SECTIONS.map(s => {
              const ready = s.status === 'ready';
              return (
                <a
                  key={s.key}
                  href={ready ? (s.key === 'ziwei' ? '/chart' : '/knowledge') : undefined}
                  onClick={ready ? undefined : (e) => e.preventDefault()}
                  className="rounded-xl p-3 border transition-all"
                  style={{
                    background: ready ? c.starBg : 'transparent',
                    borderColor: ready ? c.goldLine : c.cardBorder,
                    cursor: ready ? 'pointer' : 'not-allowed',
                    opacity: ready ? 1 : 0.5,
                    textDecoration: 'none',
                  }}
                >
                  <div className="text-sm font-bold mb-0.5" style={{ color: ready ? c.goldSolid : c.textMuted }}>
                    {s.name}
                  </div>
                  <div className="text-[10px]" style={{ color: ready ? '#10b981' : c.textMuted }}>
                    {ready ? '✓ Đang hoạt động' : s.when}
                  </div>
                </a>
              );
            })}
          </div>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm font-bold" style={{ color: c.goldSolid }}>
              <span>☯</span>
              <span>Lá Số Tử Vi · Chính Tông Nghê Hải Hạ 《Thiên Kỷ》</span>
            </div>
            <p className="text-xs leading-relaxed max-w-2xl mx-auto" style={{ color: c.textMuted }}>
              Nền tảng nghiên cứu thuật số cổ truyền Á Đông theo phong cách thực chứng khoa học của danh sư Nghê Hải Hạ.<br className="hidden sm:inline" />
              Nội dung mang tính chất tham khảo học thuật và tu dưỡng bản thân, không thay thế cho các quyết định pháp lý hay y tế.
            </p>
            <div className="pt-2 text-xs" style={{ color: c.footerText }}>
              <a href="/terms" className="hover:underline" style={{ color: c.footerText }}>Điều khoản sử dụng</a>
              {' · '}
              <a href="/privacy" className="hover:underline" style={{ color: c.footerText }}>Chính sách bảo mật</a>
              {' · '}
              <a href="/heming" className="hover:underline" style={{ color: c.footerText }}>Tử Vi Hợp Bàn</a>
              {' · '}
              <a href="/chart" className="hover:underline" style={{ color: c.footerText }}>Lập Lá Số</a>
            </div>
            <p className="text-[11px] pt-1" style={{ color: c.footerText }}>
              © {new Date().getFullYear()} Lá Số Tử Vi. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
