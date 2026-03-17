// ===============================
// ROUTE CONSTANTS
// Flood Rescue & Relief System
// ===============================

// -------- PUBLIC ROUTES --------
export const PUBLIC_ROUTES = {
    HOME: '/',
    EMERGENCY_GUIDE: '/huong-dan-khan-cap',
    TERMS_OF_USE: '/tuyen-bo-mien-tru-trach-nhiem',
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
    CREATE_RELIEF_REQUEST: '/cong-dan/tao-yeu-cau-cuu-tro',
    RESCUE_REQUEST_STATUS: '/cong-dan/trang-thai-cuu-ho',
    RELIEF_REQUEST_STATUS: '/cong-dan/trang-thai-cuu-tro',
    MY_RELIEF_REQUESTS: '/cong-dan/yeu-cau-cuu-tro',
    UPDATE_RESCUE_REQUEST: '/cong-dan/cap-nhat-yeu-cau',
    UPDATE_RELIEF_REQUEST: '/cong-dan/cap-nhat-yeu-cau-cuu-tro',
    FEEDBACK: '/cong-dan/phan-hoi',
  };
  
  // -------- RESCUE COORDINATOR ROUTES --------
  export const COORDINATOR_ROUTES = {
    DASHBOARD: '/dieu-phoi',
    RESCUE_QUEUE: '/dieu-phoi/danh-sach-yeu-cau',
    TASK_MONITOR: '/dieu-phoi/giam-sat-nhiem-vu',
    VERIFY_REQUEST: '/dieu-phoi/xac-minh',
    PRIORITIZE_REQUEST: '/dieu-phoi/phan-loai',
    ASSIGN_RESCUE: '/dieu-phoi/phan-cong',
    MERGE_REQUESTS: '/dieu-phoi/gop-yeu-cau',
    TEAM_WORKLOAD: '/dieu-phoi/theo-doi-doi-cuu-ho',
    TASK_HISTORY: '/dieu-phoi/lich-su-cuu-ho',
    DUPLICATE_MANAGEMENT: '/dieu-phoi/trung-lap',
    ESCALATION: '/dieu-phoi/leo-thang',
    BLOCKED_CITIZENS: '/dieu-phoi/da-khoa',
  };
  
  // -------- RESCUE TEAM ROUTES --------
  export const RESCUER_ROUTES = {
    DASHBOARD: '/doi-cuu-ho',
    MY_ASSIGNMENTS: '/doi-cuu-ho/nhiem-vu',
    ASSIGNMENT_DETAIL: '/doi-cuu-ho/nhiem-vu/:id',
    MISSION_MAP: '/doi-cuu-ho/ban-do-nhiem-vu/:id',
    FIELD_UPDATE: '/doi-cuu-ho/cap-nhat-hien-truong/:id',
    COMPLETE_REQUEST: '/doi-cuu-ho/hoan-tat/:id',
    UPDATE_STATUS: '/doi-cuu-ho/cap-nhat-trang-thai',
    UPDATE_RESCUE_STATUS: '/doi-cuu-ho/cap-nhat-trang-thai',
    RELIEF_PRIORITIZE: '/doi-cuu-ho/sap-xep-yeu-cau-cuu-tro',
    RELIEF_PRIORITIZE_DETAIL: '/doi-cuu-ho/sap-xep-yeu-cau-cuu-tro/:id',
    SAFETY_GUIDE: '/doi-cuu-ho/huong-dan-an-toan',
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
    RELIEF_REQUEST_DASHBOARD: '/quan-ly/danh-sach-yeu-cau-cuu-tro',
    RELIEF_APPROVE: '/quan-ly/xac-minh-cuu-tro',
    DISTRIBUTION_PLAN: '/quan-ly/phan-phoi',
    DISTRIBUTION_VOUCHER: '/quan-ly/phieu-phan-phoi',
    DISTRIBUTION_TRACKING: '/quan-ly/theo-doi-phan-phoi',
    ASSIGN_ASSET_TO_TASK: '/quan-ly/gan-phuong-tien',
    REPORTS: '/quan-ly/bao-cao',
    ASSETS_MANAGEMENT: '/quan-ly/phuong-tien',
    CREATE_ASSET: '/quan-ly/tao-phuong-tien',
  };
  
  // -------- ADMIN ROUTES --------
  export const ADMIN_ROUTES = {
    DASHBOARD: '/admin',
    USERS_MANAGEMENT: '/admin/nguoi-dung',
    TEAMS_MANAGEMENT: '/admin/doi-cuu-ho',
    CREATE_TEAM: '/admin/tao-doi-cuu-ho',
    ROLES_PERMISSIONS: '/admin/phan-quyen',
    SYSTEM_CATALOG: '/admin/danh-muc-he-thong',
    SYSTEM_SETTINGS: '/admin/cau-hinh-he-thong',
    NOTIFICATION_TEMPLATES: '/admin/mau-thong-bao',
    AUDIT_LOGS: '/admin/nhat-ky-he-thong',
    SYSTEM_FEEDBACKS: '/admin/phan-hoi-he-thong',
    CONTENT_PAGES: '/admin/noi-dung-trang',
    ASSETS_MANAGEMENT: '/admin/phuong-tien',
    CREATE_ASSET: '/admin/tao-phuong-tien',
  };
  
  // -------- ALL PRIVATE ROUTES (OPTIONAL HELPER) --------
  export const PRIVATE_ROUTES = {
    ...CITIZEN_ROUTES,
    ...COORDINATOR_ROUTES,
    ...RESCUER_ROUTES,
    ...MANAGER_ROUTES,
    ...ADMIN_ROUTES,
  };
