import { normalizeMojibakeText, normalizeObjectStrings } from './text.js';

const TOKEN_KEY = 'token';
const ROLE_KEY = 'role';
const USER_KEY = 'user';
const CITIZEN_BLOCK_STATE_KEY = 'citizen_request_block_state';

export { normalizeMojibakeText, normalizeObjectStrings };

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);
export const getRole = () => localStorage.getItem(ROLE_KEY);
export const setRole = (role) => localStorage.setItem(ROLE_KEY, role);
export const removeRole = () => localStorage.removeItem(ROLE_KEY);

export function getUser() {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
        const parsed = JSON.parse(userStr);
        const normalized = normalizeObjectStrings(parsed);
        if (JSON.stringify(normalized) !== userStr) setUser(normalized);
        return normalized;
    } catch {
        return null;
    }
}

export function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(normalizeObjectStrings(user)));
}

export const removeUser = () => localStorage.removeItem(USER_KEY);

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
            reason: typeof parsed?.reason === 'string' ? normalizeMojibakeText(parsed.reason) : '',
            updatedAt: parsed?.updatedAt || null,
        };
    } catch {
        return { blocked: false, reason: '' };
    }
}

export function setCitizenBlockState({ blocked, reason, updatedAt } = {}) {
    localStorage.setItem(CITIZEN_BLOCK_STATE_KEY, JSON.stringify({
        blocked: Boolean(blocked),
        reason: typeof reason === 'string' ? normalizeMojibakeText(reason) : '',
        updatedAt: updatedAt || new Date().toISOString(),
    }));
}

export const clearCitizenBlockState = () => localStorage.removeItem(CITIZEN_BLOCK_STATE_KEY);
