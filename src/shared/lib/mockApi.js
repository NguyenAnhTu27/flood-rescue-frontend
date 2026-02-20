/**
 * Mock API - Development mode API responses
 * Use when backend is not available
 * Set VITE_USE_MOCK_API=true in .env to enable
 */

// Simulate network delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock login response
 */
export async function mockLogin(credentials) {
    await delay(800); // Simulate network delay
    
    // Simulate validation
    if (!credentials.email || !credentials.password) {
        throw {
            message: 'Email và mật khẩu là bắt buộc',
            status: 400,
        };
    }

    // Mock successful login
    return {
        token: 'mock-jwt-token-' + Date.now(),
        user: {
            id: '1',
            fullName: 'Nguyễn Văn A',
            email: credentials.email,
            phone: '0901234567',
            role: credentials.role || 'CITIZEN',
        },
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
