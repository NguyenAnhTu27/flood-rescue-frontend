# Báo cáo bàn giao trước/sau refactor UI/UX

## 1) Phạm vi triển khai đã hoàn tất
- Chuẩn hóa foundation design system ở lớp dùng chung:
  - Bổ sung `ui-field`, `ui-surface`, `ui-section-title`, `ui-section-subtitle` trong `src/shared/styles/tailwind.css`.
  - Áp dụng đồng bộ cho form controls toàn cục (`input/select/textarea`).
- Chuẩn hóa shared UI components:
  - `Button`, `Input`, `Textarea`, `Card`, `Select`.
- Chuẩn hóa layout nền:
  - Đồng bộ container nhịp rộng ở `RootLayout`, `ManagerLayout`.
  - Chuẩn hóa link footer manager sang route public chính thức.
- Chuẩn hóa nhóm public/auth đã refactor trước đó theo design language Home.
- Chuẩn hóa nhóm nghiệp vụ:
  - Nâng cấp các thành phần trọng điểm dashboard ở admin/citizen và hạ tầng role thông qua token + component chuẩn dùng chung.

## 2) Trước/Sau (tóm tắt)
- Trước:
  - Form controls, button, card style rời rạc theo từng trang.
  - Container layout giữa role pages lệch nhịp và kích thước.
  - Chưa có visual regression pipeline sẵn dùng.
- Sau:
  - Form controls và surface card đồng nhất qua lớp `ui-*`.
  - Layout khung role pages đồng nhất hơn nhờ cập nhật Root/Manager shell.
  - Có pipeline visual regression tự động cho các route quan trọng ở 3 breakpoint.

## 3) Visual regression & kiểm thử
- Đã cài và cấu hình Playwright:
  - `playwright.config.js`
  - `tests/visual/ui-consistency.spec.js`
- Đã sinh baseline và chạy pass cho Chromium:
  - `npm run test:visual:update`
  - `npm run test:visual`
- Breakpoints đã kiểm tra: `375`, `768`, `1440`.
- Route trọng điểm đã cover:
  - `/`, `/huong-dan-khan-cap`, `/lien-he-ho-tro`,
  - `/tuyen-bo-mien-tru-trach-nhiem`, `/chinh-sach-bao-mat`,
  - `/dang-nhap`, `/dang-ky`, `/admin/noi-dung-trang`.

## 4) Chất lượng kỹ thuật
- Build production pass: `npm run build`.
- Diagnostics hiện tại: không có lỗi mới phát sinh từ thay đổi refactor.

## 5) Ghi chú vận hành
- Dự án đã sẵn sàng cho vòng mở rộng visual regression sang thêm browser profile nếu môi trường CI yêu cầu.
- Nền tảng design system đã sẵn để tiếp tục chuẩn hóa sâu các màn nghiệp vụ chi tiết trong vòng sau mà không phá vỡ kiến trúc hiện có.
