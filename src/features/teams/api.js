import httpClient from '../../shared/lib/http.js';

/**
 * TEAMS MANAGEMENT API
 * Backend base path: /api/admin/teams hoặc /api/teams
 * → FE chỉ cần gọi /admin/teams hoặc /teams vì httpClient đã prefix /api
 */

// Lấy danh sách tất cả đội cứu hộ
export async function getTeams(params = {}) {
  const candidates = [
    '/admin/teams',
    '/teams',
    '/admin/rescue-teams',
    '/rescue-teams',
  ];

  let lastErr;
  for (const path of candidates) {
    try {
      const res = await httpClient.get(path, { params });
      return res;
    } catch (e) {
      lastErr = e;
      if (e?.status !== 404 && e?.status !== 401 && e?.status !== 403) {
        throw e;
      }
    }
  }
  throw lastErr || new Error('Không tìm thấy endpoint danh sách đội cứu hộ');
}

// Lấy chi tiết 1 đội cứu hộ
export async function getTeam(id) {
  const candidates = [
    `/admin/teams/${id}`,
    `/teams/${id}`,
    `/admin/rescue-teams/${id}`,
    `/rescue-teams/${id}`,
  ];

  let lastErr;
  for (const path of candidates) {
    try {
      const res = await httpClient.get(path);
      return res;
    } catch (e) {
      lastErr = e;
      if (e?.status !== 404 && e?.status !== 401 && e?.status !== 403) {
        throw e;
      }
    }
  }
  throw lastErr || new Error('Không tìm thấy endpoint chi tiết đội cứu hộ');
}

// Tạo đội cứu hộ mới (Admin tạo)
export async function createTeam(payload) {
  const candidates = [
    '/admin/teams',
    '/teams',
    '/admin/rescue-teams',
    '/rescue-teams',
  ];

  let lastErr;
  for (const path of candidates) {
    try {
      const res = await httpClient.post(path, payload);
      return res;
    } catch (e) {
      lastErr = e;
      if (e?.status !== 404 && e?.status !== 401 && e?.status !== 403) {
        throw e;
      }
    }
  }
  throw lastErr || new Error('Không tìm thấy endpoint tạo đội cứu hộ');
}

// Cập nhật đội cứu hộ
export async function updateTeam(id, payload) {
  const candidates = [
    `/admin/teams/${id}`,
    `/teams/${id}`,
    `/admin/rescue-teams/${id}`,
    `/rescue-teams/${id}`,
  ];

  let lastErr;
  for (const path of candidates) {
    try {
      const res = await httpClient.put(path, payload);
      return res;
    } catch (e) {
      lastErr = e;
      if (e?.status !== 404 && e?.status !== 401 && e?.status !== 403) {
        throw e;
      }
    }
  }
  throw lastErr || new Error('Không tìm thấy endpoint cập nhật đội cứu hộ');
}

// Xóa đội cứu hộ
export async function deleteTeam(id) {
  const candidates = [
    `/admin/teams/${id}`,
    `/teams/${id}`,
    `/admin/rescue-teams/${id}`,
    `/rescue-teams/${id}`,
  ];

  let lastErr;
  for (const path of candidates) {
    try {
      const res = await httpClient.delete(path);
      return res;
    } catch (e) {
      lastErr = e;
      if (e?.status !== 404 && e?.status !== 401 && e?.status !== 403) {
        throw e;
      }
    }
  }
  throw lastErr || new Error('Không tìm thấy endpoint xóa đội cứu hộ');
}

// Lấy danh sách RESCUER có thể gán vào đội (kèm thông tin đang thuộc đội nào)
export async function getTeamMemberCandidates() {
  const candidates = [
    '/admin/teams/member-candidates',
    '/teams/member-candidates',
  ];

  let lastErr;
  for (const path of candidates) {
    try {
      return await httpClient.get(path);
    } catch (e) {
      lastErr = e;
      if (e?.status !== 404 && e?.status !== 401 && e?.status !== 403) {
        throw e;
      }
    }
  }

  throw lastErr || new Error('Không tìm thấy endpoint danh sách thành viên đội');
}
