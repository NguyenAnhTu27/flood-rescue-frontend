import httpClient from '../../shared/lib/http.js';
import { normalizePagination } from '../../shared/lib/httpUtils.js';

/**
 * TEAMS MANAGEMENT API
 * BE TeamController mapped at: /api/admin/teams
 * → FE chỉ cần gọi /admin/teams vì httpClient đã prefix /api
 */

// Lấy danh sách tất cả đội cứu hộ
export async function getTeams(params = {}) {
  return httpClient.get('/admin/teams', { params: normalizePagination(params) });
}

// Lấy chi tiết 1 đội cứu hộ
export async function getTeam(id) {
  return httpClient.get(`/admin/teams/${id}`);
}

// Tạo đội cứu hộ mới (Admin/Manager tạo)
export async function createTeam(payload) {
  return httpClient.post('/admin/teams', payload);
}

// Cập nhật đội cứu hộ
export async function updateTeam(id, payload) {
  return httpClient.put(`/admin/teams/${id}`, payload);
}

// Xóa đội cứu hộ
export async function deleteTeam(id) {
  return httpClient.delete(`/admin/teams/${id}`);
}

// Lấy danh sách RESCUER có thể gán vào đội (kèm thông tin đang thuộc đội nào)
export async function getTeamMemberCandidates() {
  return httpClient.get('/admin/teams/member-candidates');
}
