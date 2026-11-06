import { execFile, execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import type { BirthInfo } from './types';

const execFileAsync = promisify(execFile);

let cachedPython: string | null = null;

/**
 * Tìm kiếm chính xác đường dẫn Python 3 có cài sẵn module zstandard.
 * Trên Windows, tránh triệt để stub Microsoft Store (WindowsApps\python.exe) gây lỗi quyền.
 */
export function getPythonExecutable(): string {
  if (cachedPython) return cachedPython;

  const localApp = process.env.LOCALAPPDATA || '';
  const candidates: string[] = [
    process.env.PYTHON_PATH,
    process.env.PYTHON_BIN,
    path.join(localApp, 'Programs', 'Python', 'Python312', 'python.exe'),
    path.join(localApp, 'Programs', 'Python', 'Python311', 'python.exe'),
    path.join(localApp, 'Programs', 'Python', 'Python313', 'python.exe'),
    path.join(localApp, 'Programs', 'Python', 'Python310', 'python.exe'),
    'C:\\Python312\\python.exe',
    'C:\\Python311\\python.exe',
    'C:\\Python310\\python.exe',
    'python',
    'py',
    'python3',
  ].filter(Boolean) as string[];

  for (const cand of candidates) {
    if (cand.includes('\\') && !fs.existsSync(cand)) continue;
    try {
      execFileSync(cand, ['-c', 'import zstandard; print(1)'], { stdio: 'pipe', timeout: 3000 });
      cachedPython = cand;
      return cand;
    } catch {
      // Tiếp tục thử ứng viên tiếp theo
    }
  }

  cachedPython = 'python';
  return 'python';
}

/** Kiểm tra xem file dataset .zst của năm sinh đã có trong data/dataset/ chưa */
export function isYearDatasetDownloaded(year: number): boolean {
  const filePath = path.join(process.cwd(), 'data', 'dataset', `year-${year}.jsonl.zst`);
  return fs.existsSync(filePath);
}

export type DatasetTopic =
  | 'overview'
  | 'personality'
  | 'love'
  | 'career'
  | 'wealth'
  | 'health'
  | 'family'
  | 'children'
  | 'move'
  | 'friends'
  | 'home'
  | 'spirit'
  | 'parents';

export interface DatasetChartRecord {
  k: string;
  y: number;
  m: number;
  d: number;
  h: number;
  g: 'male' | 'female';
  ms: string | null;
  t?: Record<string, number>;
  c: Record<DatasetTopic, string>;
}

export function detectTopicKey(input: string): DatasetTopic {
  const s = input.toLowerCase();
  if (s.includes('personality') || s.includes('tính cách') || s.includes('bản tính') || s.includes('性格')) return 'personality';
  if (s.includes('love') || s.includes('tình duyên') || s.includes('hôn nhân') || s.includes('phu thê') || s.includes('感情') || s.includes('夫妻')) return 'love';
  if (s.includes('career') || s.includes('sự nghiệp') || s.includes('quan lộc') || s.includes('công danh') || s.includes('事业') || s.includes('官禄')) return 'career';
  if (s.includes('wealth') || s.includes('tài vận') || s.includes('tài lộc') || s.includes('tiền tài') || s.includes('tài bạch') || s.includes('财运') || s.includes('财帛')) return 'wealth';
  if (s.includes('health') || s.includes('sức khỏe') || s.includes('tật ách') || s.includes('bệnh tật') || s.includes('健康') || s.includes('疾厄')) return 'health';
  if (s.includes('home') || s.includes('điền trạch') || s.includes('nhà cửa') || s.includes('bất động sản') || s.includes('田宅')) return 'home';
  if (s.includes('children') || s.includes('tử tức') || s.includes('con cái') || s.includes('子女')) return 'children';
  if (s.includes('move') || s.includes('thiên di') || s.includes('xuất ngoại') || s.includes('đi xa') || s.includes('迁移')) return 'move';
  if (s.includes('friends') || s.includes('nô bộc') || s.includes('bạn bè') || s.includes('quý nhân') || s.includes('交友') || s.includes('仆役')) return 'friends';
  if (s.includes('family') || s.includes('huynh đệ') || s.includes('anh em') || s.includes('兄弟')) return 'family';
  if (s.includes('spirit') || s.includes('phúc đức') || s.includes('tâm linh') || s.includes('tinh thần') || s.includes('福德')) return 'spirit';
  if (s.includes('parents') || s.includes('phụ mẫu') || s.includes('cha mẹ') || s.includes('父母')) return 'parents';
  return 'overview';
}

const SECTION_MAP: [RegExp, string][] = [
  [/【命格总览】/g, '【TỔNG QUAN MỆNH CÁCH】'],
  [/【一句话定调】/g, '【MỘT CÂU ĐỊNH TÍNH】'],
  [/【核心论断】/g, '【LUẬN ĐOÁN CỐT LÕI】'],
  [/【关键推导】/g, '【SUY DIỄN THEN CHỐT】'],
  [/【身宫 · 后天追求】/g, '【THÂN CUNG · HẬU THIÊN】'],
  [/【命盘推演】/g, '【SUY DIỄN MỆNH BÀN】'],
  [/【三方四正联动】/g, '【LIÊN ĐỚI TAM PHƯƠNG TỨ CHÍNH】'],
  [/【命盘依据】/g, '【CĂN CỨ MỆNH BÀN】'],
  [/【特殊格局识别】/g, '【NHẬN DIỆN CÁCH CỤC ĐẶC BIỆT】'],
  [/【经典出处】/g, '【TRÍCH DẪN KINH ĐIỂN & 《THIÊN KỶ》】'],
  [/【⚠️ 风险提醒】/g, '【⚠️ CẢNH BÁO RỦI RO & LỜI KHUYÊN】'],
  [/【针对你的命盘】/g, '【ĐẶC ĐIỂM RIÊNG CỦA LÁ SỐ NÀY】'],
  [/【感情格局】/g, '【CỤC DIỆN TÌNH CẢM】'],
  [/【夫妻宫分析】/g, '【PHÂN TÍCH CUNG PHU THÊ】'],
  [/【事业格局】/g, '【CỤC DIỆN SỰ NGHIỆP】'],
  [/【官禄宫分析】/g, '【PHÂN TÍCH CUNG QUAN LỘC】'],
  [/【财运格局】/g, '【CỤC DIỆN TÀI VẬN】'],
  [/【财帛宫分析】/g, '【PHÂN TÍCH CUNG TÀI BẠCH】'],
  [/【健康状况】/g, '【TÌNH TRẠNG SỨC KHỎE】'],
  [/【疾厄宫分析】/g, '【PHÂN TÍCH CUNG TẬT ÁCH】'],
  [/【性格特质】/g, '【ĐẶC TRƯNG TÍNH CÁCH】'],
  [/【田宅不动产】/g, '【ĐIỀN TRẠCH BẤT ĐỘNG SẢN】'],
  [/【子女缘分】/g, '【CON CÁI TỬ TỨC】'],
  [/【迁移外出】/g, '【THIÊN DI XUẤT NGOẠI】'],
  [/【人际贵人】/g, '【BẠN BÈ QUÝ NHÂN】'],
  [/【兄弟合伙】/g, '【HUYNH ĐỆ HỢP TÁC】'],
  [/【精神福德】/g, '【PHÚC ĐỨC TÂM LINH】'],
  [/【父母长辈】/g, '【PHỤ MẪU TIỀN BỐI】'],
  [/## ⚙ 主辅煞组合精细论断/g, '## ⚙ LUẬN GIẢI TINH TIẾT CHÍNH - PHỤ - SÁT TINH'],
];

export function localizeDatasetText(rawText: string): string {
  let text = rawText;

  for (const [pattern, rep] of SECTION_MAP) {
    text = text.replace(pattern, rep);
  }

  // Chú thích nguồn
  const prefix = `> 📖 **Luận giải chuẩn xác từ kho tri thức 《Thiên Kỷ》 của danh sư Nghê Hải Hạ & Tử Vi Đẩu Số Toàn Thư** *(Dataset v4.0 đối chiếu thực chứng)*\n\n`;
  return prefix + text;
}

export async function lookupDatasetChart(
  birthInfo: BirthInfo,
  topic?: DatasetTopic,
  translate = false
): Promise<{ success: boolean; content?: string; record?: DatasetChartRecord; error?: string }> {
  const y = Math.round(Number(birthInfo.year));
  if (isNaN(y) || y < 1950 || y > 2026) {
    return { success: false, error: 'Dataset chỉ hỗ trợ từ năm 1950 đến 2026' };
  }

  if (!isYearDatasetDownloaded(y)) {
    return { success: false, error: 'FILE_NOT_DOWNLOADED' };
  }

  const m = Math.max(1, Math.min(12, Math.round(Number(birthInfo.month || 1))));
  const d = Math.max(1, Math.min(31, Math.round(Number(birthInfo.day || 1))));
  let h = Number(birthInfo.hour ?? 0);
  if (isNaN(h)) h = 0;
  if (h > 11) {
    // Chuyển đổi nếu người dùng hoặc API truyền vào giờ đồng hồ (0-23)
    if (h >= 23 || h < 1) h = 0;
    else h = Math.floor((h - 1) / 2) + 1;
  }
  h = Math.max(0, Math.min(11, Math.round(h)));

  const genderStr = String(birthInfo.gender || '');
  const g = (genderStr === 'female' || genderStr === 'f' || genderStr === '女') ? 'female' : 'male';

  const scriptPath = path.join(process.cwd(), 'scripts', 'lookup-dataset.py');
  const args = [
    scriptPath,
    '--year', String(y),
    '--month', String(m),
    '--day', String(d),
    '--hour', String(h),
    '--gender', g,
  ];

  if (topic) {
    args.push('--topic', topic);
  }

  if (translate) {
    args.push('--translate');
  }

  const pythonBin = getPythonExecutable();
  const pyDir = path.dirname(pythonBin);
  const extraPath = pyDir && pyDir !== '.' ? `${pyDir};` : '';

  try {
    const { stdout } = await execFileAsync(pythonBin, args, {
      maxBuffer: 15 * 1024 * 1024,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PATH: `${extraPath}${process.env.PATH || ''}`,
      },
    });
    const data = JSON.parse(stdout);

    if (topic && data.content) {
      return { success: true, content: data.content };
    }

    if (data.c) {
      return {
        success: true,
        record: data as DatasetChartRecord,
        content: topic ? data.c[topic] : data.c.overview,
      };
    }

    return { success: false, error: 'Không tìm thấy dữ liệu lá số trong dataset' };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
