import httpClient from '../../shared/lib/http.js';
import { normalizePagination } from '../../shared/lib/httpUtils.js';

function parseApiResult(response, { checkSuccess = false } = {}) {
  const root = response?.data ?? response;
  const wrapped = root?.result && typeof root.result === 'object' ? root.result : root;

  if (checkSuccess && Object.prototype.hasOwnProperty.call(wrapped || {}, 'success') && wrapped.success === false) {
    const message = wrapped?.message || root?.message || 'ApiResult indicates request failed.';
    const error = new Error(message);
    error.data = wrapped;
    throw error;
  }

  if (Object.prototype.hasOwnProperty.call(wrapped || {}, 'data')) {
    return wrapped.data;
  }

  return wrapped;
}

/**
 * MANAGER (CỨU TRỢ) DASHBOARD
 * Backend: GET /api/relief/dashboard hoặc /api/manager/relief/dashboard
 */
export async function getManagerDashboard() {
  // BE mapping hỗ trợ cả /api/manager/relief/dashboard và /api/relief/dashboard
  return httpClient.get('/manager/relief/dashboard');
}

/**
 * INVENTORY RECEIPTS (phiếu nhập kho)
 * Backend base path: /api/inventory/receipts
 */

// Lấy danh sách phiếu nhập kho
export async function listInventoryReceipts(params = {}) {
  const response = await httpClient.get('/inventory/receipts', { params: normalizePagination(params) });
  return parseApiResult(response, { checkSuccess: true });
}

// Tạo phiếu nhập kho mới
export async function createInventoryReceipt(payload) {
  return httpClient.post('/inventory/receipts', payload);
}

// Lấy chi tiết 1 phiếu nhập kho
export async function getInventoryReceipt(id) {
  const response = await httpClient.get(`/inventory/receipts/${id}`);
  return parseApiResult(response, { checkSuccess: true });
}

// Duyệt phiếu nhập kho
export async function approveInventoryReceipt(id) {
  return httpClient.put(`/inventory/receipts/${id}/approve`);
}

// Hủy phiếu nhập kho
export async function cancelInventoryReceipt(id) {
  return httpClient.put(`/inventory/receipts/${id}/cancel`);
}

/**
 * INVENTORY ISSUES (phiếu xuất kho)
 * Backend base path: /api/inventory/issues
 */

// Lấy danh sách phiếu xuất kho
export async function listInventoryIssues(params = {}) {
  const response = await httpClient.get('/inventory/issues', { params: normalizePagination(params) });
  return parseApiResult(response, { checkSuccess: true });
}

// Tạo phiếu xuất kho mới
export async function createInventoryIssue(payload) {
  return httpClient.post('/inventory/issues', payload);
}

// Lấy chi tiết 1 phiếu xuất kho
export async function getInventoryIssue(id) {
  const response = await httpClient.get(`/inventory/issues/${id}`);
  return parseApiResult(response, { checkSuccess: true });
}

// Duyệt phiếu xuất kho
export async function approveInventoryIssue(id) {
  return httpClient.put(`/inventory/issues/${id}/approve`);
}

// Hủy phiếu xuất kho
export async function cancelInventoryIssue(id) {
  return httpClient.put(`/inventory/issues/${id}/cancel`);
}

export async function getTemporaryInventoryIssues() {
  const response = await httpClient.get('/inventory/issues/temporary');
  return parseApiResult(response, { checkSuccess: true });
}

export async function generateInventoryIssueCode() {
  return httpClient.get('/inventory/issues/generate-code');
}

/**
 * DISTRIBUTION VOUCHERS (phiếu điều phối giao hàng)
 * LƯU Ý: Frontend đã có apiDistribution.js gọi trực tiếp /distributions.
 * Nếu muốn dùng qua file này thì route BE là: /api/distributions
 */

// Tạo phiếu điều phối giao hàng
export async function createDistributionVoucher(payload) {
  return httpClient.post('/distributions', payload);
}

// Danh sách phiếu điều phối
export async function listDistributionVouchers(params = {}) {
  return httpClient.get('/distributions', { params: normalizePagination(params) });
}

/**
 * INVENTORY STOCK (tồn kho hiện tại)
 * Backend: GET /api/inventory/stock
 */
