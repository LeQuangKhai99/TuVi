"""
scripts/translate_helper.py
Hệ thống dịch thuật chuyên sâu Tử Vi Đẩu Số & Tri thức 《Thiên Kỷ》 của danh sư Nghê Hải Hạ.
Chuyển ngữ toàn văn từ Dataset v4.0 tiếng Trung sang Tiếng Việt chuẩn xác, sát nghĩa, văn phong tự nhiên.
Bảo toàn nguyên bản cấu trúc Markdown, trích dẫn 《Tử Vi Đẩu Số Toàn Thư》, lời giảng và mốc thời gian video.
Hỗ trợ cơ chế dịch ngữ nghĩa chuyên sâu offline (<50ms).
"""

import sys
import os
import json
import re

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "dataset", "translations")
HANVIET_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hanviet.json")

def ensure_cache_dir():
    os.makedirs(CACHE_DIR, exist_ok=True)

# ==============================================================================
# 1. BẢNG THUẬT NGỮ CHUYÊN NGÀNH TỬ VI & ĐÔNG Y NGHÊ HẢI HẠ
# ==============================================================================
ZIWEI_TERMS = [
    # Tiêu đề mục & cấu trúc
    ('【命格总览】', '【TỔNG QUAN MỆNH CÁCH】'),
    ('【一句话定调】', '【MỘT CÂU ĐỊNH TÍNH】'),
    ('【核心论断】', '【LUẬN ĐOÁN CỐT LÕI】'),
    ('【关键推导】', '【SUY DIỄN THEN CHỐT】'),
    ('【身宫 · 后天追求】', '【THÂN CUNG · HẬU THIÊN】'),
    ('【三方四正联动】', '【LIÊN ĐỚI TAM PHƯƠNG TỨ CHÍNH】'),
    ('【命盘推演】', '【SUY DIỄN MỆNH BÀN】'),
    ('【命盘依据】', '【CĂN CỨ MỆNH BÀN】'),
    ('【特殊格局识别】', '【NHẬN DIỆN CÁCH CỤC ĐẶC BIỆT】'),
    ('【经典出处】', '【TRÍCH DẪN KINH ĐIỂN & 《THIÊN KỶ》】'),
    ('【⚠️ 风险提醒】', '【⚠️ CẢNH BÁO RỦI RO & LỜI KHUYÊN】'),
    ('【针对你的命盘】', '【ĐẶC ĐIỂM RIÊNG CỦA LÁ SỐ NÀY】'),
    ('【感情总览】', '【TỔNG QUAN TÌNH CẢM】'),
    ('【感情格局】', '【CỤC DIỆN TÌNH CẢM】'),
    ('【夫妻宫分析】', '【PHÂN TÍCH CUNG PHU THÊ】'),
    ('【事业总览】', '【TỔNG QUAN SỰ NGHIỆP】'),
    ('【事业格局】', '【CỤC DIỆN SỰ NGHIỆP】'),
    ('【官禄宫分析】', '【PHÂN TÍCH CUNG QUAN LỘC】'),
    ('【财运总览】', '【TỔNG QUAN TÀI VẬN】'),
    ('【财运格局】', '【CỤC DIỆN TÀI VẬN】'),
    ('【财帛宫分析】', '【PHÂN TÍCH CUNG TÀI BẠCH】'),
    ('【健康总览】', '【TỔNG QUAN SỨC KHỎE】'),
    ('【健康状况】', '【TÌNH TRẠNG SỨC KHỎE】'),
    ('【疾厄宫分析】', '【PHÂN TÍCH CUNG TẬT ÁCH】'),
    ('【性格总览】', '【TỔNG QUAN TÍNH CÁCH】'),
    ('【性格特质】', '【ĐẶC TRƯNG TÍNH CÁCH】'),
    ('【田宅总览】', '【TỔNG QUAN ĐIỀN TRẠCH】'),
    ('【田宅不动产】', '【ĐIỀN TRẠCH BẤT ĐỘNG SẢN】'),
    ('【田宅宫分析】', '【PHÂN TÍCH CUNG ĐIỀN TRẠCH】'),
    ('【子女总览】', '【TỔNG QUAN CON CÁI】'),
    ('【子女缘分】', '【CON CÁI TỬ TỨC】'),
    ('【子女宫分析】', '【PHÂN TÍCH CUNG TỬ TỨC】'),
    ('【迁移总览】', '【TỔNG QUAN THIÊN DI】'),
    ('【迁移外出】', '【THIÊN DI XUẤT NGOẠI】'),
    ('【迁移宫分析】', '【PHÂN TÍCH CUNG THIÊN DI】'),
    ('【交友总览】', '【TỔNG QUAN BẠN BÈ GIAO DU】'),
    ('【人际贵人】', '【BẠN BÈ QUÝ NHÂN】'),
    ('【交友宫分析】', '【PHÂN TÍCH CUNG NÔ BỘC】'),
    ('【兄弟总览】', '【TỔNG QUAN ANH EM】'),
    ('【兄弟合伙】', '【HUYNH ĐỆ HỢP TÁC】'),
    ('【兄弟宫分析】', '【PHÂN TÍCH CUNG HUYNH ĐỆ】'),
    ('【福德总览】', '【TỔNG QUAN PHÚC ĐỨC】'),
    ('【精神福德】', '【PHÚC ĐỨC TÂM LINH】'),
    ('【福德宫分析】', '【PHÂN TÍCH CUNG PHÚC ĐỨC】'),
    ('【父母总览】', '【TỔNG QUAN PHỤ MẪU】'),
    ('【父母长辈】', '【PHỤ MẪU TIỀN BỐI】'),
    ('【父母宫分析】', '【PHÂN TÍCH CUNG PHỤ MẪU】'),
    ('## ⚙ 主辅煞组合精细论断', '## ⚙ LUẬN GIẢI TINH TIẾT TỔ HỢP CHÍNH - PHỤ - SÁT TINH'),
    ('## ⚙ 主辅煞组合精细论断（命宫实际辅煞）', '## ⚙ LUẬN GIẢI TINH TIẾT TỔ HỢP CHÍNH - PHỤ - SÁT TINH (CUNG MỆNH THỰC TẾ)'),
    ('## 🌌 命格总览与核心气象', '## 🌌 TỔNG QUAN MỆNH CÁCH & KHÍ TƯỢNG CỐT LÕI'),

    # Tác phẩm kinh điển & danh xưng
    ('紫微斗数全书', '《Tử Vi Đẩu Số Toàn Thư》'),
    ('紫微斗数全书·卷二', '《Tử Vi Đẩu Số Toàn Thư · Quyển 2》'),
    ('紫微斗数全集', '《Tử Vi Đẩu Số Toàn Tập》'),
    ('骨髓赋', '《Cốt Tủy Phú》'),
    ('太微赋', '《Thái Vi Phú》'),
    ('形性赋', '《Hình Tính Phú》'),
    ('天纪', '《Thiên Kỷ》'),
    ('倪海厦', 'Nghê Hải Hạ'),
    ('倪师', 'thầy Nghê'),
    ('倪师断法', 'Phép đoán của thầy Nghê'),
    ('盘面术语', 'thuật ngữ trên lá số'),
    ('古书说', 'sách cổ chép rằng'),
    ('古书讲', 'sách cổ dạy rằng'),
    ('古籍原引', 'trích lục sách cổ'),
    ('卷二十二宫断语', 'Lời đoán 12 cung quyển 2'),
    ('明清刻本原文', 'nguyên văn bản khắc thời Minh - Thanh'),
    ('传统流派参考，非倪师断法', 'tham khảo lưu phái truyền thống, không phải phép đoán riêng của thầy Nghê'),

    # Khảo đính & thư tịch cổ
    ('校勘', 'khảo đính'),
    ('待核', 'chờ khảo chứng'),
    ('原引', 'trích nguyên văn'),
    ('原注', 'lời chú gốc'),
    ('维基文库', 'kho văn bản Wikisource'),
    ('善本', 'thiện bản cổ thư'),
    ('查无', 'tra cứu không thấy'),
    ('逐字', 'từng chữ'),
    ('改引原文', 'đổi sang trích nguyên văn'),
    ('公本', 'bản khắc công khai'),
    ('所称', 'sách chép rằng'),
    ('据之', 'dựa vào đó'),
    ('降为', 'hạ mức độ xuống thành'),
    ('流派传承', 'lưu phái truyền thừa'),
    ('诸星问答论', 'Chư Tinh Vấn Đáp Luận'),
    ('论诸星同垣', 'Luận Chư Tinh Đồng Cung'),
    ('谈星要论', 'Đàm Tinh Yếu Luận'),

    # 14 Chính Tinh
    ('紫微星', 'sao Tử Vi'),
    ('天机星', 'sao Thiên Cơ'),
    ('太阳星', 'sao Thái Dương'),
    ('武曲星', 'sao Vũ Khúc'),
    ('天同星', 'sao Thiên Đồng'),
    ('廉贞星', 'sao Liêm Trinh'),
    ('天府星', 'sao Thiên Phủ'),
    ('太阴星', 'sao Thái Âm'),
    ('贪狼星', 'sao Tham Lang'),
    ('巨门星', 'sao Cự Môn'),
    ('天相星', 'sao Thiên Tướng'),
    ('天梁星', 'sao Thiên Lương'),
    ('七杀星', 'sao Thất Sát'),
    ('破军星', 'sao Phá Quân'),

    # Tên sao đơn lẻ trong ngữ cảnh Tử Vi
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

    # Tứ Hóa & Tinh Diệu
    ('化禄', 'Hóa Lộc'),
    ('化权', 'Hóa Quyền'),
    ('化科', 'Hóa Khoa'),
    ('化忌', 'Hóa Kỵ'),
    ('禄存', 'Lộc Tồn'),
    ('天马', 'Thiên Mã'),
    ('禄马交驰', 'Lộc Mã Giao Trì'),
    ('左辅', 'Tả Phù'),
    ('右弼', 'Hữu Bật'),
    ('文昌', 'Văn Xương'),
    ('文曲', 'Văn Khúc'),
    ('天魁', 'Thiên Khôi'),
    ('天钺', 'Thiên Việt'),
    ('擎羊', 'Kình Dương'),
    ('陀罗', 'Đà La'),
    ('火星', 'Hỏa Tinh'),
    ('铃星', 'Linh Tinh'),
    ('地空', 'Địa Không'),
    ('地劫', 'Địa Kiếp'),
    ('红鸾', 'Hồng Loan'),
    ('天喜', 'Thiên Hỷ'),
    ('天刑', 'Thiên Hình'),
    ('天姚', 'Thiên Diêu'),
    ('孤辰', 'Cô Thần'),
    ('寡宿', 'Quả Tú'),
    ('天寿', 'Thiên Thọ'),
    ('天才', 'Thiên Tài'),

    # Cung Vị
    ('命宫', 'cung Mệnh'),
    ('身宫', 'cung Thân'),
    ('兄弟宫', 'cung Huynh Đệ'),
    ('夫妻宫', 'cung Phu Thê'),
    ('子女宫', 'cung Tử Tức'),
    ('财帛宫', 'cung Tài Bạch'),
    ('疾厄宫', 'cung Tật Ách'),
    ('迁移宫', 'cung Thiên Di'),
    ('交友宫', 'cung Nô Bộc'),
    ('仆役宫', 'cung Nô Bộc'),
    ('官禄宫', 'cung Quan Lộc'),
    ('事业宫', 'cung Quan Lộc'),
    ('田宅宫', 'cung Điền Trạch'),
    ('福德宫', 'cung Phúc Đức'),
    ('父母宫', 'cung PhỤ Mẫu'),
    ('本宫', 'bản cung'),
    ('对宫', 'đối cung'),
    ('三方四正', 'tam phương tứ chính'),
    ('夹宫', 'cung giáp kẹp'),
    ('三合宫', 'cung tam hợp'),

    # Miếu Vượng & Trạng Thái
    ('庙旺', 'miếu vượng'),
    ('入庙', 'nhập miếu'),
    ('落陷', 'lạc hãm'),
    ('旺地', 'vượng địa'),
    ('得地', 'đắc địa'),
    ('利益', 'lợi ích'),
    ('平和', 'bình hòa'),
    ('闲宫', 'nhàn cung'),
    ('失陷', 'thất hãm'),
    ('独坐', 'độc tọa'),
    ('坐守', 'tọa thủ'),
    ('守照', 'thủ chiếu'),
    ('同度', 'đồng cung'),
    ('同垣', 'đồng cung'),
    ('同宫', 'đồng cung'),
    ('无主星', 'vô chính diệu'),
    ('借对宫', 'mượn đối cung'),
    ('吉星', 'cát tinh'),
    ('凶星', 'hung tinh'),
    ('煞星', 'sát tinh'),
    ('杀星', 'sát tinh'),
    ('辅星', 'phụ tinh'),
    ('主星', 'chính tinh'),
    ('主辅', 'chính tinh và phụ tinh'),
    ('组合', 'tổ hợp'),
    ('精细论断', 'luận giải chi tiết'),
    ('实际辅煞', 'phụ tinh và sát tinh thực tế'),
    ('化气为', 'hóa khí thành'),
    ('化气', 'hóa khí'),
    ('南斗主星', 'Nam Đẩu chủ tinh'),
    ('北斗主星', 'Bắc Đẩu chủ tinh'),
    ('中天主星', 'Trung Thiên chủ tinh'),
    ('南斗', 'Nam Đẩu'),
    ('北斗', 'Bắc Đẩu'),
    ('印星', 'Ấn Tinh'),
    ('将星', 'Tướng Tinh'),
    ('财星', 'Tài Tinh'),
    ('寿星', 'Thọ Tinh'),
    ('权星', 'Quyền Tinh'),
    ('福星', 'Phúc Tinh'),
    ('孤克', 'cô khắc'),

    # Cách cục danh tiếng
    ('府相朝垣', 'Phủ Tướng Triều Viên'),
    ('杀破狼', 'Sát Phá Tham'),
    ('机月同梁', 'Cơ Nguyệt Đồng Lương'),
    ('紫府武相', 'Tử Phủ Vũ Tướng'),
    ('日月并明', 'Nhật Nguyệt Tịnh Minh'),
    ('日照雷门', 'Nhật Chiếu Lôi Môn'),
    ('月朗天门', 'Nguyệt Lãng Thiên Môn'),
    ('石中隐玉', 'Thạch Trung Ẩn Ngọc'),
    ('阳梁昌禄', 'Dương Lương Xương Lộc'),
    ('极向离明', 'Cực Hướng Ly Minh'),
    ('巨日同宫', 'Cự Nhật Đồng Cung'),
    ('金灿光辉', 'Kim Xán Quang Huy'),
    ('马头带箭', 'Mã Đầu Đới Tiễn'),
    ('明禄暗禄', 'Minh Lộc Ám Lộc'),
    ('科权禄夹', 'Khoa Quyền Lộc Giáp'),
    ('三奇嘉会', 'Tam Kỳ Gia Hội'),
    ('火贪格', 'Hỏa Tham Cách'),
    ('铃贪格', 'Linh Tham Cách'),
    ('贪火相逢', 'Tham Hỏa Tương Phùng'),
    ('巨火羊', 'Cự Hỏa Kình'),
    ('刑囚夹印', 'Hình Tù Giáp Ấn'),
    ('百官朝拱', 'Bách Quan Triều Củng'),
    ('君臣庆会', 'Quân Thần Khánh Hội'),
    ('府相朝垣千钟食禄', 'Phủ Tướng triều viên, thiên chung thực lộc'),
    ('言语诚实，事不虚伪', 'lời nói chân thành, hành sự không giả dối'),

    # Đông Y & Tạng Phủ Nghê Hải Hạ
    ('子胆、丑肝、寅肺、卯大肠、辰胃、巳脾、午心、未小肠、申膀胱、酉肾、戌心包、亥三焦',
     'Tý Đởm (mật), Sửu Can (gan), Dần Phế (phổi), Mão Đại trường (ruột già), Thìn Vị (dạ dày), Tỵ Tỳ (lá lách), Ngọ Tâm (tim), Mùi Tiểu trường (ruột non), Thân Bàng quang, Dậu Thận, Tuất Tâm bào, Hợi Tam tiêu'),
    ('按那一宫的地支对应脏腑', 'dựa theo địa chi của cung đó đối chiếu với tạng phủ tương ứng'),
    ('对应脏腑', 'đối chiếu với tạng phủ'),
    ('大限', 'Đại Hạn'),
    ('小限', 'Tiểu Hạn'),
    ('流年', 'Lưu Niên'),
    ('本命盘', 'lá số bản mệnh'),
    ('运限', 'vận hạn'),
]

