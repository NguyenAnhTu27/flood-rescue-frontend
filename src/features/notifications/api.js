import httpClient from '../../shared/lib/http.js';
import { normalizePagination } from '../../shared/lib/httpUtils.js';

export async function getMyNotifications(params = {}) {
  return httpClient.get('/notifications/me', { params: normalizePagination(params) });
}

export async function getUnreadNotificationCount() {
  return httpClient.get('/notifications/me/unread-count');
}

export async function markNotificationRead(id) {
  return httpClient.post(`/notifications/${id}/read`, {});
}

export async function markAllNotificationsRead() {
  return httpClient.post('/notifications/me/read-all', {});
}

export async function queueEmergencyNotification(id, { direct = true, note } = {}) {
  return httpClient.post(`/notifications/${id}/queue`, {
    direct,
    note: note || null,
  });
}

export async function overloadEmergencyNotification(queueRequestId, note) {
  return httpClient.post('/notifications/emergency/overload', {
    queueRequestId,
    note: note || null,
  });
}
