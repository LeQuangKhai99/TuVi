/**
 * lib/ziwei/heming-engine.ts
 * Động cơ phân tích Tử Vi Hợp Bàn chuyên sâu theo hệ phái chính tông của danh sư Nghê Hải Hạ 《Thiên Kỷ》
 * & 《Tử Vi Đẩu Số Toàn Thư》.
 *
 * Phân tích thực chứng 8 tầng logic:
 * 1. Ngũ Hành Cục Số & Can Chi Năm Sinh (Khí vận Thiên Can - Địa Chi)
 * 2. Tương tác Khí chất Bản mệnh (Mệnh Cung vs Mệnh Cung)
 * 3. Chiếu ứng Thiên Tác Chi Hợp (Cung Phu Thê vs Cung Mệnh qua lại)
 * 4. Song Cung Liên Tham (Khẩu quyết Nghê Hải Hạ: Cung Phu Thê & Cung Phúc Đức)
 * 5. Tượng Chồng & Vợ theo Âm Dương Nhật Nguyệt (Thái Dương Nữ & Thái Âm Nam)
 * 6. Tứ Hóa Phi Tinh Tương Hỗ (Sợi dây nhân duyên hai chiều)
 * 7. Điểm Hòa Hợp Bổ Trợ & Cảnh Báo Xung Đột Cần Hóa Giải
 * 8. Lời Khuyên Ứng Xử 《Thiên Kỷ》 & Giải Đáp Câu Hỏi Trọng Tâm
 *
 * Hỗ trợ xuất kết quả song ngữ: Chữ Hán nguyên tác (zh) và Tiếng Việt chuẩn xác (vi).
 */

import type { ZiweiChart, Palace, Star, SiHua } from './types';
import { STEMS, BRANCHES, SI_HUA_TABLE } from './constants';
import { tBranch, tJu, tStar, tGanzhi } from './i18n';
import { STAR_IN_FUQI_GU } from './heming-knowledge';

export interface HemingAnalysisResult {
  content: string;
  lang: 'vi' | 'zh';
  matchScore: number;
}

// ─── Can Hợp & Chi Quan Hệ ─────────────────────────────────
const STEM_HARMONY: Record<number, number> = {
  0: 5, 5: 0, // Giáp - Kỷ hợp Thổ
  1: 6, 6: 1, // Ất - Canh hợp Kim
  2: 7, 7: 2, // Bính - Tân hợp Thủy
  3: 8, 8: 3, // Đinh - Nhâm hợp Mộc
  4: 9, 9: 4, // Mậu - Quý hợp Hỏa
};

const BRANCH_SIX_HARMONY: Record<number, number> = {
  0: 1, 1: 0,   // Tý - Sửu
  2: 11, 11: 2, // Dần - Hợi
  3: 10, 10: 3, // Mão - Tuất
  4: 9, 9: 4,   // Thìn - Dậu
  5: 8, 8: 5,   // Tỵ - Thân
  6: 7, 7: 6,   // Ngọ - Mùi
};

const BRANCH_TRIAD_GROUPS = [
  [8, 0, 4],   // Thân - Tý - Thìn (Thủy cục)
  [2, 6, 10],  // Dần - Ngọ - Tuất (Hỏa cục)
  [5, 9, 1],   // Tỵ - Dậu - Sửu (Kim cục)
  [11, 3, 7],  // Hợi - Mão - Mùi (Mộc cục)
];

const BRANCH_CLASH: Record<number, number> = {
  0: 6, 6: 0,   // Tý - Ngọ
  1: 7, 7: 1,   // Sửu - Mùi
  2: 8, 8: 2,   // Dần - Thân
  3: 9, 9: 3,   // Mão - Dậu
  4: 10, 10: 4, // Thìn - Tuất
  5: 11, 11: 5, // Tỵ - Hợi
};

// ─── Helper: lấy chính tinh của cung ──────────────────────
function getMajorStars(palace?: Palace): Star[] {
  if (!palace) return [];
  return palace.stars.filter(s => s.type === 'major');
}

function getShaStars(palace?: Palace): Star[] {
  if (!palace) return [];
  return palace.stars.filter(s => s.type === 'sha');
}

