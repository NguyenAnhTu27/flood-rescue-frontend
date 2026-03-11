import httpClient from '../../shared/lib/http.js';

export async function getRescuerDashboard() {
  return httpClient.get('/rescue/rescuer/dashboard');
}

export async function getRescuerTasks(params = {}) {
  return httpClient.get('/rescue/rescuer/tasks', { params });
}

export async function getRescuerTaskById(id) {
  return httpClient.get(`/rescue/rescuer/tasks/${id}`);
}

export async function updateRescuerTaskStatus(id, status, note) {
  const params = new URLSearchParams();
  params.set('status', status);
  if (note) params.set('note', note);
  return httpClient.put(`/rescue/rescuer/tasks/${id}/status?${params.toString()}`);
}

export async function addRescuerTaskNote(id, note) {
  return httpClient.post(`/rescue/rescuer/tasks/${id}/notes`, { note });
}

export async function getRescuerTaskGroups(params = {}) {
  return httpClient.get('/rescue/rescuer/task-groups', { params });
}

export async function getRescuerTaskGroupById(id) {
  return httpClient.get(`/rescue/rescuer/task-groups/${id}`);
}

export async function updateRescuerTaskGroupStatus(id, status, note) {
  const params = new URLSearchParams();
  params.set('status', status);
  if (note) params.set('note', note);
  return httpClient.put(`/rescue/rescuer/task-groups/${id}/status?${params.toString()}`);
}

export async function escalateRescuerTaskGroup(id, { severity, reason }) {
  return httpClient.post(`/rescue/rescuer/task-groups/${id}/escalate`, {
    severity,
    reason,
  });
}

export async function getRescuerEmergencyAcks(taskGroupId) {
  return httpClient.get(`/rescue/rescuer/task-groups/${taskGroupId}/emergency-acks`);
}

export async function updateRescuerTeamLocation({ latitude, longitude, locationText }) {
  return httpClient.post('/rescue/rescuer/team-location', {
    latitude,
    longitude,
    locationText: locationText || null,
  });
}

export async function returnRescuerTeamAssets() {
  return httpClient.post('/rescue/rescuer/assets/return');
}

// Backward-compatible exports used by existing pages
export async function updateRescueRequestStatusAsRescuer(id, status, note) {
  return updateRescuerTaskStatus(id, status, note);
}

export async function updateTaskGroupStatusAsRescuer(id, status, note) {
  return updateRescuerTaskGroupStatus(id, status, note);
}
