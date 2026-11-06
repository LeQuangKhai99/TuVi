import type { ZiweiChart, Palace, Star } from './types';
import { detectPatterns } from './patterns';
import { STEMS, BRANCHES, SI_HUA_TABLE } from './constants';
import { tStar, tPalace, tBranch, tJu, tSiHua, tPattern, tGanzhi, tStem, tBrightness } from './i18n';
import type { DatasetTopic } from './dataset';

/**
 * Tra cứu thông tin cung vị theo tên hoặc tiền tố
 */
function getPalace(chart: ZiweiChart, namePrefix: string): Palace | undefined {
  return chart.palaces.find(p => p.name.includes(namePrefix));
}

/**
 * Lấy danh sách tên sao chính tinh (chữ Hán gốc)
 */
function getMajorStarNames(palace?: Palace): string[] {
  if (!palace) return [];
  return palace.stars.filter(s => s.type === 'major').map(s => s.name);
}

/**
 * Chuỗi hiển thị chính tinh kèm độ sáng và Tứ Hóa
 */
function getMajorStarsStr(palace?: Palace): string {
  if (!palace) return 'Vô chính diệu';
  const majors = palace.stars.filter(s => s.type === 'major');
  if (majors.length === 0) return 'Vô chính diệu (mượn chính tinh từ đối cung)';
  return majors
    .map(s => {
      const b = s.brightnessRaw ? ` (${tBrightness(s.brightnessRaw)})` : '';
      const sh = s.siHua ? ` Hóa ${tSiHua(s.siHua)}` : '';
      return `${tStar(s.name)}${b}${sh}`;
    })
    .join(', ');
}

/**
 * Tách các nhóm sao: Chính tinh, Cát tinh, Sát tinh
 */
function getCungStars(palace?: Palace) {
  if (!palace) return { major: 'Vô chính diệu', lucky: '', sha: '' };
  const major =
    palace.stars
      .filter(s => s.type === 'major')
      .map(s => {
        const b = s.brightnessRaw ? ` (${tBrightness(s.brightnessRaw)})` : '';
        const sh = s.siHua ? ` [Hóa ${tSiHua(s.siHua)}]` : '';
        return `${tStar(s.name)}${b}${sh}`;
      })
      .join(', ') || 'Vô chính diệu';
  const lucky = palace.stars.filter(s => s.type === 'lucky').map(s => tStar(s.name)).join(', ');
  const sha = palace.stars.filter(s => s.type === 'sha').map(s => tStar(s.name)).join(', ');
  return { major, lucky, sha };
}

// ─────────────────────────────────────────────────────────────────────────────
// KHO DỮ LIỆU ĐỊNH TÍNH CHÍNH TINH THEO 《TOÀN THƯ》 & 《THIÊN KỶ》 NGHÊ HẢI HẠ
// ─────────────────────────────────────────────────────────────────────────────

interface StarProfile {
  title: string;
  element: string;
  nature: string;
  essence: string;
  toanThuQuote: string;
  tianJiLesson: string;
  personality: {
    core: string;
    strengths: string[];
    weaknesses: string;
  };
  career: string;
  wealth: string;
  love: string;
  health: string;
}