export async function getInventoryStock(params = {}) {
  const response = await httpClient.get('/inventory/stock', { params: normalizePagination(params) });
  return parseApiResult(response, { checkSuccess: true });
}

/**
 * ITEM CATEGORIES / ITEMS (danh mục hàng hóa)
 * Backend: GET /api/inventory/items
 */
export async function getItemCategories(params = {}) {
  const response = await httpClient.get('/inventory/items', { params: normalizePagination(params) });
  return parseApiResult(response, { checkSuccess: true });
}

export async function createItemCategory(payload) {
  return httpClient.post('/inventory/items', payload);
}

export async function deleteItemCategory(id) {
  return httpClient.delete(`/inventory/items/${id}`);
}

export async function getItemClassifications() {
  const response = await httpClient.get('/inventory/item-classifications');
  return parseApiResult(response, { checkSuccess: true });
}

export async function createItemClassification(payload) {
  return httpClient.post('/inventory/item-classifications', payload);
}

export async function deleteItemClassification(id) {
  return httpClient.delete(`/inventory/item-classifications/${id}`);
}

export async function getItemUnits() {
  const response = await httpClient.get('/inventory/item-units');
  return parseApiResult(response, { checkSuccess: true });
}

export async function createItemUnit(payload) {
  return httpClient.post('/inventory/item-units', payload);
}

export async function deleteItemUnit(id) {
  return httpClient.delete(`/inventory/item-units/${id}`);
}

/**
 * RELIEF REQUESTS (yêu cầu cứu trợ)
 * Backend: POST/GET /api/relief/requests
 */

// Lấy danh sách yêu cầu cứu trợ (cho Coordinator/Manager)
export async function listReliefRequests(params = {}) {
  return httpClient.get('/relief/requests', { params: normalizePagination(params) });
}

// Lấy chi tiết yêu cầu cứu trợ
export async function getReliefRequest(id) {
  return httpClient.get(`/relief/requests/${id}`);
}

// Tạo yêu cầu cứu trợ mới
export async function createReliefRequest(payload) {
  return httpClient.post('/relief/requests', payload);
}

// Cập nhật yêu cầu cứu trợ (lưu ý: BE không có PUT /relief/requests/:id; với citizen dùng updateMyCitizenReliefRequest)
export async function updateReliefRequest(id, payload) {
  return httpClient.put(`/relief/requests/${id}`, payload);
}

// Duyệt yêu cầu cứu trợ
export async function approveReliefRequest(id) {
  return httpClient.put(`/relief/requests/${id}/approve`);
}

// Từ chối yêu cầu cứu trợ
export async function rejectReliefRequest(id, reason) {
  return httpClient.put(`/relief/requests/${id}/reject`, { reason });
}

// Duyệt và điều phối luôn (có thể custom payload điều phối)
export async function approveAndDispatchReliefRequest(id, payload) {
  return httpClient.put(`/relief/requests/${id}/approve-dispatch`, payload);
}

export async function rejectReliefRequestByManager(id, reason) {
  return httpClient.put(`/relief/requests/${id}/reject`, { reason });
}

// CITIZEN (Yêu cầu cứu trợ của cá nhân)
// Backend: /api/relief/citizen/requests
export async function getMyCitizenReliefRequests(params = {}) {
  return httpClient.get('/relief/citizen/requests', { params: normalizePagination(params) });
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

// RESCUER
export async function getRescuerReliefRequests(params = {}) {
  return httpClient.get('/relief/rescuer/requests', { params: normalizePagination(params) });
}

export async function updateRescuerReliefStatus(id, payload) {
  return httpClient.put(`/relief/rescuer/requests/${id}/delivery-status`, payload);
}

// Utils
export async function saveReliefRequestDraft(payload) {
  // BE không có endpoint riêng, dùng chung với status DRAFT
  return httpClient.post('/relief/requests', { ...payload, status: 'DRAFT' });
}

export async function generateReliefRequestCode() {
  return httpClient.get('/relief/requests/generate-code');
}

/**
 * TEAMS (danh sách đội cứu hộ)
 * Backend: GET /api/admin/teams
 */
export async function listTeams(params = {}) {
  return httpClient.get('/admin/teams', { params: normalizePagination(params) });
}

/**
 * AREA / LOCATIONS
 * Backend: GET /api/areas
 */
export async function getAreas() {
  return httpClient.get('/areas');
}
