import { getRescueRequestById } from '../citizen/api.js';

/**
 * Rescue API - Rescue request related API calls
 *
 * ⚠️ LƯU Ý: BE không có endpoint chung "/rescue/requests".
 * Mỗi role dùng endpoint riêng:
 *   - Citizen:     /rescue/citizen/requests      → xem features/citizen/api.js
 *   - Coordinator: /rescue/coordinator/requests   → xem features/coordinator/api.js
 *   - Rescuer:     /rescue/rescuer/tasks          → xem features/rescuer/api.js
 *
 * File này re-export từ citizen API để backward-compatible với code cũ.
 */

export {
    createRescueRequest,
    getMyRescueRequests as getRescueRequests,
    getRescueRequestById as getRescueRequest,
    updateRescueRequest,
    cancelRescueRequest,
    uploadRescueAttachments,
} from '../citizen/api.js';

/**
 * @deprecated Dùng getRescueRequestById từ citizen/api.js hoặc coordinator/api.js
 */
export async function getRescueRequestStatus(id) {
    const res = await getRescueRequestById(id);
    return { status: res?.status, id: res?.id };
}
