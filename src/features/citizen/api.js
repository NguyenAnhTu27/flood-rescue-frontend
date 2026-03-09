/**
 * Citizen API - Citizen-specific API calls
 */

import httpClient from '../../shared/lib/http.js';

/**
 * Get citizen dashboard data
 * @returns {Promise} Dashboard statistics and recent requests
 */
export async function getCitizenDashboard() {
    const page = await httpClient.get('/rescue/citizen/requests', {
        params: { page: 0, size: 20 },
    });

    const items = Array.isArray(page?.content) ? page.content : [];
    const latest = items[0] || null;

    return {
        latestRequest: latest,
        totalRequests: page?.totalElements ?? items.length,
        inProgressCount: items.filter((r) => r?.status === 'IN_PROGRESS').length,
        completedCount: items.filter((r) => r?.status === 'COMPLETED').length,
    };
}

/**
 * Get citizen's rescue requests
 * @param {Object} params - Query parameters
 * @returns {Promise} List of rescue requests
 */
export async function getMyRescueRequests(params = {}) {
    // Normalize pagination params across FE (page/limit) vs BE (page/size)
    // Many Spring-style APIs are 0-based: page=0 is first page.
    const normalized = { ...(params || {}) };

    if (normalized.limit !== undefined && normalized.size === undefined) {
        normalized.size = normalized.limit;
        delete normalized.limit;
    }

    if (typeof normalized.page === 'number' && normalized.page >= 1) {
        // FE previously used 1-based. Convert to 0-based to avoid "empty list" regressions.
        normalized.page = normalized.page - 1;
    }

    const response = await httpClient.get('/rescue/citizen/requests', { params: normalized });
    return response;
}

/**
 * Create new rescue request
 * @param {Object} data - Rescue request data matching BE DTO
 * @param {number} data.affectedPeopleCount - Number of people needing rescue
 * @param {string} data.description - Description
 * @param {string} data.addressText - Full address text
 * @param {string} data.priority - Priority level: "HIGH" | "MEDIUM" | "LOW"
 * @param {Array<{fileUrl: string, fileType?: string}>} data.attachments - Array of attachment objects
 * @returns {Promise} Created rescue request
 */
export async function createRescueRequest(data) {
    const response = await httpClient.post('/rescue/citizen/requests', data);
    return response;
}

/**
 * Update rescue request
 * @param {string} id - Request ID
 * @param {Object} data - Updated data matching BE RescueRequestUpdateRequest DTO
 * @returns {Promise} Updated rescue request
 */
export async function updateRescueRequest(id, data) {
    const response = await httpClient.put(`/rescue/citizen/requests/${id}`, data);
    return response;
}

/**
 * Upload rescue request attachments (images)
 * @param {File[]} files
 * @returns {Promise<Array<{fileUrl: string, fileType: string}>>}
 */
export async function uploadRescueAttachments(files) {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append('files', file);
    });

    const response = await httpClient.post('/rescue/citizen/attachments', formData);
    return response;
}

/**
 * Cancel rescue request
 * @param {string} id - Request ID
 * @returns {Promise}
 */
export async function cancelRescueRequest(id) {
    const response = await httpClient.delete(`/rescue/citizen/requests/${id}`);
    return response;
}

/**
 * Get rescue request by ID
 * @param {string} id - Request ID
 * @returns {Promise} Rescue request data
 */
export async function getRescueRequestById(id) {
    const response = await httpClient.get(`/rescue/citizen/requests/${id}`);
    return response;
}

/**
 * Citizen confirms whether rescue result is successful in real life.
 * @param {string|number} id
 * @param {{rescued:boolean, reason?:string}} payload
 * @returns {Promise<{rescued:boolean, originalRequestId:number, followUpRequestId:number|null, message:string}>}
 */
export async function confirmRescueResult(id, payload) {
    return httpClient.post(`/rescue/citizen/requests/${id}/confirm-result`, payload);
}

export async function reopenCancelledRequest(id, reason) {
    return httpClient.post(`/rescue/citizen/requests/${id}/reopen`, {
        reason: reason || null,
    });
}
