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
 * CITIZEN: bất kỳ email/mật khẩu khác → /cong-dan
 */
const MOCK_ACCOUNTS = {
    'manager@test.com': { password: '123456', role: 'MANAGER', fullName: 'Nguyễn Quản Lý' },
    'rescuer@test.com': { password: '123456', role: 'RESCUER', fullName: 'Trần Cứu Hộ' },
    'coordinator@test.com': { password: '123456', role: 'COORDINATOR', fullName: 'Lê Điều Phối' },
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
    
    // Return empty array or mock data
    return [];
}

/**
 * Mock create rescue request
 */
export async function mockCreateRescueRequest(data) {
    await delay(1000);
    
    return {
        id: 'req-' + Date.now(),
        ...data,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
    };
}
