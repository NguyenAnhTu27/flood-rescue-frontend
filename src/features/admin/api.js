/**
 * Admin API - quản lý đội cứu hộ & phương tiện
 */

import httpClient from '../../shared/lib/http.js';

// ===== TEAM =====

/**
 * Tạo đội cứu hộ mới
 * @param {{ name: string; description?: string | null }} data
 */
export async function createTeam(data) {
    // httpClient đã unwrap data từ BE, không trả kiểu axios response
    return await httpClient.post('/admin/teams', data);
}

/**
 * Lấy danh sách đội cứu hộ
 */
export async function getTeams() {
    // httpClient đã unwrap data từ BE, không trả kiểu axios response
    return await httpClient.get('/admin/teams');
}

// ===== ASSET =====
// BE AssetController mapped at /api/assets (không phải /api/admin/assets)

/**
 * Tạo phương tiện / thiết bị cứu hộ
 * @param {{ code: string; name: string; assetType: string; capacity?: number | null; assignedTeamId?: number | null; note?: string | null }} data
 */
export async function createAsset(data) {
    return await httpClient.post('/assets', data);
}

/**
 * Lấy danh sách phương tiện / thiết bị (có thể filter theo status)
 * @param {string} [status]
 */
export async function getAssets(status) {
    return await httpClient.get('/assets', {
        params: status ? { status } : undefined,
    });
}

