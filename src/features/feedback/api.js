import httpClient from '../../shared/lib/http.js';
import { normalizePagination } from '../../shared/lib/httpUtils.js';

export async function createCitizenSystemFeedback(payload) {
    return httpClient.post('/feedback/citizen', payload);
}

export async function getAdminSystemFeedbacks(params = {}) {
  return httpClient.get('/feedback/admin', { params: normalizePagination(params) });
}

export async function getAdminSystemFeedbackSummary() {
    return httpClient.get('/feedback/admin/summary');
}
