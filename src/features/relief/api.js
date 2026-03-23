import httpClient from '../../shared/lib/http.js';

const DISTRIBUTION_BASE_PATHS = ['/distribution', '/manager/distribution', '/relief'];
const DISTRIBUTION_RESOURCE_PATHS = ['/vouchers', '/orders', '/distributions', '/distribution-vouchers'];

function buildDistributionCollectionCandidates() {
  return DISTRIBUTION_BASE_PATHS.flatMap((basePath) =>
    DISTRIBUTION_RESOURCE_PATHS.map((resourcePath) => `${basePath}${resourcePath}`)
  );
}

/**
 * Manager (cứu trợ) dashboard
 * Thử nhiều endpoint khác nhau để tương thích với BE.
 */
export async function getManagerDashboard() {
  const candidates = [
    '/relief/manager/dashboard',
    '/manager/relief/dashboard',
    '/relief/dashboard',
    '/inventory/manager/dashboard',
  ];

  let lastErr;

  for (const path of candidates) {
    try {
      // httpClient đã unwrap data nên return thẳng
      const res = await httpClient.get(path);
      return res;
    } catch (e) {
      lastErr = e;
      // Nếu BE trả 404/401/403 cho endpoint này thì thử tiếp endpoint khác
      if (e?.status !== 404 && e?.status !== 401 && e?.status !== 403) {
        throw e;
      }
    }
  }

  // Nếu tất cả endpoint đều fail 404 thì ném lỗi cuối cùng
  throw lastErr || new Error('Không tìm thấy endpoint dashboard cứu trợ');
}

/**
 * INVENTORY RECEIPTS (phiếu nhập kho)
 * Backend base path: /api/inventory/receipts
 * → FE chỉ cần gọi /inventory/receipts vì httpClient đã prefix /api
 */

// Tạo phiếu nhập kho mới
export async function createInventoryReceipt(payload) {
  return httpClient.post('/inventory/receipts', payload);
}

// Lấy chi tiết 1 phiếu nhập kho
export async function getInventoryReceipt(id) {
  return httpClient.get(`/inventory/receipts/${id}`);
}

// Duyệt phiếu nhập kho
export async function approveInventoryReceipt(id) {
  return httpClient.put(`/inventory/receipts/${id}/approve`);
}

// Hủy phiếu nhập kho
export async function cancelInventoryReceipt(id) {
  return httpClient.put(`/inventory/receipts/${id}/cancel`);
}

// Danh sách phiếu nhập kho (có thể filter theo status, page, size)
export async function listInventoryReceipts(params = {}) {
  return httpClient.get('/inventory/receipts', { params });
}

/**
 * INVENTORY ISSUES (phiếu xuất kho)
 * Backend base path: /api/inventory/issues
 * → FE chỉ cần gọi /inventory/issues vì httpClient đã prefix /api
 */

// Tạo phiếu xuất kho mới
export async function createInventoryIssue(payload) {
  return httpClient.post('/inventory/issues', payload);
}

// Lấy chi tiết 1 phiếu xuất kho
export async function getInventoryIssue(id) {
  return httpClient.get(`/inventory/issues/${id}`);
}

// Duyệt phiếu xuất kho
export async function approveInventoryIssue(id) {
  return httpClient.put(`/inventory/issues/${id}/approve`);
}

// Hủy phiếu xuất kho
export async function cancelInventoryIssue(id) {
  return httpClient.put(`/inventory/issues/${id}/cancel`);
}

