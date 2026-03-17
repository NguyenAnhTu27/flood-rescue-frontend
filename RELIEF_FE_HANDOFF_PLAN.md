# Relief BE -> FE Handoff Plan

## 1. Scope da hoan tat o BE

Backend Relief da duoc chuan hoa cho core flow:

1. Dong bo reject flow:
- Reject manager (`PUT /api/relief/requests/{id}/reject`) hien tai set day du:
  - `status = CANCELLED`
  - `deliveryStatus = REJECTED`
  - `deliveryNote = reason`

2. Chuan hoa transition status cho rescuer:
- Chi chap nhan transition hop le, chong nhay coc sai thu tu.
- Khong cho cap nhat neu request da `DONE` hoac `CANCELLED`.

3. Giam rui ro map sai issue:
- Neu `assignedIssueId` bi null, backend fallback tim issue theo relief.
- Neu phat hien nhieu candidate issue (top 2 co > 1), backend tra loi business error de tranh map sai phieu.

4. Toi uu list API (giam N+1):
- Batch fetch lines cho cac API list relief.

## 2. State machine FE can tuan thu

### 2.1 Document status (status)
- `DRAFT` -> `APPROVED` -> `DONE`
- Hoac `DRAFT/APPROVED` -> `CANCELLED`

### 2.2 Delivery status (deliveryStatus)
- `REQUESTED` -> `MANAGER_APPROVED` -> `RESCUER_RECEIVED` -> `ARRIVED_WAREHOUSE` -> `ARRIVED_RELIEF_POINT` -> (`COMPLETED` hoac `RETURNED_TO_WAREHOUSE`)
- Tu choi/huy: `REJECTED`

### 2.3 Transition rule cho endpoint rescuer update
Endpoint: `PUT /api/relief/rescuer/requests/{id}/delivery-status`

Cho phep:
1. `MANAGER_APPROVED` -> `RESCUER_RECEIVED`
2. `RESCUER_RECEIVED` -> `ARRIVED_WAREHOUSE`
3. `ARRIVED_WAREHOUSE` -> `ARRIVED_RELIEF_POINT`
4. `ARRIVED_RELIEF_POINT` -> `COMPLETED`
5. `ARRIVED_RELIEF_POINT` -> `RETURNED_TO_WAREHOUSE`
6. Update cung status hien tai duoc xem la idempotent

Khong cho phep:
- Nhay coc (vi du tu `MANAGER_APPROVED` len `ARRIVED_WAREHOUSE`)
- Update khi `status` da `DONE` hoac `CANCELLED`

## 3. API FE bat buoc dung dung endpoint

## 3.1 Manager duyet va dieu phoi (flow chinh)
- Dung: `PUT /api/relief/requests/{id}/approve-dispatch`
- Body:
```json
{
  "assignedTeamId": 123,
  "note": "optional"
}
```

Khong dung cho flow dieu phoi:
- `PUT /api/relief/requests/{id}/approve` (chi approve don gian, khong tao issue/giao team)

## 3.2 Manager reject
- `PUT /api/relief/requests/{id}/reject`
- Body:
```json
{
  "reason": "Ly do tu choi"
}
```

## 3.3 Rescuer update delivery
- `PUT /api/relief/rescuer/requests/{id}/delivery-status`
- Body:
```json
{
  "status": "RESCUER_RECEIVED",
  "note": "optional"
}
```

Status hop le FE duoc gui:
- `RESCUER_RECEIVED`
- `ARRIVED_WAREHOUSE`
- `ARRIVED_RELIEF_POINT`
- `COMPLETED`
- `RETURNED_TO_WAREHOUSE`

## 4. FE mapping UI theo state

## 4.1 Manager screen
- Neu `status = DRAFT`:
  - Hien nut "Duyet + dieu phoi" (goi approve-dispatch)
  - Hien nut "Tu choi"
- Neu `status != DRAFT`:
  - Disable/hidden cac nut tren

## 4.2 Rescuer screen
- Chi hien action tiep theo dung thu tu, khong cho chon tu do.
- Goi y button flow:
  1. `MANAGER_APPROVED` -> button "Da nhan" (`RESCUER_RECEIVED`)
  2. `RESCUER_RECEIVED` -> "Da toi kho" (`ARRIVED_WAREHOUSE`)
  3. `ARRIVED_WAREHOUSE` -> "Da toi diem cuu tro" (`ARRIVED_RELIEF_POINT`)
  4. `ARRIVED_RELIEF_POINT` -> 2 button:
     - "Hoan thanh" (`COMPLETED`)
     - "Tra kho" (`RETURNED_TO_WAREHOUSE`)

## 4.3 Badge/text status
- Tach rieng hien thi:
  - Badge 1: `status` (document)
  - Badge 2: `deliveryStatus` (delivery)
- Khong gom 2 he thong status lam mot.

## 5. Error handling FE can bat duoc

FE can map message business error tu backend de hien thi dung y nghia:

1. "Trạng thái cập nhật không hợp lệ cho rescuer"
- FE da gui status khong nam trong tap duoc phep

2. "Chuyển trạng thái giao hàng không hợp lệ từ X sang Y"
- FE gui sai thu tu transition

3. "Yêu cầu cứu trợ đã bị hủy" hoac "Yêu cầu cứu trợ đã hoàn thành"
- Don da ket thuc, khong update tiep

4. "Yêu cầu cứu trợ đang gắn nhiều phiếu xuất, vui lòng liên hệ quản lý để đồng bộ dữ liệu"
- Data issue bi ambiguity, FE hien thong bao va khong retry tu dong

## 6. Trinh tu FE implementation khuyen nghi

1. Cap nhat service layer FE endpoint:
- Chuan hoa approve-dispatch la endpoint chinh cho manager action

2. Refactor state machine UI cho rescuer:
- Sinh next-actions tu `deliveryStatus` thay vi hard-code button linh tinh

3. Cap nhat reject flow:
- Sau reject, UI phai hien `deliveryStatus = REJECTED`

4. Cap nhat list/detail rendering:
- Hien thi dong thoi `status` va `deliveryStatus`

5. Bo sung e2e/manual script FE:
- create -> approve-dispatch -> rescuer full flow -> completed
- create -> reject
- create -> approve-dispatch -> returned_to_warehouse

## 7. Files BE lien quan de FE doi chieu

- `src/main/java/com/floodrescue/module/relief/service/ReliefRequestService.java`
- `src/main/java/com/floodrescue/module/relief/controller/ReliefRequestController.java`
- `src/main/java/com/floodrescue/module/relief/dto/request/ReliefApproveDispatchRequest.java`
- `src/main/java/com/floodrescue/module/relief/dto/request/ReliefRescuerStatusUpdateRequest.java`
- `src/main/java/com/floodrescue/module/relief/dto/request/ReliefRequestRejectRequest.java`
- `src/main/java/com/floodrescue/module/relief/dto/response/ReliefRequestResponse.java`

## 8. Verification da chay

- Build check:
  - `./mvnw.cmd -q -DskipTests compile` -> PASS

Luu y:
- Chua chay full integration test suite trong dot nay.
