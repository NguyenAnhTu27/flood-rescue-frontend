import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Shield,
    Heart,
    Eye,
    EyeOff,
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
    LifeBuoy,
    PhoneCall,
    ClipboardList,
} from 'lucide-react';
import { AUTH_ROUTES } from '../../app/routes/route.constants.js';
import { register } from '../../features/auth/api.js';
import { setToken, setRole, setUser } from '../../shared/lib/storage.js';
import Card from '../../shared/ui/Card.jsx';
import Input from '../../shared/ui/Input.jsx';
import Button from '../../shared/ui/Button.jsx';

const REGISTER_FEATURES = [
    {
        icon: ClipboardList,
        title: 'Khai báo nhanh',
        body: 'Thông tin tối giản, tập trung vào dữ liệu cần thiết để tiếp nhận yêu cầu.',
    },
    {
        icon: PhoneCall,
        title: 'Kết nối trực tiếp',
        body: 'Thông tin liên hệ giúp điều phối viên gọi lại ngay khi cần xác minh.',
    },
    {
        icon: LifeBuoy,
        title: 'Ưu tiên an toàn',
        body: 'Hệ thống ưu tiên hỗ trợ tình huống khẩn cấp và người dễ tổn thương.',
    },
];

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
            console.error('[Register Error]', err);
            // BE ApiResult: validation errors are in data.data; httpClient sets err.validationErrors
            const errors = err.validationErrors ?? err.data?.data ?? err.data?.errors ?? {};
            if (Object.keys(errors).length > 0) {
                console.error('[Validation Errors]', errors);
            }

            let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';

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
                    errorMessage = err.data?.message || err.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đăng ký.';
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
            <Card className="w-full p-6 sm:p-8">
                <div className="flex items-center gap-3">
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-[16px] bg-gradient-to-br from-blue-600 to-cyan-600 shadow-[0_14px_28px_rgba(14,116,144,0.26)]">
                        <Shield className="h-5 w-5 text-white" strokeWidth={2.5} />
                        <Heart className="absolute h-3 w-3 text-white" fill="white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Tạo tài khoản công dân</p>
                        <p className="text-base font-extrabold text-slate-900">Hệ thống Cứu hộ - Cứu trợ</p>
                    </div>
                </div>

                <h1 className="ui-heading text-3xl sm:text-4xl mt-6">Đăng ký để gửi yêu cầu cứu hộ</h1>
                <p className="ui-text-secondary mt-3 text-sm leading-7">Điền thông tin chính xác để đội điều phối có thể liên hệ và hỗ trợ nhanh nhất.</p>

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                            label="Họ và tên"
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Số điện thoại"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="09xx xxx xxx"
                            required
                        />
                    </div>

                    <div>
                        <Input
                            label="Email (tùy chọn)"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="example@gmail.com"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="relative">
                            <Input
                                label="Mật khẩu"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
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
                        <div className="relative">
                            <Input
                                label="Nhập lại mật khẩu"
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-[2.4rem] -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                            >
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <label className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            required
                        />
                        <span className="text-sm text-slate-600">Tôi xác nhận thông tin là chính xác và đồng ý với điều khoản sử dụng.</span>
                    </label>

                    {error && (
                        <div className="rounded-[14px] border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
                            {error}
                        </div>
                    )}

                    <div className="rounded-[16px] border border-amber-200 bg-amber-50/80 px-4 py-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                            <p className="text-sm leading-7 text-amber-800">
                                Mỗi công dân chỉ được có 1 yêu cầu cứu hộ đang xử lý. Bạn chỉ có thể tạo yêu cầu mới khi yêu cầu trước đã hoàn tất hoặc bị hủy.
                            </p>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full justify-center"
                        size="lg"
                    >
                        {loading ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
                        {!loading && <ArrowRight size={14} className="ml-2" />}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600">
                    Đã có tài khoản?{' '}
                    <Link to={AUTH_ROUTES.LOGIN} className="font-semibold text-blue-600 hover:text-blue-700">
                        Đăng nhập ngay
                    </Link>
                </p>
            </Card>

            <section className="ui-surface hidden rounded-[30px] p-6 sm:p-8 lg:block" style={{ animationDelay: '80ms' }}>
                <div className="rounded-[24px] border border-white/70 bg-white/[0.45] p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-emerald-500 text-white">
                            <CheckCircle2 size={20} />
                        </div>
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-600">An toàn dữ liệu</p>
                    </div>
                    <h2 className="ui-heading text-3xl mt-4">Đăng ký một lần, hỗ trợ dài hạn</h2>
                    <p className="ui-text-secondary mt-3 text-sm leading-8">
                        Tài khoản giúp lưu thông tin liên hệ, theo dõi lịch sử yêu cầu và tăng tốc độ tiếp nhận khi có tình huống mới.
                    </p>
                </div>

                <div className="mt-7 space-y-4">
                    {REGISTER_FEATURES.map(({ icon: Icon, title, body }) => (
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