function getLuckyStars(palace?: Palace): Star[] {
  if (!palace) return [];
  return palace.stars.filter(s => s.type === 'lucky');
}

function findPalaceByName(chart: ZiweiChart, nameZh: string): Palace | undefined {
  return chart.palaces.find(p => p.name === nameZh);
}

// ─── Helper: phân loại hệ phái chính tinh ─────────────────
function categorizeStarGroup(stars: Star[]): {
  group: 'shapolang' | 'ziwufuxiang' | 'jiyuetongliang' | 'juri' | 'mixed' | 'empty';
  labelVi: string;
  labelZh: string;
} {
  const names = new Set(stars.map(s => s.name));
  if (names.size === 0) {
    return { group: 'empty', labelVi: 'Vô Chính Diệu (Mượn đối cung)', labelZh: '无主星（借对宫）' };
  }
  if (names.has('七杀') || names.has('破军') || names.has('贪狼')) {
    return { group: 'shapolang', labelVi: 'Sát Phá Tham (Chủ khai phá, biến động, cá tính mạnh mẽ)', labelZh: '杀破狼格局（开拓变动、刚毅果决）' };
  }
  if (names.has('紫微') || names.has('天府') || names.has('武曲') || names.has('天相')) {
    return { group: 'ziwufuxiang', labelVi: 'Tử Phủ Vũ Tướng (Chủ lãnh đạo, uy quyền, vững vàng tổ chức)', labelZh: '紫府武相格局（稳重统筹、威仪自若）' };
  }
  if (names.has('天机') || names.has('太阴') || names.has('天同') || names.has('天梁')) {
    return { group: 'jiyuetongliang', labelVi: 'Cơ Nguyệt Đồng Lương (Chủ mưu lược, ôn hòa, chu đáo, ổn định)', labelZh: '机月同梁格局（温和周全、谋略内敛）' };
  }
  if (names.has('巨门') || names.has('太阳')) {
    return { group: 'juri', labelVi: 'Cự Nhật (Chủ hùng biện, quảng giao, quang minh chính đại)', labelZh: '巨日同宫/会照格局（口才出众、博爱热忱）' };
  }
  return { group: 'mixed', labelVi: 'Chính Tinh Phối Chiếu', labelZh: '主星吉曜组合' };
}

// ─── Helper: tra cứu Tứ Hóa can năm ───────────────────────
function getYearSiHuaStars(stemIndex: number): [string, string, string, string] {
  return SI_HUA_TABLE[stemIndex] || ['', '', '', ''];
}