const STAR_PROFILES: Record<string, StarProfile> = {
  '紫微': {
    title: 'Đế Tinh Chi Tôn',
    element: 'Thổ',
    nature: 'Chí tôn, quý hiển, bao quát toàn cục',
    essence: 'Bản mệnh mang đế khí vương giả, phong thái ung dung đĩnh đạc, có năng lực lãnh đạo bẩm sinh và khát khao đứng trên đỉnh cao.',
    toanThuQuote: '《Toàn Thư》chép: "Tử Vi nãi vạn tinh chi chủ, vi đế tọa, hóa khí viết tôn quý, lâm vu Mệnh vị, chủ phúc thọ song toàn, uy vọng phục chúng."',
    tianJiLesson: 'Nghê sư giảng: "Tử Vi là hoàng đế tọa Mệnh, sinh ra đã có khí chất đứng đầu, không chịu dưới trướng người khác. Cần nhất Tả Phụ Hữu Bật củng chiếu như vua có lương thần phò tá; nếu cô độc thì là cô quân, tự thân bươn chải cáng đáng, dễ độc đoán" (《Thiên Kỷ》 Part 5 00:05:12).',
    personality: {
      core: 'Tự tôn cực cao, trọng danh dự khí tiết, hành sự đàng hoàng, có tầm nhìn vĩ mô nhưng bên trong có nỗi cô đơn của bậc đế vương.',
      strengths: ['Tầm nhìn chiến lược sâu rộng', 'Bản lĩnh lãnh đạo và quy tụ lòng người', 'Khí khái chính trực, dám chịu trách nhiệm lớn'],
      weaknesses: 'Dễ độc đoán, khó tiếp thu ý kiến trái chiều, đặt kỳ vọng vào bản thân và người khác quá cao.',
    },
    career: 'Rất thích hợp làm lãnh đạo, giám đốc điều hành (CEO), quản lý cấp cao, công chức hoạch định chính sách hoặc người đứng đầu doanh nghiệp lớn.',
    wealth: 'Tài vận thiên về quyền quý sinh tài — danh tiếng và chức vị đi trước thì tài lộc ắt theo sau, tiền bạc vững chãi như kho vàng đế đô.',
    love: 'Người phối ngẫu đàng hoàng, có khí chất hoặc gia thế tốt. Trong hôn nhân cần hạ bớt cái tôi đế vương để giữ hòa khí lứa đôi.',
    health: 'Hành Thổ chủ về tỳ vị, dạ dày, hệ tiêu hóa và chứng căng thẳng tinh thần do gánh vác việc lớn.',
  },
  '天机': {
    title: 'Trí Tuệ Mưu Lược Chi Tinh',
    element: 'Mộc',
    nature: 'Thiện tinh, cơ biến, linh hoạt, đa mưu túc trí',
    essence: 'Bản mệnh sở hữu bộ óc phân tích sắc sảo, tư duy linh hoạt như dòng nước, giỏi quy hoạch mưu lược và ứng biến trước mọi biến cố.',
    toanThuQuote: '《Toàn Thư》chép: "Thiên Cơ nãi Nam đẩu thiện tinh, hóa khí viết thiện, chủ phúc đức cơ mưu, đa tài đa nghệ, tâm từ tính cấp."',
    tianJiLesson: 'Nghê sư giảng: "Thiên Cơ tọa Mệnh là người quân sư cái thế, đầu óc nhảy số không ngừng nghỉ, thích lập kế hoạch sâu xa. Thích hợp làm chiến lược, công nghệ, nghiên cứu; kỵ nhất là nghĩ nhiều mà không làm, cần tri hành hợp nhất" (《Thiên Kỷ》 Part 3 00:23:15).',
    personality: {
      core: 'Hiếu học, thông minh lanh lợi, giàu lòng trắc ẩn nhưng tính khí hơi vội vàng, tâm trí hay dao động và dễ đa sầu đa cảm.',
      strengths: ['Khả năng học hỏi và tiếp thu tri thức siêu việt', 'Tư duy logic, giải quyết vấn đề phức tạp nhanh chóng', 'Khéo léo tùy cơ ứng biến trước nghịch cảnh'],
      weaknesses: 'Hay suy nghĩ thái quá (overthinking), dễ mất kiên nhẫn khi việc không đi đúng kế hoạch, nội tâm nhiều mối bận tâm.',
    },
    career: 'Thích hợp làm chuyên gia tư vấn chiến lược, lập trình công nghệ thông tin, phân tích dữ liệu, nghiên cứu phát triển (R&D), tài chính, giảng dạy.',
    wealth: 'Tài lộc biến động theo trí tuệ chất xám, kiếm tiền bằng mưu lược và kỹ năng chuyên sâu, nguồn thu đa dạng từ nhiều kênh.',
    love: 'Người phối ngẫu thông minh, nhanh nhẹn, làm việc trí óc hoặc hay phải di chuyển. Đôi bên lấy sự đồng điệu tâm hồn làm cầu nối.',
    health: 'Hành Mộc chủ về gan mật, hệ thần kinh thực vật, chứng mất ngủ kinh niên và nhức mỏi thị lực.',
  },
  '太阳': {
    title: 'Quang Minh Quan Quý Chi Tinh',
    element: 'Hỏa',
    nature: 'Chí dương chí cương, quang minh lỗi lạc, khẳng khái hào hiệp',
    essence: 'Bản mệnh như vầng thái dương tỏa rạng, tính tình chính đại quang minh, nhiệt thành hào sảng, thích gánh vác và bảo bọc người khác.',
    toanThuQuote: '《Toàn Thư》chép: "Thái Dương tinh chu chước chư cung, hóa khí viết quý, vi quan lộc chủ, chiếu diệu nhật nguyệt, chủ công danh cái thế."',
    tianJiLesson: 'Nghê sư giảng: "Thái Dương là mặt trời, miếu vượng thì uy danh hiển hách, quý nhân nâng đỡ; lạc hãm thì lao tâm khổ tứ, bôn ba vất vả vì người ngoài mà bỏ quên bản thân. Phải biết tiết chế ánh hào quang" (《Thiên Kỷ》 Part 14 00:08:40).',
    personality: {
      core: 'Thẳng thắn bộc trực, ghét điều mờ ám, giàu đức hy sinh vì đại cuộc, thích gánh vác trách nhiệm nhưng đôi khi thích phô trương thể diện.',
      strengths: ['Tâm hồn quảng đại, nhiệt huyết cống hiến', 'Dám nói dám làm, bảo vệ lẽ phải', 'Sức hút cá nhân mạnh mẽ, dễ thành tâm điểm tập thể'],
      weaknesses: 'Tính nóng vội, cả nể dễ chịu thiệt thòi về tiền bạc, gánh vác quá nhiều việc không phải của mình dẫn đến kiệt sức.',
    },
    career: 'Thích hợp công chức nhà nước, ngoại giao, chính trị, luật sư bảo vệ công lý, truyền thông, giáo dục đào tạo, đại diện cộng đồng.',
    wealth: 'Tài vận công khai minh bạch, tiêu tiền hào phóng vì bạn bè và việc nghĩa, danh tiếng lan tỏa càng xa thì tiền bạc thu về càng lớn.',
    love: 'Người phối ngẫu có cá tính rõ ràng, nhiệt tình và trọng danh dự. Trong tình cảm cần học cách lắng nghe thay vì áp đặt góc nhìn cá nhân.',
    health: 'Hành Hỏa chủ về tim mạch, huyết áp, mắt, hệ tuần hoàn máu và các chứng bốc hỏa do lao lực.',
  },
  '武曲': {
    title: 'Thực Lực Tài Tinh Võ Cách',
    element: 'Kim',
    nature: 'Cương nghị, quả quyết, kỷ luật nghiêm cẩn, trọng thực tiễn',
    essence: 'Bản mệnh mang khí chất cứng cỏi như thép đã tôi, làm việc dứt khoát thực tế, nói ít làm nhiều, có bản lĩnh tự tay dựng nghiệp lớn.',
    toanThuQuote: '《Toàn Thư》chép: "Vũ Khúc nãi Bắc đẩu đệ lục tinh, thuộc kim, hóa khí viết tài, chủ quả túc cương dũng, tài vận hanh thông."',
    tianJiLesson: 'Nghê sư giảng: "Vũ Khúc là đại tài tinh thực chiến, tính khí cương nghị không khuất phục. Cung Mệnh có Vũ Khúc là người có năng lực kiếm tiền phi thường, nhưng tính hơi cô độc, cần bồi đắp sự mềm mỏng trong đối nhân xử thế" (《Thiên Kỷ》 Part 4 00:15:20).',
    personality: {
      core: 'Kiên cường, bền bỉ, không sợ gian nan thử thách, hành động có kỷ luật sắt đá nhưng bề ngoài đôi khi lạnh lùng, ít biểu lộ cảm xúc.',
      strengths: ['Ý chí thép, vượt nghịch cảnh tuyệt vời', 'Năng lực quản lý dòng tiền và tài chính sắc sảo', 'Chữ tín ngàn vàng, lời nói đi đôi với việc làm'],
      weaknesses: 'Cứng nhắc, thiếu sự mềm mỏng linh hoạt, dễ cô lập bản thân và khó mở lòng chia sẻ tâm tư với người thân.',
    },
    career: 'Rất hợp ngành tài chính ngân hàng, đầu tư, kế toán kiểm toán, kỹ thuật cơ khí, sản xuất công nghiệp, quân cảnh hoặc tự doanh làm chủ.',
    wealth: 'Cực vượng tài khí! Dòng tiền tích tụ từng bước vững chắc qua thực lực, biết cách đầu tư sinh lời và bảo toàn tư bản lâu dài.',
    love: 'Tình cảm có phần khô khan, không thích lời đường mật mà thể hiện bằng hành động chu cấp thực tế. Nên tạo không gian lãng mạn hơn.',
    health: 'Hành Kim chủ về hệ hô hấp, phế quản, phổi, xương khớp, răng và phòng ngừa chấn thương cơ học.',
  },
  '天同': {
    title: 'Phúc Tinh Ôn Nhu Hưởng Lộc',
    element: 'Thủy',
    nature: 'Phúc đức, đôn hậu, nhã nhặn, dĩ hòa vi quý',
    essence: 'Bản mệnh mang khí chất thuần lương nhân ái, tính tình hiền hòa dễ mến, tâm hồn yêu chuộng tự do nghệ thuật, một đời phùng hung hóa cát.',
    toanThuQuote: '《Toàn Thư》chép: "Thiên Đồng nãi Nam đẩu đệ tứ tinh, hóa khí viết phúc, vi phúc đức chủ, tính tình ôn hòa, vạn sự phùng hung hóa cát."',
    tianJiLesson: 'Nghê sư giảng: "Thiên Đồng là đứa trẻ thiên lương trên trời, thích an nhàn hưởng thụ, có óc thẩm mỹ. Sống không thích bon chen hãm hại ai; gặp hoạn nạn ắt có quý nhân âm phù dương trợ" (《Thiên Kỷ》 Part 3 00:35:10).',
    personality: {
      core: 'Ôn hòa, nhân hậu, tâm tính trẻ trung, dễ gần, ghét xung đột tranh chấp nhưng đôi khi thiếu tính quyết đoán và nghị lực bền bỉ.',
      strengths: ['Dễ được lòng người, nhân duyên xã hội tuyệt hảo', 'Tâm thái lạc quan, biết tận hưởng niềm vui giản dị', 'Khả năng cảm thụ thẩm mỹ và nghệ thuật tinh tế'],
      weaknesses: 'Hay do dự thiếu quyết đoán, đôi khi lười tranh đấu, an phận thủ thường khi gặp áp lực nặng nề.',
    },
    career: 'Thích hợp ngành dịch vụ khách hàng, văn hóa giải trí, ẩm thực, thiết kế nghệ thuật, nhân sự, công tác xã hội thiện nguyện.',
    wealth: 'Tài lộc vừa đủ tiêu dùng sung túc, tiền tài đến tự nhiên theo phúc đức, không chịu cảnh bần hàn nhưng ít tích lũy cự phú do không ham tranh đoạt.',
    love: 'Tình duyên giàu cảm xúc lãng mạn, phối ngẫu trẻ trung dễ mến, gia đình chan hòa tình cảm ấm êm.',
    health: 'Hành Thủy chủ về bàng quang, thận, hệ bài tiết, đường tiêu hóa dưới và chứng thừa cân do ăn uống thoải mái.',
  },
  '廉贞': {
    title: 'Thứ Đào Hoa Tù Tinh Bứt Phá',
    element: 'Hỏa',
    nature: 'Khí khái, tự tôn mạnh, tài hoa kiêm bị, biến hóa linh hoạt',
    essence: 'Bản mệnh mang nội lực thâm sâu, ý chí tiến thủ cực mạnh, thông minh tháo vát, dám nghĩ dám làm và có sức lôi cuốn người xung quanh.',
    toanThuQuote: '《Toàn Thư》chép: "Liêm Trinh Bắc đẩu đệ ngũ tinh, hóa khí viết tù thứ đào hoa, tính cách viên hoạt, văn võ kiêm toàn, ngộ cát tắc hưng, ngộ sát tắc hình."',
    tianJiLesson: 'Nghê sư giảng: "Liêm Trinh là sao giám sát nghiêm khắc kiêm thứ đào hoa. Người có Liêm Trinh rất tự trọng, làm việc quyết liệt và có tài giao tế siêu đẳng; cần giữ tâm thanh bạch, cẩn thận giấy tờ pháp lý" (《Thiên Kỷ》 Part 15 00:30:15).',
    personality: {
      core: 'Cá tính phức tạp nửa chính nửa tà, thông minh sắc sảo, tự tôn cực lớn, làm việc có nguyên tắc riêng bất khả xâm phạm.',
      strengths: ['Năng lực ngoại giao và xây dựng mạng lưới quan hệ đỉnh cao', 'Khả năng chịu áp lực và xoay chuyển tình thế', 'Tài hoa nghệ thuật và thẩm mỹ độc đáo'],
      weaknesses: 'Tính khí hay nghi ngờ, đôi khi chấp nhất câu nệ, phòng ngừa thị phi khẩu thiệt hoặc xung đột pháp lý.',
    },
    career: 'Rất hợp ngành tư pháp pháp luật, hải quan, kiểm toán, ngoại giao, chính trị, thiết kế cao cấp, nghệ thuật biểu diễn hoặc thương mại.',
    wealth: 'Kiếm tiền từ tài năng đặc thù và mạng lưới quan hệ rộng khắp, tài lộc dồi dào nhưng cần chú trọng hóa đơn chứng từ minh bạch.',
    love: 'Đào hoa vượng, có sức hút giới tính mãnh liệt. Hôn nhân cần sự bao dung và tin tưởng lẫn nhau để tránh ghen tuông vô cớ.',
    health: 'Hành Hỏa chủ về tim mạch, huyết dịch, dị ứng da liễu, hệ thần kinh thực vật và thị lực.',
  },
  '天府': {
    title: 'Tài Khố Lệnh Tinh Trầm Ổn',
    element: 'Thổ',
    nature: 'Trầm ổn, bao dung, cẩn mật, giữ của chu toàn',
    essence: 'Bản mệnh như kho báu của trời, phong thái điềm đạm bao dung, suy nghĩ đường dài cẩn trọng, làm việc bài bản vững chắc như bàn thạch.',
    toanThuQuote: '《Toàn Thư》chép: "Thiên Phủ Nam đẩu lệnh tinh, vi đế chi tá, hóa khí viết hiền năng tài khố, đoan trang ôn lương, phúc thọ song toàn."',
    tianJiLesson: 'Nghê sư giảng: "Thiên Phủ là két sắt giữ của trên trời, tính cẩn tắc vô ưu. Người này giỏi tích lũy của cải, coi trọng gia đình, không thích phiêu lưu mạo hiểm; càng về hậu vận càng giàu có an khang" (《Thiên Kỷ》 Part 4 00:08:30).',
    personality: {
      core: 'Điềm đạm, kín đáo, coi trọng an toàn tài chính, giỏi đối nhân xử thế, có phong thái người bảo hộ che chở cho tập thể.',
      strengths: ['Khả năng quản lý tài sản và tích lũy bền vững', 'Bao dung, chu đáo, làm chỗ dựa tin cậy cho mọi người', 'Tư duy tổ chức logic, ít khi mắc sai lầm sơ đẳng'],
      weaknesses: 'Có phần bảo thủ, ngại đổi mới mạo hiểm, đôi khi quá cẩn trọng làm tuột mất thời cơ đột phá.',
    },
    career: 'Rất hợp ngành ngân hàng, quản lý kho bạc tài sản, bất động sản, kế toán trưởng, hành chính quản trị doanh nghiệp lớn, công chức.',
    wealth: 'Đại tài khố! Tiền kiếm được biết giữ gìn và chuyển hóa thành bất động sản, gia sản tích lũy ngày một dồi dào theo tuổi tác.',
    love: 'Người phối ngẫu đảm đang, biết chu toàn kinh tế gia đình, cùng nhau vun đắp tổ ấm vững bền như thành trì.',
    health: 'Hành Thổ chủ về dạ dày, lá lách, hệ tiêu hóa và các chứng liên quan đến chế độ ăn uống thịnh soạn.',
  },
  '太阴': {
    title: 'Phú Tinh Điền Trạch Ôn Nhu',
    element: 'Thủy',
    nature: 'Trầm tĩnh, tinh tế, nội tâm sâu sắc, tích lũy điền sản ngầm',
    essence: 'Bản mệnh mang vẻ đẹp dịu dàng của ánh trăng rằm, tâm hồn nhạy cảm tinh tế, trực giác bén nhạy, có năng lực quản lý tài sản kín đáo tuyệt vời.',
    toanThuQuote: '《Toàn Thư》chép: "Thái Âm vi trung thiên dạ tinh, hóa khí viết phú, vi điền trạch chủ, tính tình thanh tú, từ ái trù trừ."',
    tianJiLesson: 'Nghê sư giảng: "Thái Âm là sao tiền bạc ngầm và nhà đất. Người có Thái Âm miếu vượng tích lũy của cải rất êm đềm, trực giác cực tốt; nếu lạc hãm thì cần chú ý giải tỏa âu lo nội tâm" (《Thiên Kỷ》 Part 14 00:25:10).',
    personality: {
      core: 'Thanh lịch, hướng nội, giàu lòng trắc ẩn, yêu thích cái đẹp và sự ngăn nắp, nhưng tâm trạng dễ bị dao động theo ngoại cảnh.',
      strengths: ['Trực giác tâm lý bén nhạy, thấu hiểu lòng người', 'Khả năng quản lý tài chính chi tiết, cẩn thận', 'Óc thẩm mỹ nghệ thuật và gu sống tinh tế'],
      weaknesses: 'Dễ suy nghĩ tiêu cực, đa sầu đa cảm, thiếu sự dứt khoát quyết liệt khi cần đối đầu trực diện.',
    },
    career: 'Thích hợp ngành bất động sản, quản lý quỹ tài chính, mỹ thuật thiết kế nội thất, du lịch khách sạn, văn chương giáo dục, y tế.',
    wealth: 'Tài khí tích tụ thầm lặng, lộc từ đất đai bất động sản rất thịnh vượng, tiền bạc vào đều đặn và có của để dành phong phú.',
    love: 'Tình cảm sâu lắng, chu đáo quan tâm đối phương. Nam mệnh được vợ hiền trợ lực, nữ mệnh có nét quyến rũ đoan trang.',
    health: 'Hành Thủy chủ về thận, hệ tiết niệu, mắt (đặc biệt mắt phải), khí huyết và sức khỏe nội tiết phụ khoa.',
  },
  '贪狼': {
    title: 'Đa Tài Đào Hoa Linh Hoạt Chi Thần',
    element: 'Mộc/Thủy',
    nature: 'Đa tài đa nghệ, năng động, duyên giao tế, nhạy bén thời cuộc',
    essence: 'Bản mệnh thông minh tháo vát, giao tế siêu đẳng, ham học hỏi điều mới, nắm bắt cơ hội thời cuộc nhạy bén và có sức hút đặc biệt.',
    toanThuQuote: '《Toàn Thư》chép: "Tham Lang Bắc đẩu đệ nhất tinh, hóa khí viết đào hoa dục vọng, tính hoạt bát đa tài, hảo thần tiên huyền bí chi học."',
    tianJiLesson: 'Nghê sư giảng: "Tham Lang là sao giao tế đệ nhất, khéo léo biến chuyển theo thời thế. Gặp Hỏa Tinh hoặc Linh Tinh là cách Hỏa Tham bạo phát cự phú; khi thành công phải biết tu thân tích đức để giữ phúc" (《Thiên Kỷ》 Part 13 00:12:45).',
    personality: {
      core: 'Hào hoa, phóng khoáng, thích trải nghiệm mới lạ, khéo ăn nói và nắm bắt tâm lý người khác, nhưng đôi khi thiếu tính kiên nhẫn dài lâu.',
      strengths: ['Kỹ năng giao tiếp và thuyết phục người khác bậc thầy', 'Nhanh nhạy với cơ hội kinh doanh và xu thế mới', 'Đa tài, có năng khiếu nghệ thuật và huyền học'],
      weaknesses: 'Dễ đứng núi này trông núi nọ, ham muốn nhiều thứ cùng lúc dẫn đến phân tán nguồn lực.',
    },
    career: 'Thích hợp kinh doanh thương mại, ngoại giao, quan hệ công chúng (PR), truyền thông giải trí, ẩm thực, du lịch, tâm lý học hoặc đầu tư.',
    wealth: 'Dòng tiền lưu thông linh hoạt, dễ có cơ duyên hoạch tài phát đạt bất ngờ nhờ sự nhạy bén và mạng lưới quan hệ rộng khắp.',
    love: 'Đào hoa vượng, đời sống tình cảm phong phú nhiều màu sắc. Cần giữ sự chung thủy và cùng nhau xây dựng mục tiêu chung lâu dài.',
    health: 'Hành Mộc/Thủy chủ về gan mật, đường tiết niệu, phòng ngừa các bệnh do sinh hoạt thức khuya và tiệc tùng quá độ.',
  },
  '巨门': {
    title: 'Khẩu Tài Ám Tinh Hùng Biện',
    element: 'Thủy',
    nature: 'Quan sát tỉ mỉ, tư duy phản biện, khẩu tài hùng biện, chuyên sâu',
    essence: 'Bản mệnh có năng lực quan sát thấu thị bản chất vấn đề, tư duy logic phản biện sắc sảo, khẩu tài ăn nói lưu loát và tinh thần nghiên cứu chuyên sâu.',
    toanThuQuote: '《Toàn Thư》chép: "Cự Môn Bắc đẩu đệ nhị tinh, hóa khí viết ám, chủ khẩu thiệt thị phi, minh biện thị phi, mưu lược thâm trầm."',
    tianJiLesson: 'Nghê sư giảng: "Cự Môn là cánh cổng lớn, mở ra là thị phi. Đỉnh cao của Cự Môn là dĩ khẩu vi nghiệp — dùng lời nói, chuyên môn, tư vấn, giảng dạy để biến khẩu tài thành tiền bạc và hóa giải thị phi" (《Thiên Kỷ》 Part 3 00:19:41).',
    personality: {
      core: 'Hoài nghi có cơ sở, cẩn trọng trong từng lời nói việc làm, không dễ tin người, yêu thích sự thật và sự công bằng minh bạch.',
      strengths: ['Khả năng phân tích chi tiết và phát hiện lỗ hổng siêu đẳng', 'Khẩu tài hùng biện, diễn đạt ngôn từ thuyết phục', 'Kiên trì nghiên cứu đến cùng bản chất vấn đề'],
      weaknesses: 'Dễ nói lời thẳng thắn làm phật lòng người khác, hay vướng vào tranh cãi thị phi không đáng có.',
    },
    career: 'Rất hợp nghề luật sư, giảng viên, diễn giả, chuyên gia tư vấn chiến lược, nhà báo, phát ngôn viên, nghiên cứu khoa học chuyên sâu.',
    wealth: 'Kiếm tiền từ tài ăn nói và kiến thức chuyên môn sâu rộng, càng tích lũy thâm niên chuyên môn thì tài lộc càng sung túc vững bền.',
    love: 'Trong đời sống lứa đôi dễ xảy ra khắc khẩu vì bất đồng ý kiến. Cần học cách bao dung, lắng nghe và nhường nhịn bạn đời.',
    health: 'Hành Thủy chủ về họng, thanh quản, đường hô hấp, răng miệng và hệ tiêu hóa do căng thẳng suy nghĩ nhiều.',
  },
  '天相': {
    title: 'Ấn Tinh Tể Tướng Trung Hậu',
    element: 'Thủy',
    nature: 'Trung hậu, trọng chữ tín, ngăn nắp, phò tá tài năng',
    essence: 'Bản mệnh mang phẩm chất cao quý của ấn tinh tể tướng, trọng chữ tín, làm việc chu toàn ngăn nắp, là cánh tay đắc lực và chỗ dựa vững chắc.',
    toanThuQuote: '《Toàn Thư》chép: "Thiên Tướng Nam đẩu đệ ngũ tinh, hóa khí viết ấn, vi quan lộc văn tinh, tá đế chi vị, tính thuần hòa cẩn thận."',
    tianJiLesson: 'Nghê sư giảng: "Thiên Tướng là tể tướng trời, vị trí cao nhưng phong thái hòa nhã, nhân tài phò tá đắc lực nhất thiên hạ. Thích hợp làm phó tướng, điều hành, quản trị pháp lý; uy tín là tài sản lớn nhất" (《Thiên Kỷ》 Part 4 00:22:10).',
    personality: {
      core: 'Chính trực, trung hậu, chu đáo, ghét sự giả dối, thích giúp đỡ kẻ yếu, hành sự theo khuôn phép chuẩn mực và rất coi trọng uy tín.',
      strengths: ['Năng lực phối hợp, điều hành và thực thi công việc xuất sắc', 'Được cấp trên tin cậy và cấp dưới kính trọng', 'Phong thái đàng hoàng, đáng tin cậy trong mọi thỏa thuận'],
      weaknesses: 'Đôi khi quá nguyên tắc, cả nể người quen dẫn đến gánh vác trách nhiệm hộ người khác.',
    },
    career: 'Thích hợp làm giám đốc điều hành (COO), trợ lý cấp cao, quản trị nhân sự, pháp chế doanh nghiệp, quản lý công quyền, ngoại giao.',
    wealth: 'Thu nhập ổn định và tăng trưởng theo chức vị và uy tín cá nhân, được hưởng lộc từ các hợp đồng lớn và sự tín nhiệm.',
    love: 'Người phối ngẫu hiền thục, chu đáo, gia đình nề nếp gia phong. Đôi bên tôn trọng và hỗ trợ nhau đắc lực trong cuộc sống.',
    health: 'Hành Thủy chủ về bàng quang, thận, da liễu và các bệnh dị ứng thời tiết.',
  },
  '天梁': {
    title: 'Ấn Tinh Giải Ách Thọ Khảo',
    element: 'Thổ',
    nature: 'Ấm hộ, thanh cao, từ bi, phong thái trưởng bối',
    essence: 'Bản mệnh có phong thái trưởng lão uy nghiêm từ ái, giàu lòng trắc ẩn, tính tình thanh cao, có duyên với y dược huyền học, gặp nạn hóa lành.',
    toanThuQuote: '《Toàn Thư》chép: "Thiên Lương Nam đẩu đệ tam tinh, hóa khí viết ấm, vi thọ tinh, năng giải bách ách, tính cương trực công minh."',
    tianJiLesson: 'Nghê sư giảng: "Thiên Lương là sao che chở của tiền bối. Gặp hung hóa cát, nguy nan có quý nhân đỡ đầu; tính tình quân tử thanh liêm, rất có duyên với y dược, giáo dục và làm phúc giúp đời" (《Thiên Kỷ》 Part 4 00:30:05).',
    personality: {
      core: 'Công minh chính trực, thích đạo lý, thích bao bọc người khác, phong thái chín chắn đĩnh đạc nhưng đôi khi thích giảng giải dạy đời.',
      strengths: ['Tấm lòng thiện lương, phúc ấm tổ tiên che chở lớn', 'Khả năng hòa giải mâu thuẫn và giữ gìn trật tự', 'Kiến thức uyên thâm, có năng khiếu y lý triết học'],
      weaknesses: 'Hơi cổ hủ, cố chấp vào quan điểm đạo đức cá nhân, hay lo chuyện bao đồng bên ngoài.',
    },
    career: 'Rất hợp ngành y dược, giáo dục đào tạo, thẩm phán tòa án, thanh tra kiểm toán, cố vấn chính sách, tổ chức thiện nguyện.',
    wealth: 'Tài lộc trong sạch thanh bạch, tiền bạc đến từ chuyên môn và phúc đức, không cầu tài bất chính, hậu vận giàu có an nhàn.',
    love: 'Người phối ngẫu chín chắn, biết chăm lo gia đình như người anh/chị lớn, tình cảm sâu nặng và son sắt.',
    health: 'Hành Thổ chủ về tỳ vị, tiêu hóa, đau nhức xương khớp và các chứng bệnh mãn tính tuổi già.',
  },
  '七杀': {
    title: 'Tướng Tinh Quân Lữ Quả Cảm',
    element: 'Kim',
    nature: 'Cương mãnh, quyết liệt, dám mạo hiểm, độc lập tác chiến',
    essence: 'Bản mệnh mang khí phách của thượng tướng soái trận, độc lập tự cường, không sợ gian nan nguy hiểm, làm việc thần tốc dứt khoát.',
    toanThuQuote: '《Toàn Thư》chép: "Thất Sát Nam đẩu đệ lục tinh, hóa khí viết tướng quân, chủ sát phạt uy quyền, tính cấp quả cảm, độc lập sáng nghiệp."',
    tianJiLesson: 'Nghê sư giảng: "Thất Sát là dũng tướng tiên phong, dám đương đầu với bão tố. Bản mệnh độc lập tự chủ, làm việc có uy quyền lớn; cần rèn luyện sự bình tĩnh, cẩn trọng đi lại giao thông" (《Thiên Kỷ》 Part 13 00:28:10).',
    personality: {
      core: 'Cương liệt, thẳng thắn, dũng cảm, ghét sự lề mề do dự, tự mình gánh vác mọi trọng trách, không chịu khuất phục trước nghịch cảnh.',
      strengths: ['Khí phách anh hùng, dám nghĩ dám làm việc lớn', 'Khả năng đột phá mở đường trong hoàn cảnh bế tắc', 'Tính quyết đoán và tốc độ hành động chớp nhoáng'],
      weaknesses: 'Tính khí nóng vội, độc đoán, dễ làm tổn thương người khác bằng lời nói gắt gao, nội tâm cô độc.',
    },
    career: 'Rất hợp ngành quân đội, công an, khởi nghiệp kinh doanh độc lập, quản lý khủng hoảng, kỹ thuật công trình nặng, phẫu thuật ngoại khoa.',
    wealth: 'Tài vận thăng trầm theo các thương vụ lớn, dám đầu tư mạo hiểm, có những giai đoạn tiền bạc bùng nổ vượt bậc nhờ sự táo bạo.',
    love: 'Cá tính mạnh khiến tình duyên dễ xảy ra sóng gió buổi đầu. Nên kết hôn muộn và học cách lắng nghe nhường nhịn đối phương.',
    health: 'Hành Kim chủ về phổi, đường hô hấp, phòng ngừa chấn thương chân tay do vận động mạnh hoặc đi lại va chạm.',
  },
  '破军': {
    title: 'Hao Tinh Dũng Tướng Tiên Phá Hậu Thành',
    element: 'Thủy',
    nature: 'Khai phá, canh tân, dám đập bỏ cái cũ để dựng cái mới',
    essence: 'Bản mệnh mang ngọn lửa cách tân bất tận, ghét sự trói buộc rập khuôn, sẵn sàng dấn thân từ hai bàn tay trắng để kiến tạo thế giới mới.',
    toanThuQuote: '《Toàn Thư》chép: "Phá Quân Bắc đẩu đệ thất tinh, hóa khí viết hao, chủ biến động canh tân, tiên phá hậu thành, dũng mãnh tiến thủ."',
    tianJiLesson: 'Nghê sư giảng: "Phá Quân là dũng tướng phá trận. Đời người buộc phải trải qua tiên phá hậu thành — đạp đổ cái cũ rồi mới dựng nên cái mới; bôn ba lập nghiệp từ hai bàn tay trắng" (《Thiên Kỷ》 Part 10 00:32:00).',
    personality: {
      core: 'Phá cách, nổi loạn tích cực, kiên cường bất khuất, dám dấn thân vào những nơi chưa ai từng đi, ghét sống cuộc đời tẻ nhạt bình lặng.',
      strengths: ['Tinh thần sáng tạo đổi mới không ngừng', 'Sức bật phi thường sau những lần thất bại', 'Dám chấp nhận rủi ro để giành lấy thành quả lớn'],
      weaknesses: 'Tính cách bốc đồng, dễ phá vỡ trật tự sẵn có, chi tiêu tiền bạc thiếu kiểm soát khi hứng khởi.',
    },
    career: 'Thích hợp khởi nghiệp công nghệ mới, cải tổ doanh nghiệp, kiến trúc xây dựng, sáng tạo đột phá, thị trường nước ngoài, thiết kế.',
    wealth: 'Dòng tiền biến động dữ dội theo từng chu kỳ đầu tư, sau những lần thăng trầm tôi luyện sẽ tích tụ được cơ nghiệp đồ sộ bền vững.',
    love: 'Tình cảm nhiều thăng trầm biến động, phối ngẫu có cá tính khác biệt độc đáo. Cần giữ ngọn lửa thấu hiểu và sẻ chia.',
    health: 'Hành Thủy chủ về thận, hệ bài tiết, phòng ngừa suy kiệt do làm việc quá sức và chấn thương thể thao.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PHÂN TÍCH TỔ HỢP SONG TINH ĐẶC BIỆT
// ─────────────────────────────────────────────────────────────────────────────

function getDualStarInsight(names: string[]): string | undefined {
  const set = new Set(names);
  if (set.has('紫微') && set.has('天府')) {
    return '【CÁCH CỤC TỬ PHỦ ĐỒNG CUNG】: Tử Vi chí tôn gặp Thiên Phủ tài khố, ví như bậc minh quân nắm giữ kho bạc quốc gia, phúc lộc song toàn, tính cách trầm ổn đĩnh đạc, hậu vận đại phú đại quý.';
  }
  if (set.has('紫微') && set.has('七杀')) {
    return '【CÁCH CỤC TỬ SÁT HÓA QUYỀN】: Tử Vi gặp Thất Sát biến sát khí thành uy quyền tối thượng. Đương số là tướng soái tài ba, bản lĩnh kiên cường, dám đột phá lập nên nghiệp lớn phi thường.';
  }
  if (set.has('紫微') && set.has('破军')) {
    return '【CÁCH CỤC TỬ PHÁ BỨT PHÁ】: Vừa có đế khí vương giả vừa có tính khai phá tiên phong. Đương số không chấp nhận đi theo lối mòn, sẵn sàng đổi mới sáng tạo và tạo bước ngoặt lớn cho thời cuộc.';
  }
  if (set.has('紫微') && set.has('贪狼')) {
    return '【CÁCH CỤC TỬ THAM ĐÀO HOA KHẢM CHỦ】: Vừa có tài năng lãnh đạo vừa có tài giao tế siêu việt, phong lưu đa tài, nhân duyên thịnh vượng, khéo léo biến quan hệ xã hội thành thành tựu sự nghiệp.';
  }
  if (set.has('紫微') && set.has('天相')) {
    return '【CÁCH CỤC TỬ TƯỚNG TỀ TÂM】: Quân thần tương hội, làm việc bài bản ngăn nắp, chính nhân quân tử, năng lực quản trị xuất chúng, được mọi người vị nể tôn kính.';
  }
  if (set.has('武曲') && set.has('天府')) {
    return '【CÁCH CỤC VŨ PHỦ TRƯỜNG TỒN】: Hai đại tài tinh gặp nhau, một bên giỏi kiếm tiền một bên giỏi giữ của, cự phú chi cách, tài khố dồi dào, cả đời không lo thiếu thốn vật chất.';
  }
  if (set.has('武曲') && set.has('贪狼')) {
    return '【CÁCH CỤC VŨ THAM TIỀN BẦN HẬU PHÚ】: Tiền vận bôn ba tích lũy kinh nghiệm, ngoài 30 tuổi thời cơ chín muồi bùng nổ tài lộc (nhất là khi hội Hỏa Tinh hoặc Linh Tinh tạo thành Hỏa Tham/Linh Tham cách).';
  }
  if (set.has('武曲') && set.has('七杀')) {
    return '【CÁCH CỤC VŨ SÁT CƯƠNG NGHỊ】: Khí chất cứng như sắt thép, quyết đoán mau lẹ, rất hợp với các ngành nghề đòi hỏi kỷ luật cao, kinh doanh độc lập hoặc quân cảnh kỹ thuật.';
  }
  if (set.has('武曲') && set.has('破军')) {
    return '【CÁCH CỤC VŨ PHÁ TIÊN PHÁ HẬU THÀNH】: Dám mạo hiểm đầu tư, tự lực cánh sinh lập nghiệp, trải qua sóng gió khúc quanh thì tài nguyên ngày một vững bền.';
  }
  if (set.has('武曲') && set.has('天相')) {
    return '【CÁCH CỤC VŨ TƯỚNG VĂN VÕ SONG TOÀN】: Tài năng và đức độ song hành, hành sự cẩn mật, công bằng chính trực, được cấp trên trao phó trọng trách tài chính lớn.';
  }
  if (set.has('太阳') && set.has('太阴')) {
    return '【CÁCH CỤC NHẬT NGUYỆT ĐỒNG CUNG】: Âm Dương hội tụ, nội tâm phong phú đa diện vừa có sự quyết liệt của Thái Dương vừa có sự tinh tế của Thái Âm, tư duy biến hóa khôn lường.';
  }
  if (set.has('太阳') && set.has('巨门')) {
    return '【CÁCH CỤC CỰ NHẬT QUANG MINH】: Ánh dương chiếu rọi xua tan ám khí Cự Môn, khẩu tài xuất chúng, danh tiếng vang xa, rất thích hợp xuất ngoại hoặc làm việc trong môi trường đa quốc gia.';
  }
  if (set.has('太阳') && set.has('天梁')) {
    return '【CÁCH CỤC DƯƠNG LƯƠNG XƯƠNG LỘC】: Văn chương quán thế, danh tiếng hiển đạt, có duyên với khoa cử học thuật và y dược, được tiền bối nâng đỡ tận tình.';
  }
  if (set.has('天机') && set.has('太阴')) {
    return '【CÁCH CỤC CƠ NGUYỆT THÂM TRẦM】: Trí tuệ tinh tế, mưu lược sâu xa, nội tâm kín đáo, có năng khiếu đặc biệt về lập kế hoạch, tài chính ngầm và nghệ thuật.';
  }
  if (set.has('天机') && set.has('巨门')) {
    return '【CÁCH CỤC CƠ CỰ ĐỒNG HÀNH】: Tư duy phản biện sắc sảo, tài hùng biện biện luận bậc thầy, tiền vận nhiều thử thách nhưng hậu vận gặt hái thành công vang dội.';
  }
  if (set.has('天机') && set.has('天梁')) {
    return '【CÁCH CỤC THIỆN ẤM TRIỀU CƯƠNG】: Thiện lương và mưu lược kết hợp, tính tình cao thượng, có duyên với y thuật, huyền học, triết lý và công tác cố vấn cấp cao.';
  }
  if (set.has('天同') && set.has('太阴')) {
    return '【CÁCH CỤC ĐỒNG ÂM TẠI TÝ】: Nước trong trăng tỏ, ngoại hình thanh nhã, tâm hồn lãng mạn, phúc lộc dồi dào, cuộc sống êm ấm an lành.';
  }
  if (set.has('天同') && set.has('巨门')) {
    return '【CÁCH CỤC ĐỒNG CỰ DĨ KHẨU VI NGHIỆP】: Ban đầu có thể gặp chút hiểu lầm thị phi, nhưng về sau khẩu tài phát tiết, càng nói càng sinh tài, hậu vận an khang.';
  }
  if (set.has('天同') && set.has('天梁')) {
    return '【CÁCH CỤC ĐỒNG LƯƠNG PHÚC ẤM】: Phúc tinh gặp Ấm tinh, một đời bình an, tai qua nạn khỏi, quý nhân nâng đỡ trên mọi nẻo đường.';
  }
  if (set.has('廉贞') && set.has('天府')) {
    return '【CÁCH CỤC LIÊM PHỦ TRẦM UY】: Tài hoa xuất chúng kết hợp với sự điềm đạm cẩn mật, giữ tiền và quyền rất tốt, sự nghiệp vững vàng như đỉnh núi.';
  }
  if (set.has('廉贞') && set.has('贪狼')) {
    return '【CÁCH CỤC LIÊM THAM ĐẠI ĐÀO HOA】: Cực kỳ nhanh nhạy, nghệ thuật và giao tiếp bậc thầy, cuộc sống tràn ngập màu sắc và cơ hội bứt phá.';
  }
  if (set.has('廉贞') && set.has('天相')) {
    return '【CÁCH CỤC LIÊM TƯỚNG CHÍNH TRỰC】: Nghiêm túc, kỷ luật, công bằng, rất thích hợp các ngành tư pháp, quản lý pháp lý và hành chính công quyền.';
  }
  if (set.has('廉贞') && set.has('七杀')) {
    return '【CÁCH CỤC LIÊM SÁT HÙNG TÚC ĐẠI TRIỀU】: Khí thế hiên ngang, dũng cảm xông pha nơi đầu sóng ngọn gió, biến động tôi luyện nên anh tài.';
  }
  if (set.has('廉贞') && set.has('破军')) {
    return '【CÁCH CỤC LIÊM PHÁ TIÊN PHONG】: Dám đập tan khuôn phép để dựng nên đại nghiệp, bản lĩnh quật cường không lùi bước.';
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHÂN TÍCH TƯƠNG QUAN NGŨ HÀNH CUNG VÀ CỤC
// ─────────────────────────────────────────────────────────────────────────────

function getCungCucRelation(cucName: string, branchIdx: number): string {
  const branchElements = ['Thủy', 'Thổ', 'Mộc', 'Mộc', 'Thổ', 'Hỏa', 'Hỏa', 'Thổ', 'Kim', 'Kim', 'Thổ', 'Thủy'];
  const cungEl = branchElements[branchIdx] || 'Thổ';
  let cucEl = 'Kim';
  if (cucName.includes('水') || cucName.includes('Thủy')) cucEl = 'Thủy';
  else if (cucName.includes('木') || cucName.includes('Mộc')) cucEl = 'Mộc';
  else if (cucName.includes('火') || cucName.includes('Hỏa')) cucEl = 'Hỏa';
  else if (cucName.includes('土') || cucName.includes('Thổ')) cucEl = 'Thổ';

  if (cungEl === cucEl) return `Cung vị (${cungEl}) và Cục số (${cucEl}) tỷ hòa — thời vận bình ổn, nội lực và hoàn cảnh dung thông hòa hợp.`;
  if (
    (cungEl === 'Kim' && cucEl === 'Thủy') ||
    (cungEl === 'Thủy' && cucEl === 'Mộc') ||
    (cungEl === 'Mộc' && cucEl === 'Hỏa') ||
    (cungEl === 'Hỏa' && cucEl === 'Thổ') ||
    (cungEl === 'Thổ' && cucEl === 'Kim')
  ) {
    return `Cung vị (${cungEl}) sinh Cục số (${cucEl}) — được ngoại cảnh nâng đỡ tương sinh, như thuyền xuôi dòng nước, gặp nhiều may mắn thuận lợi.`;
  }
  if (
    (cucEl === 'Kim' && cungEl === 'Thủy') ||
    (cucEl === 'Thủy' && cungEl === 'Mộc') ||
    (cucEl === 'Mộc' && cungEl === 'Hỏa') ||
    (cucEl === 'Hỏa' && cungEl === 'Thổ') ||
    (cucEl === 'Thổ' && cungEl === 'Kim')
  ) {
    return `Cục số (${cucEl}) sinh Cung vị (${cungEl}) — bản thân phải cống hiến, hao tâm tổn lực nhiều cho hoàn cảnh mới gặt hái được thành quả.`;
  }
  if (
    (cungEl === 'Kim' && cucEl === 'Mộc') ||
    (cungEl === 'Mộc' && cucEl === 'Thổ') ||
    (cungEl === 'Thổ' && cucEl === 'Thủy') ||
    (cungEl === 'Thủy' && cucEl === 'Hỏa') ||
    (cungEl === 'Hỏa' && cucEl === 'Kim')
  ) {
    return `Cung vị (${cungEl}) khắc Cục số (${cucEl}) — thời vận chịu sức ép từ môi trường bên ngoài, nhiều trở lực khách quan, cần lấy sự kiên nhẫn làm đầu.`;
  }
  return `Cục số (${cucEl}) khắc Cung vị (${cungEl}) — tự thân phải nỗ lực vượt khó, dùng bản lĩnh để chế ngự hoàn cảnh, tuy vất vả nhưng ắt đắc thắng.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// BỘ SUY LUẬN CHÍNH THỰC THI (VIETNAMESE INTERPRETATION ENGINE)
// ─────────────────────────────────────────────────────────────────────────────

export function generateVietnameseInterpretation(
  chart: ZiweiChart,
  topic: DatasetTopic | 'daxian' | 'liunian',
  options?: { selectedDxIndex?: number; liunianYear?: number }
): string {
  const ming = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  const than = chart.palaces.find(p => p.branch === chart.shenGongBranch);
  const currentDx = chart.daXians[chart.currentDaXianIndex];
  const wuxing = tJu(chart.wuxingJuName);
  const patterns = detectPatterns(chart);
  const patternNames = patterns.map(p => tPattern(p.name)).join(', ') || 'Cách cục bình ổn, đắc hòa tự nhiên';
  const birthYearGanzhi = chart.lunarInfo ? tGanzhi(chart.lunarInfo.yearStem, chart.lunarInfo.yearBranch) : '';

  // Lấy danh sách sao Mệnh
  const mingMajorNames = getMajorStarNames(ming);
  const firstMajor = mingMajorNames[0] ? STAR_PROFILES[mingMajorNames[0]] : undefined;
  const secondMajor = mingMajorNames[1] ? STAR_PROFILES[mingMajorNames[1]] : undefined;
  const dualInsight = getDualStarInsight(mingMajorNames);

  switch (topic) {
    case 'overview': {
      const mingStars = getMajorStarsStr(ming);
      const isVcd = mingMajorNames.length === 0;

      // Đoạn văn định tính cốt lõi hoàn toàn động theo sao thủ Mệnh
      let essenceText = '';
      if (dualInsight) {
        essenceText = dualInsight;
      } else if (firstMajor) {
        essenceText = `Bản mệnh tọa thủ 【${tStar(mingMajorNames[0])}】 (${firstMajor.title}). ${firstMajor.essence} Với đặc tính ${firstMajor.nature}, đường đời chú trọng vào việc phát huy năng lực thực chất và khẳng định vị thế cá nhân.`;
      } else if (isVcd) {
        const diBranch = (chart.mingGongBranch + 6) % 12;
        const thienDi = chart.palaces.find(p => p.branch === diBranch);
        const diMajorStr = getMajorStarsStr(thienDi);
        essenceText = `Mệnh Cung Vô Chính Diệu, mượn chính tinh đối cung Thiên Di (${diMajorStr}) chiếu về làm nòng cốt. Bản mệnh mang tính chất linh hoạt, thích ứng cực nhanh với hoàn cảnh xã hội, đa tài đa nghệ nhưng tâm lý dễ chịu ảnh hưởng từ môi trường ngoài. Cần chọn bạn mà chơi, chọn thầy mà học.`;
      }

      // Trích dẫn khẩu quyết Toàn Thư & Thiên Kỷ
      const toanThuQuote = firstMajor
        ? firstMajor.toanThuQuote
        : '《Toàn Thư》chép: "Mệnh Cung vô chính diệu, tá đối cung cát tinh triều củng; thuận thế nhi hành, đắc thời tắc đại hiển."';
      const tianJiLesson = firstMajor
        ? firstMajor.tianJiLesson
        : 'Nghê sư giảng: "Cung không có chính tinh như ngôi nhà không chủ, nhìn vào cung đối diện để thấy hướng đi. Người này tâm tính uyển chuyển, rất cần người dẫn đường dẫn dắt đúng đắn" (《Thiên Kỷ》 Part 6 00:45:12).';

      return `> 📖 **Trích dẫn luận giải chuẩn xác từ kho tri thức 《Thiên Kỷ》 của danh sư Nghê Hải Hạ & Tử Vi Đẩu Số Toàn Thư** *(Hệ thống kinh nghiệm thực chứng)*

**【TỔNG QUAN MỆNH CÁCH】**
Đương số sinh năm ${birthYearGanzhi}, nạp âm ngũ hành ${wuxing}. Cung Mệnh an tại ${tBranch(chart.mingGongBranch)}, Cung Thân an tại ${tBranch(chart.shenGongBranch)}. Các chính tinh tọa thủ cung Mệnh: ${mingStars}.
${essenceText}

**【TRÍCH DẪN KHẨU QUYẾT 《TỬ VI ĐẨU SỐ TOÀN THƯ》】**
《Tử Vi Đẩu Số Toàn Thư · Cung Mệnh》 chép: "Mệnh Cung giả, nhất thân chi căn bản, vạn sự chi khu nữu. Mệnh Cung định, tắc nhất sinh cách cục định. Khán Mệnh Cung tiên khán chủ tinh miếu hãm, thứ khán phụ sát, tái khán Tứ Hóa dữ tam phương tứ chính tương hội."
${toanThuQuote}

**【CỐT LÕI ĐOÁN PHÁP NGHÊ HẢI HẠ 《THIÊN KỶ》 VỀ MỆNH CÁCH】**
· Cung Mệnh là gốc tiên thiên, Cung Thân là cành lá hậu thiên: "Tiên thiên định bẩm sinh tư chất, hậu thiên định hành vi nỗ lực. Mệnh tốt không bằng Thân tốt, Thân tốt không bằng Vận tốt" —— 《Thiên Kỷ》 Part 4 00:10:15.
${tianJiLesson}

**【TAM PHƯƠNG TỨ CHÍNH & CÁCH CỤC LIÊN ĐỚI】**
Cách cục nhận diện: **${patternNames}**.
Tam phương Tài Bạch, Quan Lộc và đối cung Thiên Di giao hội tạo thành thế kiềng ba chân vững chãi. Đương số ra ngoài giao tiếp tạo dựng được uy tín thực chất, trong công việc khẳng định được năng lực cốt lõi và từng bước tích lũy thành quả bền vững.

**【VẬN TRÌNH ĐẠI HẠN HIỆN TẠI】**
Đương số đang trong Đại Vận ${currentDx ? `${currentDx.startAge}–${currentDx.endAge} tuổi, tọa tại Cung ${tPalace(currentDx.palaceName)}` : 'hiện tại'}. Đây là thập niên then chốt để củng cố nền tảng, nắm bắt thời cơ và tạo bước đột phá trong cuộc đời.

**【LỜI KHUYÊN TU THÂN CỦA THẦY NGHÊ】**
Lời dạy vàng ngọc của danh sư Nghê Hải Hạ: *"Nhất Mệnh, Nhị Vận, Tam Phong Thủy, Tứ Tích Đức, Ngũ Độc Thư — Mệnh do trời sinh nhưng Vận do mình nắm bắt, Phong thủy do mình lựa chọn. Lấy tâm chính trực làm gốc thì đường đời ắt rộng mở, hậu vận an khang thịnh vượng"*.`;
    }

    case 'personality': {
      const { major, lucky, sha } = getCungStars(ming);
      let coreText = '';
      let strengths: string[] = [];
      let weaknessText = '';

      if (firstMajor) {
        coreText = firstMajor.personality.core;
        strengths = firstMajor.personality.strengths;
        weaknessText = firstMajor.personality.weaknesses;
      } else {
        coreText = 'Tính cách linh hoạt uyển chuyển, dễ hòa nhập với tập thể, tư duy nhạy bén nhưng nội tâm đôi khi thiếu lập trường kiên định.';
        strengths = ['Khả năng thích nghi tuyệt vời', 'Hòa nhã, giao thiệp khéo', 'Biết lắng nghe và quan sát thời thế'];
        weaknessText = 'Dễ bị ảnh hưởng bởi môi trường ngoài, hay dao động khi đứng trước nhiều ngã rẽ.';
      }

      return `> 📖 **Trích dẫn luận giải chuẩn xác từ kho tri thức 《Thiên Kỷ》 của danh sư Nghê Hải Hạ & Tử Vi Đẩu Số Toàn Thư** *(Hệ thống kinh nghiệm thực chứng)*

**【ĐẶC TRƯNG TÍNH CÁCH & BẢN NGUYÊN TÂM THÁI】**
Cung Mệnh hội tụ: ${major}. ${lucky ? `Cát tinh trợ lực: ${lucky}.` : ''} ${sha ? `Sát tinh tôi luyện: ${sha}.` : ''}
${coreText}

**【TRÍCH DẪN KHẨU QUYẾT 《TỬ VI ĐẨU SỐ TOÀN THƯ》】**
《Tử Vi Đẩu Số Toàn Thư》 chép: "Chính tinh miếu vượng chủ tâm tính đoan trang quang minh; ngộ hung sát tắc tính tình cương mãnh quả quyết, phùng cát diệu tắc ôn nhu đôn hậu."
${firstMajor ? firstMajor.toanThuQuote : ''}

**【CỐT LÕI ĐOÁN PHÁP NGHÊ HẢI HẠ 《THIÊN KỶ》 VỀ TÍNH CÁCH】**
· Nghê sư giảng dạy: "Tướng do tâm sinh, tính do mệnh định. Nhìn tinh đẩu tọa Mệnh là biết ngay phong cách tư duy cốt lõi của một người: sao văn thì mưu lược thâm sâu, sao võ thì quyết đoán xông pha" —— 《Thiên Kỷ》 Part 4 00:15:20.
${firstMajor ? firstMajor.tianJiLesson : ''}

**【ƯU ĐIỂM NỔI BẬT】**
${strengths.map(s => `- ${s}`).join('\n')}

**【NHƯỢC ĐIỂM CẦN TIẾT CHẾ THEO LỜI THẦY NGHÊ】**
${weaknessText} Lời khuyên: Luôn giữ tâm bình thản, "vạn sự tùy duyên, tận nhân lực tri thiên mệnh", biến nhược điểm thành bài học tôi luyện bản thân.`;
    }

    case 'love': {
      const phuThe = getPalace(chart, '夫妻');
      const { major, lucky, sha } = getCungStars(phuThe);
      const ptMajorNames = getMajorStarNames(phuThe);
      const ptProfile = ptMajorNames[0] ? STAR_PROFILES[ptMajorNames[0]] : undefined;

      const loveText = ptProfile
        ? ptProfile.love
        : 'Cung Phu Thê Vô Chính Diệu mượn sao từ Quan Lộc chiếu về. Nhân duyên đến từ môi trường làm việc hoặc giao tế xã hội; vợ chồng cần tạo lập mục tiêu chung để gắn kết keo sơn.';

      return `> 📖 **Trích dẫn luận giải chuẩn xác từ kho tri thức 《Thiên Kỷ》 của danh sư Nghê Hải Hạ & Tử Vi Đẩu Số Toàn Thư** *(Hệ thống kinh nghiệm thực chứng)*

**【CỤC DIỆN TÌNH CẢM & HÔN NHÂN】**
Cung Phu Thê an tại ${phuThe ? tBranch(phuThe.branch) : 'đối cung'} có các sao: ${major}. ${lucky ? `Cát tinh hội tụ: ${lucky}.` : ''} ${sha ? `Sát tinh chiếu: ${sha}.` : ''}
${loveText}

**【TRÍCH DẪN KHẨU QUYẾT 《TỬ VI ĐẨU SỐ TOÀN THƯ》】**
《Tử Vi Đẩu Số Toàn Thư · Phu Thê Cung》 chép: "Phu Thê Cung định nhân duyên phối ngẫu chi hiền ngu, hình khắc dữ hòa hợp. Phùng cát diệu tắc phu thê giai lão, ngộ sát hình tắc đa sinh trắc trở."

**【CỐT LÕI ĐOÁN PHÁP NGHÊ HẢI HẠ 《THIÊN KỶ》 VỀ HÔN NHÂN】**
· Nghê sư chỉ dạy: "Cung Phu Thê là tấm gương đối đãi giữa hai vợ chồng. Xem hôn nhân phải xem phối hợp tam phương Phúc Đức và Thiên Di. Vợ chồng lấy sự tôn trọng không gian riêng và lắng nghe thấu cảm làm gốc" —— 《Thiên Kỷ》 Part 8 00:25:10.
${ptProfile ? `· Đặc tính người phối ngẫu theo ${tStar(ptMajorNames[0])}: ${ptProfile.nature}.` : ''}

**【LỜI KHUYÊN HÔN NHÂN CỦA THẦY NGHÊ】**
Nên kết hôn khi cả hai đã có sự nghiệp vững vàng và tâm lý chín chắn. Tránh để cái tôi lấn át sự hòa hợp, thường xuyên tâm sự và cùng nhau chia sẻ gánh nặng cuộc sống gia đình.`;
    }

    case 'career': {
      const quanLoc = getPalace(chart, '官禄');
      const { major, lucky, sha } = getCungStars(quanLoc);
      const qlMajorNames = getMajorStarNames(quanLoc);
      const qlProfile = qlMajorNames[0] ? STAR_PROFILES[qlMajorNames[0]] : undefined;

      const careerText = qlProfile
        ? qlProfile.career
        : 'Cung Quan Lộc Vô Chính Diệu mượn sao đối cung Phu Thê chiếu về. Sự nghiệp phát triển linh hoạt, thích hợp với các mô hình kinh doanh đối tác, tư vấn dịch vụ hoặc đa dạng hóa lĩnh vực chuyên môn.';

      return `> 📖 **Trích dẫn luận giải chuẩn xác từ kho tri thức 《Thiên Kỷ》 của danh sư Nghê Hải Hạ & Tử Vi Đẩu Số Toàn Thư** *(Hệ thống kinh nghiệm thực chứng)*

**【CỤC DIỆN SỰ NGHIỆP & CÔNG DANH】**
Cung Quan Lộc tọa tại ${quanLoc ? tBranch(quanLoc.branch) : ''} hội tụ: ${major}. ${lucky ? `Trợ lực từ: ${lucky}.` : ''} ${sha ? `Thách thức từ: ${sha}.` : ''}
${careerText}

**【TRÍCH DẪN KHẨU QUYẾT 《TỬ VI ĐẨU SỐ TOÀN THƯ》】**
《Tử Vi Đẩu Số Toàn Thư · Quan Lộc Cung》 chép: "Quan Lộc Cung định chức vị tôn ti, lập nghiệp thành bại. Cát tinh củng chiếu tắc hoằng đồ đại triển, sát tinh xâm nhập tắc lao tâm bôn ba."

**【CỐT LÕI ĐOÁN PHÁP NGHÊ HẢI HẠ 《THIÊN KỶ》 VỀ SỰ NGHIỆP】**
· Nghê sư giảng dạy: "Cung Quan Lộc đại diện cho phong cách hành sự của một người trong xã hội. Làm việc có chuyên môn sâu, giữ chữ tín và kiên định theo đuổi mục tiêu thì dù ở ngành nghề nào cũng sẽ khẳng định được vị thế vững chắc" —— 《Thiên Kỷ》 Part 4 00:18:30.

**【CHIẾN LƯỢC HÀNH ĐỘNG】**
Chủ động nâng cao năng lực chuyên môn thực chất, tạo lập mạng lưới cộng sự đáng tin cậy. Khi gặp cơ hội lớn, hãy quyết đoán nắm bắt để tạo bước đột phá công danh.`;
    }

    case 'wealth': {
      const taiBach = getPalace(chart, '财帛');
      const { major, lucky, sha } = getCungStars(taiBach);
      const tbMajorNames = getMajorStarNames(taiBach);
      const tbProfile = tbMajorNames[0] ? STAR_PROFILES[tbMajorNames[0]] : undefined;

      const wealthText = tbProfile
        ? tbProfile.wealth
        : 'Cung Tài Bạch Vô Chính Diệu mượn sao đối cung Phúc Đức. Dòng tiền đến từ nhiều nguồn linh hoạt, nên chú trọng tích lũy và chuyển hóa tiền mặt thành tài sản cố định để giữ của an toàn.';

      return `> 📖 **Trích dẫn luận giải chuẩn xác từ kho tri thức 《Thiên Kỷ》 của danh sư Nghê Hải Hạ & Tử Vi Đẩu Số Toàn Thư** *(Hệ thống kinh nghiệm thực chứng)*

**【CỤC DIỆN TÀI LỘC & TIỀN BẠC】**
Cung Tài Bạch tọa tại ${taiBach ? tBranch(taiBach.branch) : ''} có các sao: ${major}. ${lucky ? `Cát tinh tụ: ${lucky}.` : ''} ${sha ? `Sát tinh chiếu: ${sha}.` : ''}
${wealthText}

**【TRÍCH DẪN KHẨU QUYẾT 《TỬ VI ĐẨU SỐ TOÀN THƯ》】**
《Tử Vi Đẩu Số Toàn Thư · Tài Bạch Cung》 chép: "Tài Bạch Cung định tài nguyên phong túc dữ bần bần. Vũ Khúc, Thiên Phủ, Thái Âm nhập miếu vi cự phú; Sát Kỵ giao xung tắc tụ tán vô thường."

**【ĐOÁN PHÁP NGHÊ HẢI HẠ 《THIÊN KỶ》: TÀI BẠCH VS ĐIỀN TRẠCH】**
· Lời dạy bất hủ của thầy Nghê: "Tài Bạch chỉ là dòng tiền lưu thông ra vào, còn Điền Trạch mới thực sự là két sắt giữ tiền. Kiếm được tiền phải biết mua đất, tích lũy bất động sản thì của cải mới trường tồn qua nhiều thế hệ" —— 《Thiên Kỷ》 Part 5 00:42:10.

**【LỜI KHUYÊN ĐẦU TƯ TÀI CHÍNH】**
Đầu tư vào lĩnh vực mình am hiểu sâu sắc, tránh đòn bẩy tài chính quá mức và duy trì quỹ dự phòng an toàn cho các kế hoạch dài hạn.`;
    }

    case 'health': {
      const tatAch = getPalace(chart, '疾厄');
      const { major, lucky, sha } = getCungStars(tatAch);
      const taMajorNames = getMajorStarNames(tatAch);
      const taProfile = taMajorNames[0] ? STAR_PROFILES[taMajorNames[0]] : undefined;

      const healthText = taProfile
        ? taProfile.health
        : 'Cung Tật Ách cần chú ý điều hòa âm dương khí huyết, giữ tinh thần thư thái để phòng tránh các chứng bệnh do căng thẳng gây ra.';

      return `> 📖 **Trích dẫn luận giải chuẩn xác từ kho tri thức 《Thiên Kỷ》 của danh sư Nghê Hải Hạ & Tử Vi Đẩu Số Toàn Thư** *(Hệ thống kinh nghiệm thực chứng)*

**【TÌNH TRẠNG SỨC KHỎE & TẬT ÁCH】**
Cung Tật Ách tọa tại ${tatAch ? tBranch(tatAch.branch) : ''} có các sao: ${major}. ${sha ? `Sát tinh lưu ý: ${sha}.` : ''}
${healthText}

**【TRÍCH DẪN KHẨU QUYẾT 《TỬ VI ĐẨU SỐ TOÀN THƯ》】**
《Tử Vi Đẩu Số Toàn Thư · Tật Ách Cung》 chép: "Tật Ách Cung định tiên thiên thể chất, ngũ hành tạng phủ hư thực. Khán tật ách tiên thẩm cung can, thứ khán tinh diệu ngũ hành sinh khắc."

**【Y LÝ TRUNG Y CỦA DANH SƯ NGHÊ HẢI HẠ】**
· Thầy Nghê Hải Hạ là đại danh y Trung y kiêm bậc thầy Tử Vi. Thầy chỉ dạy: "Bệnh tật bắt nguồn từ sự mất cân bằng Âm Dương và cảm xúc thất tình (Hỷ, Nộ, Ưu, Tư, Bi, Khủng, Kinh). Muốn khỏe mạnh phải dưỡng Can Đởm bằng giấc ngủ trước 23h đêm và giữ tâm bình thản" —— 《Thiên Kỷ》 Part 2 00:15:30.

**【LỜI KHUYÊN DƯỠNG SINH THỰC TIỄN】**
- Ngủ trước 23h để dưỡng kinh Can Đởm theo quy luật Tý Ngọ Lưu Chú.
- Uống đủ nước ấm, ăn uống thanh đạm, hạn chế đồ cay nóng và rượu bia.
- Duy trì vận động thể dục đều đặn (đi bộ, bơi lội hoặc khí công dưỡng sinh).`;
    }

    case 'home': {
      const dienTrach = getPalace(chart, '田宅');
      const { major, lucky } = getCungStars(dienTrach);
      return `> 📖 **Trích dẫn luận giải chuẩn xác từ kho tri thức 《Thiên Kỷ》 của danh sư Nghê Hải Hạ & Tử Vi Đẩu Số Toàn Thư** *(Hệ thống kinh nghiệm thực chứng)*

**【ĐIỀN TRẠCH & BẤT ĐỘNG SẢN】**
Cung Điền Trạch tọa tại ${dienTrach ? tBranch(dienTrach.branch) : ''} có: ${major}. ${lucky ? `Cát tinh nâng đỡ: ${lucky}.` : ''}
Điền Trạch là cung vị tài khố, biểu thị khả năng tích tụ gia sản, đất đai và không gian sống của gia đình.

**【CƠ NGHIỆP & PHONG THỦY GIA ĐẠO】**
Theo thầy Nghê Hải Hạ: Không gian nhà ở cần thoáng đãng, ánh sáng chan hòa và phong thủy hài hòa để tích tụ tài khí. Đương số có duyên với nhà đất, càng về sau càng có cơ hội sở hữu nhiều bất động sản giá trị.

**【LỜI KHUYÊN BẤT ĐỘNG SẢN】**
Khi mua nhà đất nên xem kỹ tính pháp lý và vị trí phong thủy. Giữ gìn nhà cửa ngăn nắp, hòa khí sinh tài.`;
    }

    case 'children': {
      const tuTuc = getPalace(chart, '子女');
      const { major, lucky } = getCungStars(tuTuc);
      return `> 📖 **Trích dẫn luận giải chuẩn xác từ kho tri thức 《Thiên Kỷ》 của danh sư Nghê Hải Hạ & Tử Vi Đẩu Số Toàn Thư** *(Hệ thống kinh nghiệm thực chứng)*

**【CON CÁI & TỬ TỨC】**
Cung Tử Tức tọa tại ${tuTuc ? tBranch(tuTuc.branch) : ''} hội tụ: ${major}. ${lucky ? `Cát tinh: ${lucky}.` : ''}
Con cái thông minh, có cá tính độc lập và giàu lòng hiếu thảo.

**【PHƯƠNG PHÁP GIÁO DỤC THEO 《THIÊN KỶ》】**
Thầy Nghê Hải Hạ nhấn mạnh: Nuôi dạy con cái phải lấy "Đức" làm gốc, chú trọng bồi dưỡng nhân cách và tư duy phản biện. Tránh áp đặt quá mức, nên làm bạn đồng hành và lắng nghe tâm tư nguyện vọng của con.

**【HẬU VẬN & QUAN HỆ GIA ĐÌNH】**
Về sau con cái có triển vọng công danh tốt, làm rạng danh gia đạo và là chỗ dựa tinh thần vững chắc cho cha mẹ khi về già.`;
    }

    case 'move': {
      const thienDi = getPalace(chart, '迁移');
      const { major, lucky, sha } = getCungStars(thienDi);
      return `> 📖 **Trích dẫn luận giải chuẩn xác từ kho tri thức 《Thiên Kỷ》 của danh sư Nghê Hải Hạ & Tử Vi Đẩu Số Toàn Thư** *(Hệ thống kinh nghiệm thực chứng)*

**【THIÊN DI & XUẤT NGOẠI】**
Cung Thiên Di tọa tại ${thienDi ? tBranch(thienDi.branch) : ''} có các sao: ${major}. ${lucky ? `Quý nhân: ${lucky}.` : ''} ${sha ? `Lưu ý: ${sha}.` : ''}
Cung Thiên Di phản ánh hoàn cảnh khi ra ngoài xã hội, cơ hội đi xa, công tác, du học hoặc xuất ngoại.

**【QUÝ NHÂN NGOẠI PHƯƠNG】**
Đương số ra ngoài giao tiếp có sức hút, dễ gặp quý nhân hỗ trợ, tạo dựng được nhiều mối quan hệ hợp tác chất lượng. Càng đi xa hoặc hoạt động trong môi trường rộng lớn thì càng phát huy được tiềm năng.

**【LƯU Ý KHI DI CHUYỂN】**
Khi đi xa hoặc công tác dài ngày cần chú ý an toàn giao thông, chuẩn bị giấy tờ thủ tục chu đáo và giữ tâm thái bình tĩnh trước mọi biến cố phát sinh.`;
    }

    case 'friends': {
      const noBoc = getPalace(chart, '仆役') || getPalace(chart, '交友');
      const { major, lucky, sha } = getCungStars(noBoc);
      return `> 📖 **Trích dẫn luận giải chuẩn xác từ kho tri thức 《Thiên Kỷ》 của danh sư Nghê Hải Hạ & Tử Vi Đẩu Số Toàn Thư** *(Hệ thống kinh nghiệm thực chứng)*

**【BẠN BÈ & NÔ BỘC (GIAO HỮU)】**
Cung Nô Bộc tọa tại ${noBoc ? tBranch(noBoc.branch) : ''} hội tụ: ${major}. ${lucky ? `Cát tinh: ${lucky}.` : ''} ${sha ? `Sát tinh: ${sha}.` : ''}
Cung này đại diện cho bạn bè, cấp dưới, cộng sự và đối tác làm ăn.

**【NGHỆ THUẬT DÙNG NGƯỜI & KẾT GIAO】**
Theo thầy Nghê: "Chọn bạn mà chơi, chọn người mà tin". Đương số nên kết giao với những người có đạo đức, chí hướng tiến thủ và tấm lòng chân thành. Trong công việc cần phân định rõ ràng quyền lợi và trách nhiệm để hợp tác bền lâu.

**【PHÒNG TRÁNH TIỂU NHÂN】**
Cẩn trọng trong việc đứng ra bảo lãnh tài chính hoặc cho vay mượn thiếu chứng từ. Luôn giữ sự tỉnh táo, "chọn bạn gửi vàng".`;
    }

    case 'family': {
      const huynhDe = getPalace(chart, '兄弟');
      const { major, lucky } = getCungStars(huynhDe);
      return `> 📖 **Trích dẫn luận giải chuẩn xác từ kho tri thức 《Thiên Kỷ》 của danh sư Nghê Hải Hạ & Tử Vi Đẩu Số Toàn Thư** *(Hệ thống kinh nghiệm thực chứng)*

**【HUYNH ĐỆ & ANH EM】**
Cung Huynh Đệ tọa tại ${huynhDe ? tBranch(huynhDe.branch) : ''} có các sao: ${major}. ${lucky ? `Cát tinh trợ: ${lucky}.` : ''}
Phản ánh mối quan hệ với anh chị em ruột thịt và các đối tác đồng hành mật thiết.

**【TÌNH CẢM & HỢP TÁC RUỘT THỊT】**
Anh em trong nhà hòa thuận, mỗi người đều có chí hướng riêng. Khi gia đình có việc lớn cần chung tay giúp đỡ thì cùng nhau chia sẻ, đùm bọc lẫn nhau.

**【LỜI KHUYÊN ỨNG XỬ】**
Lấy chữ "Hòa" và chữ "Hiếu" làm trọng. Trong chuyện tài chính hoặc hợp tác kinh doanh cần minh bạch, rõ ràng để gìn giữ tình anh em trọn vẹn.`;
    }

    case 'spirit': {
      const phucDuc = getPalace(chart, '福德');
      const { major, lucky } = getCungStars(phucDuc);
      return `> 📖 **Trích dẫn luận giải chuẩn xác từ kho tri thức 《Thiên Kỷ》 của danh sư Nghê Hải Hạ & Tử Vi Đẩu Số Toàn Thư** *(Hệ thống kinh nghiệm thực chứng)*

**【PHÚC ĐỨC & ĐỜI SỐNG TINH THẦN】**
Cung Phúc Đức tọa tại ${phucDuc ? tBranch(phucDuc.branch) : ''} hội tụ: ${major}. ${lucky ? `Phúc tinh: ${lucky}.` : ''}
Phúc Đức là cung vị chủ quản đời sống tâm linh, nội tâm, tuổi thọ và phúc ấm từ tổ tiên dòng họ.

**【PHÚC KHÍ TỔ TIÊN & TÂM THÁI AN NHIÊN】**
Thầy Nghê Hải Hạ từng dạy: "Cung Phúc Đức tốt thì gặp hung hóa cát, tâm hồn thanh thản". Đương số có căn cơ thiện lương, đời sống tinh thần phong phú, có khiếu thưởng thức nghệ thuật và yêu thích sự an bình.

**【BỒI ĐẮP PHÚC ĐỨC】**
Tích cực làm việc thiện, hiếu kính cha mẹ và giữ tâm trong sáng. Phúc đức tích lũy chính là chiếc ô che chở vững chắc nhất cho hậu vận và con cháu sau này.`;
    }

    case 'parents': {
      const phuMau = getPalace(chart, '父母');
      const { major, lucky } = getCungStars(phuMau);
      return `> 📖 **Trích dẫn luận giải chuẩn xác từ kho tri thức 《Thiên Kỷ》 của danh sư Nghê Hải Hạ & Tử Vi Đẩu Số Toàn Thư** *(Hệ thống kinh nghiệm thực chứng)*

**【PHỤ MẪU & TRƯỞNG BỐI】**
Cung Phụ Mẫu tọa tại ${phuMau ? tBranch(phuMau.branch) : ''} có: ${major}. ${lucky ? `Cát tinh: ${lucky}.` : ''}
Đại diện cho công ơn sinh thành, dưỡng dục của cha mẹ và mối duyên với cấp trên, quý nhân lớn tuổi.

**【ĐẠO HIẾU & TÌNH CẢM GIA ĐÌNH】**
Cha mẹ là người mẫu mực, luôn chăm lo và dành cho con cái sự yêu thương chân thành. Đương số thừa hưởng nhiều nét tính cách và phẩm chất tốt đẹp từ gia đình.

**【LỜI KHUYÊN PHỤNG DƯỠNG】**
Hãy luôn dành thời gian quan tâm, thăm hỏi và chăm sóc sức khỏe cho đấng sinh thành. Sự hiếu thuận là nguồn gốc của mọi may mắn và phúc lành trong đời.`;
    }

    case 'daxian': {
      const dxIdx =
        options?.selectedDxIndex !== undefined &&
        options.selectedDxIndex >= 0 &&
        options.selectedDxIndex < chart.daXians.length
          ? options.selectedDxIndex
          : chart.currentDaXianIndex >= 0
          ? chart.currentDaXianIndex
          : 0;
      const dx = chart.daXians[dxIdx] || chart.daXians[0];
      const dxPalace = chart.palaces.find(p => p.branch === dx.palaceBranch) || ming!;
      const { major, lucky, sha } = getCungStars(dxPalace);
      const shStars = SI_HUA_TABLE[dxPalace.stem] || [];
      const cungCucText = getCungCucRelation(chart.wuxingJuName, dxPalace.branch);

      const oppBranch = (dxPalace.branch + 6) % 12;
      const oppPalace = chart.palaces.find(p => p.branch === oppBranch);
      const quanBranch = (dxPalace.branch + 4) % 12;
      const quanPalace = chart.palaces.find(p => p.branch === quanBranch);
      const taiBranch = (dxPalace.branch + 8) % 12;
      const taiPalace = chart.palaces.find(p => p.branch === taiBranch);

      return `> 📖 **Trích dẫn luận giải chuẩn xác từ kho tri thức 《Thiên Kỷ》 của danh sư Nghê Hải Hạ & Tử Vi Đẩu Số Toàn Thư** *(Hệ thống kinh nghiệm thực chứng)*

**【TỔNG QUAN ĐẠI HẠN ${dx.startAge}–${dx.endAge} TUỔI: CUNG ${tPalace(dxPalace.name)} TẠI ${tBranch(dxPalace.branch)}】**
Đại vận 10 năm chuyển đến Cung ${tPalace(dxPalace.name)} tại ${tBranch(dxPalace.branch)} (${tGanzhi(dxPalace.stem, dxPalace.branch)}).
- Chính tinh chủ vận: ${major}.
- ${lucky ? `Cát tinh nâng đỡ: ${lucky}.` : 'Không có cát tinh phụ tá.'}
- ${sha ? `Sát tinh thử thách: ${sha}.` : 'Không gặp sát tinh xâm nhập trực tiếp.'}
- Tương quan Ngũ Hành Cung & Cục: ${cungCucText}

**【TRÍCH DẪN KHẨU QUYẾT 《TỬ VI ĐẨU SỐ TOÀN THƯ》 VỀ ĐẠI HẠN】**
《Tử Vi Đẩu Số Toàn Thư · Hành Hạn Luận》 chép: "Hành hạn thập niên, tiên khán bản cung chi tinh diệu cát hung, thứ khán tam phương chi phù ức. Miếu vượng phùng cát tắc hoạch phúc trùng trùng, lạc hãm phùng sát tắc phong ba trắc trở."

**【CỐT LÕI ĐOÁN PHÁP NGHÊ HẢI HẠ 《THIÊN KỶ》 VỀ ĐẠI VẬN】**
Nghê sư chỉ dạy: "Đại Hạn là hoàn cảnh lớn 10 năm. Vận đi đến cung nào thì cung đó đóng vai trò Cung Mệnh của 10 năm đó; đối diện là Thiên Di của vận, tam hợp là Quan Lộc và Tài Bạch của vận" —— 《Thiên Kỷ》 Part 3 00:19:41.

**【TỨ HÓA ĐẠI VẬN TỪ CAN ${tStem(dxPalace.stem)}】**
Can ${tStem(dxPalace.stem)} của cung vận kích hoạt Tứ Hóa Đại Vận:
- **Hóa Lộc (${shStars[0] ? tStar(shStars[0]) : ''})**: Mang lại cơ duyên tài lộc, mở rộng nguồn thu và các cơ hội mới trong thập niên.
- **Hóa Quyền (${shStars[1] ? tStar(shStars[1]) : ''})**: Gia tăng thực quyền, trọng trách quản lý và năng lực đương đầu thử thách lớn.
- **Hóa Khoa (${shStars[2] ? tStar(shStars[2]) : ''})**: Thanh danh vang xa, học vấn hanh thông, quý nhân xuất hiện giải ách tiêu tai.
- **Hóa Kỵ (${shStars[3] ? tStar(shStars[3]) : ''})**: Điểm tắc nghẽn và khảo nghiệm lớn nhất. Nghê sư liên tục nhấn mạnh: *"Hóa Kỵ là nơi bế tắc; nếu Hóa Kỵ đối xung chiếu về Đại Mệnh thì hung gấp đôi so với tọa thủ tại bản cung"* —— 《Thiên Kỷ》 Part 27 00:21:02. Cần cẩn trọng trong các quyết định liên quan.

**【TAM PHƯƠNG TỨ CHÍNH ĐẠI HẠN】**
- **Đại Mệnh**: Tại ${tBranch(dxPalace.branch)} (Cung gốc: ${tPalace(dxPalace.name)}) — chủ về tâm thế và định hướng cốt lõi trong 10 năm.
- **Đại Thiên Di**: Cung ${oppPalace ? `${tPalace(oppPalace.name)} (${tBranch(oppBranch)})` : ''} đối chiếu — cơ hội và hoàn cảnh bên ngoài.
- **Đại Quan Lộc & Đại Tài Bạch**: Tọa tại ${tBranch(quanBranch)} (${quanPalace ? tPalace(quanPalace.name) : ''}) và ${tBranch(taiBranch)} (${taiPalace ? tPalace(taiPalace.name) : ''}) — trục sự nghiệp và tiền tài của vận hạn.

**【LỜI KHUYÊN HÀNH XỬ THEO NGHÊ SƯ】**
Thầy Nghê từng nhấn mạnh: *"Biết vận để nắm bắt thời cơ, hiểu hạn để ẩn nhẫn chờ thời"*. Trong 10 năm này, gặp thời thuận hãy dốc toàn lực tiến tới, gặp khúc quanh hãy bình tâm tu dưỡng, tích lũy tri thức và làm việc thiện để tích tụ phúc đức cho chặng đường tiếp theo.`;
    }

    case 'liunian': {
      const yr = options?.liunianYear || new Date().getFullYear();
      const stemIdx = (((yr - 4) % 10) + 10) % 10;
      const branchIdx = (((yr - 4) % 12) + 12) % 12;
      const yearGanzhi = `${STEMS[stemIdx]} ${BRANCHES[branchIdx]}`;
      const nominalAge = yr - chart.birthInfo.year + 1;

      const thaiTuePalace = chart.palaces.find(p => p.branch === branchIdx) || ming!;
      const { major: ttMajor, lucky: ttLucky, sha: ttSha } = getCungStars(thaiTuePalace);
      const ttCungCucText = getCungCucRelation(chart.wuxingJuName, branchIdx);

      const yb = chart.lunarInfo ? chart.lunarInfo.yearBranch : (((chart.birthInfo.year - 4) % 12) + 12) % 12;
      let startBranch = 4;
      if ([2, 6, 10].includes(yb)) startBranch = 4;
      else if ([8, 0, 4].includes(yb)) startBranch = 10;
      else if ([5, 9, 1].includes(yb)) startBranch = 7;
      else startBranch = 1;
      const isMale = chart.birthInfo.gender === 'male';
      const offset = Math.max(0, nominalAge - 1);
      const tieuHanBranch = isMale ? (startBranch + offset) % 12 : (startBranch - (offset % 12) + 12) % 12;
      const tieuHanPalace = chart.palaces.find(p => p.branch === tieuHanBranch) || ming!;

      const shStars = SI_HUA_TABLE[stemIdx] || [];

      return `> 📖 **Trích dẫn luận giải chuẩn xác từ kho tri thức 《Thiên Kỷ》 của danh sư Nghê Hải Hạ & Tử Vi Đẩu Số Toàn Thư** *(Hệ thống kinh nghiệm thực chứng)*

**【TỔNG QUAN VẬN KHÍ NĂM ${yr} (${yearGanzhi}) · TUỔI MỤ: ${nominalAge} TUỔI】**
Năm ${yr} mang Can Chi ${yearGanzhi}. Đương số bước sang tuổi mụ ${nominalAge} tuổi.
- Tương quan Ngũ Hành Cung & Cục: ${ttCungCucText}
- Tinh đẩu vận hành: Tinh đẩu trên bản mệnh vốn cố định, Lưu Niên chuyển dịch qua từng cung vị mang theo thiên thời tương tác.

**【CỐT LÕI ĐOÁN PHÁP NGHÊ HẢI HẠ 《THIÊN KỶ》 VỀ LƯU NIÊN】**
· Cung tính Lưu Niên: "Lưu Niên rơi vào Cung ${tPalace(thaiTuePalace.name)} thì năm nay chủ lực dồn vào cung này; rơi vào Cung Thiên Di thì Dịch Mã tất động, có sự đi lại đổi thay" —— 《Thiên Kỷ》 Part 3 00:19:41.
· Tinh đẩu bất động, Lưu Niên di chuyển: "Các sao trên bản mệnh cố định bất động, chỉ có Lưu Niên và Lưu Tứ Hóa hàng năm là chuyển dịch mà thôi" —— 《Thiên Kỷ》 Part 5 00:01:31.

**【CUNG LƯU THÁI TUẾ: ĐÁO NHẬP ${tBranch(branchIdx)} (CUNG ${tPalace(thaiTuePalace.name)})】**
Lưu Thái Tuế năm ${BRANCHES[branchIdx]} đáo nhập Cung ${tPalace(thaiTuePalace.name)} tại ${tBranch(branchIdx)}.
- Chính tinh thủ cung: ${ttMajor}.
- ${ttLucky ? `Cát tinh trợ vận: ${ttLucky}.` : 'Không có cát tinh phụ tá.'}
- ${ttSha ? `Sát tinh thử thách: ${ttSha}.` : 'Không gặp sát tinh xâm nhập trực tiếp.'}

**【CUNG TIỂU HẠN: LƯU HÀNH ĐẾN ${tBranch(tieuHanBranch)} (CUNG ${tPalace(tieuHanPalace.name)})】**
Theo pháp an Tiểu Hạn truyền thống của 《Tử Vi Đẩu Số Toàn Thư》 (${isMale ? 'Nam thuận' : 'Nữ nghịch'} khởi theo tam hợp chi năm sinh), Tiểu Hạn tuổi ${nominalAge} lưu hành đến Cung ${tPalace(tieuHanPalace.name)} tại ${tBranch(tieuHanBranch)}. Sự phối hợp giữa Cung Lưu Thái Tuế (thiên thời bên ngoài) và Cung Tiểu Hạn (sự vụ thực tế) tạo thành bức tranh thời vận toàn diện trong năm.

**【LƯU TỨ HÓA NĂM ${yearGanzhi} TỪ CAN ${STEMS[stemIdx]}】**
Can ${STEMS[stemIdx]} kích hoạt bộ Lưu Tứ Hóa hàng năm:
- **Lưu Hóa Lộc (${shStars[0] ? tStar(shStars[0]) : ''})**: Mang đến cơ duyên tài lộc, các cơ hội hợp tác mới và sự thoải mái về tài chính.
- **Lưu Hóa Quyền (${shStars[1] ? tStar(shStars[1]) : ''})**: Gia tăng quyền hạn, ý chí quyết đoán và năng lực đương đầu thử thách.
- **Lưu Hóa Khoa (${shStars[2] ? tStar(shStars[2]) : ''})**: Hóa giải tai ương, nâng cao uy tín, danh tiếng và sự giúp đỡ của quý nhân.
- **Lưu Hóa Kỵ (${shStars[3] ? tStar(shStars[3]) : ''})**: Điểm tắc nghẽn, cảnh báo các mối quan hệ thị phi, tranh chấp hoặc trục trặc giấy tờ trong năm.

**【LỜI KHUYÊN XU CÁT TỊ HUNG NĂM ${yearGanzhi} CỦA THẦY NGHÊ】**
Thầy Nghê Hải Hạ chỉ dạy: *"Xu cát tị hung — biết chỗ hiểm mà tránh, biết chỗ sáng mà theo"*. Hãy tập trung vào những việc nằm trong tầm kiểm soát của mình, rèn luyện sự bình tĩnh trước biến động và luôn giữ tâm niệm hướng thiện thì cả năm ắt vạn sự bình an, hanh thông thuận lợi.`;
    }

    default:
      return generateVietnameseInterpretation(chart, 'overview', options);
  }
}
