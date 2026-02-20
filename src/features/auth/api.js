/**
 * Auth API - Authentication related API calls
 */

import httpClient from '../../shared/lib/http.js';

/**
 * Login API
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email or phone
 * @param {string} credentials.password - User password
 * @param {string} credentials.role - User role (CITIZEN, COORDINATOR, etc.)
 * @returns {Promise} User data and token
 */
export async function login(credentials) {
    const response = await httpClient.post('/auth/login', credentials);
    return response;
}

/**
 * Register API (Citizen only)
 * @param {Object} userData - User registration data
 * @param {string} userData.fullName - Full name
 * @param {string} userData.phone - Phone number
 * @param {string} userData.email - Email (optional)
 * @param {string} userData.password - Password
 * @returns {Promise} User data and token
 */
export async function register(userData) {
    const response = await httpClient.post('/auth/register', userData);
    return response;
}

/**
 * Logout API
 * @returns {Promise}
 */
export async function logout() {
    const response = await httpClient.post('/auth/logout');
    return response;
}

/**
 * Get current user profile
 * @returns {Promise} User data
 */
export async function getCurrentUser() {
    const response = await httpClient.get('/auth/me');
    return response;
}

/**
 * Refresh access token
 * @returns {Promise} New token
 */
export async function refreshToken() {
    const response = await httpClient.post('/auth/refresh');
    return response;
}

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise}
 */
export async function forgotPassword(email) {
    const response = await httpClient.post('/auth/forgot-password', { email });
    return response;
}

/**
 * Reset password with token
 * @param {Object} data - Reset password data
 * @param {string} data.token - Reset token
 * @param {string} data.password - New password
 * @returns {Promise}
 */
export async function resetPassword(data) {
    const response = await httpClient.post('/auth/reset-password', data);
    return response;
}
