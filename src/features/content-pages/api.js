import httpClient from '../../shared/lib/http.js';

export async function getPublicContentPage(pageKey) {
    return httpClient.get(`/public/content-pages/${pageKey}`);
}

export async function getAdminContentPages() {
    return httpClient.get('/admin/content-pages');
}

export async function updateAdminContentPages(payload) {
    return httpClient.put('/admin/content-pages', payload);
}
