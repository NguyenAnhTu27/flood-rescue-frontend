/**
 * LocalStorage utilities for token and user data management
 */

const TOKEN_KEY = 'token';
const ROLE_KEY = 'role';
const USER_KEY = 'user';
const CITIZEN_BLOCK_STATE_KEY = 'citizen_request_block_state';

const MOJIBAKE_PATTERN = /(?:Ã[^\s]|Ä[^\s]|Æ[^\s]|á»|áº|â€|â€™|â€œ)/;

function normalizeMojibakeText(value) {
    if (typeof value !== 'string' || value.length === 0) {
        return value;
    }
    if (!MOJIBAKE_PATTERN.test(value)) {
        return value;
    }

    try {
        const bytes = Uint8Array.from(Array.from(value).map((ch) => ch.charCodeAt(0) & 0xff));
        const decoded = new TextDecoder('utf-8').decode(bytes);
        // Keep original if decode looks broken.
        if (!decoded || decoded.includes('\uFFFD')) {
            return value;
        }
        return decoded;
    } catch {
        return value;
    }
}

function normalizeObjectStrings(input) {
    if (Array.isArray(input)) {
        return input.map(normalizeObjectStrings);
    }
    if (input && typeof input === 'object') {
        const output = {};
        for (const [k, v] of Object.entries(input)) {
            output[k] = normalizeObjectStrings(v);
        }
        return output;
    }
    return normalizeMojibakeText(input);
}

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
    if (!userStr) return null;

    try {
        const parsed = JSON.parse(userStr);
        const normalized = normalizeObjectStrings(parsed);
        const normalizedStr = JSON.stringify(normalized);
        if (normalizedStr !== userStr) {
            localStorage.setItem(USER_KEY, normalizedStr);
        }
        return normalized;
    } catch {
        return null;
    }
}

/**
 * Save user data to localStorage
 */
export function setUser(user) {
    const normalized = normalizeObjectStrings(user);
    localStorage.setItem(USER_KEY, JSON.stringify(normalized));
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
    clearCitizenBlockState();
}

export function getCitizenBlockState() {
    const raw = localStorage.getItem(CITIZEN_BLOCK_STATE_KEY);
    if (!raw) return { blocked: false, reason: '' };
    try {
        const parsed = JSON.parse(raw);
        return {
            blocked: Boolean(parsed?.blocked),
            reason: typeof parsed?.reason === 'string' ? parsed.reason : '',
            updatedAt: parsed?.updatedAt || null,
        };
    } catch {
        return { blocked: false, reason: '' };
    }
}

export function setCitizenBlockState({ blocked, reason, updatedAt } = {}) {
    const payload = {
        blocked: Boolean(blocked),
        reason: typeof reason === 'string' ? reason : '',
        updatedAt: updatedAt || new Date().toISOString(),
    };
    localStorage.setItem(CITIZEN_BLOCK_STATE_KEY, JSON.stringify(payload));
}

export function clearCitizenBlockState() {
    localStorage.removeItem(CITIZEN_BLOCK_STATE_KEY);
}
