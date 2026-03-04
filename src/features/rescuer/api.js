/**
 * Rescuer API - Rescue team (RESCUER) specific API calls
 */
import httpClient from '../../shared/lib/http.js';

/**
 * Get rescuer dashboard data (team info + current missions/task-groups)
 *
 * NOTE: Backend route naming in this project is not fully consistent
 * (ex: citizen uses `/citizen/dashboard` while coordinator uses `/rescue/coordinator/dashboard`).
 * We try the most likely endpoint first, then fall back on 404.
 */
export async function getRescuerDashboard() {
  try {
    return await httpClient.get('/rescuer/dashboard');
  } catch (e) {
    if (e?.status === 404) {
      return await httpClient.get('/rescue/rescuer/dashboard');
    }
    throw e;
  }
}

/**
 * Get rescuer task-group detail by id (to load requests/assets/location for UI)
 * We try several likely endpoints because BE route naming may vary.
 */
export async function getRescuerTaskGroupById(id) {
  const candidates = [
    `/rescuer/task-groups/${id}`,
    `/rescue/rescuer/task-groups/${id}`,
    // fallback variants (some BEs use camelCase / no dash)
    `/rescuer/taskGroups/${id}`,
    `/rescue/rescuer/taskGroups/${id}`,
  ];

  let lastErr = null;
  for (const url of candidates) {
    try {
      return await httpClient.get(url);
    } catch (e) {
      lastErr = e;
      // Try next only for 404; for other errors bubble up
      if (e?.status !== 404) throw e;
    }
  }
  throw lastErr || new Error('Cannot load task-group detail');
}

async function putStatusWithCandidates({ id, status, note, bases }) {
  const params = new URLSearchParams();
  params.set('status', status);
  if (note) params.set('note', note);

  let lastErr = null;
  for (const base of bases) {
    const url = `${base}/${id}/status?${params.toString()}`;
    try {
      return await httpClient.put(url);
    } catch (e) {
      lastErr = e;
      // Với 404/401/403: thử endpoint tiếp theo (có thể BE dùng route khác hoặc role khác)
      if (e?.status !== 404 && e?.status !== 401 && e?.status !== 403) {
        throw e;
      }
    }
  }
  throw lastErr || new Error('Cannot update status');
}

/**
 * Update a rescue-request status from rescuer side (so citizen timeline can update).
 * We try multiple likely endpoints due to BE route naming differences.
 */
export async function updateRescueRequestStatusAsRescuer(id, status, note) {
  const bases = [
    '/rescuer/requests',
    '/rescue/rescuer/requests',
    '/rescuer/rescue-requests',
    '/rescue/rescuer/rescue-requests',
    // Sometimes public rescue routes allow updating by assigned team
    '/rescue/requests',
    // Last resort (may 403 if role is not coordinator)
    '/rescue/coordinator/requests',
  ];
  return await putStatusWithCandidates({ id, status, note, bases });
}

/**
 * Update a task-group status (optional, used if BE models mission at task-group level).
 */
export async function updateTaskGroupStatusAsRescuer(id, status, note) {
  const bases = [
    '/rescuer/task-groups',
    '/rescue/rescuer/task-groups',
    '/rescuer/taskGroups',
    '/rescue/rescuer/taskGroups',
    // Coordinator route fallback (may 403)
    '/rescue/coordinator/task-groups',
  ];
  return await putStatusWithCandidates({ id, status, note, bases });
}