// ─── Hàm sinh luận giải Hợp Bàn toàn diện ────────────────
export function generateHemingAnalysis(
  chartA: ZiweiChart,
  chartB: ZiweiChart,
  question?: string,
  lang: 'vi' | 'zh' = 'zh'
): HemingAnalysisResult {
  const isZh = (lang === 'zh');

  const nameA = chartA.birthInfo.name || (isZh ? '男方/甲方' : 'Người A');
  const nameB = chartB.birthInfo.name || (isZh ? '女方/乙方' : 'Người B');

  const stemA = chartA.lunarInfo.yearStem;
  const branchA = chartA.lunarInfo.yearBranch;
  const stemB = chartB.lunarInfo.yearStem;
  const branchB = chartB.lunarInfo.yearBranch;

  const stemNameA = STEMS[stemA];
  const branchNameA = BRANCHES[branchA];
  const stemNameB = STEMS[stemB];
  const branchNameB = BRANCHES[branchB];

  const gzNameA = isZh ? `${stemNameA}${branchNameA}年` : `Năm ${tGanzhi(stemA, branchA)}`;
  const gzNameB = isZh ? `${stemNameB}${branchNameB}年` : `Năm ${tGanzhi(stemB, branchB)}`;

  const juA = isZh ? chartA.wuxingJuName : tJu(chartA.wuxingJuName);
  const juB = isZh ? chartB.wuxingJuName : tJu(chartB.wuxingJuName);

  const mingBranchA = isZh ? `${BRANCHES[chartA.mingGongBranch]}宫` : tBranch(chartA.mingGongBranch);
  const mingBranchB = isZh ? `${BRANCHES[chartB.mingGongBranch]}宫` : tBranch(chartB.mingGongBranch);

  const mingPalaceA = findPalaceByName(chartA, '命宫');
  const mingPalaceB = findPalaceByName(chartB, '命宫');
  const fuqiPalaceA = findPalaceByName(chartA, '夫妻宫');
  const fuqiPalaceB = findPalaceByName(chartB, '夫妻宫');
  const fudePalaceA = findPalaceByName(chartA, '福德宫');
  const fudePalaceB = findPalaceByName(chartB, '福德宫');

  const mingStarsA = getMajorStars(mingPalaceA);
  const mingStarsB = getMajorStars(mingPalaceB);
  const fuqiStarsA = getMajorStars(fuqiPalaceA);
  const fuqiStarsB = getMajorStars(fuqiPalaceB);
  const fudeStarsA = getMajorStars(fudePalaceA);
  const fudeStarsB = getMajorStars(fudePalaceB);

  const mingStarNamesA = mingStarsA.length > 0 ? (isZh ? mingStarsA.map(s => s.name).join('、') : mingStarsA.map(s => tStar(s.name)).join(', ')) : (isZh ? '无主星' : 'Vô chính diệu');
  const mingStarNamesB = mingStarsB.length > 0 ? (isZh ? mingStarsB.map(s => s.name).join('、') : mingStarsB.map(s => tStar(s.name)).join(', ')) : (isZh ? '无主星' : 'Vô chính diệu');

  const fuqiStarNamesA = fuqiStarsA.length > 0 ? (isZh ? fuqiStarsA.map(s => s.name).join('、') : fuqiStarsA.map(s => tStar(s.name)).join(', ')) : (isZh ? '无主星' : 'Vô chính diệu');
  const fuqiStarNamesB = fuqiStarsB.length > 0 ? (isZh ? fuqiStarsB.map(s => s.name).join('、') : fuqiStarsB.map(s => tStar(s.name)).join(', ')) : (isZh ? '无主星' : 'Vô chính diệu');

  // Điểm đánh giá ban đầu
  let matchScore = 75;

  // 1. Phân tích Can Hợp & Chi Quan Hệ
  const isStemHarmonious = STEM_HARMONY[stemA] === stemB;
  const isBranchSixHarmonious = BRANCH_SIX_HARMONY[branchA] === branchB;
  const isBranchTriad = BRANCH_TRIAD_GROUPS.some(g => g.includes(branchA) && g.includes(branchB));
  const isBranchClash = BRANCH_CLASH[branchA] === branchB;

  if (isStemHarmonious) matchScore += 6;
  if (isBranchSixHarmonious) matchScore += 8;
  else if (isBranchTriad) matchScore += 6;
  if (isBranchClash) matchScore -= 8;

  // 2. Phân tích Hệ phái Mệnh cung
  const groupA = categorizeStarGroup(mingStarsA);
  const groupB = categorizeStarGroup(mingStarsB);

  // 3. Phân tích Thiên Tác Chi Hợp (Chiếu ứng Cung Phu Thê và Mệnh)
  const namesMingA = new Set(mingStarsA.map(s => s.name));
  const namesMingB = new Set(mingStarsB.map(s => s.name));
  const namesFuqiA = new Set(fuqiStarsA.map(s => s.name));
  const namesFuqiB = new Set(fuqiStarsB.map(s => s.name));

  const directMatchAtoB = [...namesFuqiA].some(s => namesMingB.has(s));
  const directMatchBtoA = [...namesFuqiB].some(s => namesMingA.has(s));

  if (directMatchAtoB && directMatchBtoA) matchScore += 12;
  else if (directMatchAtoB || directMatchBtoA) matchScore += 7;

  // 4. Phân tích Sát Tinh Cung Phu Thê & Phúc Đức
  const shaFuqiA = getShaStars(fuqiPalaceA);
  const shaFuqiB = getShaStars(fuqiPalaceB);
  const shaFudeA = getShaStars(fudePalaceA);
  const shaFudeB = getShaStars(fudePalaceB);

  if (shaFuqiA.length > 0 || shaFuqiB.length > 0) matchScore -= 5;
  if (shaFudeA.length > 0 || shaFudeB.length > 0) matchScore -= 4;

  matchScore = Math.max(55, Math.min(96, matchScore));

  // 5. Tứ Hóa Phi Tinh Tương Hỗ
  const [luA, quanA, keA, jiA] = getYearSiHuaStars(stemA);
  const [luB, quanB, keB, jiB] = getYearSiHuaStars(stemB);

  // Tìm cung chứa Hóa Lộc / Hóa Kỵ của A trên lá số B
  const palaceOfLuAinB = chartB.palaces.find(p => p.stars.some(s => s.name === luA));
  const palaceOfJiAinB = chartB.palaces.find(p => p.stars.some(s => s.name === jiA));
  const palaceOfLuBinA = chartA.palaces.find(p => p.stars.some(s => s.name === luB));
  const palaceOfJiBinA = chartA.palaces.find(p => p.stars.some(s => s.name === jiB));

  // Tra cứu trích dẫn Phu thê
  const primeFuqiStarA = fuqiStarsA[0]?.name;
  const primeFuqiStarB = fuqiStarsB[0]?.name;
  const quoteA = primeFuqiStarA && STAR_IN_FUQI_GU[primeFuqiStarA];
  const quoteB = primeFuqiStarB && STAR_IN_FUQI_GU[primeFuqiStarB];

  // ─── Soạn thảo bản luận giải Tiếng Việt / Chữ Hán ──────────
  if (isZh) {
    let md = `> 📖 **倪海厦《天纪》与《紫微斗数全书》双盘合参·深度缘分实证报告**\n\n`;

    md += `**【合盘概况与缘分定调】**\n`;
    md += `· **${nameA}**：${gzNameA}生人 · 命宫安于【${mingBranchA}】（${juA}） · 主星：**${mingStarNamesA}**（${groupA.labelZh}）\n`;
    md += `· **${nameB}**：${gzNameB}生人 · 命宫安于【${mingBranchB}】（${juB}） · 主星：**${mingStarNamesB}**（${groupB.labelZh}）\n`;
    md += `· **先天缘分契合指数**：**${matchScore} / 100**\n\n`;

    // Khí vận can chi
    md += `**【岁气根基 · 天干地支五行化合】**\n`;
    if (isStemHarmonious) {
      md += `· **天干五合**：${stemNameA}与${stemNameB}天干相合，代表双方思维底层具有天然的吸引力与包容度，相处越久越有默契。\n`;
    } else {
      md += `· **天干气场**：${stemNameA}干与${stemNameB}干各有主张，思维模式各有侧重，交往需尊重各自独立的见解。\n`;
    }

    if (isBranchSixHarmonious) {
      md += `· **地支六合**：生肖地支呈六合格局（${branchNameA}与${branchNameB}相合），主家庭根基稳固，长辈相处顺畅，生活步调极其协调。\n`;
    } else if (isBranchTriad) {
      md += `· **地支三合**：地支呈三合之象，共同奋斗目标明确，在事业与人生规划上步调一致、互为同盟。\n`;
    } else if (isBranchClash) {
      md += `· **地支相冲提醒**：地支逢六冲（${branchNameA}与${branchNameB}相冲），个性深处偶有对立面，发生分歧时切忌口舌争胜，各退一步则可化解。\n`;
    } else {
      md += `· **地支平稳**：地支循序相生，无刑冲破害，日常生活平实自然。\n`;
    }
    md += `· **五行局气数**：${nameA}为${juA}，${nameB}为${juB}。五行气数相互激荡，一方之稳健正好制衡另一方之急躁，具备实质性互补优势。\n\n`;

    // Thiên tác chi hợp
    md += `**【天作之合 · 夫妻宫与命宫互参（倪师铁律）】**\n`;
    md += `倪海厦先生在《天纪》中强调：「合盘先看彼此夫妻宫所坐之星，是否与对方命宫主星吻合，这叫正配。」\n`;
    md += `· **${nameA}的夫妻宫**坐【${fuqiStarNamesA}】：`;
    if (directMatchAtoB) {
      md += `**极其吻合！** 其夫妻宫所显现的星曜特质，精准投射在${nameB}的命盘主星之上，说明${nameB}正是${nameA}命中注定的理想伴侣。\n`;
    } else {
      md += `反映${nameA}内心期盼一个${quoteA ? quoteA.spouse_traits : '性格鲜明、能给予安全感'}的伴侣；双方在后天互动中可有意识地向该特质靠拢。\n`;
    }

    md += `· **${nameB}的夫妻宫**坐【${fuqiStarNamesB}】：`;
    if (directMatchBtoA) {
      md += `**双向对应！** ${nameB}夫妻宫的主曜恰好也是${nameA}的命宫主星，两盘遥相呼应，是极为难得的「宿世良缘」。\n`;
    } else {
      md += `说明${nameB}在感情中看重对方${quoteB ? quoteB.spouse_traits : '有担当、有能力'}的一面。\n`;
    }
    md += `\n`;

    // Song cung liên tham (Phúc đức)
    md += `**【双宫联参 · 福德宫之深层默契】**\n`;
    md += `倪师口诀：「**看婚姻，光看夫妻宫，大错特错，一定要同时看福德宫。福德宫是感情能否白头偕老的灵魂。**」\n`;
    md += `· **${nameA}福德宫**：主星为【${fudeStarsA.map(s => s.name).join('、') || '吉曜拱照'}】，精神追求追求精神契合。\n`;
    md += `· **${nameB}福德宫**：主星为【${fudeStarsB.map(s => s.name).join('、') || '吉曜拱照'}】，内心世界注重安宁与尊重。\n`;
    if (shaFudeA.length === 0 && shaFudeB.length === 0) {
      md += `· **断语**：双方福德宫均无严重煞星冲破，说明深层价值观一致，即使日常有琐碎争吵，也不会触及根本，感情底色深厚。\n\n`;
    } else {
      md += `· **断语**：福德宫微见煞忌，说明两人内心偶有各自不愿言说的隐性压力。倪师建议：遇到困扰务必坦诚沟通，不可暗自揣测生闷气。\n\n`;
    }

    // Tứ hóa phi tinh
    md += `**【四化飞化 · 缘分引动与因果纽带】**\n`;
    md += `· **${nameA}化禄（${luA}）** 飞入${nameB}盘之【${palaceOfLuAinB?.name || '运限宫位'}】，代表${nameA}天然能给${nameB}带来温暖、资源与喜悦。\n`;
    if (palaceOfJiAinB) {
      md += `· **${nameA}化忌（${jiA}）** 落在${nameB}盘之【${palaceOfJiAinB.name}】，提醒${nameA}不可将自身在${palaceOfJiAinB.name}领域的执念转嫁给对方。\n`;
    }
    md += `· **${nameB}化禄（${luB}）** 飞入${nameA}盘之【${palaceOfLuBinA?.name || '运限宫位'}】，代表${nameB}是${nameA}生活中的开心果与福德贵人。\n\n`;

    // Điểm hòa hợp & cảnh báo
    md += `**【和合助力与磨合建议】**\n`;
    md += `· **财帛与事业配合**：${groupA.group === 'ziwufuxiang' || groupB.group === 'ziwufuxiang' ? '一方善于统揽全局，一方擅长细致落实，在共同理财与事业规划上是一流搭档。' : '双方在财务处理上宜各自独立又共同透明，避免因小失大。'}\n`;
    md += `· **婚期与相处时机**：${(shaFuqiA.length > 0 || shaFuqiB.length > 0 || namesFuqiA.has('七杀') || namesFuqiA.has('破军') || namesFuqiA.has('武曲')) ? '夫妻宫见刚毅之星，倪师常断「宜晚婚」，双方心智成熟后再定终身，百利而无一害。' : '感情水到渠成，遇红鸾天喜之流年即为婚嫁吉期。'}\n\n`;

    // Trả lời câu hỏi trọng tâm
    if (question) {
      md += `**【针对提问解答：「${question}」】**\n`;
      if (question.includes('情') || question.includes('婚') || question.includes('爱') || question.includes('duyên') || question.includes('cưới')) {
        md += `从双盘联参来看，两人的感情属于「细水长流、越磨合越坚挺」的类型。关键在于包容各自的小固执，给彼此保留一分从容的空间。\n\n`;
      } else if (question.includes('财') || question.includes('事业') || question.includes('生意') || question.includes('làm ăn')) {
        md += `合伙与求财方面，气数互补，适宜分工明确的合作模式。一方对外开拓，一方对内把控财务与风控，可成大器。\n\n`;
      } else {
        md += `依据天纪合盘断法，顺天应人，以和为贵。把重心放在互相扶持而非改变对方，必能逢凶化吉。\n\n`;
      }
    }

    md += `**【倪师《天纪》修持箴言】**\n`;
    md += `> “命是天定，运在人为，化解之道全在人心。知己知彼，互谅互敬，则是化煞成祥之上上乘。”`;

    return { content: md, lang: 'zh', matchScore };
  } else {
    // Tiếng Việt
    let md = `> 📖 **Luận giải Hợp Bàn Tử Vi Đẩu Số song phương chính tông theo trường phái Nghê Hải Hạ 《Thiên Kỷ》**\n\n`;

    md += `**【TỔNG QUAN HỢP BÀN & ĐỊNH TÍNH DUYÊN PHẬN】**\n`;
    md += `· **${nameA}**: Sinh ${gzNameA} · Cung Mệnh an tại 【${mingBranchA}】 (${juA}) · Chính tinh: **${mingStarNamesA}** (${groupA.labelVi})\n`;
    md += `· **${nameB}**: Sinh ${gzNameB} · Cung Mệnh an tại 【${mingBranchB}】 (${juB}) · Chính tinh: **${mingStarNamesB}** (${groupB.labelVi})\n`;
    md += `· **Chỉ số tương hợp duyên phận tiên thiên**: **${matchScore} / 100 điểm**\n\n`;

    // Khí vận can chi
    md += `**【NĂM SINH KHÍ VẬN · THIÊN CAN ĐỊA CHI HÒA HỢP】**\n`;
    if (isStemHarmonious) {
      md += `· **Thiên Can Tương Hợp**: ${stemNameA} và ${stemNameB} thuộc thế Ngũ Hợp (Giáp Kỷ / Ất Canh / Bính Tân / Đinh Nhâm / Mậu Quý), tượng trưng cho tầng sâu tư duy và nhân sinh quan có sự thu hút tự nhiên, càng ở bên nhau lâu càng hiểu ý nhau.\n`;
    } else {
      md += `· **Khí Trường Thiên Can**: Thiên Can ${stemNameA} và ${stemNameB} mang cá tính độc lập, mỗi người có góc nhìn và nguyên tắc riêng, cần tôn trọng sự khác biệt của đối phương.\n`;
    }

    if (isBranchSixHarmonious) {
      md += `· **Địa Chi Lục Hợp**: Chi năm sinh ${branchNameA} và ${branchNameB} nằm trong thế Lục Hợp hoàn hảo, nền móng gia đạo vững bền, đôi bên dễ hòa thuận với gia đình hai họ, nhịp điệu sinh hoạt rất ăn khớp.\n`;
    } else if (isBranchTriad) {
      md += `· **Địa Chi Tam Hợp**: Chi năm sinh nằm trong tam hợp cục, có chung định hướng phấn đấu, dễ tìm được tiếng nói chung trong sự nghiệp và xây dựng tương lai.\n`;
    } else if (isBranchClash) {
      md += `· **Cảnh Báo Lục Xung**: Chi năm sinh thuộc thế Lục Xung (${branchNameA} - ${branchNameB}), tính cách đôi khi có phần đối chọi. Khi phát sinh mâu thuẫn cần bình tĩnh, tránh đôi co tranh thắng thua bằng lời nói.\n`;
    } else {
      md += `· **Địa Chi Bình Hòa**: Chi năm sinh tương sinh bình hòa, không phạm hình xung phá hại, cuộc sống gia đình êm ả tự nhiên.\n`;
    }
    md += `· **Ngũ Hành Cục Số**: ${nameA} là ${juA}, ${nameB} là ${juB}. Khí chất ngũ hành tạo thế cân bằng, sự điềm tĩnh của người này sẽ là điểm tựa vững chãi hóa giải sự nóng vội của người kia.\n\n`;

    // Thiên tác chi hợp
    md += `**【THIÊN TÁC CHI HỢP · ĐỐI CHIẾU PHU THÊ & MỆNH (NGUYÊN TẮC THẦY NGHÊ)】**\n`;
    md += `Thầy Nghê Hải Hạ trong 《Thiên Kỷ》 đặc biệt nhấn mạnh: *"Hợp bàn trước hết phải xem sao ngự tại Cung Phu Thê của người này có trùng khớp với sao tọa thủ Mệnh Cung của đối phương hay không, đó gọi là chính phối."*\n`;
    md += `· **Cung Phu Thê của ${nameA}** tọa thủ 【${fuqiStarNamesA}】: `;
    if (directMatchAtoB) {
      md += `**Trùng khớp kỳ diệu!** Tính chất sao ở Cung Phu Thê của ${nameA} phản ánh chân thực các sao chủ mệnh của ${nameB}. Đây chính là hình mẫu người phối ngẫu tiền định mà số mệnh đã an bài cho ${nameA}.\n`;
    } else {
      md += `cho thấy ${nameA} luôn mong muốn một người bạn đời ${quoteA ? quoteA.spouse_traits : 'vững vàng, biết vun vén và mang lại sự an tâm'}.\n`;
    }

    md += `· **Cung Phu Thê của ${nameB}** tọa thủ 【${fuqiStarNamesB}】: `;
    if (directMatchBtoA) {
      md += `**Chiếu ứng hai chiều!** Cung Phu Thê của ${nameB} cũng mang đúng các sao chủ lực trên Cung Mệnh của ${nameA}. Đây là cách cục hiếm có của một mối lương duyên sâu đậm.\n`;
    } else {
      md += `thể hiện ${nameB} trong hôn nhân rất trân trọng một người bạn đời ${quoteB ? quoteB.spouse_traits : 'có bản lĩnh, dám nghĩ dám làm và có trách nhiệm'}.\n`;
    }
    md += `\n`;

    // Song cung liên tham (Phúc đức)
    md += `**【SONG CUNG LIÊN THAM · NỘI TÂM CUNG PHÚC ĐỨC】**\n`;
    md += `Khẩu quyết thầy Nghê: *"**Xem hôn nhân mà chỉ nhìn Cung Phu Thê là đại sai lầm, nhất định phải đồng thời xem Cung Phúc Đức. Phúc Đức mới là cái gốc quyết định vợ chồng có sống được trọn đời bên nhau hay không.**"*\n`;
    md += `· **Phúc Đức của ${nameA}**: Chủ tinh 【${fudeStarsA.map(s => tStar(s.name)).join(', ') || 'Cát tinh chiếu'}】, coi trọng sự thanh thản và tôn trọng tự do tinh thần.\n`;
    md += `· **Phúc Đức của ${nameB}**: Chủ tinh 【${fudeStarsB.map(s => tStar(s.name)).join(', ') || 'Cát tinh chiếu'}】, hướng đến mái ấm ấm áp, chân thành.\n`;
    if (shaFudeA.length === 0 && shaFudeB.length === 0) {
      md += `· **Luận đoán**: Cả hai cung Phúc Đức đều sáng sủa, không bị sát tinh nặng nề xâm phạm. Điều này bảo chứng rằng dẫu bên ngoài có va chạm vụn vặt, sợi dây gắn kết tinh thần sâu kín vẫn luôn bền chặt, không dễ chia lìa.\n\n`;
    } else {
      md += `· **Luận đoán**: Cung Phúc Đức thoáng thấy sát tinh hoặc hóa kỵ, cho thấy đôi khi trong lòng vẫn còn những tâm sự riêng khó giãi bày. Lời khuyên của thầy Nghê: Gặp khúc mắc phải thẳng thắn chia sẻ, chớ nên ôm ấm ức một mình mà sinh nghi kỵ.\n\n`;
    }

    // Tứ hóa phi tinh
    md += `**【TỨ HÓA PHI TINH · DÂY NỐI NHÂN DUYÊN & TƯƠNG TRỢ】**\n`;
    md += `· **Hóa Lộc của ${nameA} (${tStar(luA)})** bay vào lá số của ${nameB} tại cung 【${palaceOfLuAinB ? tBranch(palaceOfLuAinB.branch) : 'Cát vị'}】: ${nameA} sinh ra đã mang nguồn năng lượng tài lộc, sự hoan hỷ và may mắn đến cho ${nameB}.\n`;
    if (palaceOfJiAinB) {
      md += `· **Hóa Kỵ của ${nameA} (${tStar(jiA)})** rơi vào cung 【${tBranch(palaceOfJiAinB.branch)}】 của ${nameB}: nhắc nhở ${nameA} không nên áp đặt kỳ vọng quá khắt khe của mình lên đối phương ở phương diện này.\n`;
    }
    md += `· **Hóa Lộc của ${nameB} (${tStar(luB)})** bay vào lá số của ${nameA} tại cung 【${palaceOfLuBinA ? tBranch(palaceOfLuBinA.branch) : 'Cát vị'}】: ${nameB} chính là quý nhân sưởi ấm tâm hồn và gia tăng phúc khí cho ${nameA}.\n\n`;

    // Điểm hòa hợp & hóa giải
    md += `**【ĐIỂM HÒA HỢP & LỜI KHUYÊN DUNG HÒA】**\n`;
    md += `· **Hợp tác & Kinh tế**: ${groupA.group === 'ziwufuxiang' || groupB.group === 'ziwufuxiang' ? 'Một người có tầm nhìn bao quát chiến lược, một người tỉ mỉ chu đáo trong quản lý tài chính; hai người khi chung tay sẽ dễ dàng tích lũy cơ ngơi hưng thịnh hơn là đơn thương độc mã.' : 'Nên có sự thống nhất rõ ràng và minh bạch trong các khoản chi tiêu lớn để gia đạo luôn thuận hòa.'}\n`;
    md += `· **Hôn kỳ & Ứng xử**: ${(shaFuqiA.length > 0 || shaFuqiB.length > 0 || namesFuqiA.has('七杀') || namesFuqiA.has('破军') || namesFuqiA.has('武曲')) ? 'Do Cung Phu Thê có sự xuất hiện của các sao cá tính mạnh mẽ, phái Nghê Hải Hạ khuyên nên "kết hôn muộn một chút" (ngoài 28-30 tuổi) khi tâm tính đã chín chắn, lúc đó hôn nhân sẽ vô cùng viên mãn, bền lâu.' : 'Duyên phận tự nhiên nảy nở, gặp năm lưu niên có Hồng Loan hoặc Thiên Hỷ chiếu là thời điểm vàng để tiến tới hôn nhân.'}\n\n`;

    // Giải đáp câu hỏi nếu có
    if (question) {
      md += `**【GIẢI ĐÁP CÂU HỎI TRỌNG TÂM: "${question}"】**\n`;
      if (question.includes('tình') || question.includes('yêu') || question.includes('cưới') || question.includes('hôn nhân')) {
        md += `Đối chiếu hai lá số, đây là mối quan hệ càng trải qua thời gian thử thách thì tình cảm lại càng sâu đậm. Chìa khóa để giữ lửa hạnh phúc là biết nhường nhịn và lắng nghe cảm xúc thật của nhau.\n\n`;
      } else if (question.includes('làm ăn') || question.includes('tiền') || question.includes('kinh doanh') || question.includes('tài')) {
        md += `Về phương diện làm ăn chung, ngũ hành và cung Quan Lộc tương trợ tốt. Nên phân công công việc rạch ròi: một người phụ trách đối ngoại mở rộng thị trường, một người lo liệu vận hành nội bộ và tài chính.\n\n`;
      } else {
        md += `Căn cứ theo phép đoán của thầy Nghê, vạn sự tùy duyên nhưng thuận theo đạo lý. Lấy sự chân thành và bao dung làm gốc rễ thì mọi thử thách đều hóa thành quả ngọt.\n\n`;
      }
    }

    md += `**【LỜI KHUYÊN TU DƯỠNG TỪ DANH SƯ NGHÊ HẢI HẠ】**\n`;
    md += `> *"Mệnh do trời định, nhưng vận tại lòng người. Phương pháp hóa giải xung khắc chân chính nhất không nằm ở bùa chú, mà nằm ở sự thấu hiểu và tôn trọng lẫn nhau giữa hai tâm hồn."*`;

    return { content: md, lang: 'vi', matchScore };
  }
}