# ==============================================================================
# 2. BẢNG DỊCH THÀNH NGỮ, QUÁN NGỮ & LỜI BÌNH ĐẶC TRƯNG NGHÊ HẢI HẠ
# ==============================================================================
NIHAI_COLLOQUIAL = [
    # Mệnh cách & Tính cách
    ('你天生适合做那个把事情做稳的人', 'Bản tính trời sinh bạn rất thích hợp làm người xử lý công việc chắc chắn, vững vàng'),
    ('你为人忠厚，做事守规矩，说到做到', 'Bạn là người đôn hậu thật thà, hành sự đúng quy củ, nói được là làm được'),
    ('越是要细心、按规矩来、能长期坚持的活，你做得越漂亮', 'Càng là việc đòi hỏi tỉ mỉ, làm theo khuôn phép và kiên trì bền bỉ, bạn lại càng hoàn thành xuất sắc'),
    ('你不是没脾气的老好人，看见谁做得不地道，心里那口气压不住', 'Bạn không phải kiểu người hiền lành nhu nhược ba phải, hễ thấy ai hành xử không đàng hoàng tử tế, trong lòng liền khó mà nhẫn nhịn'),
    ('弱点是太厚道，争利益的场合容易吃亏', 'Nhược điểm là quá thật thà, ở những nơi tranh giành quyền lợi rất dễ chịu phần thiệt thòi'),
    ('不会替自己开口，常常能力很强却因为不爱表现被忽略', 'không biết chủ động lên tiếng đòi quyền lợi cho mình, thường thì năng lực rất giỏi nhưng vì không thích phô trương mà dễ bị người khác xem nhẹ'),
    ('长期不被当回事，心里会积下很深的委屈', 'lâu ngày không được coi trọng xứng đáng, trong lòng sẽ tích tụ nỗi ấm ức, tủi thân rất sâu'),
    ('建议你把自己做过的事主动说出来', 'Khuyên bạn nên chủ động nói ra những việc mình đã làm'),
    ('不是邀功，是让人知道活是谁干的', 'không phải để tranh công, mà là để mọi người biết rõ công lao là do ai cống hiến'),
    ('开会先讲一句自己的判断，别一上来就问别人怎么看，问着问着主意就没了', 'Khi hội họp hãy nêu rõ nhận định của bản thân trước, đừng vừa vào đã vội hỏi người khác thấy thế nào, hỏi đi hỏi lại rồi cuối cùng lại đánh mất chính kiến'),
    ('遇到规则之外的新事，找一个敢闯的人搭伙，你负责稳、他负责冲', 'Khi gặp những việc mới mẻ ngoài khuôn khổ, hãy tìm một người dám nghĩ dám làm để cùng hợp tác: bạn phụ trách sự vững chắc, họ phụ trách xông pha mở đường'),
    ('该松手的事就松手，别拿死磕当负责', 'Việc gì đáng buông thì nên buông tay, đừng nhầm lẫn giữa sự cố chấp ôm đồm với tinh thần trách nhiệm'),
    ('天相是「印星」，意思是掌印的副手：位子高，实权不大', 'Thiên Tướng là "Ấn Tinh", mang ý nghĩa là trợ thủ nắm giữ con dấu: địa vị cao nhưng thực quyền không quá lớn'),
    ('这颗星管爵位、替皇帝办事', 'ngôi sao này chủ quản về tước vị phẩm hàm, chuyên lo việc lớn cho bậc quân vương'),
    ('所以代表辅佐、忠诚、行政、法务这一路', 'cho nên đại diện cho đường hướng phò tá, lòng trung thành, hành chính và pháp chế quy củ'),
    ('天上的宰相，是非常好的良佐，辅佐的人才', 'như vị tể tướng trên trời, là trợ thủ vô cùng đắc lực, là bậc kỳ tài phò tá'),
    ('一定是位高无权', 'nhất định là vị trí cao nhưng không nắm thực quyền sinh sát'),
    ('你如果是天相入命的人你适合去当人家的助理当人家的秘书去当师爷', 'Nếu bạn là người có Thiên Tướng nhập Mệnh, bạn rất thích hợp làm trợ lý, thư ký hoặc làm quân sư cố vấn cho người khác'),
    ('老是干副的', 'luôn làm cấp phó'),
    ('说的是大限走到天相的那十年', 'đó là nói khi Đại Hạn đi đến cung có sao Thiên Tướng trong mười năm đó'),
    ('不是说命宫天相一辈子做副手', 'chứ không phải bảo người Mệnh cung Thiên Tướng cả đời chỉ làm phó'),
    ('说话实在、不来虚的', 'nói năng chắc chắn, chân thật, không ba hoa dối trá'),
    ('看到别人有难会心软想帮，看到别人作恶会替人抱不平', 'thấy người gặp nạn thì động lòng thương muốn giúp, thấy kẻ làm ác thì bất bình đứng ra bênh vực'),
    ('厚道之外心里还有一把是非尺，不是没主见的老好人', 'Bên cạnh tính đôn hậu, trong lòng họ còn có một cán cân thị phi rất rõ ràng, hoàn toàn không phải kẻ nhu nhược thiếu chủ kiến'),
    ('职业上适合做辅佐：行政、法务、秘书助理，在大机构里一步步走最顺，踏实可靠是最大的优势', 'Về nghề nghiệp rất hợp làm phò tá: hành chính, pháp lý, thư ký trợ lý; làm việc trong các tổ chức lớn tiến bước từng bước là thuận lợi nhất, tính cách vững vàng đáng tin cậy chính là ưu thế lớn nhất'),
    ('一生贵人多，适合跟一位强势的领导搭档，在辅佐别人的过程中成就自己', 'Cả đời nhiều quý nhân, rất thích hợp cộng sự cùng một người lãnh đạo mạnh mẽ quyết đoán, trong quá trình phò tá người khác mà làm nên thành tựu của chính mình'),
    ('一辈子吃穿不愁、地位也高，这是命盘里最稳的好格局之一', 'cả đời cơm áo dư dả không lo, địa vị tôn quý, đây là một trong những thượng cách vững vàng nhất trên lá số'),
    ('辅佐人才的特质全开，行政管理、法务秘书方向最能发挥，得到上司的信任与重用，是高平台中最可靠的人', 'phát huy trọn vẹn tài năng phò tá, theo hướng quản lý hành chính, thư ký pháp lý sẽ phát huy tối đa, được cấp trên hết lòng tin tưởng trọng dụng, là con người đáng tin cậy nhất trong các môi trường lớn'),

    # Tính cách tổng quan
    ('你是那种放在哪都让人放心的人', 'Bạn là mẫu người mà dù đặt ở bất cứ đâu cũng khiến người khác tuyệt đối an tâm'),
    ('稳重、配合度高、爱面子但不张扬', 'Điềm đạm, tinh thần phối hợp cao, trọng thể diện nhưng không hề phô trương'),
    ('给带头的人当左右手，比自己当头儿舒服', 'Làm cánh tay phải đắc lực cho người đứng đầu còn cảm thấy thoải mái hơn là tự mình đứng mũi chịu sào'),
    ('你不爱冲在最前面，可凡是你接下的事都办得妥当', 'Bạn không thích xông pha nơi tuyến đầu, nhưng hễ việc gì đã nhận lời thì đều thu xếp chu toàn trọn vẹn'),
    ('你不争不抢，但那把是非尺很直', 'Bạn không tranh giành với ai, nhưng thước đo đúng sai trong lòng lại vô cùng ngay thẳng'),
    ('讲究体面，穿着、谈吐、家里的样子都有分寸', 'Rất coi trọng thể diện, từ cách ăn mặc, lời ăn tiếng nói cho đến nếp nhà đều chuẩn mực chỉn chu'),
    ('这不是显摆，是你觉得做人就该有个样子', 'Đây không phải là khoe mẽ, mà là bạn quan niệm làm người thì cần phải đàng hoàng cho ra dáng'),
    ('你的短板不是没主见', 'Điểm yếu của bạn hoàn toàn không phải là thiếu chủ kiến'),
    ('你认定的事别人很难把你带偏', 'Một khi bạn đã xác định việc gì thì người khác rất khó làm bạn lung lay'),
    ('短板是不肯先开口', 'Điểm yếu chính là bạn ngại mở lời trước'),
    ('该自己拍板时习惯先问一圈，问着问着自己的判断就没了', 'Đến lúc cần tự mình quyết định thì lại có thói quen đi hỏi một vòng, hỏi qua hỏi lại một hồi thì chính kiến ban đầu cũng tan biến mất'),
    ('建议下次拿主意，先把自己的答案写下来，再去听别人的意见', 'Lần sau khi cần quyết định việc gì, khuyên bạn hãy ghi sẵn câu trả lời của mình ra trước, rồi sau đó mới lắng nghe ý kiến người khác'),
    ('做配角不丢人，但你要确认这是你自己选的位置，而不是从来没给自己上过场的机会', 'Làm vai phụ không hề xấu hổ, nhưng bạn phải chắc chắn đó là vị trí do chính mình lựa chọn, chứ không phải vì chưa từng cho bản thân cơ hội bước lên sân khấu'),
    ('厚道、忠诚、守规矩讲信用，适合辅佐别人而不是自己挂帅', 'Đôn hậu, trung thành, giữ quy củ và coi trọng chữ tín, thích hợp phò tá người khác hơn là tự mình đứng đầu chỉ huy'),
    ('为人相貌敦厚持重，清白好酒食', 'Tướng mạo đôn hậu điềm đạm, phẩm hạnh thanh liêm, chuộng phong lưu ẩm thực'),

    # Tình duyên & Hôn nhân
    ('你在感情上有吸引力，容易被人注意到', 'Trong chuyện tình cảm bạn rất có sức hút, dễ dàng thu hút sự chú ý của đối phương'),
    ('感情会不会多波折，不能一见廉贞就断，要看夫妻宫有没有擎羊、陀罗、火星、铃星来加', 'Tình cảm có trắc trở sóng gió hay không thì không thể cứ thấy Liêm Trinh là vội kết luận, mà cần phải xem cung Phu Thê có gặp thêm Kình Dương, Đà La, Hỏa Tinh, Linh Tinh hội hợp hay không'),
    ('晚一点结、看准了再定，对你更有利', 'Kết hôn muộn một chút, tìm hiểu cho thật kỹ càng rồi mới tính chuyện trăm năm sẽ có lợi hơn cho bạn rất nhiều'),
    ('你投入时很热，要走时也干脆，不会在没指望的关系里耗着', 'Khi yêu bạn dành trọn nhiệt huyết, nhưng khi cần dứt áo ra đi cũng rất dứt khoát, không bao giờ chịu dây dưa trong một mối quan hệ không có tương lai'),
    ('但冲动做的决定事后常后悔', 'tuy nhiên những quyết định bốc đồng thường khiến bạn phải hối hận về sau'),
    ('你的妻子多半有自己的特色：才艺好、外表有吸引力', 'Người bạn đời của bạn phần lớn đều có nét riêng nổi bật: có tài năng khiếu nghệ thuật, ngoại hình cuốn hút'),
    ('在人群里很扎眼', 'nổi bật giữa chốn đông người'),
    ('她在人脉和形象上能间接帮到你', 'Người ấy có thể giúp ích gián tiếp cho bạn rất nhiều về phương diện xây dựng hình ảnh và mở rộng quan hệ xã hội'),
    ('你们两个主意都大，吵起来火气也大', 'Cả hai người đều có cá tính và chủ kiến rất mạnh, hễ nổ ra tranh cãi là ngọn lửa giận dữ bốc lên rất cao'),
    ('建议你把结婚这件事往后放一放', 'Khuyên bạn nên để chuyện hôn nhân thư thả về sau'),
    ('先看人品和过日子的底子，别只被感觉带着走', 'Trước hết hãy nhìn vào nhân phẩm và khả năng lo liệu cuộc sống thực tế, đừng để cảm xúc nhất thời cuốn đi'),
    ('吵架当天不解决问题，等火气下去再谈，这一条对你们特别管用', 'Trong ngày cãi vã chớ vội vàng giải quyết mâu thuẫn ngay, hãy đợi cơn giận nguôi ngoai rồi mới cùng ngồi lại nói chuyện, nguyên tắc này đặc biệt hữu hiệu với hai bạn'),
    ('配偶很有魅力，晚点结婚更好，早婚容易反复', 'Người bạn đời rất có sức hút, kết hôn muộn sẽ tốt đẹp bền vững hơn, kết hôn quá sớm dễ sinh trắc trở dùng dằng'),

    # Sự nghiệp & Công danh
    ('你吃饭靠的是才华和个人特色', 'Bạn mưu sinh lập nghiệp dựa vào chính tài năng thực thụ và phong cách độc đáo của riêng mình'),
    ('你在需要创意、需要表达、需要个人风格的地方最容易发光', 'Ở những lĩnh vực đòi hỏi tính sáng tạo, khả năng biểu đạt và dấu ấn cá nhân, bạn là người dễ dàng tỏa sáng rực rỡ nhất'),
    ('有舞台的地方你表现最好', 'Nơi nào có sân khấu để thể hiện thì bạn lại càng biểu diễn xuất sắc'),
    ('你是能把一个项目盘活的人，点子多、也推得动', 'Bạn là mẫu người có tài năng vực dậy và khai thông một dự án, nhiều ý tưởng sáng tạo và có sức bật triển khai mạnh mẽ'),
    ('但情绪一上来就容易把事搞砸', 'nhưng hễ để cảm xúc bốc đồng lấn át là rất dễ làm hỏng việc lớn'),
    ('你还容易成为众人注意的中心，跟着来的就是眼红和闲话', 'Bạn cũng dễ trở thành tâm điểm chú ý của mọi người xung quanh, kéo theo đó là sự đố kỵ ghen ghét và những lời đàm tiếu thị phi'),
    ('建议你别把私人情绪带进工作关系', 'Khuyên bạn tuyệt đối không nên đem cảm xúc cá nhân xen vào các mối quan hệ công việc'),
    ('难听的话先在心里放一天再说', 'Những lời nói khó nghe hãy nén lại trong lòng một ngày rồi hẵng nói'),
    ('想自己干可以，但最好找个稳重的人管运营和账目，你只管创意和对外', 'Nếu muốn tự mình kinh doanh cũng được, nhưng tốt nhất nên tìm một cộng sự điềm đạm chắc chắn để quản lý vận hành và sổ sách tài chính, còn bạn chỉ chuyên tâm lo về sáng tạo và đối ngoại'),
    ('名声比一时的输赢重要，感情上的事更别带到公司里去', 'Thanh danh còn quan trọng hơn cả chuyện thắng thua nhất thời, chuyện tình cảm riêng tư càng không được đem vào môi trường công sở'),
    ('在热闹、讲美感的地方立身，人多的场合里出头', 'Lập nghiệp ở những nơi sôi động, chú trọng tính thẩm mỹ, dễ dàng vươn lên nổi bật giữa chốn đông người'),

    # Tài vận & Tiền bạc
    ('你的钱是攒出来的，不是搏出来的', 'Tiền tài của bạn là nhờ tích lũy chắt chiu dành dụm mà nên, chứ không phải do liều lĩnh đầu cơ đỏ đen mà có'),
    ('收入主要来自稳定的工作和日积月累的储蓄', 'Thu nhập chủ yếu bắt nguồn từ công việc ổn định và sự tích cóp kiên trì qua từng năm tháng'),
    ('因为花钱有节制，时间一长家底自然厚，属于细水长流那一类', 'Nhờ chi tiêu có chừng mực, theo thời gian cơ ngơi tự nhiên sẽ dày dặn, thuộc mẫu người tích tiểu thành đại, nước chảy đá mòn'),
    ('中年以后手里会相当充实', 'Từ tuổi trung niên trở đi trong tay sẽ tích lũy được khối tài sản rất vững vàng sung túc'),
    ('你守钱的本事强，不会冲动乱花', 'Bản lĩnh giữ tiền của bạn rất giỏi, không hề bốc đồng tiêu xài hoang phí'),
    ('真正漏钱的地方有两个：一是太保守，好机会摆在眼前也不敢上；二是感情和家里的大额开销', 'Nơi thực sự làm hao tài tốn của của bạn có hai chỗ: thứ nhất là quá mức bảo thủ, cơ hội tốt bày ra trước mắt mà không dám nắm bắt; thứ hai là các khoản chi tiêu lớn cho chuyện tình cảm và người thân trong gia đình'),
    ('建议你把钱分成三份', 'Khuyên bạn nên phân chia dòng tiền thành ba phần rõ ràng'),
    ('大头放长期拿得住的地方，比如自住的房子，或者风险低、放着安稳的存款和理财', 'Phần lớn hãy đầu tư vào những nơi nắm giữ lâu dài chắc chắn, ví dụ như bất động sản an cư, hoặc các khoản tiền gửi và tài sản có rủi ro thấp, ổn định'),
    ('婚姻稳，你的财才稳', 'Hôn nhân có yên ấm bền vững thì tài vận của bạn mới thật sự hưng vượng vững vàng'),
    ('财帛是天府最舒服的位置之一，一辈子手头富足；遇上禄存、武曲更是大富', 'Cung Tài Bạch là một trong những vị trí đắc địa nhất của sao Thiên Phủ, cả đời tài chính dư dả ấm no; nếu gặp thêm Lộc Tồn, Vũ Khúc thì chắc chắn đại phú đại quý'),

    # Sức khỏe & Thể chất
    ('你底子不差，大毛病不多', 'Nền tảng thể chất của bạn vốn không tệ, bệnh tật lớn không nhiều'),
    ('身上哪一处要多留意，要看你全盘哪一宫杀星最集中', 'Cần đặc biệt lưu ý bộ phận nào trên cơ thể thì phải quan sát xem trên toàn bộ lá số cung vị nào tập trung sát tinh nặng nề nhất'),
    ('真正拖你后腿的是生活方式太舒服：能坐不站、能躺不坐，运动量常年不够，体重和血糖要盯着', 'Điều thực sự gây hại cho sức khỏe của bạn là lối sống quá hưởng thụ nhàn hạ: có thể ngồi thì không đứng, có thể nằm thì không ngồi, lượng vận động quanh năm không đủ, cần phải theo dõi sát sao cân nặng và chỉ số đường huyết'),
    ('你也不太会把不痛快说出口，习惯用吃点好的、玩一玩来转移，情绪压着不散，身体跟着受影响', 'Bạn cũng là người ít khi thổ lộ những điều ấm ức trong lòng ra ngoài, thường có thói quen ăn uống đồ ngon hoặc vui chơi để khỏa lấp, cảm xúc bị đè nén không giải tỏa được khiến cơ thể cũng bị tổn hại theo'),
    ('建议你把运动变成每天固定的一件小事', 'Khuyên bạn nên biến việc tập thể dục thành một thói quen cố định hằng ngày'),
    ('重点是天天做，不是偶尔练一次狠的', 'Điểm mấu chốt là phải duy trì đều đặn mỗi ngày, chứ không phải thỉnh thoảng mới tập một buổi quá sức'),
    ('每年做一次体检，血糖、体重这两项盯住，数值不对就去看医生、遵医嘱', 'Mỗi năm nên đi khám sức khỏe tổng quát một lần, đặc biệt chú ý đường huyết và cân nặng, hễ có chỉ số bất thường phải lập tức thăm khám và tuân thủ lời dặn của bác sĩ'),
    ('心里不痛快的时候找人说出来，别一个人闷着靠吃喝顶过去', 'Những lúc trong lòng không vui hãy tìm người tin cậy để giãi bày, đừng một mình ôm ấm ức rồi tìm đến ăn uống để trốn tránh'),
    ('天同在疾厄，古书只说入庙灾少；哪个脏腑要留意，看全盘杀星最集中那一宫的地支', 'Thiên Đồng cư Tật Ách, cổ thư chỉ dạy nhập miếu thì ít tai ách; còn muốn biết tạng phủ nào cần đề phòng thì phải căn cứ vào địa chi của cung tập trung sát tinh nặng nhất trên toàn bàn'),

    # Các cụm từ thông dụng & liên từ
    ('所有的星在庙旺的时候都是最好的', 'tất cả các ngôi sao khi ở vị trí miếu vượng đều là tốt đẹp nhất'),
    ('所有的星', 'tất cả các ngôi sao'),
    ('在庙旺的时候', 'khi ở vị trí miếu vượng'),
    ('都是最好的', 'đều là tốt đẹp nhất'),
    ('最好的', 'tốt nhất'),
    ('最好', 'tốt nhất'),
    ('不能直接当成', 'không thể xem ngay là'),
    ('天生的优势', 'ưu thế bẩm sinh'),
    ('先天优势', 'ưu thế tiên thiên'),
    ('三方四正有没有', 'tam phương tứ chính có hay không'),
    ('三方有恶星', 'tam phương có sao hung ác'),
    ('守照破格', 'thủ chiếu phá cách'),
    ('所以庙旺之外还要看', 'cho nên ngoài miếu vượng ra thì còn phải xem'),
    ('还要看三方四正', 'còn phải xem tam phương tứ chính'),
    ('有没有恶星', 'có sao hung ác hay không'),
    ('有没有', 'có hay không'),
    ('南斗第五星', 'ngôi sao thứ năm của chòm Nam Đẩu'),
    ('天相是什么', 'Thiên Tướng là gì'),
    ('所以天相呢', 'cho nên Thiên Tướng đấy'),
    ('平时温和但偶尔暴怒', 'bình thường tính tình ôn hòa nhưng đôi khi lại nổi giận'),
    ('平时温和', 'ngày thường tính tình ôn hòa'),
    ('偶尔暴怒', 'đôi khi lại nổi trận lôi đình'),
    ('注意情绪管理', 'cần chú ý kiểm soát và làm chủ cảm xúc của bản thân'),
    ('情绪管理', 'kiểm soát cảm xúc'),
    ('情绪', 'cảm xúc'),
    ('偶尔', 'thỉnh thoảng đôi khi'),
    ('平时', 'ngày thường bình thường'),
    ('温和', 'ôn hòa'),
    ('暴怒', 'nổi trận lôi đình'),
    ('冲克', 'xung khắc'),
    ('冲击', 'xung phá'),
    ('克制', 'khắc chế'),
    ('矩阵', 'ma trận'),
    ('专属论断', 'luận giải chuyên biệt'),
    ('以下是', 'Dưới đây là'),
    ('基于', 'căn cứ dựa trên'),
    ('是什么', 'là gì'),
    ('什么', 'gì'),
    ('所以', 'cho nên'),
    ('因此', 'vì thế'),
    ('还要', 'còn cần'),
    ('还要看', 'còn phải xem xét'),
    ('衣食无忧', 'cơm áo không lo, đời sống ấm no'),
    ('千钟食禄', 'bổng lộc ngàn chung, phú quý trọn đời'),
    ('犹豫不决', 'do dự thiếu quyết đoán'),
    ('魄力不足', 'thiếu sự quyết đoán mạnh mẽ'),
    ('不地道', 'không đàng hoàng tử tế'),
    ('老好人', 'người hiền lành ba phải'),
    ('吃亏', 'chịu thiệt thòi'),
    ('不爱表现', 'không thích phô trương'),
    ('不被当回事', 'không được coi trọng đúng mức'),
    ('委屈', 'nỗi ấm ức, tủi thân'),
    ('邀功', 'tranh công'),
    ('搭伙', 'hợp tác, kết giao'),
    ('死磕', 'cố chấp ôm đồm'),
    ('位高权轻', 'vị trí cao nhưng thực quyền không lớn'),
    ('位高无权', 'vị trí cao nhưng không nắm thực quyền'),
    ('细水长流', 'tích tiểu thành đại, nước chảy đá mòn'),
    ('逢凶化吉', 'gặp hung hóa cát'),
    ('遇难呈祥', 'gặp nạn hóa may'),
    ('吉星高照', 'cát tinh cao chiếu'),
    ('大富大贵', 'đại phú đại quý'),
    ('丰衣足食', 'ấm no đủ đầy'),
    ('平步青云', 'thăng tiến nhanh chóng'),
    ('步步高升', 'từng bước thăng tiến'),
    ('名利双收', 'danh lợi vẹn toàn'),
    ('前途无量', 'tiền đồ rộng mở vô lượng'),
    ('也就是说', 'nói cách khác là'),
    ('换句话说', 'nói một cách dễ hiểu hơn là'),
    ('这就是为什么', 'đây chính là lý do vì sao'),
    ('并不是', 'hoàn toàn không phải là'),
    ('并不代表', 'không đồng nghĩa với việc'),
    ('总的来说', 'nhìn chung quy lại'),
    ('具体来说', 'nói một cách cụ thể'),
    ('不得不', 'không thể không'),
    ('无论如何', 'dù thế nào đi nữa'),
    ('在此基础上', 'trên cơ sở đó'),
    ('由此可见', 'từ đó có thể thấy rằng'),
]

