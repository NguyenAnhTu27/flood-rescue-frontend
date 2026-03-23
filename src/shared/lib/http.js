import { getToken } from './storage.js';
import { normalizeMojibakeText, normalizeObjectStrings } from './text.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

async function httpClient(url, options = {}) {
    const token = getToken();
    const isFormDataBody = typeof FormData !== 'undefined' && options?.body instanceof FormData;
    const headers = { ...options.headers };

    if (!isFormDataBody && !headers['Content-Type'] && !headers['content-type']) headers['Content-Type'] = 'application/json';
    if (isFormDataBody) {
        delete headers['Content-Type'];
        delete headers['content-type'];
    }
    if (token) headers.Authorization = `Bearer ${token}`;

    const { params, ...fetchOptions } = options || {};
    let fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    if (params && typeof params === 'object' && !Array.isArray(params)) {
        const usp = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') return;
            usp.append(key, String(value));
        });
        const qs = usp.toString();
        if (qs) fullUrl = fullUrl.includes('?') ? `${fullUrl}&${qs}` : `${fullUrl}?${qs}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
        const response = await fetch(fullUrl, { ...fetchOptions, headers, signal: controller.signal });
        clearTimeout(timeoutId);
        const contentType = response.headers.get('content-type');
        const data = contentType && contentType.includes('application/json')
            ? normalizeObjectStrings(await response.json())
            : normalizeMojibakeText(await response.text());
        if (!response.ok) {
            throw {
                message: normalizeMojibakeText(data?.message || data?.error || data?.msg || `HTTP ${response.status}: ${response.statusText}`),
                status: response.status,
                data,
            };
        }
        if (data?.success && data?.data !== undefined) return normalizeObjectStrings(data.data);
        if (data?.data !== undefined) return normalizeObjectStrings(data.data);
        return normalizeObjectStrings(data);
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') throw { message: 'Hết thời gian chờ phản hồi từ máy chủ.', status: 0 };
        if (error.status) throw error;
        const originalError = normalizeMojibakeText(error.message || '');
        const message = originalError.includes('Failed to fetch') || originalError.includes('NetworkError')
            ? `Không thể kết nối tới backend tại ${API_BASE_URL}. Vui lòng kiểm tra backend đang chạy.`
            : 'Lỗi kết nối mạng. Vui lòng kiểm tra lại.';
        throw { message, status: 0, originalError, url: fullUrl };
    }
}

httpClient.get = (url, options = {}) => httpClient(url, { ...options, method: 'GET' });
httpClient.post = (url, data, options = {}) => httpClient(url, {
    ...options,
    method: 'POST',
    headers: data instanceof FormData ? { ...options.headers } : { 'Content-Type': 'application/json', ...options.headers },
    body: data instanceof FormData ? data : JSON.stringify(data),
});
httpClient.put = (url, data, options = {}) => httpClient(url, { ...options, method: 'PUT', headers: { 'Content-Type': 'application/json', ...options.headers }, body: JSON.stringify(data) });
httpClient.patch = (url, data, options = {}) => httpClient(url, { ...options, method: 'PATCH', headers: { 'Content-Type': 'application/json', ...options.headers }, body: JSON.stringify(data) });
httpClient.delete = (url, options = {}) => httpClient(url, { ...options, method: 'DELETE' });

export default httpClient;
