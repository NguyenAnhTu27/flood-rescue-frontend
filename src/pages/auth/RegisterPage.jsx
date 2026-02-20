import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Shield,
    Heart,
    Eye,
    EyeOff,
    Zap,
    Radio,
    Users,
    AlertTriangle,
    CheckCircle2,
    ShieldCheck,
    BriefcaseMedical,
} from 'lucide-react';
import { AUTH_ROUTES } from '../../app/routes/route.constants.js';
import { register } from '../../features/auth/api.js';
import { setToken, setRole, setUser } from '../../shared/lib/storage.js';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validate password match
        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        // Validate required fields
        if (!formData.fullName || !formData.phone || !formData.password) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        // Validate terms agreement
        if (!agreeTerms) {
            setError('Vui lòng đồng ý với điều khoản sử dụng');
            return;
        }

        setLoading(true);

        try {
            // Prepare registration data
            // Backend might expect different field names - adjust based on your API
            const registerData = {
                fullName: formData.fullName,
                phone: formData.phone,
                password: formData.password,
            };

            // Add email if provided (optional field)
            if (formData.email) {
                registerData.email = formData.email;
            }

            // Call register API
            const response = await register(registerData);

            // Log response for debugging
            console.log('[Register Response]', response);

            // Handle different response formats from backend
            const token = response.token || response.accessToken || response.data?.token || response.data?.accessToken;
            const user = response.user || response.data?.user;

            if (token) {
                setToken(token);
            } else {
                console.warn('[Register] No token received from backend');
            }

            if (user) {
                setRole(user.role || 'CITIZEN');
                setUser(user);
            } else {
                // If no user object, create a minimal one
                const userData = {
                    fullName: formData.fullName,
                    phone: formData.phone,
                    email: formData.email,
                    role: 'CITIZEN',
                    ...response,
                };
                setRole('CITIZEN');
                setUser(userData);
            }

            // Redirect to citizen dashboard
            navigate('/cong-dan');
        } catch (err) {
            // Handle error - show more helpful messages
            console.error('[Register Error]', err);

            // Log detailed validation errors for debugging
            if (err.status === 400 && err.data?.errors) {
                console.error('[Validation Errors]', err.data.errors);
            }

            let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';

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
                        errorMessage = err.data.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đăng ký.';
                    }
                } else {
                    errorMessage = err.data.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đăng ký.';
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
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start min-h-[calc(100vh-120px)]">
            {/* Left: Registration Form */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                        <Shield className="h-5 w-5 text-white" strokeWidth={2.5} />
                        <Heart className="h-3 w-3 text-white absolute" fill="white" strokeWidth={2.5} />
                    </div>
                    <span className="text-lg font-bold text-slate-900">HỆ THỐNG CỨU HỘ – CỨU TRỢ</span>
                </div>

                <h2 className="text-3xl font-bold text-slate-900 mb-2">Đăng ký tài khoản Công dân</h2>
                <p className="text-sm text-slate-600 mb-8">
                    Vui lòng nhập thông tin để tạo tài khoản
                </p>

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Full Name and Phone Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Họ và tên
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Số điện thoại
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="09xx xxx xxx"
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                required
                            />
                        </div>
                    </div>

                    {/* Email (Optional) */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Email (tùy chọn)
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="example@gmail.com"
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    {/* Password Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
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
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Nhập lại mật khẩu
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pr-12 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Terms Checkbox */}
                    <label className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            required
                        />
                        <span className="text-sm text-slate-600">
                            Tôi xác nhận thông tin là chính xác và đồng ý với điều khoản sử dụng
                        </span>
                    </label>

                    {/* Error Message */}
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Warning Box */}
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-orange-800">
                                Mỗi công dân chỉ được có 1 yêu cầu cứu hộ đang xử lý. Bạn chỉ có thể tạo yêu cầu mới khi yêu cầu trước đã hoàn tất hoặc bị hủy.
                            </p>
                        </div>
                    </div>

                    {/* Register Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
                    </button>
                </form>

                {/* Login Link */}
                <p className="mt-6 text-center text-sm text-slate-600">
                    Đã có tài khoản?{' '}
                    <Link
                        to={AUTH_ROUTES.LOGIN}
                        className="font-semibold text-blue-600 hover:text-blue-700"
                    >
                        Đăng nhập ngay
                    </Link>
                </p>
            </div>

            {/* Right: Informational Section */}
            <div className="hidden lg:block relative">
                <div className="space-y-8">
                    {/* Illustration */}
                    <div className="relative">
                        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-8">
                            <div className="flex items-center justify-center">
                                <div className="relative">
                                    {/* Server/Stack Illustration */}
                                    <div className="space-y-2">
                                        <div className="h-16 w-32 rounded bg-slate-200"></div>
                                        <div className="h-16 w-32 rounded bg-slate-300"></div>
                                        <div className="h-16 w-32 rounded bg-slate-400"></div>
                                    </div>
                                    {/* Security Badge */}
                                    <div className="absolute -right-4 -top-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500 shadow-lg">
                                        <CheckCircle2 className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </div>
                            <p className="mt-4 text-center text-xs font-semibold text-slate-700">
                                Kết nối An toàn & Bảo mật
                            </p>
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-3xl font-bold text-slate-900 leading-tight">
                        Đăng ký để được hỗ trợ kịp thời
                    </h3>

                    {/* Features List */}
                    <div className="space-y-6">
                        {/* Feature 1 */}
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                                <Zap className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 mb-1">
                                    Gửi yêu cầu cứu hộ nhanh chóng
                                </h4>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                                <Radio className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 mb-1">
                                    Theo dõi trạng thái xử lý thời gian thực
                                </h4>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 mb-1">
                                    Nhận hỗ trợ cứu trợ từ cộng đồng
                                </h4>
                            </div>
                        </div>
                    </div>

                    {/* Community Partnership */}
                    <div className="mt-8 space-y-4">
                        <p className="text-sm font-bold uppercase tracking-wider text-slate-700">
                            ĐỒNG HÀNH CÙNG CỘNG ĐỒNG
                        </p>
                        <div className="flex gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                                <CheckCircle2 className="h-5 w-5 text-slate-600" />
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                                <ShieldCheck className="h-5 w-5 text-slate-600" />
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                                <BriefcaseMedical className="h-5 w-5 text-slate-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