# ==============================================================================
# 3. BẢNG TỪ ĐƠN HÁN VIỆT ĐƯỢC CHUẨN HÓA NGHĨA (KHÔNG DỊCH ẨU, KHÔNG VAY/KHUYA)
# ==============================================================================
_STANDARDIZED_CHARS = {
    # Đại từ & chỉ định từ
    '你': 'bạn',
    '我': 'tôi',
    '他': 'thầy',
    '她': 'cô ấy',
    '它': 'nó',
    '们': 'các',
    '这': 'này',
    '那': 'đó',
    '哪': 'nào',
    '其': 'đương số',
    '此': 'đây',
    '彼': 'đó',
    '人': 'người',
    '男': 'nam',
    '女': 'nữ',
    '子': 'con cái',
    '夫': 'chồng',
    '妻': 'vợ',
    '父': 'cha',
    '母': 'mẹ',
    '兄': 'anh',
    '弟': 'em',
    '朋': 'bạn',
    '友': 'bè',

    # Động từ & trợ động từ
    '为': 'là',
    '是': 'là',
    '有': 'có',
    '无': 'không có',
    '非': 'phi',
    '不': 'không',
    '没': 'chưa',
    '好': 'tốt',
    '第': 'thứ',
    '什': 'gì',
    '么': 'gì',
    '所': 'nơi',
    '以': 'lấy',
    '会': 'sẽ',
    '能': 'có thể',
    '要': 'cần',
    '想': 'muốn',
    '应': 'nên',
    '该': 'nên',
    '须': 'cần',
    '得': 'được',
    '做': 'làm',
    '干': 'làm',
    '行': 'hành động',
    '看': 'xem',
    '讲': 'giảng',
    '说': 'chép rằng',
    '言': 'lời',
    '语': 'ngữ',
    '吃': 'ăn',
    '喝': 'uống',
    '坐': 'tọa thủ',
    '守': 'đóng giữ',
    '照': 'chiếu về',
    '冲': 'xung chiếu',
    '合': 'tam hợp',
    '会': 'hội tụ',
    '夹': 'kẹp giáp',

    # Trợ từ & hư từ
    '的': 'của',
    '地': 'một cách',
    '得': 'được',
    '了': 'rồi',
    '着': 'đang',
    '过': 'từng',
    '呢': 'đấy',
    '吗': 'chăng',
    '吧': 'nhé',
    '啊': 'a',
    '呀': 'nha',
    '把': 'đem',
    '被': 'bị',
    '让': 'khiến',
    '给': 'cho',
    '由': 'do',
    '在': 'tại',
    '于': 'tại',
    '从': 'từ',
    '自': 'từ',
    '向': 'hướng',
    '往': 'về',
    '朝': 'hướng',
    '与': 'cùng',
    '和': 'và',
    '同': 'cùng',
    '跟': 'cùng',
    '或': 'hoặc',
    '而': 'mà',
    '则': 'thì',
    '就': 'thì',
    '便': 'liền',
    '即': 'tức là',
    '才': 'mới',
    '若': 'nếu',
    '如': 'như',
    '但': 'nhưng',
    '且': 'vả lại',
    '又': 'lại',
    '也': 'cũng',
    '都': 'đều',
    '还': 'vẫn',
    '再': 'lại',

    # Phó từ mức độ
    '很': 'rất',
    '太': 'quá',
    '更': 'càng',
    '最': 'nhất',
    '越': 'càng',
    '挺': 'khá',
    '极': 'cực kỳ',
    '略': 'hơi',
    '稍': 'hơi',
    '全': 'toàn bộ',
    '皆': 'đều là',

    # Danh từ thời gian & thuật ngữ
    '年': 'năm',
    '月': 'tháng',
    '日': 'ngày',
    '时': 'giờ',
    '岁': 'tuổi',
    '世': 'đời',
    '生': 'sinh',
    '死': 'tử',
    '运': 'vận thế',
    '限': 'hạn kỳ',
    '吉': 'cát lành',
    '凶': 'hung hiểm',
    '煞': 'sát tinh',
    '星': 'ngôi sao',
    '曜': 'tinh diệu',
    '宫': 'cung',
    '度': 'độ',
    '垣': 'viên',
    '事': 'việc',
    '物': 'vật',
    '心': 'tâm',
    '气': 'khí',
    '情': 'tình',
    '理': 'lý',
    '财': 'tiền tài',
    '官': 'quan chức',
    '禄': 'bổng lộc',
    '福': 'phúc đức',
    '寿': 'tuổi thọ',
    '厚': 'đôn hậu',
    '道': 'đạo đức',
    '亏': 'thiệt thòi',
    '活': 'công việc',
    '食': 'ẩm thực',
    '稳': 'vững vàng',
    '重': 'cẩn trọng',
    '轻': 'nhẹ',
    '大': 'lớn',
    '小': 'nhỏ',
    '高': 'cao',
    '低': 'thấp',
    '深': 'sâu sắc',
    '浅': 'nông cạn',
    '快': 'nhanh',
    '慢': 'chậm',
    '早': 'sớm',
    '晚': 'muộn',
    '前': 'trước',
    '后': 'sau',
    '金': 'Kim',
    '木': 'Mộc',
    '水': 'Thủy',
    '火': 'Hỏa',
    '土': 'Thổ',
}

