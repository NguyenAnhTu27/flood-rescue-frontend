/**
 * HTTP Client - Fetch-based API client
 * Handles authentication, error handling, and request/response interceptors
 * 
 * To use axios instead, install: npm install axios
 * Then replace this file with axios version (see API_SETUP_GUIDE.md)
 */

import { getToken } from './storage.js';
import { normalizePagination } from './httpUtils.js';

// Get API base URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Main HTTP client function
 */
async function httpClient(url, options = {}) {
    const token = getToken();
    
    // Default headers
    // Important: when sending FormData, DO NOT set Content-Type manually
    // (the browser will add the correct multipart boundary).
    const isFormDataBody =
        typeof FormData !== 'undefined' && options?.body instanceof FormData;

    const headers = {
        ...options.headers,
    };

    // Set JSON content type by default for non-FormData requests (unless caller already set it)
    if (!isFormDataBody && !headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
    }

    // If FormData, ensure Content-Type is not set (avoid boundary issues)
    if (isFormDataBody) {
        delete headers['Content-Type'];
        delete headers['content-type'];
    }

    // Add auth token if available
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    // Build full URL + query params (axios-like `params` support)
    let { params, ...fetchOptions } = options || {};
    if (params && typeof params === 'object' && !Array.isArray(params)) {
        params = normalizePagination(params);
    }

    let fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    if (params && typeof params === 'object' && !Array.isArray(params)) {
        const usp = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
            if (v === undefined || v === null || v === '') continue;
            usp.append(k, String(v));
        }
        const qs = usp.toString();
        if (qs) {
            fullUrl = fullUrl.includes('?') ? `${fullUrl}&${qs}` : `${fullUrl}?${qs}`;
        }
    }

    // #region agent log
    if (import.meta.env.VITE_AGENT_LOGGING === 'true') {
        fetch('http://127.0.0.1:7760/ingest/0fef38d5-d2ff-44cd-8a64-86cef69f9613', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Debug-Session-Id': '6a69cc',
            },
            body: JSON.stringify({
                sessionId: '6a69cc',
                runId: 'initial',
                hypothesisId: 'A',
                location: 'shared/lib/http.js:before_fetch',
                message: 'httpClient request',
                data: {
                    url: fullUrl,
                    method: fetchOptions.method || options.method || 'GET',
                    hasToken: Boolean(token),
                    hasBody: Boolean(options.body),
                    hasParams: Boolean(params),
                },
                timestamp: Date.now(),
            }),
        }).catch(() => {});
    }
    // #endregion agent log

    // Log request in development (redacted)
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG === 'true') {
        // eslint-disable-next-line no-unused-vars
        const { Authorization, authorization, ...safeHeaders } = headers || {};
        const hasBody = Boolean(options.body);
        console.log(`[API Request] ${options.method || 'GET'} ${fullUrl}`, {
            headers: safeHeaders,
            hasBody,
        });
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    try {
        const response = await fetch(fullUrl, {
            ...fetchOptions,
            headers,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle response
        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        // #region agent log
        if (import.meta.env.VITE_AGENT_LOGGING === 'true') {
            fetch('http://127.0.0.1:7760/ingest/0fef38d5-d2ff-44cd-8a64-86cef69f9613', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Debug-Session-Id': '6a69cc',
                },
                body: JSON.stringify({
                    sessionId: '6a69cc',
                    runId: 'initial',
                    hypothesisId: 'A',
                    location: 'shared/lib/http.js:after_fetch',
                    message: 'httpClient response',
                    data: {
                        url: fullUrl,
                        status: response.status,
                        ok: response.ok,
                        contentType,
                        hasData: data !== undefined && data !== null,
                    },
                    timestamp: Date.now(),
                }),
            }).catch(() => {});
        }
        // #endregion agent log

        // Log response in development (redacted)
        if (import.meta.env.DEV && import.meta.env.VITE_DEBUG === 'true') {
            console.log(`[API Response] ${options.method || 'GET'} ${url}`, {
                status: response.status,
                statusText: response.statusText,
                hasData: data !== undefined && data !== null,
            });
        }

        // Handle error responses
        if (!response.ok) {
            // Backend uses ApiResult: { success, message, data }. Validation errors (400) are in data (field → message map).
            let errorMessage = data?.message || data?.error || data?.msg || `HTTP ${response.status}: ${response.statusText}`;
            if (typeof data === 'string') {
                errorMessage = data;
            }
            // Normalize validation errors: BE sends them in ApiResult.data; legacy format used root "errors"
            const validationErrors = (response.status === 400 && data && typeof data === 'object')
                ? (data.data && typeof data.data === 'object' && !Array.isArray(data.data) ? data.data : data.errors || {})
                : {};
            const error = {
                message: errorMessage,
                status: response.status,
                data: data,
                validationErrors,
            };

            // #region agent log
            if (import.meta.env.VITE_AGENT_LOGGING === 'true') {
                fetch('http://127.0.0.1:7760/ingest/0fef38d5-d2ff-44cd-8a64-86cef69f9613', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Debug-Session-Id': '6a69cc',
                    },
                    body: JSON.stringify({
                        sessionId: '6a69cc',
                        runId: 'initial',
                        hypothesisId: 'A',
                        location: 'shared/lib/http.js:error_response',
                        message: 'httpClient non-ok response',
                        data: {
                            url: fullUrl,
                            status: response.status,
                            errorMessage,
                        },
                        timestamp: Date.now(),
                    }),
                }).catch(() => {});
            }
            // #endregion agent log

            switch (response.status) {
                case 401:
                    // Unauthorized - log error but let caller handle it
                    // Caller can decide whether to logout, retry, or show error message
                    console.error('Unauthorized (401):', error.message);
                    // Notify app-level auth handler (AuthProvider) to clear session + redirect.
                    try {
                        window.dispatchEvent(new Event('auth:unauthorized'));
                    } catch {
                        // ignore
                    }
                    // Note: Token may be invalid/expired, but we don't auto-logout here
                    // Each page/component can handle 401 as needed (e.g., show error, retry, or manual logout)
                    break;
                case 403:
                    console.error('Access forbidden:', error.message);
                    break;
                case 404:
                    console.error('Resource not found:', error.message);
                    break;
                case 500:
                    console.error('Server error:', error.message);
                    break;
                default:
                    console.error('API Error:', error.message);
            }

            throw error;
        }

        // Return data (handle different backend response formats)
        // Format 1: { success: true, data: {...} }
        // Format 2: { data: {...} }
        // Format 3: Direct response {...}
        if (data?.success && data?.data !== undefined) {
            return data.data;
        } else if (data?.data !== undefined) {
            return data.data;
        } else {
            return data;
        }
    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw {
                message: 'Request timeout. Please try again.',
                status: 0,
            };
        }

        if (error.status) {
            // Already handled above
            throw error;
        }

        // #region agent log
        if (import.meta.env.VITE_AGENT_LOGGING === 'true') {
            fetch('http://127.0.0.1:7760/ingest/0fef38d5-d2ff-44cd-8a64-86cef69f9613', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Debug-Session-Id': '6a69cc',
                },
                body: JSON.stringify({
                    sessionId: '6a69cc',
                    runId: 'initial',
                    hypothesisId: 'A',
                    location: 'shared/lib/http.js:network_error',
                    message: 'httpClient network error',
                    data: {
                        url: typeof fullUrl !== 'undefined' ? fullUrl : url,
                        apiBaseUrl: API_BASE_URL,
                        errorMessage: error.message,
                    },
                    timestamp: Date.now(),
                }),
            }).catch(() => {});
        }
        // #endregion agent log

        // Network error - provide more details
        if (import.meta.env.DEV && import.meta.env.VITE_DEBUG === 'true') {
            console.error('Network error details:', {
                message: error.message,
                url: fullUrl,
                apiBaseUrl: API_BASE_URL,
                error: error,
            });
        }
        
        // More helpful error message
        let errorMessage = 'Network error. Please check your connection.';
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
            errorMessage = `Cannot connect to backend server at ${API_BASE_URL}. Please ensure the backend is running.`;
        }
        
        throw {
            message: errorMessage,
            status: 0,
            originalError: error.message,
            url: fullUrl,
        };
    }
}

// Convenience methods
httpClient.get = (url, options = {}) => {
    return httpClient(url, { ...options, method: 'GET' });
};

httpClient.post = (url, data, options = {}) => {
    // Handle FormData (for file uploads)
    const isFormData = data instanceof FormData;
    const headers = isFormData 
        ? {} // Let browser set Content-Type for FormData
        : { 'Content-Type': 'application/json' };

    return httpClient(url, {
        ...options,
        method: 'POST',
        headers: { ...headers, ...options.headers },
        body: isFormData ? data : JSON.stringify(data),
    });
};

httpClient.put = (url, data, options = {}) => {
    return httpClient(url, {
        ...options,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        body: JSON.stringify(data),
    });
};

httpClient.patch = (url, data, options = {}) => {
    return httpClient(url, {
        ...options,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        body: JSON.stringify(data),
    });
};

httpClient.delete = (url, options = {}) => {
    return httpClient(url, { ...options, method: 'DELETE' });
};

export default httpClient;
