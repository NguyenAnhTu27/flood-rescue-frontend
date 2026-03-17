# Tasks
- [x] Task 1: Audit toàn bộ trang hiện có theo chuẩn Home và lập baseline sai khác.
  - [x] SubTask 1.1: Lập danh sách route cần audit theo từng nhóm vai trò.
  - [x] SubTask 1.2: Đối chiếu token, component, layout, interaction, responsive của từng trang.
  - [x] SubTask 1.3: Gán mức ưu tiên sai khác và xác định phạm vi refactor theo đợt.

- [x] Task 2: Chuẩn hóa nền tảng design system dùng chung.
  - [x] SubTask 2.1: Chuẩn hóa token màu, typography, spacing, radius, shadow, transition.
  - [x] SubTask 2.2: Chuẩn hóa shared layout và shared component theo style Home.
  - [x] SubTask 2.3: Loại bỏ/giảm style cục bộ lệch chuẩn ở lớp hạ tầng.

- [x] Task 3: Refactor UI/UX nhóm trang public và auth theo chuẩn mới.
  - [x] SubTask 3.1: Đồng nhất cấu trúc thông tin, hierarchy, CTA và spacing.
  - [x] SubTask 3.2: Đồng nhất states tương tác (hover/focus/active/disabled/loading).
  - [x] SubTask 3.3: Kiểm tra lại navigation, footer/header, và nội dung static liên quan.

- [x] Task 4: Refactor UI/UX nhóm trang nghiệp vụ theo vai trò (citizen/coordinator/rescuer/manager/admin).
  - [x] SubTask 4.1: Ưu tiên màn dashboard, danh sách, form và chi tiết nghiệp vụ.
  - [x] SubTask 4.2: Chuẩn hóa table, form controls, badge, card, modal, empty/error states.
  - [x] SubTask 4.3: Đảm bảo nhất quán cross-role khi chuyển ngữ cảnh sử dụng.

- [x] Task 5: Thiết lập và chạy visual regression testing đa breakpoint, đa trình duyệt.
  - [x] SubTask 5.1: Tạo baseline screenshot cho 375/768/1440.
  - [x] SubTask 5.2: Chạy regression trên các trình duyệt chính và ghi nhận diff.
  - [x] SubTask 5.3: Fix toàn bộ diff vượt ngưỡng và cập nhật baseline hợp lệ.

- [x] Task 6: Tổng hợp kết quả, rà soát checklist, và bàn giao cho stakeholder.
  - [x] SubTask 6.1: Cập nhật trạng thái hoàn thành theo checklist.
  - [x] SubTask 6.2: Xuất báo cáo trước/sau refactor và phạm vi đã chuẩn hóa.
  - [x] SubTask 6.3: Chốt danh sách tồn đọng (nếu có) cho vòng tiếp theo.

# Task Dependencies
- Task 2 depends on Task 1.
- Task 3 depends on Task 2.
- Task 4 depends on Task 2.
- Task 5 depends on Task 3 and Task 4.
- Task 6 depends on Task 5.
