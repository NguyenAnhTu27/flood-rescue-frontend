/**
 * Coordinator API - dashboard (Điều phối)
 */

import httpClient from '../../shared/lib/http.js';

/**
 * Lấy hàng đợi yêu cầu cứu hộ cho điều phối viên
 * @param {{status?: string, page?: number, size?: number}} params
 */
export async function getCoordinatorRescueQueue(params = {}) {
  const response = await httpClient.get('/rescue/coordinator/requests', {
    params,
  });
  return response;
}

/**
 * Lấy chi tiết 1 yêu cầu cứu hộ theo ID (điều phối xem chi tiết)
 */
export async function getCoordinatorRescueRequestById(id) {
  const response = await httpClient.get(`/rescue/coordinator/requests/${id}`);
  return response;
}

/**
 * Lấy chi tiết theo mã yêu cầu (code)
 */
export async function getCoordinatorRescueRequestByCode(code) {
  const response = await httpClient.get(`/rescue/coordinator/requests/code/${code}`);
  return response;
}

/**
 * Xác minh yêu cầu cứu hộ
 * BE DTO:
 * VerifyRequest {
 *   locationVerified: boolean,
 *   note?: string,
 *   cancelRequest?: boolean,
 *   cancelAction?: 'DELETE' | 'WAITING_TEAM',
 *   cancelReason?: string
 * }
 */
export async function verifyRescueRequest(id, { locationVerified, note, cancelRequest, cancelAction, cancelReason }) {
  const response = await httpClient.post(
    `/rescue/coordinator/requests/${id}/verify`,
    {
      locationVerified,
      note: note || null,
      cancelRequest: cancelRequest === true,
      cancelAction: cancelAction || null,
      cancelReason: cancelReason || null,
    },
  );
  return response;
}

export async function setCitizenBlockByRequest(id, { blocked, reason }) {
  return httpClient.post(`/rescue/coordinator/requests/${id}/citizen-block`, {
    blocked: blocked === true,
    reason: reason || null,
  });
}

export async function getBlockedCitizens() {
  return httpClient.get('/rescue/coordinator/citizens/blocked');
}

export async function unblockCitizen(citizenId, reason) {
  return httpClient.post(`/rescue/coordinator/citizens/${citizenId}/unblock`, {
    reason: reason || null,
  });
}

/**
 * Đổi mức độ ưu tiên yêu cầu
 * BE DTO: PrioritizeRequest { priority: 'HIGH' | 'MEDIUM' | 'LOW' }
 */
export async function prioritizeRescueRequest(id, priority) {
  const response = await httpClient.put(
    `/rescue/coordinator/requests/${id}/priority`,
    { priority },
  );
  return response;
}

/**
 * Đánh dấu yêu cầu trùng lặp
 * BE DTO: MarkDuplicateRequest { masterRequestId: number, note?: string }
 */
export async function markDuplicateRescueRequest(id, { masterRequestId, note }) {
  const response = await httpClient.post(
    `/rescue/coordinator/requests/${id}/duplicate`,
    {
      masterRequestId,
      note: note || null,
    },
  );
  return response;
}

/**
 * Đổi trạng thái yêu cầu (IN_PROGRESS, COMPLETED, CANCELLED, ...)
 */
export async function changeRescueRequestStatus(id, status, note) {
  const params = new URLSearchParams();
  params.set('status', status);
  if (note) params.set('note', note);

  const response = await httpClient.put(
    `/rescue/coordinator/requests/${id}/status?${params.toString()}`,
  );
  return response;
}

/**
 * Thêm ghi chú nội bộ cho yêu cầu
 * BE DTO: AddNoteRequest { note: string }
 */
export async function addCoordinatorNoteToRescueRequest(id, note) {
  const response = await httpClient.post(
    `/rescue/coordinator/requests/${id}/notes`,
    { note },
  );
  return response;
}

// ===== Task Group (gộp nhiệm vụ) =====

/**
 * Tạo nhóm nhiệm vụ mới từ danh sách rescue_request_id
 * BE DTO: CreateTaskGroupRequest { rescueRequestIds: number[], assignedTeamId?: number, note?: string }
 */
export async function createTaskGroup(data) {
  const response = await httpClient.post('/rescue/coordinator/task-groups', data);
  return response;
}

/**
 * Lấy danh sách task group (filter theo status nếu cần)
 * @param {{status?: string, page?: number, size?: number}} params
 */
export async function getTaskGroups(params = {}) {
  const response = await httpClient.get('/rescue/coordinator/task-groups', {
    params,
  });
  return response;
}

/**
 * Lấy chi tiết 1 task group
 */
export async function getTaskGroupById(id) {
  const response = await httpClient.get(`/rescue/coordinator/task-groups/${id}`);
  return response;
}

/**
 * Đổi trạng thái task group (NEW, ASSIGNED, IN_PROGRESS, DONE, CANCELLED)
 */
export async function changeTaskGroupStatus(id, status, note) {
  const params = new URLSearchParams();
  params.set('status', status);
  if (note) params.set('note', note);

  const response = await httpClient.put(
    `/rescue/coordinator/task-groups/${id}/status?${params.toString()}`,
  );
  return response;
}

/**
 * Phân công đội & phương tiện cho task group
 * BE DTO: AssignTaskGroupRequest { taskGroupId, teamId, assetId?, note? }
 */
export async function assignTaskGroup(data) {
  const normalized = {
    ...data,
    // Backward compatibility for BE variants using assignedTeamId.
    assignedTeamId: data?.assignedTeamId ?? data?.teamId ?? null,
  };
  const response = await httpClient.post(
    '/rescue/coordinator/task-groups/assign',
    normalized,
  );
  return response;
}




export async function getCoordinatorDashboard() {
    return httpClient.get('/rescue/coordinator/dashboard');
} 

// Lấy chi tiết 1 yêu cầu cứu hộ cho điều phối viên (đầy đủ dữ liệu từ DB)
export async function getCoordinatorRescueRequest(id) {
    // BE thường sẽ có endpoint dạng /rescue/coordinator/requests/{id}
    // Nếu BE của bạn dùng path khác, hãy chỉnh lại đường dẫn dưới đây cho trùng khớp.
    return httpClient.get(`/rescue/coordinator/requests/${id}`);
}
