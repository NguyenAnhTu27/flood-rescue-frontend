/**
 * Mock API - Development mode API responses
 * Use when backend is not available
 * Set VITE_USE_MOCK_API=true in .env to enable
 */

// Simulate network delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock accounts for development - dùng để login trực tiếp vào từng giao diện
 * MANAGER: manager@test.com / 123456  → /quan-ly
 * RESCUER: rescuer@test.com / 123456  → /doi-cuu-ho
 * COORDINATOR: coordinator@test.com / 123456 → /dieu-phoi
 * CITIZEN: citizen@test.com / 123456  → /cong-dan (hoặc bất kỳ email/mật khẩu khác)
 */
const MOCK_ACCOUNTS = {
    'manager@test.com': { password: '123456', role: 'MANAGER', fullName: 'Nguyễn Quản Lý' },
    'rescuer@test.com': { password: '123456', role: 'RESCUER', fullName: 'Trần Cứu Hộ' },
    'coordinator@test.com': { password: '123456', role: 'COORDINATOR', fullName: 'Lê Điều Phối' },
    'citizen@test.com': { password: '123456', role: 'CITIZEN', fullName: 'Nguyễn Công Dân' },
};

/**
 * Mock login response
 */
export async function mockLogin(credentials) {
    await delay(800); // Simulate network delay

    const email = credentials.email || credentials.identifier;
    const password = credentials.password;

    if (!email || !password) {
        throw {
            message: 'Email và mật khẩu là bắt buộc',
            status: 400,
        };
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const account = MOCK_ACCOUNTS[normalizedEmail];

    const role = account && account.password === password
        ? account.role
        : (credentials.role || 'CITIZEN');
    const fullName = account && account.password === password
        ? account.fullName
        : 'Nguyễn Văn A';

    return {
        token: 'mock-jwt-token-' + Date.now(),
        user: {
            id: '1',
            fullName,
            email: normalizedEmail || email,
            phone: '0901234567',
            role,
        },
        role,
    };
}

/**
 * Mock register response
 */
export async function mockRegister(userData) {
    await delay(1000);
    
    if (!userData.fullName || !userData.phone || !userData.password) {
        throw {
            message: 'Vui lòng điền đầy đủ thông tin',
            status: 400,
        };
    }

    return {
        token: 'mock-jwt-token-' + Date.now(),
        user: {
            id: '1',
            ...userData,
            role: 'CITIZEN',
        },
    };
}

/**
 * Mock get rescue requests
 */
export async function mockGetRescueRequests(params = {}) {
    await delay(500);

    // Return Spring-style page for citizen (getMyRescueRequests handles content/data/items)
    return {
        content: [...MOCK_CITIZEN_RESCUE_REQUESTS],
        totalElements: MOCK_CITIZEN_RESCUE_REQUESTS.length,
        totalPages: 1,
        number: 0,
        size: 100,
    };
}

/**
 * Mock data: danh sách yêu cầu cứu hộ của citizen (dùng chung cho GET list & GET by id)
 */
const MOCK_CITIZEN_RESCUE_REQUESTS = [
    {
        id: 'req-1',
        code: 'YCH-001',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        addressText: '123 Đường Nguyễn Huệ, Quận 1, TP.HCM',
        description: 'Gia đình 4 người mắc kẹt tầng 2, nước đang dâng cao.',
        affectedPeopleCount: 4,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        attachments: [],
    },
    {
        id: 'req-2',
        code: 'YCH-002',
        status: 'PENDING',
        priority: 'MEDIUM',
        addressText: '45 Đường Lê Lợi, Quận 3, TP.HCM',
        description: 'Cần hỗ trợ hàng cứu trợ sau khi được sơ tán.',
        affectedPeopleCount: 2,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        attachments: [],
    },
    {
        id: 'req-3',
        code: 'YCH-003',
        status: 'COMPLETED',
        priority: 'HIGH',
        addressText: '78 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM',
        description: 'Đã được cứu an toàn, cảm ơn đội cứu hộ.',
        affectedPeopleCount: 3,
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        attachments: [],
    },
];

function findRequestById(id) {
    const found = MOCK_CITIZEN_RESCUE_REQUESTS.find((r) => r.id === id || r.code === id);
    if (found) return found;
    // Nếu FE gửi id dạng "req-123" mà chưa có trong list, trả về mock mẫu
    return {
        id,
        code: id.startsWith('YCH-') ? id : `YCH-${id.slice(-3)}`,
        status: 'PENDING',
        priority: 'MEDIUM',
        addressText: 'Địa chỉ mẫu, Quận 1, TP.HCM',
        description: 'Mô tả yêu cầu',
        affectedPeopleCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: [],
    };
}

/**
 * Mock GET rescue request by ID (citizen: /rescue/citizen/requests/:id hoặc /rescue/requests/:id)
 */
export async function mockGetRescueRequestById(id) {
    await delay(300);
    return findRequestById(id);
}

/**
 * Mock GET rescue request status
 */
export async function mockGetRescueRequestStatus(id) {
    await delay(300);
    const req = findRequestById(id);
    return {
        requestId: req.id,
        code: req.code,
        status: req.status,
        updatedAt: req.updatedAt,
        message: req.status === 'COMPLETED' ? 'Yêu cầu đã hoàn thành.' : req.status === 'IN_PROGRESS' ? 'Đội cứu hộ đang trên đường.' : 'Đang chờ xử lý.',
    };
}

/**
 * Mock PUT update rescue request (citizen)
 */
export async function mockUpdateRescueRequest(id, data) {
    await delay(500);
    const req = findRequestById(id);
    const updated = { ...req, ...data, updatedAt: new Date().toISOString() };
    const idx = MOCK_CITIZEN_RESCUE_REQUESTS.findIndex((r) => r.id === id || r.code === id);
    if (idx >= 0) {
        MOCK_CITIZEN_RESCUE_REQUESTS[idx] = updated;
    }
    return updated;
}

/**
 * Mock DELETE cancel rescue request (citizen)
 */
export async function mockCancelRescueRequest(id) {
    await delay(400);
    const idx = MOCK_CITIZEN_RESCUE_REQUESTS.findIndex((r) => r.id === id || r.code === id);
    if (idx >= 0) {
        MOCK_CITIZEN_RESCUE_REQUESTS[idx] = { ...MOCK_CITIZEN_RESCUE_REQUESTS[idx], status: 'CANCELLED', updatedAt: new Date().toISOString() };
    }
    return { success: true, message: 'Đã hủy yêu cầu.' };
}

/**
 * Mock citizen dashboard
 */
export async function mockCitizenDashboard() {
    await delay(400);
    const list = MOCK_CITIZEN_RESCUE_REQUESTS;
    return {
        totalRequests: list.length,
        pendingCount: list.filter((r) => r.status === 'PENDING').length,
        inProgressCount: list.filter((r) => r.status === 'IN_PROGRESS').length,
        completedCount: list.filter((r) => r.status === 'COMPLETED').length,
        recentRequests: list.slice(0, 5),
    };
}

/**
 * Mock upload rescue attachments - trả về danh sách URL giả
 */
export async function mockUploadRescueAttachments(formData) {
    await delay(800);
    const count = formData?.getAll?.('files')?.length ?? 2;
    return Array.from({ length: count }, (_, i) => ({
        fileUrl: `https://mock-cdn.example.com/rescue/attachments/${Date.now()}-${i}.jpg`,
        fileType: 'image/jpeg',
    }));
}

/**
 * Mock gửi phản hồi citizen
 */
export async function mockSubmitFeedback(data) {
    await delay(600);
    return {
        success: true,
        message: 'Cảm ơn bạn đã gửi phản hồi.',
        id: 'fb-' + Date.now(),
    };
}

/**
 * Mock create rescue request
 */
export async function mockCreateRescueRequest(data) {
    await delay(1000);

    const id = 'req-' + Date.now();
    const code = 'YCH-' + String(MOCK_CITIZEN_RESCUE_REQUESTS.length + 1).padStart(3, '0');
    const newReq = {
        id,
        code,
        status: 'PENDING',
        priority: data.priority || 'MEDIUM',
        addressText: data.addressText || data.address || '',
        description: data.description || '',
        affectedPeopleCount: data.affectedPeopleCount ?? data.peopleCount ?? 1,
        attachments: data.attachments || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    MOCK_CITIZEN_RESCUE_REQUESTS.unshift(newReq);
    return newReq;
}
