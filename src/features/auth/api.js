import httpClient from '../../shared/lib/http.js';

export async function login(credentials) {
    return httpClient.post('/auth/login', credentials);
}

export async function register(userData) {
    return httpClient.post('/auth/register', userData);
}

export async function logout() {
    return httpClient.post('/auth/logout', {});
}

export async function getCurrentUser() {
    return httpClient.get('/users/me');
}

export async function updateMyProfile(data) {
    return httpClient.put('/users/me/profile', data);
}

export async function changeMyPassword(data) {
    return httpClient.put('/users/me/password', data);
}
