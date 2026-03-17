# Audit UI/UX toàn bộ pages/layout theo chuẩn Home

## 1) Mục tiêu & phạm vi
- Mục tiêu: kiểm tra mức độ đồng nhất của toàn bộ `src/pages/**/*.jsx` và `src/layouts/*.jsx` so với chuẩn Home.
- Không thay đổi UI trong đợt này; chỉ audit và đề xuất ưu tiên refactor.
- Phạm vi kỹ thuật:
  - 76 file được audit (72 page + 4 layout).
  - Public/Auth/Citizen/Coordinator/Rescuer/Manager/Admin + layout dùng chung.
  - Route tree tham chiếu từ `src/app/routes/index.jsx`.

## 2) Chuẩn Home dùng làm baseline
Baseline được rút ra từ `HomePage`, `PublicLayout`, `tailwind.css`, `tailwind.config.js`:

- **Surface system**: ưu tiên `glass-card`, `glass-panel`, `glass-chip`, `glass-hover`, `reveal-rise`.
- **Hình học**: bo góc custom (`rounded-[14..30px]`) thay vì bo chuẩn nhỏ đồng loạt.
- **Typography**: heading đậm + tracking âm cho title lớn; body thoáng (`leading-7/8`).
- **Tone màu**: xanh rescue + cyan, nền sáng nhiều lớp blur/gradient.
- **Interaction**: hover/focus/active nhất quán, chuyển động mềm, có giảm motion.
- **Layout rhythm**: `max-w-7xl`, khoảng trắng rộng, phân tầng hero/section/card rõ.

## 3) Phương pháp audit
- Phân tích route/layout thực tế từ `src/app/routes/index.jsx`.
- Quét toàn bộ file pages/layout để đo mức sử dụng token kiểu Home.
- Đối chiếu định tính trên từng nhóm vai trò (public, auth, citizen, coordinator, rescuer, manager, admin).
- Trích xuất các điểm lệch có tác động lớn tới trải nghiệm và bảo trì.

## 4) Kết quả định lượng

### 4.1 Coverage token Home
- Tổng file pages/layout: **76**
- File có dùng token Home (`glass-card|glass-panel|glass-chip|glass-hover|reveal-rise`): **8**
- Coverage: **10.5%**

### 4.2 Theo nhóm module
| Nhóm | Tổng file | File có token Home | `rounded-[...]` | `rounded-lg` | `rounded-md` |
|---|---:|---:|---:|---:|---:|
| public | 5 | 5 | 45 | 0 | 0 |
| auth | 2 | 2 | 24 | 0 | 0 |
| layouts | 4 | 1 | 19 | 8 | 19 |
| citizen | 11 | 0 | 0 | 55 | 9 |
| coordinator | 13 | 0 | 0 | 72 | 8 |
| rescuer | 7 | 0 | 0 | 59 | 2 |
| manager | 22 | 0 | 0 | 180 | 33 |
| admin | 12 | 0 | 0 | 73 | 6 |

Nhận định:
- Public/Auth đang gần chuẩn Home nhất.
- Toàn bộ khối private nghiệp vụ (Citizen/Coordinator/Rescuer/Manager/Admin) gần như đi theo hệ visual khác (card trắng + `rounded-lg/md`).

### 4.3 Bức tranh route/layout
- Số lần mount layout trong route tree:
  - `PublicLayout`: 6
  - `AuthLayout`: 2
  - `RootLayout`: 43
  - `ManagerLayout`: 15
- Có **4 app shell** khác nhau trong runtime, là nguyên nhân lớn gây cảm giác không đồng nhất.

## 5) Sai khác chính theo hạng mục

### 5.1 Layout shell (Critical)
- `PublicLayout` theo ngôn ngữ Home, nhưng `RootLayout`/`ManagerLayout` dùng shell khác rõ rệt (header, radius, spacing, footer pattern khác).
- Điều này tạo cảm giác “đổi sản phẩm” khi user chuyển từ public sang private.

### 5.2 Surface/Card system (Critical)
- Home ưu tiên glass surface + blur + lớp sáng.
- Khối private chủ yếu dùng card trắng phẳng (`bg-white`, `border-slate-200`, `rounded-lg/md`) theo một hệ khác.
- Kết quả: phân mảnh visual và khó tái sử dụng component xuyên vai trò.

