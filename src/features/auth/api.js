/**
 * Auth API - Authentication related API calls
 */

import httpClient from '../../shared/lib/http.js';

function extractPayload(response) {
    const root = response?.data ?? response;
    if (root?.result && typeof root.result === 'object') {
        const result = root.result;
        if (Object.prototype.hasOwnProperty.call(result, 'data')) return result.data;
        return result;
    }
    if (Object.prototype.hasOwnProperty.call(root || {}, 'data')) {
        return root.data;
    }
    return root;
}

/**
 * Login API
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.identifier - User email or phone (BE field: identifier)
 * @param {string} credentials.password - User password
 * @returns {Promise<{token: string, tokenType: string, userId: number, fullName: string, role: string}>}
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
 * @param {string} userData.password - Password (min 6 chars, must contain uppercase, lowercase, digit)
 * @returns {Promise<{message: string}>} Success message (no token — user must login after register)
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
    try {
        const response = await httpClient.get('/api/auth/me');
        return extractPayload(response);
    } catch (error) {
        const response = await httpClient.get('/auth/me');
        return extractPayload(response);
    }
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
 * Request password reset (BE: ForgotPasswordRequest { identifier })
 * @param {string} identifier - User email or phone (BE field: identifier)
 * @returns {Promise}
 */
export async function forgotPassword(identifier) {
    const response = await httpClient.post('/auth/forgot-password', { identifier });
    return response;
}

/**
 * Reset password with token (BE: ResetPasswordRequest { token, newPassword })
 * @param {Object} data - Reset password data
 * @param {string} data.token - Reset token from email/link
 * @param {string} data.newPassword - New password (or pass data.password, will be sent as newPassword)
 * @returns {Promise}
 */
export async function resetPassword(data) {
    const payload = {
        token: data.token,
        newPassword: data.newPassword != null ? data.newPassword : data.password,
    };
    const response = await httpClient.post('/auth/reset-password', payload);
    return response;
}
