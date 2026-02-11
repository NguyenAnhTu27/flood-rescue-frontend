// TODO: Thay bằng store zustand thật sau (useAuthStore)
// Tạm thời: đọc token/role từ localStorage để demo phân quyền

export function useAuth() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role'); // CITIZEN / COORDINATOR / RESCUER / MANAGER / ADMIN
    return { isAuthed: !!token, role };
}
