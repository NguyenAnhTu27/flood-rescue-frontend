import httpClient from '../../shared/lib/http.js';

/**
 * Asset API - quản lý phương tiện / thiết bị cứu hộ
 */

/**
 * Tạo phương tiện / thiết bị cứu hộ
 * DTO BE (tham khảo): { code, name, assetType, capacity?, assignedTeamId?, note? }
 */
export async function createAsset(data) {
    // Gửi trực tiếp data cho BE, httpClient sẽ unwrap response
    return await httpClient.post('/admin/assets', data);
}

/**
 * Lấy danh sách phương tiện / thiết bị
 * @param {{ status?: string }} [params]
 */
export async function getAssets(params = {}) {
    return await httpClient.get('/admin/assets', {
        params,
    });
}

