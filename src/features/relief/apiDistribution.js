import httpClient from "../../shared/lib/http.js";

const DISTRIBUTION_BASE = "/distributions";

// Tạo phiếu điều phối giao hàng
export async function createDistributionVoucher(payload) {
  return await httpClient.post(DISTRIBUTION_BASE, payload);
}

// Danh sách phiếu điều phối
export async function listDistributionVouchers(params = {}) {
  return await httpClient.get(DISTRIBUTION_BASE, { params });
}

// (Optional) Lấy chi tiết phiếu điều phối
export async function getDistributionVoucher(id) {
  return await httpClient.get(`${DISTRIBUTION_BASE}/${id}`);
}

// Gán đội/xe cho phiếu điều phối
export async function assignDistributionTask(id, payload) {
  // Theo BE hiện tại: PUT/PATCH /api/distributions/{id}/assignment
  try {
    return await httpClient.put(
      `${DISTRIBUTION_BASE}/${id}/assignment`,
      payload,
    );
  } catch (e) {
    if (e?.status === 404 || e?.status === 405) {
      return await httpClient.patch(
        `${DISTRIBUTION_BASE}/${id}/assignment`,
        payload,
      );
    }
    throw e;
  }
}
