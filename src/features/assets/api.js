import httpClient from '../../shared/lib/http.js';

/**
 * ASSETS MANAGEMENT API
 * Backend base path: /api/assets (không phải /api/admin/assets)
 * → FE chỉ cần gọi /assets vì httpClient đã prefix /api
 */

// Lấy danh sách tất cả phương tiện
export async function getAssets(params = {}) {
  const candidates = [
    '/assets',
    '/manager/assets',
    '/assets/list',
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
  throw lastErr || new Error('Không tìm thấy endpoint danh sách phương tiện');
}

// Lấy chi tiết 1 phương tiện
export async function getAsset(id) {
  return httpClient.get(`/assets/${id}`);
}

// Tạo phương tiện mới (Manager tạo, không phải Admin)
export async function createAsset(payload) {
  const candidates = [
    '/assets',
    '/manager/assets',
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
  throw lastErr || new Error('Không tìm thấy endpoint tạo phương tiện');
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
export async function updateAssetStatus(id, status) {
  return httpClient.put(`/assets/${id}/status`, { status });
}
