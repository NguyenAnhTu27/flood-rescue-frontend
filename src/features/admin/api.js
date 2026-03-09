/**
 * Admin API - quản lý đội cứu hộ & phương tiện
 */

import httpClient from '../../shared/lib/http.js';

// ===== TEAM =====

export async function createTeam(data) {
    return await httpClient.post('/admin/teams', data);
}

export async function getTeams() {
    return await httpClient.get('/admin/teams');
}

// ===== ASSET =====
// Backend exposes assets at /api/assets

export async function createAsset(data) {
    return await httpClient.post('/assets', data);
}

export async function getAssets(status) {
    return await httpClient.get('/assets', {
        params: status ? { status } : undefined,
    });
}
