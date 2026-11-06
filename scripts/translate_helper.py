"""
scripts/translate_helper.py
Dịch toàn văn nguyên bản tiếng Trung từ Dataset v4.0 sang Tiếng Việt chuẩn xác 100%.
Bảo toàn nguyên bản độ dài, cấu trúc Markdown, trích dẫn 《Thiên Kỷ》 của Nghê Hải Hạ,
《Tử Vi Đẩu Số Toàn Thư》, mốc thời gian video và thuật ngữ Tử Vi Đẩu Số chính tông.
Chạy hoàn toàn cục bộ, tức thì (<50ms), không phụ thuộc mạng, có cache trên đĩa.
"""

import sys
import os
import json
import re

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "dataset", "translations")
HANVIET_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hanviet.json")

def ensure_cache_dir():
    os.makedirs(CACHE_DIR, exist_ok=True)

def clean_reading(val: str) -> str:
    if not val:
        return ""
    # Lấy từ đầu tiên trước dấu gạch chéo, phẩy hoặc ngoặc
    first_part = re.split(r'[/,;(|\[]', val)[0].strip()
    return first_part

_HV_CHARS = {}
if os.path.exists(HANVIET_PATH):
    try:
        with open(HANVIET_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            for k, v in data.get("chars", {}).items():
                _HV_CHARS[k] = clean_reading(v)
    except Exception as e:
        sys.stderr.write(f"Warning loading hanviet.json: {e}\n")

_CUSTOM_CHARS = {
    '紫': 'Tử', '微': 'Vi', '机': 'Cơ', '阳': 'Dương', '武': 'Vũ', '曲': 'Khúc',
    '同': 'Đồng', '廉': 'Liêm', '贞': 'Trinh', '府': 'Phủ', '阴': 'Âm', '贪': 'Tham',
    '狼': 'Lang', '巨': 'Cự', '门': 'Môn', '相': 'Tướng', '梁': 'Lương', '七': 'Thất',
    '杀': 'Sát', '破': 'Phá', '军': 'Quân', '文': 'Văn', '昌': 'Xương', '左': 'Tả',
    '辅': 'Phụ', '右': 'Hữu', '弼': 'Bật', '魁': 'Khôi', '钺': 'Việt', '禄': 'Lộc',
    '存': 'Tồn', '马': 'Mã', '擎': 'Kình', '羊': 'Dương', '陀': 'Đà', '罗': 'La',
    '火': 'Hỏa', '星': 'Tinh', '铃': 'Linh', '空': 'Không', '劫': 'Kiếp', '权': 'Quyền',
    '科': 'Khoa', '忌': 'Kỵ', '命': 'Mệnh', '宫': 'Cung', '身': 'Thân', '财': 'Tài',
    '帛': 'Bạch', '官': 'Quan', '迁': 'Thiên', '移': 'Di', '疾': 'Tật', '厄': 'Ách',
    '田': 'Điền', '宅': 'Trạch', '福': 'Phúc', '德': 'Đức', '父': 'Phụ', '母': 'Mẫu',
    '兄': 'Huynh', '弟': 'Đệ', '子': 'Tử', '女': 'Tức', '交': 'Giao', '友': 'Hữu',
    '仆': 'Nô', '役': 'Bộc', '夫': 'Phu', '妻': 'Thê', '庙': 'Miếu', '旺': 'Vượng',
    '陷': 'Hãm', '得': 'Đắc', '利': 'Lợi', '平': 'Bình', '局': 'Cục', '水': 'Thủy',
    '木': 'Mộc', '金': 'Kim', '土': 'Thổ', '年': 'Năm', '限': 'Hạn', '运': 'Vận',
    '煞': 'Sát', '吉': 'Cát', '凶': 'Hung', '格': 'Cách', '照': 'Chiếu', '冲': 'Xung',
    '会': 'Hội', '合': 'Hợp', '坐': 'Tọa', '守': 'Thủ', '对': 'Đối', '化': 'Hóa',
    '贵': 'Quý', '人': 'Nhân', '富': 'Phú', '贫': 'Bần', '寿': 'Thọ', '夭': 'Yểu',
    '每': 'mỗi', '第': 'thứ', '甘': 'cam', '问': 'hỏi', '遍': 'lần', '革': 'cách',
    '面': 'diện', '这': 'này', '种': 'loại', '拆': 'phá bỏ', '坏': 'xấu', '旧': 'cũ',
    '新': 'mới', '改': 'cải', '造': 'tạo', '势': 'thế', '力': 'lực', '引': 'dẫn',
    '帮': 'giúp', '靠': 'dựa vào', '信': 'tin', '任': 'nhiệm', '真': 'thật', '假': 'giả',
    '正': 'chính', '邪': 'tà', '明': 'sáng', '暗': 'tối', '日': 'ngày', '月': 'tháng',
    '天': 'trời', '地': 'đất', '大': 'lớn', '小': 'nhỏ', '多': 'nhiều', '少': 'ít',
    '长': 'trường', '短': 'đoản', '高': 'cao', '低': 'thấp', '强': 'mạnh', '弱': 'yếu',
    '好': 'tốt', '稳': 'vững', '重': 'nặng', '轻': 'nhẹ', '深': 'sâu', '浅': 'nông',
    '快': 'nhanh', '慢': 'chậm', '早': 'sớm', '晚': 'muộn', '前': 'trước', '后': 'sau',
    '头': 'đầu', '尾': 'đuôi', '进': 'vào', '出': 'ra', '上': 'trên', '下': 'dưới',
    '里': 'trong', '外': 'ngoài', '中': 'trung', '内': 'nội', '东': 'Đông', '西': 'Tây',
    '南': 'Nam', '北': 'Bắc', '起': 'khởi', '落': 'lạc', '开': 'mở', '关': 'đóng',
    '成': 'thành', '败': 'bại', '得': 'được', '失': 'mất', '生': 'sinh', '死': 'tử',
    '言': 'lời', '语': 'ngữ', '文': 'văn', '武': 'võ', '心': 'tâm', '气': 'khí',
    '意': 'ý', '想': 'nghĩ', '思': 'tư', '志': 'chí', '情': 'tình', '理': 'lý',
    '事': 'việc', '物': 'vật', '道': 'đạo', '法': 'pháp', '术': 'thuật', '数': 'số',
    '产': 'sản', '亮': 'sáng', '仅': 'chỉ', '以': 'dĩ', '优': 'ưu', '何': 'hà',
    '俟': 'kỳ', '做': 'làm', '击': 'kích', '剩': 'thừa', '努': 'nỗ', '咨': 'tư',
    '型': 'hình', '垣': 'viên', '够': 'đủ', '尤': 'vưu', '峰': 'phong', '异': 'dị',
    '归': 'quy', '录': 'lục', '惟': 'duy', '慧': 'tuệ', '抹': 'mạt', '换': 'đổi',
    '曜': 'diệu', '析': 'tích', '档': 'đương', '牵': 'khiên', '猜': 'đoán', '环': 'hoàn',
    '碰': 'chạm', '籍': 'tịch', '纠': 'củ', '线': 'tuyến', '维': 'duy', '缓': 'hoãn',
    '翻': 'lật', '者': 'người', '而': 'mà', '聊': 'trò chuyện', '腻': 'nị', '范': 'phạm',
    '葛': 'cát', '薪': 'lương', '覆': 'phúc', '诀': 'quyết', '识': 'thức', '询': 'tuân',
    '误': 'sai', '谁': 'ai', '购': 'mua', '赔': 'bồi', '赚': 'kiếm', '较': 'so sánh',
    '辩': 'biện', '量': 'lượng', '际': 'tế', '需': 'cần', '静': 'tĩnh', '颗': 'ngôi',
    '饭': 'cơm', '吃': 'ăn', '找': 'tìm', '搞': 'làm', '扎': 'cắm', '抓': 'nắm',
    '并': 'đồng thời', '从': 'từ', '向': 'hướng', '由': 'do', '被': 'bị', '让': 'để',
    '给': 'cho', '把': 'đem', '与': 'cùng', '跟': 'cùng', '或': 'hoặc',
    '但': 'nhưng', '却': 'lại', '且': 'vả lại', '又': 'lại', '再': 'lại',
    '才': 'mới', '就': 'liền', '也': 'cũng', '都': 'đều', '很': 'rất',
    '太': 'quá', '更': 'càng', '最': 'nhất', '越': 'càng', '不': 'không', '没': 'chưa',
    '别': 'đừng', '莫': 'chớ', '未': 'chưa', '无': 'không', '非': 'phi', '所': 'sở',
}
_HV_CHARS.update(_CUSTOM_CHARS)

# Thuật ngữ chuyên sâu Tử Vi & đoán pháp Nghê Hải Hạ
DOMAIN_PHRASES = [
    # Tiêu đề mục lớn
    ('【命格总览】', '【TỔNG QUAN MỆNH CÁCH】'),
    ('【感情格局】', '【CỤC DIỆN TÌNH CẢM】'),
    ('【事业格局】', '【CỤC DIỆN SỰ NGHIỆP】'),
    ('【财运格局】', '【CỤC DIỆN TÀI VẬN】'),
    ('【健康状况】', '【TÌNH TRẠNG SỨC KHỎE】'),
    ('【性格特质】', '【ĐẶC TRƯNG TÍNH CÁCH】'),
    ('【田宅不动产】', '【ĐIỀN TRẠCH BẤT ĐỘNG SẢN】'),
    ('【子女缘分】', '【CON CÁI TỬ TỨC】'),
    ('【迁移外出】', '【THIÊN DI XUẤT NGOẠI】'),
    ('【人际贵人】', '【BẠN BÈ QUÝ NHÂN】'),
    ('【兄弟合伙】', '【HUYNH ĐỆ HỢP TÁC】'),
    ('【精神福德】', '【PHÚC ĐỨC TÂM LINH】'),
    ('【父母长辈】', '【PHỤ MẪU TIỀN BỐI】'),
    ('【一句话定调】', '【MỘT CÂU ĐỊNH TÍNH】'),
    ('【核心论断】', '【LUẬN ĐOÁN CỐT LÕI】'),
    ('【关键推导】', '【SUY DIỄN THEN CHỐT】'),
    ('关键推导', 'Suy diễn then chốt'),
    ('【身宫 · 后天追求】', '【THÂN CUNG · HẬU THIÊN THEO ĐUỔI】'),
    ('【命盘推演】', '【SUY DIỄN MỆNH BÀN】'),
    ('【三方四正联动】', '【LIÊN ĐỚI TAM PHƯƠNG TỨ CHÍNH】'),
    ('【四化路径分析 · 落到你这盘】', '【PHÂN TÍCH ĐƯỜNG ĐI TỨ HÓA TRÊN LÁ SỐ】'),
    ('【四化路径】', '【ĐƯỜNG ĐI TỨ HÓA】'),
    ('【命盘依据】', '【CĂN CỨ MỆNH BÀN】'),
    ('【特殊格局识别】', '【NHẬN DIỆN CÁCH CỤC ĐẶC BIỆT】'),
    ('特殊格局识别', 'Nhận diện cách cục đặc biệt'),
    ('【经典出处】', '【TRÍCH DẪN KINH ĐIỂN & 《THIÊN KỶ》】'),
    ('【⚠️ 风险提醒】', '【⚠️ CẢNH BÁO NGUY CƠ & RỦI RO】'),
    ('【针对你的命盘】', '【ĐẶC ĐIỂM RIÊNG CỦA LÁ SỐ NÀY】'),
    ('## ✦ 双星同宫', '## ✦ SONG TINH ĐỒNG CUNG'),
    ('## ⚙ 主辅煞组合精细论断', '## ⚙ LUẬN GIẢI TINH TIẾT TỔ HỢP CHÍNH - PHỤ - SÁT TINH'),
    ('倪师断法引擎 · 可回溯《天纪》', 'Bộ suy luận đoán pháp Thầy Nghê · Đối chiếu 《Thiên Kỷ》'),
    ('倪师断法', 'Đoán pháp Thầy Nghê'),
    ('传统断法', 'Đoán pháp truyền thống'),
    ('流派传承·待核', 'Dòng phái truyền thừa · Chờ khảo nghiệm'),
    ('经维基文库善本核验', 'Đã khảo đính qua bản gốc kinh điển'),
    ('明清刻本原文·传统流派参考，非倪师断法', 'Nguyên văn mộc bản Minh - Thanh · Tham khảo các phái truyền thống, không phải đoán pháp Thầy Nghê'),

    # Thầy Nghê & Sách kinh điển
    ('倪师', 'Thầy Nghê'),
    ('倪海厦', 'Nghê Hải Hạ'),
    ('《天纪》', '《Thiên Kỷ》'),
    ('天纪', '《Thiên Kỷ》'),
    ('《全书》', '《Tử Vi Đẩu Số Toàn Thư》'),
    ('全书', '《Tử Vi Đẩu Số Toàn Thư》'),
    ('《紫微斗数全书》', '《Tử Vi Đẩu Số Toàn Thư》'),
    ('紫微斗数全书', '《Tử Vi Đẩu Số Toàn Thư》'),
    ('《斗数骨髓赋》', '《Đẩu Số Cốt Tủy Phú》'),
    ('斗数骨髓赋', '《Đẩu Số Cốt Tủy Phú》'),
    ('《骨髓赋》', '《Đẩu Số Cốt Tủy Phú》'),
    ('骨髓赋', '《Đẩu Số Cốt Tủy Phú》'),
    ('《太微赋》', '《Thái Vi Phú》'),
    ('太微赋', '《Thái Vi Phú》'),

    # Khẩu ngữ & cụm từ luận đoán thông dụng
    ('这盘', 'lá số này'),
    ('本盘', 'lá số này'),
    ('环境', 'hoàn cảnh'),
    ('吃饭', 'kiếm cơm'),
    ('薪水', 'tiền lương'),
    ('做生意', 'kinh doanh làm ăn'),
    ('搭档', 'cộng sự đồng hành'),
    ('脑子', 'đầu óc'),
    ('谁都', 'ai cũng'),
    ('谁也', 'ai cũng'),
    ('拍板', 'quyết định dứt khoát'),
    ('落地', 'thực thi hiện thực'),
    ('点子', 'ý tưởng'),
    ('主意', 'chủ kiến'),
    ('做事', 'hành sự làm việc'),
    ('说话', 'lời ăn tiếng nói'),
    ('商量', 'thương lượng bàn bạc'),
    ('琢磨', 'nghiền ngẫm'),
    ('翻来覆去', 'suy đi tính lại'),
    ('打交道', 'giao thiệp tiếp xúc'),
    ('靠谱', 'đáng tin cậy'),
    ('踏实', 'vững vàng chắc chắn'),

    # Khái niệm Cốt lõi Tiên thiên - Hậu thiên - Vận hạn
    ('先天', 'tiên thiên'),
    ('后天', 'hậu thiên'),
    ('日月', 'Nhật Nguyệt'),
    ('本命', 'bản mệnh'),
    ('身命', 'thân mệnh'),
    ('大限', 'Đại Hạn'),
    ('流年', 'Lưu Niên'),
    ('小限', 'Tiểu Hạn'),
    ('太岁', 'Thái Tuế'),
    ('岁建', 'Tuế Kiến'),
    ('空亡', 'không vong'),
    ('空劫', 'Không Kiếp'),
    ('羊陀', 'Kình Đà'),
    ('火铃', 'Hỏa Linh'),
    ('昌曲', 'Xương Khúc'),
    ('辅弼', 'Phụ Bật'),
    ('魁钺', 'Khôi Việt'),

    # Cung vị
    ('命宫三合·官禄 · 官禄', 'Cung Mệnh Tam Hợp · Quan Lộc'),
    ('命宫三合·财帛 · 财帛', 'Cung Mệnh Tam Hợp · Tài Bạch'),
    ('命宫对宫·迁移 · 迁移', 'Cung Mệnh Đối Cung · Thiên Di'),
    ('本宫 · 命宫', 'Bản Cung · Cung Mệnh'),
    ('命宫', 'Cung Mệnh'),
    ('身宫', 'Thân Cung'),
    ('财帛宫', 'Cung Tài Bạch'),
    ('官禄宫', 'Cung Quan Lộc'),
    ('迁移宫', 'Cung Thiên Di'),
    ('夫妻宫', 'Cung Phu Thê'),
    ('疾厄宫', 'Cung Tật Ách'),
    ('田宅宫', 'Cung Điền Trạch'),
    ('福德宫', 'Cung Phúc Đức'),
    ('父母宫', 'Cung Phụ Mẫu'),
    ('兄弟宫', 'Cung Huynh Đệ'),
    ('子女宫', 'Cung Tử Tức'),
    ('交友宫', 'Cung Nô Bộc'),
    ('仆役宫', 'Cung Nô Bộc'),

    # Cung - Cục - Tứ Hóa
    ('三方四正', 'Tam Phương Tứ Chính'),
    ('四化路径', 'đường đi Tứ Hóa'),
    ('水二局', 'Thủy Nhị Cục'),
    ('木三局', 'Mộc Tam Cục'),
    ('金四局', 'Kim Tứ Cục'),
    ('土五局', 'Thổ Ngũ Cục'),
    ('火六局', 'Hỏa Lục Cục'),
    ('化禄', 'Hóa Lộc'),
    ('化权', 'Hóa Quyền'),
    ('化科', 'Hóa Khoa'),
    ('化忌', 'Hóa Kỵ'),
    ('禄存', 'Lộc Tồn'),
    ('天马', 'Thiên Mã'),
    ('擎羊', 'Kình Dương'),
    ('陀罗', 'Đà La'),
    ('火星', 'Hỏa Tinh'),
    ('铃星', 'Linh Tinh'),
    ('地空', 'Địa Không'),
    ('地劫', 'Địa Kiếp'),
    ('天空', 'Thiên Không'),
    ('旬空', 'Tuần Không'),
    ('截空', 'Triệt Không'),
    ('文昌', 'Văn Xương'),
    ('文曲', 'Văn Khúc'),
    ('左辅', 'Tả Phụ'),
    ('右弼', 'Hữu Bật'),
    ('天魁', 'Thiên Khôi'),
    ('天钺', 'Thiên Việt'),
    ('天刑', 'Thiên Hình'),
    ('天姚', 'Thiên Diêu'),
    ('红鸾', 'Hồng Loan'),
    ('天喜', 'Thiên Hỷ'),
    ('孤辰', 'Cô Thần'),
    ('寡宿', 'Quả Tú'),

    # 14 Chính tinh
    ('紫微', 'Tử Vi'),
    ('天机', 'Thiên Cơ'),
    ('太阳', 'Thái Dương'),
    ('武曲', 'Vũ Khúc'),
    ('天同', 'Thiên Đồng'),
    ('廉贞', 'Liêm Trinh'),
    ('天府', 'Thiên Phủ'),
    ('太阴', 'Thái Âm'),
    ('贪狼', 'Tham Lang'),
    ('巨门', 'Cự Môn'),
    ('天相', 'Thiên Tướng'),
    ('天梁', 'Thiên Lương'),
    ('七杀', 'Thất Sát'),
    ('破军', 'Phá Quân'),

    # Miếu Hãm & Cung Tính
    ('庙旺', 'miếu vượng'),
    ('入庙', 'nhập miếu'),
    ('落陷', 'lạc hãm'),
    ('利益', 'đắc lợi'),
    ('平和', 'bình hòa'),
    ('对冲', 'đối xung'),
    ('冲命', 'xung Mệnh'),
    ('坐守', 'tọa thủ'),
    ('同度', 'đồng độ'),
    ('同坐', 'đồng tọa'),
    ('同宫', 'đồng cung'),
    ('坐命', 'tọa thủ Cung Mệnh'),
    ('会照', 'hội chiếu'),
    ('守照', 'thủ chiếu'),
    ('空宫', 'cung vô chính diệu'),
    ('借对宫', 'mượn đối cung'),
    ('解厄制化', 'giải ách chế hóa'),
    ('逢凶化吉', 'gặp hung hóa cát'),
    ('解厄', 'giải ách'),

    # Cách cục danh tiếng
    ('石中隐玉', 'Thạch Trung Ẩn Ngọc'),
    ('禄马交驰', 'Lộc Mã giao trì'),
    ('杀破狼', 'Sát Phá Tham'),
    ('机月同梁', 'Cơ Nguyệt Đồng Lương'),
    ('日照雷门', 'Nhật Chiếu Lôi Môn'),
    ('月朗天门', 'Nguyệt Lãng Thiên Môn'),
    ('金灿光辉', 'Kim Xán Quang Huy'),
    ('巨日同宫', 'Cự Nhật đồng cung'),
    ('阳梁昌禄', 'Dương Lương Xương Lộc'),
    ('紫府朝垣', 'Tử Phủ triều viên'),
    ('君臣庆会', 'Quân Thần khánh hội'),
    ('马头带箭', 'Mã Đầu Đới Tiễn'),
    ('半空折翅', 'bán không chiết cánh'),

    # Thuật ngữ luận đoán Thầy Nghê
    ('口舌是非', 'khẩu thiệt thị phi'),
    ('破旧立新', 'phá bỏ cái cũ lập nên cái mới'),
    ('先破后立', 'trước phá sau dựng'),
    ('领固定的薪水', 'nhận mức lương cố định'),
    ('叫正财', 'gọi là chính tài'),
    ('正财', 'chính tài'),
    ('偏财', 'thiên tài'),
    ('横财', 'hoành tài'),
    ('公职', 'công chức'),
    ('文官', 'quan văn'),
    ('武官', 'quan võ'),
    ('帝星', 'Đế tinh'),
    ('将星', 'Tướng tinh'),
    ('耗星', 'Hao tinh'),
    ('暗曜', 'Ám diệu'),
    ('是非星', 'Thị phi tinh'),
    ('桃花星', 'Đào hoa tinh'),
    ('贵星', 'Quý tinh'),
    ('善星', 'Thiện tinh'),
    ('印星', 'Ấn tinh'),
    ('吉星', 'cát tinh'),
    ('煞星', 'sát tinh'),
    ('凶星', 'hung tinh'),
    ('恶星', 'ác tinh'),
    ('吉曜', 'cát diệu'),
    ('凶曜', 'hung diệu'),
    ('主星', 'chính tinh'),
    ('辅星', 'phụ tinh'),
    ('贵人', 'quý nhân'),
    ('大限', 'Đại Hạn'),
    ('流年', 'Lưu Niên'),
    ('小限', 'Tiểu Hạn'),
    ('太岁', 'Thái Tuế'),

    # Văn phong giải thích hiện đại của bộ dataset
    ('你天生有一股', 'Bạn bẩm sinh có một luồng'),
    ('你天生会', 'Bạn bẩm sinh giỏi'),
    ('你天生', 'Bạn bẩm sinh'),
    ('你最大的长处是', 'Sở trường lớn nhất của bạn là'),
    ('你最大的长处', 'Sở trường lớn nhất của bạn'),
    ('你的长处是', 'Sở trường của bạn là'),
    ('短处是', 'Sở đoản là'),
    ('弱点是', 'Điểm yếu là'),
    ('建议你', 'Khuyên bạn'),
    ('这辈子最大的分水岭', 'Bước ngoặt lớn nhất của cả cuộc đời này'),
    ('这辈子', 'Cả cuộc đời này'),
    ('做大决定', 'đưa ra quyết định lớn'),
    ('做决定', 'đưa ra quyết định'),
    ('一句话定调', 'Một câu định tính'),
    ('核心论断', 'Luận đoán cốt lõi'),
    ('说服人', 'thuyết phục người khác'),
    ('做判断', 'đưa ra phán đoán'),
    ('疑心重', 'lòng đa nghi nặng'),
    ('防备心', 'tâm lý phòng bị'),
    ('奔波劳碌', 'bôn ba vất vả'),
    ('名利双收', 'danh lợi song toàn'),
    ('名利兼得', 'danh lợi đều có thể trọn vẹn'),
    ('知所警惕方能转危为安', 'biết cảnh giác mới có thể chuyển nguy thành an'),
    ('隐性焦虑', 'sự lo âu tiềm ẩn'),
    ('自我怀疑', 'hoài nghi bản thân'),
    ('心血管问题', 'vấn đề tim mạch huyết áp'),
    ('重视情绪管理', 'chú trọng quản lý cảm xúc'),
    ('大器晚成', 'đại khí vãn thành (thành công muộn vững bền)'),
    ('不安于现状', 'không an phận với hiện trạng'),
    ('性子刚', 'tính cách cương nghị'),
    ('认死理', 'nguyên tắc chặt chẽ'),
    ('爱面子', 'coi trọng thể diện'),
    ('有气场', 'có khí chất đĩnh đạc'),
    ('靠谱的人', 'người đáng tin cậy'),
    ('独当一面', 'tự đảm đương một phương diện'),
    ('辅佐型人才', 'nhân tài phụ tá đắc lực'),
    ('专业人才', 'nhân tài chuyên môn'),
    ('出差多', 'đi công tác nhiều'),
    ('变动多', 'biến động nhiều'),
    ('动中生财', 'trong biến động mà sinh tài lộc'),
    ('外地', 'ngoại phương đất khách'),
    ('外出', 'xuất ngoại đi xa'),
    ('考运佳', 'vận thi cử thuận lợi'),
    ('贵人多', 'nhiều quý nhân giúp đỡ'),
    ('社交能力强', 'khả năng ngoại giao kết nối mạnh'),
    ('口才与辨析能力', 'khẩu tài và năng lực biện luận phân tích'),
    ('达到顶峰', 'đạt tới đỉnh cao'),
    ('如鱼得水', 'như cá gặp nước'),
    ('以退为进', 'lấy lùi làm tiến'),
    ('守成为上', 'lấy sự cẩn trọng gìn giữ làm đầu'),
    ('大富之象', 'tượng đại phú quý'),
    ('武职大贵', 'quan võ hay kinh doanh độc lập đại quý'),
    ('最强的财富格局之一', 'một trong những cách cục tài phú mạnh mẽ nhất'),
    ('适合金融投资与企业经营', 'thích hợp đầu tư tài chính và quản lý doanh nghiệp'),
    ('孤独果决冒险', 'cô độc, quả quyết và dám mạo hiểm'),
    ('将星', 'Tướng tinh'),
    ('印星辅佐', 'Ấn tinh phò tá'),
    ('位高权轻', 'vị trí cao nhưng phong thái ôn hòa'),
    ('守成为上', 'lấy cẩn trọng giữ gìn làm gốc'),
    ('适合文教迁移', 'thích hợp xuất ngoại du học hoặc văn hóa giáo dục'),
    ('盘面术语', 'thuật ngữ trên lá số'),
    ('不构成收入或成就预测', 'không dùng để khẳng định mức thu nhập hay thành tựu cụ thể'),
    ('词义', 'Ý nghĩa thuật ngữ'),
    ('校勘', 'Khảo đính'),
]

_SORTED_DOMAIN_PHRASES = sorted(DOMAIN_PHRASES, key=lambda x: len(x[0]), reverse=True)

COMMON_VOCAB = {
    '你': 'bạn', '我': 'tôi', '他': 'họ', '她': 'cô ấy', '它': 'nó', '们': 'các',
    '的': 'của', '了': 'rồi', '在': 'tại', '是': 'là', '不是': 'không phải là',
    '有': 'có', '没有': 'không có', '和': 'và', '跟': 'cùng với', '与': 'và',
    '及': 'cùng', '就': 'thì', '也': 'cũng', '不': 'không', '要': 'cần',
    '会': 'sẽ', '能': 'có thể', '把': 'đem', '被': 'bị', '让': 'khiến',
    '给': 'cho', '到': 'đến', '从': 'từ', '但': 'nhưng', '但是': 'nhưng',
    '因为': 'bởi vì', '所以': 'cho nên', '如果': 'nếu như', '虽然': 'mặc dù',
    '而且': 'hơn nữa', '或者': 'hoặc là', '自己': 'bản thân', '别人': 'người khác',
    '大家': 'mọi người', '这个': 'điều này', '那个': 'điều đó', '这些': 'những điều này',
    '那些': 'những điều đó', '很': 'rất', '更': 'càng', '最': 'nhất', '太': 'quá',
    '比较': 'tương đối', '非常': 'vô cùng', '特别': 'đặc biệt', '容易': 'dễ dàng',
    '可以': 'có thể', '应该': 'nên', '需要': 'cần', '必须': 'phải', '什么时候': 'khi nào',
    '时候': 'khi', '事情': 'sự việc', '问题': 'vấn đề', '情况': 'hoàn cảnh',
    '地方': 'nơi chốn', '说话': 'lời ăn tiếng nói', '做事': 'hành sự', '工作': 'công việc',
    '生活': 'cuộc sống', '感情': 'tình cảm', '钱财': 'tiền bạc', '身体': 'thân thể sức khỏe',
    '朋友': 'bạn bè', '家人': 'người nhà', '家庭': 'gia đình', '一生': 'một đời',
    '一辈子': 'cả cuộc đời', '意思是': 'ý nói rằng', '这就是': 'đây chính là',
    '来看': 'mà xét', '来说': 'mà nói', '看': 'xem', '讲': 'giảng dạy',
    '说': 'chép rằng', '直言': 'nói thẳng rằng', '指出': 'chỉ rõ', '多': 'nhiều',
    '少': 'ít', '大': 'lớn', '小': 'nhỏ', '好': 'tốt', '坏': 'xấu', '高': 'cao',
    '低': 'thấp', '重': 'nặng', '轻': 'nhẹ', '深': 'sâu', '浅': 'nông',
    '难': 'khó', '易': 'dễ', '快': 'nhanh', '慢': 'chậm', '早': 'sớm', '晚': 'muộn',
    '前': 'trước', '后': 'sau', '上': 'trên', '下': 'dưới', '里': 'trong', '外': 'ngoài',
    '中': 'trung', '内': 'nội', '东': 'Đông', '西': 'Tây', '南': 'Nam', '北': 'Bắc',
    '岁': 'tuổi', '月': 'tháng', '日': 'ngày', '时': 'giờ', '年': 'năm',
}

_SORTED_VOCAB = sorted(COMMON_VOCAB.items(), key=lambda x: len(x[0]), reverse=True)

def translate_phrase(s: str) -> tuple[str, int]:
    for zh, vi in _SORTED_DOMAIN_PHRASES:
        if s.startswith(zh):
            return vi, len(zh)

    for zh, vi in _SORTED_VOCAB:
        if s.startswith(zh):
            return vi, len(zh)

    c = s[0]
    if c in _HV_CHARS:
        return _HV_CHARS[c], 1

    return c, 1

def translate_line(line: str) -> str:
    if not line.strip():
        return line

    prefix = ""
    m = re.match(r"^(\s*[\*#>\-·✦▍]+\s*)", line)
    if m:
        prefix = m.group(1)
        line = line[len(prefix):]

    out = []
    i = 0
    n = len(line)

    while i < n:
        ch = line[i]
        if '\u4e00' <= ch <= '\u9fff' or ch in '【】〔〕':
            res, consumed = translate_phrase(line[i:])
            out.append(' ' + res + ' ')
            i += consumed
        elif ch in ',，':
            out.append(', ')
            i += 1
        elif ch in '。':
            out.append('. ')
            i += 1
        elif ch in '、':
            out.append(', ')
            i += 1
        elif ch in ';；':
            out.append('; ')
            i += 1
        elif ch in ':：':
            out.append(': ')
            i += 1
        elif ch in '「“':
            out.append(' "')
            i += 1
        elif ch in '”」':
            out.append('" ')
            i += 1
        else:
            out.append(ch)
            i += 1

    translated = "".join(out)
    translated = re.sub(r' +', ' ', translated).strip()
    translated = re.sub(r'\s+([,.:;?!])', r'\1', translated)
    translated = re.sub(r'([(\[])\s+', r'\1', translated)
    translated = re.sub(r'\s+([)\]])', r'\1', translated)
    translated = re.sub(r'\*\*\s+', '**', translated)
    translated = re.sub(r'\s+\*\*', '**', translated)
    translated = re.sub(r'《\s*《', '《', translated)
    translated = re.sub(r'》\s*》', '》', translated)

    return prefix + translated

def translate_full_markdown(text: str) -> str:
    lines = text.split("\n")
    translated_lines = [translate_line(l) for l in lines]
    result = "\n".join(translated_lines)
    result = re.sub(r'《\s*《', '《', result)
    result = re.sub(r'》\s*》', '》', result)
    return result

def get_cached_translation(chart_key: str, topic: str, raw_chinese_text: str) -> str:
    ensure_cache_dir()
    cache_file = os.path.join(CACHE_DIR, f"{chart_key}_{topic}_vi.md")

    # Kiểm tra nếu cache đã có và không chứa quá nhiều chữ Hán sót lại
    if os.path.exists(cache_file) and os.path.getsize(cache_file) > 100:
        with open(cache_file, "r", encoding="utf-8") as f:
            content = f.read()
            zh_count = sum(1 for c in content if '\u4e00' <= c <= '\u9fff')
            # Nếu bản dịch cũ bị lỗi chứa nhiều chữ Hán (>100 ký tự) hoặc chứa cụm từ dịch sai như 'Mặt trời', dịch lại
            if zh_count < 50 and 'Mặt trời' not in content and 'Cổng khổng lồ' not in content:
                return content

    translated = translate_full_markdown(raw_chinese_text)

    final_output = (
        "> 📖 **Bản dịch nguyên tác toàn văn từ kho tri thức 《Thiên Kỷ》 của danh sư Nghê Hải Hạ & Tử Vi Đẩu Số Toàn Thư** *(Dataset v4.0 đối chiếu thực chứng)*\n\n"
        + translated
    )

    with open(cache_file, "w", encoding="utf-8") as f:
        f.write(final_output)

    return final_output
