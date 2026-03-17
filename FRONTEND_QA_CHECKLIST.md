# Frontend QA Checklist — Flood Rescue Frontend

Tài liệu này là **checklist test thủ công** theo role/page, tập trung vào:

- **Logic hoạt động** (happy path + data mapping)
- **UI/UX** (khả dụng, rõ ràng, tránh “đơ/trắng”)
- **Loading / Error / Empty state**
- **Edge cases** (dữ liệu rỗng, API lỗi, mạng chậm, thao tác nhanh)
- **Tính nhất quán UI** (button/input/typography/spacing/responsive)

> Gợi ý: khi test, bật throttling mạng (Slow 3G) và thử tắt/bật backend để kiểm tra trạng thái lỗi.

---

## 1) Public

### Home (`/`)
- **Happy path**: nội dung hiển thị đúng, CTA điều hướng đúng.
- **Responsive**: mobile/tablet không vỡ layout.

### Emergency guide / Static content
- **Empty/404**: nếu không có nội dung từ backend (nếu có), phải có message rõ.

### Not found
- **Link back**: quay lại trang chủ/đăng nhập rõ ràng.

---

## 2) Auth

### Login
- **Happy path**: login thành công → redirect đúng theo role backend trả về.
- **Loading**: disable submit + label “Đang đăng nhập…”.
- **Error**:
  - 400 validation (thiếu identifier/password) hiển thị message.
  - 401/403 hiển thị message dễ hiểu.
  - network down hiển thị “không kết nối backend”.
- **Edge**: click submit nhanh nhiều lần không tạo nhiều request.
- **Consistency**: input/button nên dùng UI kit chung (`shared/ui`).

### Register (Citizen)
- **Validate FE**: confirm password, min length, terms.
- **Error**: backend validation map hiển thị rõ.
- **Expectation**: nếu backend *không trả token* thì sau đăng ký phải điều hướng về login (hoặc message rõ).

---

## 3) Citizen

### Citizen dashboard
- **GPS**:
  - permission denied → message rõ + fallback location.
  - slow GPS → không “đơ”, có trạng thái.
- **Rescue confirm prompt**:
  - confirm rescued → điều hướng feedback
  - confirm not rescued → request follow-up (nếu BE có) + UI refresh đúng
- **Edge**:
  - citizen bị block → CTA tạo yêu cầu disabled + lý do hiển thị.
- **Issue cần chú ý**: còn `window.alert()` trong error flows.

### Create rescue request (multi-step + map + upload)
- **Step validation**:
  - step1 thiếu coords / locationDescription
  - step2 thiếu description / peopleCount < 1
  - step3 phone invalid
- **Map**:
  - chọn điểm trên map → cập nhật marker + address
  - reverse geocode fail → fallback “GPS lat,lng”
- **Loading**:
  - lấy GPS có spinner
  - submit request disable + label
- **Edge**:
  - upload quá số lượng / quá size
  - user đổi step nhanh

### Rescue request status
- **Polling**: 10s refresh không “nhảy layout” quá nhiều.
- **Error**: API lỗi → banner lỗi nhưng không crash.
- **Empty**: không có request → CTA về danh sách.
- **Issue cần chú ý**: có `window.prompt/alert` và `window.location.reload()` ở nhánh “not rescued”.

### Relief pages (create/update/status/list)
- **Empty**: list rỗng có message + CTA tạo mới.
- **Error**: API fail hiển thị rõ.

---

## 4) Coordinator

### Dashboard (queue + map + detail)
- **Empty**: queue rỗng phải có “Không có yêu cầu”.
- **Detail**:
  - chưa chọn → empty state OK
  - loading detail → loader/text
  - attachments rỗng → message
- **Edge**:
  - request thiếu lat/lng → không crash map, show fallback.

### Verify request
- **Happy path**: verify thành công → chuyển sang assign.
- **Cancel/block flows**:
  - reason required → hiển thị validation
  - API error → giữ form state, show error
- **Issue cần chú ý**: dùng `window.alert()` nhiều nơi.

### Assign request
- **Resources**:
  - teams/assets load slow → có loading.
  - assets filter theo team đúng.
- **Assign**:
  - thiếu team/asset/request → validation message
  - merge mode chọn nhiều request → merged detail hiển thị đúng.
- **Issue cần chú ý**: dùng `window.alert()` nhiều nơi.

### Blocked citizens
- **Empty**: “Chưa có citizen nào bị khóa”.
- **Unblock**:
  - prompt reason optional
  - disable nút khi đang saving
- **Issue cần chú ý**: dùng `window.prompt/alert`.

---

## 5) Rescuer

### Rescuer dashboard
- **Loading**: missions + relief requests có loading/empty ok.
- **Polling**: 20s refresh (khi tab visible) không race.
- **GPS update**:
  - permission denied / timeout → message rõ
- **Assets return**:
  - chỉ cho trả khi không có active missions
- **Issue cần chú ý**: dùng `window.alert/confirm`.

### Assignment detail / status update / field update / tracking
- **Edge**:
  - missing missionId/state → không crash, show empty state.
  - rapid status updates → button disabled / preventing double submit.

---

## 6) Manager

### ReliefRequests (dispatch)
- **Queue**:
  - empty state khi `requests=[]`
  - reject flow: confirm + reason
- **Map**:
  - teams/vehicles empty state
  - slow network: map vẫn tương tác, list có loading
- **Issue cần chú ý**: dùng `window.confirm/prompt`.

### Inventory overview
- **Fallback logic**:
  - stock_balances rỗng → calculate receipts/issues
  - receipts/issues rỗng → empty state rõ
- **Error**: show message + giữ stats default

---

## 7) Admin

### Teams management / Team create
- **CRUD**: load → search → paginate → edit/create → delete
- **Loading/Error/Empty**: đã có tương đối đầy đủ
- **Issue cần chú ý**: dùng `window.alert/confirm`.

### User management
- **Critical**:
  - base URL không hardcode
  - phải có loading/empty/error state
  - không dùng `window.location.reload()` sau create/delete

---

## 8) Cross-cutting UI Consistency Checklist
- **Buttons**: cùng focus ring, disabled style, sizes.
- **Inputs/forms**: error state (border/red + helper text) thống nhất.
- **Typography**: dùng token `font-heading/font-body`.
- **Spacing**: card padding/section spacing (đặc biệt layout panel `w-80`) không quá chật trên màn nhỏ.
- **Route-level loading**: lazy routes không được “trắng” (Suspense fallback cần UI).
- **Global error boundary**: crash phải vào `AppErrorBoundary` và có CTA reload/home.