### 5.3 Component primitives (High)
- `Button`/`Card` shared vẫn tồn tại system riêng (đặc biệt radius và trạng thái), chưa map 1-1 với chuẩn Home.
- Nhiều page tự viết class trực tiếp thay vì dùng primitive nhất quán.

### 5.4 Typography & spacing rhythm (High)
- Home dùng title lớn, tracking rõ, line-height rộng.
- Nhiều dashboard private dày thông tin, spacing chặt, heading hierarchy chưa đều.
- Ảnh hưởng khả năng scan nhanh ở tình huống khẩn cấp.

### 5.5 Interaction pattern (Medium)
- Một số trang có focus/hover tốt, nhưng token focus, hover elevation, animation chưa đồng nhất giữa module.
- Có chênh lệch giữa các nút cùng vai trò hành động (primary/secondary/danger).

### 5.6 Responsive risk (Medium)
- Một số cấu trúc cứng (`w-80`, `h-[calc(100vh-...)]`) dễ gây dồn nén nội dung ở viewport thấp/thiết bị nhỏ.
- Cần chuẩn hóa responsive rules theo cùng layout grid/token spacing.

## 6) Kết luận theo nhóm trang
- **Public/Auth**: đã theo đúng hướng Home, dùng nhiều token glass và nhịp spacing tương thích.
- **Private layouts**: cần refactor shell trước (Root/Manager) để giảm độ lệch tức thì.
- **Role dashboards/pages**: đang dùng hệ UI “legacy dashboard” nhất quán nội bộ nhưng lệch mạnh so với Home.

## 7) Đề xuất refactor ưu tiên (không triển khai trong đợt audit)

### P0 — Chuẩn hóa nền tảng (ưu tiên cao nhất)
1. Thiết kế **UI foundation map**: token Home -> token semantic dùng chung cho private.
2. Hợp nhất app shell:
   - Tạo `UnifiedPrivateLayout` (hoặc nâng cấp `RootLayout`) theo nhịp Home.
   - Giảm phân tách shell giữa Root và Manager.
3. Chuẩn hóa primitive:
   - `Button`, `Card`, `Badge`, `Input`, `Panel`, `SectionHeader`.
   - Khóa guideline radius/spacing/interaction bằng variant rõ ràng.

### P1 — Refactor lớp layout trước, page sau
1. Refactor `RootLayout` + `ManagerLayout` về cùng hệ header/footer/navigation.
2. Chuẩn hóa container/page frame cho toàn bộ route private (`max-w`, gutter, vertical rhythm).
3. Chốt pattern trạng thái (loading/empty/error/critical banner) thành shared component.

### P2 — Refactor theo cụm vai trò (ưu tiên theo tác động người dùng)
1. **Coordinator + Rescuer** (màn hình tác nghiệp realtime, ảnh hưởng vận hành trực tiếp).
2. **Citizen** (tác động trực tiếp trải nghiệm người dân khi cần cứu hộ).
3. **Manager + Admin** (backoffice, khối lượng trang lớn, cần theo batch).

### P3 — Governance & regression
1. Thêm checklist lint UI class/token (chặn class lệch hệ mới).
2. Thiết lập visual regression cho 375/768/1440 theo route quan trọng.
3. Định nghĩa “Done for UI consistency” trước khi merge.

## 8) Backlog refactor gợi ý theo epic
- **Epic A (Foundation):** token mapping + primitive refresh.
- **Epic B (Shell):** unify Root/Manager shell.
- **Epic C (Mission-critical pages):** coordinator/rescuer dashboard + queue/map/detail.
- **Epic D (Citizen flows):** dashboard, request create/status/update.
- **Epic E (Backoffice):** manager/admin dashboard + CRUD pages.
- **Epic F (Quality gate):** visual regression + UI checklist automation.

## 9) Danh sách file đã theo chuẩn Home (điểm sáng)
- `src/pages/public/HomePage.jsx`
- `src/pages/public/EmergencyGuidePage.jsx`
- `src/pages/public/StaticContentPage.jsx`
- `src/pages/public/SupportContactPage.jsx`
- `src/pages/public/NotFoundPage.jsx`
- `src/pages/auth/LoginPage.jsx`
- `src/pages/auth/RegisterPage.jsx`
- `src/layouts/PublicLayout.jsx`

## 10) Ghi chú bàn giao
- Báo cáo này là baseline audit để triển khai refactor theo thứ tự ưu tiên.
- Chưa thực hiện thay đổi UI/code production trong đợt này.