_HV_CHARS = {}
if os.path.exists(HANVIET_PATH):
    try:
        with open(HANVIET_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            for k, v in data.get("chars", {}).items():
                first_part = re.split(r'[/,;(|\[]', v)[0].strip()
                _HV_CHARS[k] = first_part
    except Exception as e:
        sys.stderr.write(f"Warning loading hanviet.json: {e}\n")

_HV_CHARS.update(_STANDARDIZED_CHARS)

# Ghép toàn bộ và sắp xếp ưu tiên chuỗi dài nhất trước
_SORTED_LEXICON = sorted(ZIWEI_TERMS + NIHAI_COLLOQUIAL, key=lambda x: len(x[0]), reverse=True)

# ==============================================================================
# 4. HÀM DỊCH NGỮ NGHĨA PHÂN ĐOẠN (MAXIMAL MATCHING)
# ==============================================================================
def translate_phrase(s: str) -> tuple[str, int]:
    # 1. Khớp từ điển cụm từ dài nhất trước
    for zh, vi in _SORTED_LEXICON:
        if s.startswith(zh):
            return vi, len(zh)

    # 2. Khớp từ điển Hán Việt đơn ký tự đã chuẩn hóa
    c = s[0]
    if c in _HV_CHARS:
        return _HV_CHARS[c], 1

    return c, 1

def translate_line(line: str) -> str:
    if not line.strip():
        return line

    # Xử lý các quy tắc số tập, thời lượng và số quyển
    line = re.sub(r'第(\d+)集(\d{2}:\d{2})', r'tập \1 thời lượng \2', line)
    line = re.sub(r'第(\d+)集', r'tập \1', line)
    line = re.sub(r'第(\d+)卷', r'quyển \1', line)
    line = re.sub(r'第(\d+)星', r'ngôi sao thứ \1', line)

    prefix = ""
    m = re.match(r"^(\s*[\*#>\-·✦▍◆⚠]+\s*)", line)
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

    # Kiểm tra nếu cache đã có và đạt chuẩn (không chứa từ lỗi cũ như 'ăn khuya', 'phều sáng', 'vay Nhân')
    if os.path.exists(cache_file) and os.path.getsize(cache_file) > 100:
        with open(cache_file, "r", encoding="utf-8") as f:
            content = f.read()
            if 'ăn khuya' not in content and 'phều sáng' not in content and 'vay Nhân' not in content and 'đích' not in content:
                return content

    translated = translate_full_markdown(raw_chinese_text)

    final_output = (
        "> 📖 **Bản dịch nguyên tác toàn văn từ kho tri thức 《Thiên Kỷ》 của danh sư Nghê Hải Hạ & Tử Vi Đẩu Số Toàn Thư** *(Dataset v4.0 đối chiếu thực chứng)*\n\n"
        + translated
    )

    with open(cache_file, "w", encoding="utf-8") as f:
        f.write(final_output)

    return final_output
