# Kế hoạch triển khai đồng nhất UI/UX toàn hệ thống theo Tinh Thần Cứu Hộ

## 1) Mục tiêu triển khai
- Đồng nhất toàn bộ giao diện theo design system của Home, nhưng không “đánh bóng” hình thức quá mức gây giảm khả năng thao tác trong ngữ cảnh khẩn cấp.
- Đảm bảo mọi quyết định UX/UI phục vụ 3 nguyên tắc cốt lõi của Tinh Thần Cứu Hộ:
  - Rõ ràng khi áp lực cao.
  - Hành động nhanh với số thao tác tối thiểu.
  - Tin cậy và an toàn cho người dùng trong tình huống khẩn cấp.
- Duy trì chất lượng kỹ thuật: tái sử dụng, dễ bảo trì, hiệu năng ổn định, responsive chuẩn.

## 2) Phạm vi và đầu vào
- Sử dụng trực tiếp đặc tả đã duyệt trong:
  - `.trae/specs/unify-uiux-systemwide/spec.md`
  - `.trae/specs/unify-uiux-systemwide/tasks.md`
  - `.trae/specs/unify-uiux-systemwide/checklist.md`
  - `.trae/specs/unify-uiux-systemwide/audit-report.md`
- Triển khai trên các nhóm: public, auth, citizen, coordinator, rescuer, manager, admin, và layouts/shared components liên quan.

## 3) Nguyên tắc thiết kế bắt buộc (định nghĩa “phù hợp Tinh Thần Cứu Hộ”)
- Ưu tiên hierarchy: thông tin sống còn luôn ở lớp đầu (trạng thái, cảnh báo, CTA chính).
- Mỗi khung nhìn chỉ mang 1 thông điệp chính; nội dung phụ đưa xuống dưới hoặc theo mô hình mở rộng.
- CTA khẩn cấp phải có tương phản cao, vị trí ổn định, nhãn hành động rõ nghĩa.
- Trạng thái lỗi/rỗng/tải phải “hướng dẫn hành động tiếp theo”, không chỉ hiển thị mô tả lỗi.
- Tối ưu khả dụng:
  - Touch target đủ lớn.
  - Focus state rõ trên bàn phím.
  - Không dùng hiệu ứng gây phân tán ở màn hình nghiệp vụ.
- Hiệu năng thị giác:
  - Giảm hiệu ứng không cần thiết ở trang có mật độ thao tác cao.
  - Tránh layout shift khi dữ liệu tải.

## 4) Lộ trình thực thi theo pha

### Pha A — Chuẩn hóa nền tảng thiết kế (Foundation)
1. Chốt token chuẩn: màu, typography, spacing, radius, shadow, transition.
2. Chuẩn hóa lớp shared styles và utility pattern để tránh hardcode tùy biến theo trang.
3. Chuẩn hóa các shared component lõi: button, input, select, textarea, card, badge, modal, table shell, empty/error/loading block.
4. Chuẩn hóa layout frame: header/footer/content container, khoảng cách section, nhịp dọc.
5. Kiểm tra không phá vỡ route hiện có.

### Pha B — Refactor Public + Auth (vùng ảnh hưởng cao với người dùng)
1. Đồng nhất cấu trúc thông điệp, hierarchy và spacing theo baseline Home.
2. Đồng bộ interaction pattern (hover/focus/active/disabled/loading).
3. Chuẩn hóa header/footer/navigation/static content mapping sau các rename route gần đây.
4. Kiểm tra hành trình chính: truy cập thông tin công khai → đăng nhập/đăng ký → điều hướng tiếp.

### Pha C — Refactor khối nghiệp vụ theo vai trò
1. Ưu tiên dashboard/list/form/detail của từng role theo thứ tự ảnh hưởng vận hành:
   - Citizen → Coordinator → Rescuer → Manager → Admin.
2. Với mỗi role:
   - Chuẩn hóa page shell + component set.
   - Chuẩn hóa trạng thái thao tác và phản hồi hệ thống.
   - Giảm sai khác thị giác giữa các trang cùng role.
3. Đảm bảo cross-role chuyển ngữ cảnh vẫn nhất quán về interaction.

### Pha D — QA trực quan và kỹ thuật
1. Thiết lập baseline visual cho 3 breakpoint: 375 / 768 / 1440.
2. Chạy visual regression trên các trình duyệt chính (ít nhất: Chromium-based + Firefox).
3. Phân loại diff:
   - Chấp nhận được (intentional) → cập nhật baseline có kiểm soát.
   - Không chấp nhận được → fix UI và chạy lại.
4. Chạy kiểm tra kỹ thuật bắt buộc:
   - Build production.
   - Diagnostics/lint theo khả năng hiện có của repo.

### Pha E — Bàn giao và chốt chất lượng
1. Cập nhật `tasks.md` (tick từng task/subtask hoàn thành).
2. Cập nhật `checklist.md` (tick từng checkpoint đạt).
3. Xuất báo cáo trước/sau:
   - Phạm vi đã chuẩn hóa.
   - Diff quan trọng còn tồn.
   - Đề xuất vòng cải tiến tiếp theo.

## 5) Chiến lược triển khai an toàn
- Thực hiện theo lô nhỏ, mỗi lô có xác minh ngay để giảm rủi ro regression diện rộng.
- Không rollback thay đổi hợp lệ hiện có của người dùng.
- Với route/link nhạy cảm (đặc biệt trang công khai), luôn giữ backward compatibility khi cần.
- Khi phát hiện phụ thuộc backend chưa rõ, sẽ cô lập lỗi bằng fallback UX rõ ràng trước, rồi mới mở rộng.

## 6) Tiêu chí hoàn thành (Definition of Done)
- Toàn bộ task trong `tasks.md` được đánh dấu hoàn thành.
- Toàn bộ checkpoint trong `checklist.md` được đánh dấu đạt.
- Build chạy thành công, không có lỗi diagnostics mới phát sinh do refactor.
- Visual regression không còn diff vượt ngưỡng chấp nhận.
- UX/UI toàn hệ thống thể hiện rõ Tinh Thần Cứu Hộ: rõ ràng, hành động nhanh, tin cậy.

## 7) Thứ tự bắt đầu ngay khi được duyệt
1. Đồng bộ trạng thái task/checklist với thực tế hiện tại (audit đã có).
2. Triển khai Pha A (foundation) trước.
3. Triển khai song song có kiểm soát Pha B và từng nhánh của Pha C.
4. Chạy Pha D, sau đó khóa bằng Pha E.
