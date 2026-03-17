import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Home,
    Eye,
    EyeOff,
    ShieldCheck,
    Radio,
    Truck,
    ArrowRight,
} from 'lucide-react';
import { AUTH_ROUTES } from '../../app/routes/route.constants.js';
import { login } from '../../features/auth/api.js';
import { useAuth } from '../../features/auth/hooks.js';
import Card from '../../shared/ui/Card.jsx';
import Input from '../../shared/ui/Input.jsx';
import Button from '../../shared/ui/Button.jsx';

const LOGIN_FEATURES = [
    {
        icon: ShieldCheck,
        title: 'Xác thực tập trung',
        body: 'Đăng nhập một lần để truy cập đúng luồng theo vai trò được cấp.',
    },
    {
        icon: Radio,
        title: 'Theo dõi thời gian thực',
        body: 'Liên tục cập nhật trạng thái xử lý để không bỏ lỡ tác vụ quan trọng.',
    },
    {
        icon: Truck,
        title: 'Điều phối nhanh',
        body: 'Đội ngũ phản ứng dựa trên dữ liệu ưu tiên và vị trí hiện trường.',
    },
];

export default function LoginPage() {
    const navigate = useNavigate();
    const { setSession } = useAuth();
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

            // Handle LoginResponse from backend
            // BE returns: { token, tokenType, userId, fullName, role }
            const token = response.token || response.accessToken;
            const role = response.role || 'CITIZEN';
            const userId = response.userId;
            const fullName = response.fullName;

            if (!token) {
                console.warn('[Login] No token received from backend');
            }

            // Build user object from flat response fields
            const userData = {
                id: userId,
                fullName: fullName || '',
                role: role,
                email: email,
            };
            // Cập nhật session vào AuthProvider + localStorage
            setSession({
                token,
                role,
                user: userData,
            });

            // Redirect based on role
            const roleRoutes = {
                CITIZEN: '/cong-dan',
                COORDINATOR: '/dieu-phoi',
                RESCUER: '/doi-cuu-ho',
                MANAGER: '/quan-ly',
                ADMIN: '/admin',
            };
            navigate(roleRoutes[role] || '/');
        } catch (err) {
            console.error('[Login Error]', err);
            // Validation errors: BE ApiResult puts field→message map in data.data; httpClient also sets err.validationErrors
            const errors = err.validationErrors ?? err.data?.data ?? err.data?.errors ?? {};
            if (Object.keys(errors).length > 0) {
                console.error('[Validation Errors]', errors);
            }

            let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';

            if (err.status === 400 && Object.keys(errors).length > 0) {
                const errorMessages = [];
                Object.entries(errors).forEach(([field, value]) => {
                    if (Array.isArray(value)) {
                        value.forEach((msg) => errorMessages.push(`${field}: ${msg}`));
                    } else if (typeof value === 'string') {
                        errorMessages.push(`${field}: ${value}`);
                    }
                });
                if (errorMessages.length === 1) {
                    errorMessage = errorMessages[0];
                } else if (errorMessages.length > 1) {
                    errorMessage = errorMessages[0] + ` (+${errorMessages.length - 1} lỗi khác)`;
                } else {
                    errorMessage = err.data?.message || err.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đăng nhập.';
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
        <div className="grid gap-7 lg:grid-cols-[1fr_0.95fr] lg:gap-10 xl:gap-14">
            <Card className="w-full max-w-xl p-6 sm:p-8">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-gradient-to-br from-blue-600 to-cyan-600 shadow-[0_14px_28px_rgba(14,116,144,0.26)]">
                        <Home className="h-5 w-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Đăng nhập hệ thống</p>
                        <p className="text-base font-extrabold text-slate-900">Hệ thống Cứu hộ - Cứu trợ</p>
                    </div>
                </div>

                <h1 className="ui-heading text-3xl sm:text-4xl mt-6">Xin chào, mời bạn quay lại</h1>
                <p className="ui-text-secondary mt-3 text-sm leading-7">Nhập thông tin đăng nhập để tiếp tục xử lý công việc.</p>

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                    <Input
                        label="Số điện thoại / Email"
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập email hoặc số điện thoại"
                        required
                    />

                    <div className="relative">
                         <Input
                            label="Mật khẩu"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nhập mật khẩu"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-[2.4rem] -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>

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
                        <Link to="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                            Quên mật khẩu?
                        </Link>
                    </div>

                    {error && (
                        <div className="rounded-[14px] border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full justify-center"
                        size="lg"
                    >
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        {!loading && <ArrowRight size={14} className="ml-2" />}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600">
                    Chưa có tài khoản?{' '}
                    <Link to={AUTH_ROUTES.REGISTER} className="font-semibold text-blue-600 hover:text-blue-700">
                        Đăng ký ngay
                    </Link>
                </p>
            </Card>

            <section className="ui-surface hidden rounded-[30px] p-6 sm:p-8 lg:block" style={{ animationDelay: '80ms' }}>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">Đăng nhập an toàn</p>
                <h2 className="ui-heading text-3xl mt-3">Điều phối nhanh, phản hồi đúng ưu tiên</h2>
                <p className="ui-text-secondary mt-4 text-sm leading-8">
                    Trang đăng nhập mới tập trung vào tính rõ ràng và tốc độ thao tác, giúp người dùng vào đúng khu vực làm việc ngay từ đầu.
                </p>

                <div className="mt-8 space-y-4">
                    {LOGIN_FEATURES.map(({ icon: Icon, title, body }) => (
                        <article key={title} className="rounded-[22px] border border-white/70 bg-white/[0.45] px-5 py-4 backdrop-blur-xl">
                            <div className="flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/80 bg-white/70 text-blue-600">
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">{title}</h3>
                                    <p className="mt-1 text-sm leading-7 text-slate-600">{body}</p>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
