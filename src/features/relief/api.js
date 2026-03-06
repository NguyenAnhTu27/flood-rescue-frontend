import httpClient from '../../shared/lib/http.js';

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
export async function getItemCategories() {
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
      const res = await httpClient.get(path);
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

/**
 * RELIEF REQUESTS (yêu cầu cứu trợ)
 */

// Lấy danh sách yêu cầu cứu trợ
// Backend: GET /api/relief/requests  (base prefix /api đã được httpClient thêm sẵn)
export async function listReliefRequests(params = {}) {
  return httpClient.get('/relief/requests', { params });
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

// Lưu nháp yêu cầu cứu trợ
export async function saveReliefRequestDraft(payload) {
  // Nếu BE không có endpoint riêng cho draft, ta vẫn POST lên /relief/requests với status = DRAFT
  const draftPayload = { ...payload, status: 'DRAFT' };
  return httpClient.post('/relief/requests', draftPayload);
}

// Tạo mã phiếu tự động
export async function generateReliefRequestCode() {
  const candidates = [
    '/relief/requests/generate-code',
    '/relief/manager/requests/generate-code',
    '/manager/relief/requests/generate-code',
  ];

  let lastErr;
  for (const path of candidates) {
    try {
      const res = await httpClient.get(path);
      // Nếu response có code, return ngay
      if (res?.code) {
        return res;
      }
      // Nếu response là object có data.code
      if (res?.data?.code) {
        return { code: res.data.code };
      }
      // Nếu response trả về trực tiếp code
      return res;
    } catch (e) {
      lastErr = e;
      // Nếu gặp 401 (Unauthorized), có thể endpoint không tồn tại hoặc yêu cầu auth
      // Fallback về client-side generation ngay
      if (e?.status === 401) {
        console.warn(`[generateReliefRequestCode] Endpoint ${path} returned 401, falling back to client-side generation`);
        break;
      }
      // Nếu gặp 404 hoặc 403, tiếp tục thử endpoint khác
      if (e?.status === 404 || e?.status === 403) {
        continue;
      }
      // Nếu là lỗi khác (500, network error, etc.), throw ngay
      throw e;
    }
  }
  
  // Fallback: generate code client-side
  // Format: REQ-YYYY-XXXX (YYYY = năm, XXXX = số ngẫu nhiên 4 chữ số)
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const generatedCode = `REQ-${year}-${random}`;
  
  console.log(`[generateReliefRequestCode] Generated client-side code: ${generatedCode}`);
  return { code: generatedCode };
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
  // Fallback: return mock areas
  return [
    { id: 1, name: 'Huyện Lệ Thủy, Quảng Bình' },
    { id: 2, name: 'Thị xã Ba Đồn, Quảng Bình' },
    { id: 3, name: 'Huyện Cam Lộ, Quảng Trị' },
    { id: 4, name: 'Huyện Hương Khê, Hà Tĩnh' },
    { id: 5, name: 'Huyện Kỳ Anh, Hà Tĩnh' },
  ];
}
