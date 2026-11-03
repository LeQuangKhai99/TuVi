<div align="center">

# Tử Vi Đẩu Số · Động Cơ An Sao & Luận Giải Mã Nguồn Mở

### Thuật toán là trí tuệ truyền thống công khai, không nên bị giam giữ trong những bức tường đóng kín

[![License: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](./LICENSE)
[![Dataset: CC BY 4.0](https://img.shields.io/badge/dataset-CC%20BY%204.0-green.svg)](./DATASET-LICENSE)

**Tiếng Việt** · [English](./README.en.md)

</div>

---

### I. Triết Lý Dự Án

Tử Vi Đẩu Số là viên ngọc quý của thuật số truyền thống Á Đông. Danh sư **Nghê Hải Hạ (倪海厦)** trong hệ thống giáo trình **《Thiên Kỷ》** đã đúc kết và hệ thống hóa phương pháp luận Tử Vi chính tông: xem mệnh bàn như một tấm bản đồ chỉ dẫn để thấu hiểu bản thân, lấy phương châm *"Nhất Mệnh, Nhị Vận, Tam Phong Thủy, Tứ Tích Đức, Ngũ Độc Thư"* làm gốc rễ tu thân và đối đãi nhân thế.

Dự án này mở mã nguồn toàn bộ thuật toán an sao, lập lá số và kho tri thức cách cục vì một niềm tin: **Thuật toán là tài sản trí tuệ chung của nhân loại, không nên bị biến thành hàng rào thương mại khép kín.**

Phiên bản này đã được **Việt hóa toàn diện 100%**, đồng thời tích hợp sẵn hệ thống **API Luận Giải Thời Gian Thực** (Server-Sent Events) hoạt động offline nội bộ, hỗ trợ kết nối linh hoạt với các mô hình AI tiên tiến (DeepSeek, OpenAI...).

---

### II. Thông Tin Dự Án & Các Tính Năng Nổi Bật

* **Việt hóa toàn diện:** Tên 14 chính tinh, phụ tinh, 12 cung chức, ngũ hành cục, thiên can, địa chi, tứ hóa (Lộc, Quyền, Khoa, Kỵ), 7 cấp miếu hãm và hệ thống đại hạn - lưu niên.
* **Tích hợp sẵn 2 API Route:**
  * `/api/interpret`: Luận giải lá số chi tiết theo thời gian thực (Mệnh cách, Tình duyên, Sự nghiệp, Tài vận, Sức khỏe).
  * `/api/heming`: Phân tích hợp bàn tử vi 2 người (đối chiếu hôn nhân, tính cách, trợ lực công việc).
* **Hoạt động 100% Cục Bộ (Offline):** Tự động luận giải theo hệ phái Nghê Hải Hạ mà không bắt buộc phải có API Key bên ngoài.
* **Hỗ trợ kết nối AI ngoài (Tùy chọn):** Dễ dàng gắn thêm key của DeepSeek hoặc OpenAI qua file `.env.local` để sinh văn phong đàm thoại tương tác trực tiếp.
* **Đầy đủ dữ liệu cổ tịch & tri thức:**
  * **1.848 câu khẩu quyết nguyên văn** của thầy Nghê Hải Hạ trích xuất từ 16 bài giảng video gốc kèm timestamp (`docs/tianji-ziwei/`).
  * Toàn văn kinh điển: **Cốt Tủy Phú** (`gusuifu.ts`), **Tử Vi Đẩu Số Toàn Thư** (`quanshu.ts`), **Tử Vi Đẩu Số Toàn Tập** (`quanji.ts`).
  * Hơn **1.100 dòng quy tắc nhận diện đại cách cục** (`patterns.ts`).

---

### III. Khởi Động Nhanh

#### 1. Yêu cầu môi trường
* Node.js phiên bản 18+ (khuyên dùng Node.js 22 LTS).
* Git.

#### 2. Cài đặt & Khởi chạy

```bash
# Clone kho lưu trữ
git clone git@github.com:LeQuangKhai99/TuVi.git
cd TuVi

# Cài đặt thư viện phụ thuộc
npm install

# Khởi chạy máy chủ phát triển
npm run dev
```

Mở trình duyệt truy cập: **`http://localhost:3000`**

#### 3. Các file chạy nhanh bằng 1-Click (Dành cho Windows):
* **`chay-web.bat`**: Khởi chạy phiên bản Production tối ưu hóa (`npm run start`).
* **`chay-dev.bat`**: Khởi chạy phiên bản Development (`npm run dev`).
* **`day-len-github.bat`**: Đẩy các cập nhật mới nhất lên GitHub qua SSH.

#### 4. Kiểm tra mã nguồn & Kiểm thử hồi quy
```bash
npm run typecheck   # Kiểm tra kiểu dữ liệu TypeScript (0 lỗi)
npm test            # Chạy toàn bộ 16 bài kiểm thử thuật toán an sao (768 lá số mẫu, chân thái dương thời, nhuận tháng...)
```

---

### IV. Cấu Hình AI Luận Giải (Tùy Chọn)

Hệ thống đã có sẵn bộ sinh luận giải offline. Nếu bạn muốn sử dụng thêm các mô hình AI trực tuyến thông minh (như DeepSeek hoặc OpenAI), hãy mở file `.env.local`:

```env
# 1. Sử dụng DeepSeek (Khuyên dùng cho văn phong Á Đông và chi phí rất tiết kiệm):
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=your-deepseek-api-key

# 2. Hoặc sử dụng OpenAI:
# OPENAI_API_KEY=your-openai-api-key

# 3. Địa chỉ trang web:
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

### V. Cấu Trúc Mã Nguồn

| Thư mục / Tệp tin | Chức năng |
|-------------------|-----------|
| `lib/ziwei/algorithm.ts` | Thuật toán an sao cốt lõi: An Mệnh, định Cục, 14 Chính Tinh, Phụ Tinh, Lưu Niên, Đại Hạn |
| `lib/ziwei/i18n.ts` | Bộ từ điển chuyển ngữ tiếng Việt hoàn chỉnh cho toàn bộ hệ thống Tử Vi |
| `lib/ziwei/patterns.ts` | 1.100+ dòng nhận diện cách cục: Tử Phủ đồng cung, Sát Phá Tham, Cơ Nguyệt Đồng Lương... |
| `lib/ziwei/sihua.ts` | Hệ thống Tứ Hóa phi tinh (Lộc, Quyền, Khoa, Kỵ) theo can năm, đại hạn và lưu niên |
| `lib/ziwei/true-solar-time.ts` | Hiệu chỉnh Chân Thái Dương Thời (kinh độ địa lý + phương trình thời gian) |
| `lib/ziwei/cities.ts` | Tọa độ kinh độ - vĩ độ các tỉnh thành (đã bổ sung các thành phố lớn tại Việt Nam) |
| `lib/classics/` | Toàn văn các bộ cổ tịch kinh điển: Cốt Tủy Phú, Toàn Tập, Toàn Thư |
| `docs/tianji-ziwei/` | 1.848 câu khẩu quyết thực chứng của danh sư Nghê Hải Hạ trong 《Thiên Kỷ》 |
| `app/api/interpret/route.ts` | Backend API luận giải lá số đa chiều thời gian thực (Server-Sent Events) |
| `app/api/heming/route.ts` | Backend API đối chiếu hợp bàn tử vi hai người |
| `components/` | Các thành phần giao diện: Bàn cờ lá số (ChartBoard), ô cung vị (PalaceCell), bảng luận giải (InsightPanel)... |

---

### VI. Bộ Dữ Liệu Huấn Luyện Mở

Trong phần Releases của dự án gốc, cộng đồng cung cấp sẵn 2 bộ dữ liệu đồ sộ phục vụ nghiên cứu và tinh chỉnh (fine-tune) mô hình AI:
* **Bộ dữ liệu v4.0 (2026):** Gồm 674.976 lá số × 13 chiều luận giải = 8.774.688 đoạn văn bản, tổng dung lượng sau giải nén ~56.6 GB.
* **Bộ dữ liệu v3.0:** Gồm 518.400 lá số chuẩn hoá cho nghiên cứu so sánh A/B và RAG.

---

### VII. Giấy Phép & Bản Quyền

* **Mã nguồn phần mềm:** Phát hành theo giấy phép tự do [MIT License](./LICENSE). Bạn có thể tự do sử dụng, chỉnh sửa và ứng dụng vào mục đích thương mại.
* **Bộ dữ liệu:** Phát hành theo giấy phép [CC BY 4.0](./DATASET-LICENSE) (yêu cầu ghi nhận nguồn).
* **Cổ tịch:** Thuộc phạm vi công cộng (Public Domain).
* **Khẩu quyết bài giảng Nghê Hải Hạ (`docs/tianji-ziwei/`):** Phát hành theo giấy phép phi thương mại [CC BY-NC-SA 4.0](./docs/tianji-ziwei/LICENSE.md).

---

<div align="center">
  Phát triển và duy trì bởi cộng đồng yêu thích Tử Vi Đẩu Số chính tông.
</div>
