import httpClient from '../../shared/lib/http.js';

function normalizePageResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  return [];
}

export async function getManagerReliefDispatchQueue(params = {}) {
  try {
    const resp = await httpClient.get('/manager/relief/requests', { params });
    return normalizePageResponse(resp);
  } catch (e) {
    const resp = await httpClient.get('/relief/requests', { params });
    return normalizePageResponse(resp);
  }
}

export async function getManagerReliefDispatchDashboard() {
  try {
    return await httpClient.get('/manager/relief/dispatch-dashboard');
  } catch (e) {
    return httpClient.get('/relief/dispatch-dashboard');
  }
}

export async function getManagerReliefDispatchRequestById(id) {
  try {
    return await httpClient.get(`/manager/relief/requests/${id}`);
  } catch (e) {
    return httpClient.get(`/relief/requests/${id}`);
  }
}

export async function approveManagerReliefDispatch(id, payload) {
  try {
    return await httpClient.put(`/manager/relief/requests/${id}/approve-dispatch`, payload);
  } catch (e) {
    return httpClient.put(`/relief/requests/${id}/approve-dispatch`, payload);
  }
}

export async function rejectManagerReliefDispatch(id, reason) {
  const body = { reason: reason || null };
  try {
    return await httpClient.put(`/manager/relief/requests/${id}/reject`, body);
  } catch (e) {
    return httpClient.put(`/relief/requests/${id}/reject`, body);
  }
}
