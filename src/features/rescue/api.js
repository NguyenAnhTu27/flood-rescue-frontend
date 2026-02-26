/**
 * Rescue API - Rescue request related API calls
 */

import httpClient from '../../shared/lib/http.js';

/**
 * Get all rescue requests for current user
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise} List of rescue requests
 */
export async function getRescueRequests(params = {}) {
    const response = await httpClient.get('/rescue/requests', { params });
    return response;
}

/**
 * Get single rescue request by ID
 * @param {string} id - Request ID
 * @returns {Promise} Rescue request data
 */
export async function getRescueRequest(id) {
    const response = await httpClient.get(`/rescue/requests/${id}`);
    return response;
}

/**
 * Create new rescue request (Citizen)
 * @param {Object} data - Rescue request data matching BE DTO
 * @param {number} data.affectedPeopleCount - Number of people needing rescue
 * @param {string} data.description - Description
 * @param {string} data.addressText - Full address text
 * @param {string} data.priority - Priority level: "HIGH" | "MEDIUM" | "LOW"
 * @param {Array<{fileUrl: string, fileType?: string}>} data.attachments - Array of attachment objects with fileUrl
 * @returns {Promise} Created rescue request
 */
export async function createRescueRequest(data) {
    // Backend expects JSON format, not FormData
    // Note: For file uploads, you need to upload files first to get fileUrl,
    // then include those URLs in the attachments array
    const response = await httpClient.post('/rescue/citizen/requests', data);
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

    // httpClient.post will handle FormData correctly
    const response = await httpClient.post('/rescue/citizen/attachments', formData);
    // BE returns a plain array of { fileUrl, fileType }
    return response;
}

/**
 * Update rescue request
 * @param {string} id - Request ID
 * @param {Object} data - Updated data
 * @returns {Promise} Updated rescue request
 */
export async function updateRescueRequest(id, data) {
    const response = await httpClient.put(`/rescue/requests/${id}`, data);
    return response;
}

/**
 * Cancel rescue request
 * @param {string} id - Request ID
 * @returns {Promise}
 */
export async function cancelRescueRequest(id) {
    const response = await httpClient.post(`/rescue/requests/${id}/cancel`);
    return response;
}

/**
 * Get rescue request status
 * @param {string} id - Request ID
 * @returns {Promise} Status information
 */
export async function getRescueRequestStatus(id) {
    const response = await httpClient.get(`/rescue/requests/${id}/status`);
    return response;
}
