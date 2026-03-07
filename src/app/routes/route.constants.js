// ===============================
// ROUTE CONSTANTS
// Flood Rescue & Relief System
// ===============================

// -------- PUBLIC ROUTES --------
export const PUBLIC_ROUTES = {
    HOME: '/',
    EMERGENCY_GUIDE: '/huong-dan-khan-cap',
    NOT_FOUND: '*',
  };
  
  // -------- AUTH ROUTES --------
  export const AUTH_ROUTES = {
    LOGIN: '/dang-nhap',
    REGISTER: '/dang-ky', // chỉ Citizen dùng
  };
  
  // -------- CITIZEN ROUTES --------
  export const CITIZEN_ROUTES = {
    DASHBOARD: '/cong-dan',
    CREATE_RESCUE_REQUEST: '/cong-dan/tao-yeu-cau-cuu-ho',
    MY_RESCUE_REQUESTS: '/cong-dan/yeu-cau-cuu-ho',
    RESCUE_DETAIL: '/cong-dan/chi-tiet-cuu-ho',
    RESCUE_REQUEST_STATUS: '/cong-dan/trang-thai-cuu-ho',
    UPDATE_RESCUE_REQUEST: '/cong-dan/cap-nhat-yeu-cau',
    CANCEL_RESCUE_REQUEST: '/cong-dan/huy-yeu-cau',
    RESCUE_REQUEST_LIST: '/cong-dan/danh-sach-yeu-cau',
    FEEDBACK: '/cong-dan/phan-hoi',
  };
  
  // -------- RESCUE COORDINATOR ROUTES --------
  export const COORDINATOR_ROUTES = {
    DASHBOARD: '/dieu-phoi',
    RESCUE_QUEUE: '/dieu-phoi/danh-sach-yeu-cau',
    VERIFY_REQUEST: '/dieu-phoi/xac-minh',
    PRIORITIZE_REQUEST: '/dieu-phoi/phan-loai',
    ASSIGN_RESCUE: '/dieu-phoi/phan-cong',
    TEAM_WORKLOAD: '/dieu-phoi/theo-doi-doi-cuu-ho',
    DUPLICATE_MANAGEMENT: '/dieu-phoi/trung-lap',
    ESCALATION: '/dieu-phoi/leo-thang',
  };
  
  // -------- RESCUE TEAM ROUTES --------
  export const RESCUER_ROUTES = {
    DASHBOARD: '/doi-cuu-ho',
    MY_ASSIGNMENTS: '/doi-cuu-ho/nhiem-vu',
    ASSIGNMENT_DETAIL: '/doi-cuu-ho/nhiem-vu/:id',
    UPDATE_STATUS: '/doi-cuu-ho/cap-nhat-trang-thai',
    SAFETY_GUIDE: '/doi-cuu-ho/huong-dan-an-toan',
  };
  
  // -------- MANAGER ROUTES (RELIEF + INVENTORY) --------
  export const MANAGER_ROUTES = {
    DASHBOARD: '/quan-ly',
    INVENTORY_OVERVIEW: '/quan-ly/kho-hang',
    ITEM_CATEGORIES: '/quan-ly/danh-muc-hang',
    CREATE_RECEIPT: '/quan-ly/phieu-nhap',
    CREATE_ISSUE: '/quan-ly/phieu-xuat',
    RELIEF_REQUEST_CREATE: '/quan-ly/tao-yeu-cau-cuu-tro',
    RELIEF_APPROVE: '/quan-ly/xac-minh-cuu-tro',
    DISTRIBUTION_PLAN: '/quan-ly/phan-phoi',
    DISTRIBUTION_TRACKING: '/quan-ly/theo-doi-phan-phoi',
    ASSETS_MANAGEMENT: '/quan-ly/phuong-tien',
    REPORTS: '/quan-ly/bao-cao',
  };
  
  // -------- ADMIN ROUTES --------
  export const ADMIN_ROUTES = {
    DASHBOARD: '/admin',
    USERS_MANAGEMENT: '/admin/nguoi-dung',
    ROLES_PERMISSIONS: '/admin/phan-quyen',
    SYSTEM_CATALOG: '/admin/danh-muc-he-thong',
    SYSTEM_SETTINGS: '/admin/cau-hinh-he-thong',
    NOTIFICATION_TEMPLATES: '/admin/mau-thong-bao',
    AUDIT_LOGS: '/admin/nhat-ky-he-thong',
  };
  
  // -------- ALL PRIVATE ROUTES (OPTIONAL HELPER) --------
  export const PRIVATE_ROUTES = {
    ...CITIZEN_ROUTES,
    ...COORDINATOR_ROUTES,
    ...RESCUER_ROUTES,
    ...MANAGER_ROUTES,
    ...ADMIN_ROUTES,
  };
