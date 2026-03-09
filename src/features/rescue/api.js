/**
 * Rescue API - Citizen rescue request related API calls
 */

import httpClient from '../../shared/lib/http.js';

function normalizePagination(params = {}) {
    const normalized = { ...(params || {}) };

    if (normalized.limit !== undefined && normalized.size === undefined) {
        normalized.size = normalized.limit;
        delete normalized.limit;
    }

    if (typeof normalized.page === 'number' && normalized.page >= 1) {
        normalized.page = normalized.page - 1;
    }

    return normalized;
}

export async function getRescueRequests(params = {}) {
    const response = await httpClient.get('/rescue/citizen/requests', {
        params: normalizePagination(params),
    });
    return response;
}

export async function getRescueRequest(id) {
    const response = await httpClient.get(`/rescue/citizen/requests/${id}`);
    return response;
}

export async function createRescueRequest(data) {
    const response = await httpClient.post('/rescue/citizen/requests', data);
    return response;
}

export async function uploadRescueAttachments(files) {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append('files', file);
    });

    const response = await httpClient.post('/rescue/citizen/attachments', formData);
    return response;
}

export async function updateRescueRequest(id, data) {
    const response = await httpClient.put(`/rescue/citizen/requests/${id}`, data);
    return response;
}

export async function cancelRescueRequest(id) {
    const response = await httpClient.delete(`/rescue/citizen/requests/${id}`);
    return response;
}

export async function getRescueRequestStatus(id) {
    const response = await httpClient.get(`/rescue/citizen/requests/${id}`);
    return {
        status: response?.status,
        requestStatus: response?.status,
        data: response,
    };
}
