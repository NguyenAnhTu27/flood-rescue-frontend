// ===============================
// ROUTE CONSTANTS
// Flood Rescue & Relief System
// ===============================

// -------- PUBLIC ROUTES --------
export const PUBLIC_ROUTES = {
    HOME: '/',
    EMERGENCY_GUIDE: '/huong-dan-khan-cap',
    TERMS_OF_USE: '/dieu-khoan-su-dung',
    PRIVACY_POLICY: '/chinh-sach-bao-mat',
    SUPPORT_CONTACT: '/lien-he-ho-tro',
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
    MY_RESCUE_REQUESTS: '/cong-dan/yeu-cau-cuu-ho',
    CREATE_RESCUE_REQUEST: '/cong-dan/tao-yeu-cau-cuu-ho',
    RESCUE_REQUEST_STATUS: '/cong-dan/trang-thai-cuu-ho',
    UPDATE_RESCUE_REQUEST: '/cong-dan/cap-nhat-yeu-cau',
    FEEDBACK: '/cong-dan/phan-hoi',
  };
  
  // -------- RESCUE COORDINATOR ROUTES --------
  export const COORDINATOR_ROUTES = {
    DASHBOARD: '/dieu-phoi',
    TASK_MONITOR: '/dieu-phoi/giam-sat-nhiem-vu',
    VERIFY_REQUEST: '/dieu-phoi/xac-minh',
    PRIORITIZE_REQUEST: '/dieu-phoi/phan-loai',
    ASSIGN_RESCUE: '/dieu-phoi/phan-cong',
    TEAM_WORKLOAD: '/dieu-phoi/theo-doi-doi-cuu-ho',
    TASK_HISTORY: '/dieu-phoi/lich-su-cuu-ho',
    DUPLICATE_MANAGEMENT: '/dieu-phoi/trung-lap',
    BLOCKED_CITIZENS: '/dieu-phoi/da-khoa',
  };
  
  // -------- RESCUE TEAM ROUTES --------
  export const RESCUER_ROUTES = {
    DASHBOARD: '/doi-cuu-ho',
    MY_ASSIGNMENTS: '/doi-cuu-ho/nhiem-vu',
    ASSIGNMENT_DETAIL: '/doi-cuu-ho/nhiem-vu/:id',
    RELIEF_PRIORITIZE: '/doi-cuu-ho/sap-xep-yeu-cau-cuu-tro',
    RELIEF_PRIORITIZE_DETAIL: '/doi-cuu-ho/sap-xep-yeu-cau-cuu-tro/:id',
    SAFETY_GUIDE: '/doi-cuu-ho/lich-su',
  };
  
  // -------- MANAGER ROUTES (RELIEF + INVENTORY) --------
  export const MANAGER_ROUTES = {
    DASHBOARD: '/quan-ly',
    RELIEF_REQUESTS: '/quan-ly/yeu-cau-cuu-tro',
    INVENTORY_OVERVIEW: '/quan-ly/kho-hang',
    ITEM_CATEGORIES: '/quan-ly/danh-muc-hang',
    ITEM_CLASSIFICATIONS: '/quan-ly/phan-loai-hang',
    ITEM_UNITS: '/quan-ly/don-vi',
    CREATE_RECEIPT: '/quan-ly/phieu-nhap',
    CREATE_ISSUE: '/quan-ly/phieu-xuat',
    RELIEF_TEAM_MANAGEMENT: '/quan-ly/doi-cuu-ho-cuu-tro',
    RELIEF_APPROVED_ISSUES: '/quan-ly/yeu-cau-cuu-tro-da-duyet-phieu-xuat',
    RELIEF_REQUEST_CREATE: '/quan-ly/tao-yeu-cau-cuu-tro',
    ASSETS_MANAGEMENT: '/quan-ly/phuong-tien',
    CREATE_ASSET: '/quan-ly/tao-phuong-tien',
  };
  
  // -------- ADMIN ROUTES --------
  export const ADMIN_ROUTES = {
    DASHBOARD: '/admin',
    USERS_MANAGEMENT: '/admin/nguoi-dung',
    TEAMS_MANAGEMENT: '/admin/doi-cuu-ho',
    CREATE_TEAM: '/admin/tao-doi-cuu-ho',
    SYSTEM_SETTINGS: '/admin/cau-hinh-he-thong',
    AUDIT_LOGS: '/admin/nhat-ky-he-thong',
    SYSTEM_FEEDBACKS: '/admin/phan-hoi-he-thong',
    CONTENT_PAGES: '/admin/noi-dung-trang',
  };
  
  // -------- ALL PRIVATE ROUTES (OPTIONAL HELPER) --------
  export const PRIVATE_ROUTES = {
    ...CITIZEN_ROUTES,
    ...COORDINATOR_ROUTES,
    ...RESCUER_ROUTES,
    ...MANAGER_ROUTES,
    ...ADMIN_ROUTES,
  };
