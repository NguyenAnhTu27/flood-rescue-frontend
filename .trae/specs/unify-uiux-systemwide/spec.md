# Spec đồng nhất UI/UX toàn hệ thống theo chuẩn Home

## Why
Hiện tại giao diện giữa các trang còn lệch nhau về component, typography, spacing, màu và hành vi tương tác, gây cảm giác rời rạc và tăng chi phí bảo trì. Cần chuẩn hóa toàn bộ theo design system đã áp dụng ở trang Home để đảm bảo trải nghiệm nhất quán, dễ mở rộng và dễ kiểm thử.

## What Changes
- Audit toàn bộ trang hiện có, lập baseline sai khác UI/UX so với chuẩn Home.
- Chuẩn hóa design tokens (màu, font, spacing, radius, shadow, transition) và quy ước sử dụng.
- Refactor layout và component dùng chung để tái sử dụng nhất quán.
- Refactor từng nhóm trang theo vai trò (public, auth, citizen, coordinator, rescuer, manager, admin) theo checklist sai khác.
- Chuẩn hóa interaction pattern (hover/focus/active/disabled/loading/empty/error).
- Thiết lập visual regression testing cho breakpoints 375/768/1440 và trình duyệt chính.
- **BREAKING**: Một số class cũ và style local không theo design system sẽ bị thay thế hoặc loại bỏ.

## Impact
- Affected specs: Public Experience, Authentication Experience, Role-based Dashboards, Design Tokens, Shared Components, QA/Testing Standards.
- Affected code: `src/layouts/*`, `src/pages/**/*`, `src/shared/components/**/*`, `src/shared/styles/**/*`, `src/app/routes/**/*`, cấu hình test/preview liên quan đến visual regression.

## ADDED Requirements
### Requirement: Audit UI/UX toàn hệ thống
Hệ thống SHALL có báo cáo audit định lượng mức độ lệch thiết kế của tất cả trang so với chuẩn Home.

#### Scenario: Audit đầy đủ
- **WHEN** chạy quy trình audit UI trên toàn bộ route hợp lệ
- **THEN** sinh danh sách sai khác theo từng trang, từng hạng mục (token, component, layout, interaction)
- **AND** mỗi sai khác có mức ưu tiên (critical/high/medium/low) và đề xuất refactor

### Requirement: Design system chuẩn hóa theo Home
Hệ thống SHALL cung cấp bộ quy chuẩn thiết kế thống nhất có thể tái sử dụng cho mọi trang.

#### Scenario: Áp dụng token thống nhất
- **WHEN** trang sử dụng màu, typography, spacing, radius, shadow, transition
- **THEN** các giá trị phải lấy từ token chuẩn đã định nghĩa
- **AND** không dùng giá trị tùy tiện ngoài quy chuẩn nếu không có ngoại lệ được phê duyệt

### Requirement: Visual regression đa breakpoint và trình duyệt
Hệ thống SHALL tự động kiểm tra độ đồng nhất giao diện bằng ảnh chụp chuẩn trên các breakpoint và trình duyệt chính.

#### Scenario: Regression pass
- **WHEN** chạy bộ visual regression sau mỗi đợt refactor
- **THEN** kết quả phải so sánh với baseline theo ngưỡng cho phép
- **AND** các sai lệch vượt ngưỡng phải được ghi nhận và chặn merge

## MODIFIED Requirements
### Requirement: Quy tắc xây dựng page/layout/component
Tất cả page/layout/component hiện có SHALL tuân thủ một ngôn ngữ thiết kế thống nhất theo chuẩn Home, bao gồm cấu trúc thị giác, nhịp khoảng trắng, ngữ nghĩa tiêu đề, trạng thái tương tác và hành vi responsive.

#### Scenario: Trang bất kỳ hiển thị nhất quán
- **WHEN** người dùng chuyển giữa các trang trong hệ thống
- **THEN** cảm nhận thị giác và pattern tương tác phải đồng nhất
- **AND** không xuất hiện component “lệch hệ” về style hoặc behavior

### Requirement: Responsive behavior
Tất cả trang SHALL đạt tiêu chuẩn hiển thị ổn định tại 375px, 768px, 1440px.

#### Scenario: Không tràn, không dồn nén
- **WHEN** kiểm tra trên từng breakpoint mục tiêu
- **THEN** không có tràn ngang, chồng lớp bất thường hoặc giảm khả dụng thao tác

## REMOVED Requirements
### Requirement: Styling cục bộ không theo chuẩn
**Reason**: Các style phân tán theo từng trang làm tăng lệch UI và khó bảo trì.
**Migration**: Di chuyển dần sang token + shared component chuẩn; thay thế class/style cũ bằng pattern thống nhất theo từng đợt refactor.
