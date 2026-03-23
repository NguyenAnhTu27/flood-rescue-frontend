import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Home,
    Eye,
    EyeOff,
    CheckCircle2,
    Info,
    ShoppingCart,
    MapPin,
    Briefcase,
} from 'lucide-react';
import { AUTH_ROUTES } from '../../app/routes/route.constants.js';
import { login } from '../../features/auth/api.js';
import { setToken, setRole, setUser } from '../../shared/lib/storage.js';

const ROLES = [
    { value: 'CITIZEN', label: 'Công dân' },
    { value: 'COORDINATOR', label: 'Điều phối' },
    { value: 'RESCUER', label: 'Đội cứu hộ' },
    { value: 'MANAGER', label: 'Quản lý' },
    { value: 'ADMIN', label: 'Admin' },
];

export default function LoginPage() {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState('CITIZEN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Call login API
            // Backend requires 'identifier' field (can be email or phone)
            // Note: Most backends don't accept 'role' in login request
            // The role is determined from the user account, not the request
            const response = await login({
                identifier: email, // Backend expects 'identifier' field (not 'email')
                password: password,
                // role: selectedRole, // Commented out - backend determines role from user account
            });

            // Log response for debugging
            console.log('[Login Response]', response);

            // Handle different response formats from backend
            // Format 1: { token: "...", user: {...} }
            // Format 2: { data: { token: "...", user: {...} } }
            // Format 3: { accessToken: "...", user: {...} } (alternative token field name)
            const token = response.token || response.accessToken || response.data?.token || response.data?.accessToken;
            const user = response.user || response.data?.user;
            const roleFromResponse = response.role || response.data?.role || user?.role || null;

            if (token) {
                setToken(token);
            } else {
                console.warn('[Login] No token received from backend');
            }

            if (user) {
                const userRole = roleFromResponse || selectedRole;
                setRole(userRole);
                setUser(user);

                // Redirect based on role from user (not selectedRole)
                const roleRoutes = {
                    CITIZEN: '/cong-dan',
                    COORDINATOR: '/dieu-phoi',
                    RESCUER: '/doi-cuu-ho',
                    MANAGER: '/quan-ly',
                    ADMIN: '/admin',
                };
                navigate(roleRoutes[userRole] || '/');
            } else {
                // If no user object, create a minimal one from the response
                const userRole = roleFromResponse || selectedRole;
                const userData = {
                    email: email,
                    role: userRole,
                    ...response,
                };
                setRole(userRole);
                setUser(userData);

                // Redirect based on role from BE response (fallback to selectedRole only if BE doesn't return role)
                const roleRoutes = {
                    CITIZEN: '/cong-dan',
                    COORDINATOR: '/dieu-phoi',
                    RESCUER: '/doi-cuu-ho',
                    MANAGER: '/quan-ly',
                    ADMIN: '/admin',
                };
                navigate(roleRoutes[userRole] || '/');
            }
        } catch (err) {
            // Handle error - show more helpful messages
            console.error('[Login Error]', err);

            // Log detailed validation errors for debugging
            if (err.status === 400 && err.data?.errors) {
                console.error('[Validation Errors]', err.data.errors);
            }

            let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';

            // Check for validation errors (400 Bad Request)
            if (err.status === 400 && err.data?.errors) {
                // Backend returned field-specific validation errors
                const errors = err.data.errors;
                const errorFields = Object.keys(errors);

                if (errorFields.length > 0) {
                    // Combine all validation errors into a readable message
                    const errorMessages = [];

                    errorFields.forEach(field => {
                        const fieldErrors = errors[field];
                        if (Array.isArray(fieldErrors)) {
                            fieldErrors.forEach(msg => {
                                errorMessages.push(`${field}: ${msg}`);
                            });
                        } else if (typeof fieldErrors === 'string') {
                            errorMessages.push(`${field}: ${fieldErrors}`);
                        }
                    });

                    if (errorMessages.length > 0) {
                        // Show all errors, or just the first one if too many
                        if (errorMessages.length === 1) {
                            errorMessage = errorMessages[0];
                        } else {
                            errorMessage = errorMessages[0] + ` (+${errorMessages.length - 1} lỗi khác)`;
                        }
                    } else {
                        errorMessage = err.data.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đăng nhập.';
                    }
                } else {
                    errorMessage = err.data.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đăng nhập.';
                }
            } else if (err.message) {
                errorMessage = err.message;
            } else if (err.data?.message) {
                errorMessage = err.data.message;
            } else if (err.data?.error) {
                errorMessage = err.data.error;
            } else if (err.originalError) {
                // Network error details
                if (err.originalError.includes('Failed to fetch')) {
                    errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc đảm bảo backend đang chạy.';
                } else {
                    errorMessage = err.originalError;
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-120px)]">
            {/* Left: Login Form */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 border-2 border-blue-700">
                        <Home className="h-5 w-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-lg font-bold text-slate-900">Hệ thống Cứu hộ - Cứu trợ</span>
                </div>

                <h2 className="text-3xl font-bold text-slate-900 mb-2">Đăng nhập</h2>
                <p className="text-sm text-slate-600 mb-8">
                    Vui lòng chọn vai trò và nhập thông tin để tiếp tục
                </p>

                {/* Role Selection */}
                <div className="flex gap-2 mb-6 overflow-x-auto">
                    {ROLES.map((role) => (
                        <button
                            key={role.value}
                            type="button"
                            onClick={() => setSelectedRole(role.value)}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition-all whitespace-nowrap shrink-0 ${selectedRole === role.value
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                                }`}
                        >
                            {role.label}
                        </button>
                    ))}
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email/Phone Input */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Số điện thoại / Email
                        </label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Nhập email hoặc số điện thoại"
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Mật khẩu
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu"
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pr-12 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Remember & Forgot */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-600">Ghi nhớ đăng nhập</span>
                        </label>
                        <Link
                            to="#"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            Quên mật khẩu?
                        </Link>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>

                {/* Register Link */}
                <p className="mt-6 text-center text-sm text-slate-600">
                    Chưa có tài khoản?{' '}
                    <Link
                        to={AUTH_ROUTES.REGISTER}
                        className="font-semibold text-blue-600 hover:text-blue-700"
                    >
                        Đăng ký ngay
                    </Link>
                </p>
            </div>

            {/* Right: Features */}
            <div className="hidden lg:block relative">
                <div className="space-y-8">
                    {/* Title */}
                    <h3 className="text-3xl font-bold text-slate-900 leading-tight">
                        Hỗ trợ cứu hộ nhanh chóng và hiệu quả
                    </h3>

                    {/* Background Graphic */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <div className="relative">
                                <div className="h-64 w-64 rounded-full border-4 border-blue-300"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-40 w-40 rounded-full border-2 border-blue-300"></div>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <MapPin className="h-8 w-8 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        {/* Features List */}
                        <div className="relative space-y-6 pt-4">
                            {/* Feature 1 */}
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                                    <CheckCircle2 className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-1">
                                        Tiếp nhận yêu cầu
                                    </h4>
                                    <p className="text-sm text-slate-600">
                                        Xử lý thông tin khẩn cấp từ người dân 24/7
                                    </p>
                                </div>
                            </div>

                            {/* Feature 2 */}
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                                    <Info className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-1">
                                        Điều phối đội/phương tiện
                                    </h4>
                                    <p className="text-sm text-slate-600">
                                        Tối ưu hóa nguồn lực và thời gian phản ứng
                                    </p>
                                </div>
                            </div>

                            {/* Feature 3 */}
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-1">
                                        Quản lý phân phối hàng
                                    </h4>
                                    <p className="text-sm text-slate-600">
                                        Minh bạch hóa quá trình cứu trợ nhu yếu phẩm
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Placeholder Image */}
                    <div className="mt-8 rounded-xl border border-slate-200 bg-blue-50 p-8">
                        <div className="flex items-center justify-center">
                            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-blue-600">
                                <Briefcase className="h-12 w-12 text-white" strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