// Danh sách phiếu xuất kho (có thể filter theo status, page, size)
export async function listInventoryIssues(params = {}) {
  const candidates = [
    '/inventory/issues',
    '/inventory/issue',
    '/issues',
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
  throw lastErr || new Error('Không tìm thấy endpoint phiếu xuất kho');
}

export async function getTemporaryInventoryIssues() {
  return httpClient.get('/inventory/issues/temporary');
}

/**
 * DISTRIBUTION VOUCHERS (phiếu điều phối giao hàng)
 * Backend tách riêng khỏi nghiệp vụ kho.
 */

// Tạo phiếu điều phối giao hàng
export async function createDistributionVoucher(payload) {
  const candidates = buildDistributionCollectionCandidates();

  let lastErr;
  for (const path of candidates) {
    try {
      return await httpClient.post(path, payload);
    } catch (e) {
      lastErr = e;
      if (e?.status !== 404 && e?.status !== 401 && e?.status !== 403) {
        throw e;
      }
    }
  }

  throw lastErr || new Error('Không tìm thấy endpoint phiếu điều phối');
}

// Danh sách phiếu điều phối
export async function listDistributionVouchers(params = {}) {
  const candidates = buildDistributionCollectionCandidates();

  let lastErr;
  for (const path of candidates) {
    try {
      return await httpClient.get(path, { params });
    } catch (e) {
      lastErr = e;
      if (e?.status !== 404 && e?.status !== 401 && e?.status !== 403) {
        throw e;
      }
    }
  }

  throw lastErr || new Error('Không tìm thấy endpoint danh sách phiếu điều phối');
}

/**
 * INVENTORY STOCK (tồn kho hiện tại)
 */

// Lấy danh sách hàng tồn kho hiện tại
export async function getInventoryStock(params = {}) {
  const candidates = [
    '/inventory/stock',
    '/inventory/items/stock',
    '/inventory/current-stock',
    '/inventory/stock/current',
    '/stock',
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
  throw lastErr || new Error('Không tìm thấy endpoint tồn kho');
}

/**
 * ITEM CATEGORIES (danh mục hàng hóa)
 */

// Lấy danh sách tất cả danh mục / loại hàng hóa
export async function getItemCategories(params = {}) {
  const candidates = [
    // BE hiện tại: GET /api/inventory/items trả về danh sách loại hàng (ItemCategoryResponse)
    '/inventory/items',
    '/items',
    // Dự phòng nếu BE đổi path sang item-categories
    '/inventory/item-categories',
    '/inventory/itemCategories',
    '/inventory/categories',
    '/item-categories',
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
  throw lastErr || new Error('Không tìm thấy endpoint danh mục hàng hóa');
}

// Tạo danh mục / loại hàng hóa mới
export async function createItemCategory(payload) {
  const candidates = [
    // Chính: tạo loại hàng qua /api/inventory/items
    '/inventory/items',
    '/items',
    // Dự phòng: nếu BE dùng item-categories
    '/inventory/item-categories',
    '/inventory/itemCategories',
    '/inventory/categories',
    '/item-categories',
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
  throw lastErr || new Error('Không tìm thấy endpoint tạo danh mục hàng hóa');
}

export async function deleteItemCategory(id) {
  return httpClient.delete(`/inventory/items/${id}`);
}

export async function getItemClassifications() {
  return httpClient.get('/inventory/item-classifications');
}

export async function createItemClassification(payload) {
  return httpClient.post('/inventory/item-classifications', payload);
}

export async function deleteItemClassification(id) {
  return httpClient.delete(`/inventory/item-classifications/${id}`);
}

export async function getItemUnits() {
  return httpClient.get('/inventory/item-units');
}

export async function createItemUnit(payload) {
  return httpClient.post('/inventory/item-units', payload);
}

export async function deleteItemUnit(id) {
  return httpClient.delete(`/inventory/item-units/${id}`);
}

/**
 * RELIEF REQUESTS (yêu cầu cứu trợ)
 */

// Lấy danh sách yêu cầu cứu trợ
// Backend: GET /api/relief/requests  (base prefix /api đã được httpClient thêm sẵn)
export async function listReliefRequests(params = {}) {
  try {
    return await httpClient.get('/relief/requests', { params });
  } catch (e) {
    // Fallback cho backend chỉ expose namespace manager
    if ([401, 403, 404].includes(Number(e?.status))) {
      return httpClient.get('/manager/relief/requests', { params });
    }
    throw e;
  }
}

// Lấy chi tiết yêu cầu cứu trợ
export async function getReliefRequest(id) {
  return httpClient.get(`/relief/requests/${id}`);
}

// Duyệt yêu cầu cứu trợ
export async function approveReliefRequest(id) {
  return httpClient.put(`/relief/requests/${id}/approve`);
}

// Từ chối yêu cầu cứu trợ
export async function rejectReliefRequest(id, reason) {
  return httpClient.put(`/relief/requests/${id}/reject`, { reason });
}

// Tạo yêu cầu cứu trợ mới
export async function createReliefRequest(payload) {
  // Backend: POST /api/relief/requests
  return httpClient.post('/relief/requests', payload);
}

export async function getMyCitizenReliefRequests(params = {}) {
  return httpClient.get('/relief/citizen/requests', { params });
}

export async function updateMyCitizenReliefRequest(id, payload) {
  return httpClient.put(`/relief/citizen/requests/${id}`, payload);
}

export async function cancelMyCitizenReliefRequest(id, reason) {
  const query = reason && String(reason).trim()
    ? `?reason=${encodeURIComponent(String(reason).trim())}`
    : '';
  return httpClient.delete(`/relief/citizen/requests/${id}${query}`);
}

export async function approveAndDispatchReliefRequest(id, payload) {
  return httpClient.put(`/relief/requests/${id}/approve-dispatch`, payload);
}

export async function rejectReliefRequestByManager(id, reason) {
  return httpClient.put(`/relief/requests/${id}/reject`, { reason });
}

export async function getRescuerReliefRequests(params = {}) {
  return httpClient.get('/relief/rescuer/requests', { params });
}

export async function updateRescuerReliefStatus(id, payload) {
  return httpClient.put(`/relief/rescuer/requests/${id}/delivery-status`, payload);
}

// Lưu nháp yêu cầu cứu trợ
export async function saveReliefRequestDraft(payload) {
  // Nếu BE không có endpoint riêng cho draft, ta vẫn POST lên /relief/requests với status = DRAFT
  const draftPayload = { ...payload, status: 'DRAFT' };
  return httpClient.post('/relief/requests', draftPayload);
}

// Tạo mã phiếu tự động
export async function generateReliefRequestCode() {
  return httpClient.get('/relief/requests/generate-code');
}

export async function generateInventoryIssueCode() {
  return httpClient.get('/inventory/issues/generate-code');
}

// Lấy danh sách khu vực/địa điểm
export async function getAreas() {
  const candidates = [
    '/areas',
    '/locations',
    '/relief/areas',
    '/manager/areas',
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
  throw lastErr || new Error('Không tìm thấy endpoint khu vực');
}
