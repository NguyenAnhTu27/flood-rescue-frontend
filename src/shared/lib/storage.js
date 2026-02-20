/**
 * LocalStorage utilities for token and user data management
 */

const TOKEN_KEY = 'token';
const ROLE_KEY = 'role';
const USER_KEY = 'user';

/**
 * Get authentication token from localStorage
 */
export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Save authentication token to localStorage
 */
export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove authentication token from localStorage
 */
export function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

/**
 * Get user role from localStorage
 */
export function getRole() {
    return localStorage.getItem(ROLE_KEY);
}

/**
 * Save user role to localStorage
 */
export function setRole(role) {
    localStorage.setItem(ROLE_KEY, role);
}

/**
 * Remove user role from localStorage
 */
export function removeRole() {
    localStorage.removeItem(ROLE_KEY);
}

/**
 * Get user data from localStorage
 */
export function getUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * Save user data to localStorage
 */
export function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Remove user data from localStorage
 */
export function removeUser() {
    localStorage.removeItem(USER_KEY);
}

/**
 * Clear all auth-related data
 */
export function clearAuth() {
    removeToken();
    removeRole();
    removeUser();
}
