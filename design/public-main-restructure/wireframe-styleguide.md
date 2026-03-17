# Tái tổ chức `main` theo nguyên tắc “một khung nhìn – một thông điệp rõ ràng”

## 1) Kiểm kê thành phần hiện có và mức độ quan trọng

| Nhóm thành phần hiện tại | Ví dụ cụ thể | Mức độ | Vấn đề hiện tại | Quyết định |
|---|---|---|---|---|
| Hero thông điệp chính | H1 + mô tả + CTA | Rất cao | Đúng trọng tâm nhưng cạnh tranh với nhiều card cùng lúc | Giữ, tinh gọn |
| Khối “Lối vào nhanh” bên phải | 3 bước + 2 CTA | Rất cao | Trùng nội dung với block “3 thao tác” phía dưới | Gộp thành 1 khối duy nhất |
| Khối “3 thao tác cần mở ngay” | 3 card hành động | Cao | Trùng semantics với “Lối vào nhanh” | Gộp, chỉ giữ 1 phiên bản |
| Dãy số liệu 24/7, 100+, 63 | 3 mini stat cards | Trung bình | Chiếm diện tích vùng đầu, làm nhiễu thông điệp chính | Chuyển xuống dưới fold |
| “Capabilities” 4 card | Theo dõi, yêu cầu, điều phối, quy trình | Cao | Hợp lý nhưng đang lên quá sớm | Đưa xuống section 2 |
| “Tài nguyên công khai” + 3 scenario card | Giải thích vai trò public site | Trung bình | Nội dung dài, dày chữ | Chuyển thành expandable section |
| Icon trang trí/gradient phụ | blur circles, glass effects | Thấp | Nhiều lớp thị giác, giảm độ rõ | Giảm cường độ |

## 2) Nhóm lại thành block chức năng (mỗi block 1 chủ đề)

### Block A — Above-the-fold: “Hành động ngay”
- Thông điệp duy nhất: **“Khi khẩn cấp, bạn cần làm gì ngay bây giờ”**
- Thành phần:
  1. Eyebrow ngắn (ngữ cảnh)
  2. H1 (1 câu rõ ràng)
  3. 1 đoạn mô tả ngắn
  4. Primary CTA: Gửi yêu cầu cứu hộ
  5. Secondary CTA: Mở hướng dẫn
  6. Checklist 3 bước tóm tắt

### Block B — Khả năng hệ thống
- Thông điệp duy nhất: **“Hệ thống hỗ trợ bạn như thế nào”**
- 4 năng lực cốt lõi theo card gọn, mô tả 1 dòng.

### Block C — Tài nguyên mở rộng (Expandable)
- Thông điệp duy nhất: **“Tài nguyên bổ sung trước khi đăng nhập”**
- Dùng `details/summary` để ẩn mặc định trên first view.

## 3) Visual hierarchy áp dụng

- Cấp 1: H1 44–56px, weight 800, line-height ~1.08.
- Cấp 2: H2 28–36px, weight 800.
- Cấp 3: Title card 18–22px, weight 700–800.
- Body chính: 16–18px, line-height 1.7.
- Body phụ: 14–15px, line-height 1.7.
- CTA:
  - Primary: nền đậm, tương phản cao, luôn đứng trước.
  - Secondary: outline/chip, trọng số thấp hơn.
- Khoảng cách:
  - Section gap: 56–80px.
  - Block inner: 24–40px.
  - Item gap: 12–20px.

## 4) Giới hạn 5–7 phần tử ở vùng nhìn đầu tiên

Trong first viewport chỉ giữ tối đa 6 điểm nhấn:
1. Eyebrow
2. H1
3. Mô tả ngắn
4. Primary CTA
5. Secondary CTA
6. Checklist 3 bước

Các nội dung khác chuyển xuống sau fold hoặc vào expandable section.

## 5) Quy tắc khoảng trắng tối thiểu 30%

- Mục tiêu bố cục: nội dung chiếm ~65–70%, khoảng trắng ~30–35%.
- Cách đạt:
  - Giới hạn chiều rộng text chính tối đa 60–68 ký tự.
  - Dùng grid 12 cột, hero content chỉ dùng 7–8 cột desktop.
  - Tăng `padding` card và giảm số card xuất hiện đồng thời ở first view.

## 6) Kiểm tra responsive (375 / 768 / 1440)

| Breakpoint | Trạng thái layout mong muốn | Kết quả kiểm tra prototype |
|---|---|---|
| 375px | 1 cột, CTA xếp dọc, checklist full width | Đạt |
| 768px | 1 cột rộng, card năng lực 2 cột | Đạt |
| 1440px | Hero 2 cột (nội dung + checklist), section rõ khoảng trắng | Đạt |

Không ghi nhận tràn ngang hoặc dồn nén nội dung trong prototype tĩnh.

## 7) Wireframe annotate (textual)

```text
[A] HERO ACTION FRAME (Above-the-fold)
 ├─ [A1] Eyebrow: "Ứng phó khẩn cấp mùa mưa lũ"
 ├─ [A2] H1: "3 bước rõ ràng để nhận hỗ trợ ngay"
 ├─ [A3] Mô tả 1 đoạn ngắn
 ├─ [A4] CTA Primary: "Gửi yêu cầu cứu hộ"
 ├─ [A5] CTA Secondary: "Mở hướng dẫn khẩn cấp"
 └─ [A6] Checklist 3 bước (01/02/03)

[B] SYSTEM CAPABILITIES
 ├─ [B1] Theo dõi thời gian thực
 ├─ [B2] Yêu cầu cứu hộ tức thì
 ├─ [B3] Điều phối cứu trợ
 └─ [B4] Quy trình rõ ràng

[C] EXPANDABLE PUBLIC RESOURCES
 ├─ [C1] Summary: "Xem thêm tài nguyên công khai"
 └─ [C2] Nội dung scenario + link liên quan
```

## Style guide rút gọn

- Font:
  - Heading: `Inter`, `system-ui`, sans-serif
  - Body: `Inter`, `system-ui`, sans-serif
- Màu:
  - Primary: `#2563EB`
  - Primary hover: `#1D4ED8`
  - Accent cyan: `#0891B2`
  - Background: `#EEF6FF`
  - Surface: `#FFFFFF`
  - Text main: `#0F172A`
  - Text secondary: `#475569`
- Spacing scale:
  - 8, 12, 16, 24, 32, 40, 56, 72
- Radius:
  - Button 14–18
  - Card 20–28
- Shadow:
  - Primary CTA: `0 16px 30px rgba(37,99,235,0.28)`
  - Surface card: `0 8px 24px rgba(15,23,42,0.08)`

## Bản giao stakeholder review

- Prototype tĩnh: `design/public-main-restructure/prototype.html`
- Tài liệu wireframe + style guide: file hiện tại
- Trạng thái: **sẵn sàng review trước khi triển khai code production**
