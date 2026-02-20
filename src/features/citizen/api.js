/**
 * Citizen API - Citizen-specific API calls
 */

import httpClient from '../../shared/lib/http.js';

/**
 * Get citizen dashboard data
 * @returns {Promise} Dashboard statistics and recent requests
 */
export async function getCitizenDashboard() {
    const response = await httpClient.get('/citizen/dashboard');
    return response;
}

/**
 * Get citizen's rescue requests
 * @param {Object} params - Query parameters
 * @returns {Promise} List of rescue requests
 */
export async function getMyRescueRequests(params = {}) {
    const response = await httpClient.get('/rescue/citizen/requests', { params });
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
