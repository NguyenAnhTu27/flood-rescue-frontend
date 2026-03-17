import httpClient from '../../shared/lib/http.js';
import { normalizePagination } from '../../shared/lib/httpUtils.js';

/**
 * ASSETS MANAGEMENT API
 * BE AssetController mapped at: /api/assets
 * → FE chỉ cần gọi /assets vì httpClient đã prefix /api
 */

// Lấy danh sách tất cả phương tiện (filter theo status nếu cần)
export async function getAssets(params = {}) {
  const normalizedParams = normalizePagination(params || {});
  if (typeof normalizedParams.status === 'string') {
    normalizedParams.status = normalizedParams.status.toUpperCase();
  }
  return httpClient.get('/assets', { params: normalizedParams });
}

// Lấy danh sách phương tiện theo bộ lọc nâng cao
export async function getAssetsFiltered(params = {}) {
  return httpClient.get('/assets/filter', { params: normalizePagination(params) });
}

// Lấy chi tiết 1 phương tiện
export async function getAsset(id) {
  return httpClient.get(`/assets/${id}`);
}

// Tạo phương tiện mới (Manager tạo)
export async function createAsset(payload) {
  return httpClient.post('/assets', payload);
}

// Cập nhật phương tiện
export async function updateAsset(id, payload) {
  return httpClient.put(`/assets/${id}`, payload);
}

// Xóa phương tiện
export async function deleteAsset(id) {
  return httpClient.delete(`/assets/${id}`);
}

// Cập nhật trạng thái phương tiện
// BE dùng @PatchMapping + ChangeAssetStatusRequest { newStatus }
export async function updateAssetStatus(id, status) {
  return httpClient.patch(`/assets/${id}/status`, { newStatus: status });
}

// Gán phương tiện cho đội
export async function assignAssetToTeam(id, teamId) {
  return httpClient.put(`/assets/${id}/assign-team`, { teamId });
}

// Hủy gán phương tiện khỏi đội
export async function unassignAssetFromTeam(id) {
  return httpClient.put(`/assets/${id}/unassign-team`);
}

// Lấy danh sách phương tiện theo đội
export async function getAssetsByTeam(teamId) {
  return httpClient.get(`/assets/team/${teamId}`);
}
