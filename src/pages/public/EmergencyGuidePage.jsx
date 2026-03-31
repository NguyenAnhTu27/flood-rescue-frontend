import React from 'react';
import { Link } from 'react-router-dom';
import {
    Home as HomeIcon,
    LogIn,
    BellRing,
    MapPin,
    HeartPulse,
    Phone,
    AlertTriangle,
    Shield,
    FileText,
    Mail,
    Facebook,
    Twitter,
    Youtube,
} from 'lucide-react';
import { AUTH_ROUTES, PUBLIC_ROUTES } from '../../app/routes/route.constants.js';

function Container({ children, className = '' }) {
    return <div className={`mx-auto w-full max-w-[90%] px-2 lg:px-3 ${className}`}>{children}</div>;
}

function IconBadge({ children, className = '' }) {
    return (
        <div
            className={[
                'flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50',
                className,
            ].join(' ')}
        >
            {children}
        </div>
    );
}

export default function EmergencyGuidePage() {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-sky-700 via-blue-600 to-indigo-700">
                <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute left-10 -bottom-28 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />

                <div className="max-w-6xl mx-auto px-6 py-14">
                    <div className="grid lg:grid-cols-2 gap-10 items-center">
                        <div className="text-white">
                            <p className="text-sm font-semibold uppercase tracking-wide text-white/80">Cẩm nang</p>
                            <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold leading-tight">
                                Chào mừng bạn đến với <span className="text-yellow-200">Cẩm nang Cứu hộ</span>
                            </h1>
                            <p className="mt-4 text-lg text-white/80 max-w-xl">
                                Hệ thống hướng dẫn toàn diện cho các hoạt động ứng phó khẩn cấp và cứu hộ thông minh, an toàn và chuyên nghiệp.
                            </p>

                            <div className="mt-8 relative max-w-lg">
                                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                                    <svg
                                        className="h-5 w-5 text-white/70"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 6.15z"
                                        />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm hướng dẫn, quy trình hoặc hành động..."
                                    className="w-full rounded-full border border-white/30 bg-white/10 py-3 pl-12 pr-4 text-white placeholder:text-white/60 shadow-sm focus:border-white focus:outline-none focus:ring-2 focus:ring-white/40"
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
                                <h2 className="text-xl font-semibold text-white">Vai trò người dùng</h2>
                                <p className="mt-2 text-sm text-white/70">Chọn một vai trò để nhận hướng dẫn chi tiết</p>

                                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                    {[
                                        {
                                            title: 'Công dân',
                                            desc: 'Gửi yêu cầu cứu hộ, theo dõi tiến trình.',
                                            icon: '👤',
                                        },
                                        {
                                            title: 'Điều phối',
                                            desc: 'Phân phối nhiệm vụ, giám sát hiện trường.',
                                            icon: '🧭',
                                        },
                                        {
                                            title: 'Đội cứu hộ',
                                            desc: 'Nhận thông tin, điều phối & phản hồi nhanh.',
                                            icon: '🚑',
                                        },
                                        {
                                            title: 'Quản lý',
                                            desc: 'Thống kê, báo cáo và đánh giá hiệu suất.',
                                            icon: '📊',
                                        },
                                    ].map((role) => (
                                        <button
                                            key={role.title}
                                            className="flex flex-col items-start rounded-2xl bg-white/15 p-5 text-left shadow-sm transition hover:bg-white/25 focus:outline-none"
                                        >
                                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 text-white text-lg">
                                                {role.icon}
                                            </div>
                                            <h3 className="mt-4 text-lg font-semibold text-white">{role.title}</h3>
                                            <p className="mt-1 text-sm text-white/70">{role.desc}</p>
                                            <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-white/70">
                                                Xem chi tiết
                                                <svg
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 5l7 7-7 7"
                                                    />
                                                </svg>
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-6 flex items-center justify-between text-sm text-white/70">
                                    <span>Hoặc</span>
                                    <a href="#basic-process" className="font-semibold text-white hover:text-yellow-200">
                                        Xem quy trình cơ bản →
                                    </a>
                                </div>
                            </div>

                            <div className="pointer-events-none absolute -right-16 -bottom-16 w-60 h-60 rounded-full bg-white/5 blur-2xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quy trình cơ bản */}
            <section id="basic-process" className="max-w-6xl mx-auto px-6 py-14">
                <div className="text-center">
                    <p className="text-sm font-semibold text-blue-500 uppercase tracking-wide">Quy trình cơ bản</p>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900">4 bước đơn giản để gửi yêu cầu cứu hộ</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-base text-slate-600">
                        Thực hiện theo từng bước để đảm bảo thông tin chính xác và tiếp cận nhanh nhất với đội cứu hộ.
                    </p>
                </div>

                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        {
                            number: '1',
                            title: 'Đăng ký',
                            desc: 'Tạo tài khoản nhanh chóng và xác thực thông tin liên lạc của bạn.',
                        },
                        {
                            number: '2',
                            title: 'Gửi yêu cầu',
                            desc: 'Chọn loại sự cố, nhập vị trí và trạng thái hiện tại.',
                        },
                        {
                            number: '3',
                            title: 'Phân công',
                            desc: 'Hệ thống điều phối gửi yêu cầu tới đội cứu hộ gần nhất.',
                        },
                        {
                            number: '4',
                            title: 'Hoàn tất',
                            desc: 'Nhận thông báo khi đội cứu hộ đến và đóng yêu cầu.',
                        },
                    ].map((step) => (
                        <div key={step.number} className="relative rounded-3xl bg-white shadow-lg p-6">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-900 text-white text-xl font-bold shadow-lg">
                                    {step.number}
                                </div>
                            </div>
                            <div className="mt-10 text-center">
                                <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                                <p className="mt-2 text-sm text-slate-600">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Bottom danger bar */}
            <div className="bg-red-600/95">
                <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6 md:flex-row items-center justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-white text-2xl">
                            🚨
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-white">Bạn đang trong tình trạng nguy hiểm?</p>
                            <p className="text-sm text-white/80">Gọi ngay đội cứu hộ để được hỗ trợ khẩn cấp.</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <a
                            href="tel:114"
                            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-red-600 shadow-lg shadow-red-500/30 transition hover:bg-white/90"
                        >
                            <span className="mr-2">Gọi ngay</span>
                            <span className="text-xl font-bold">114</span>
                        </a>
                        <a
                            href="#basic-process"
                            className="inline-flex items-center justify-center rounded-full bg-white/15 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-white/25"
                        >
                            Xem quy trình chi tiết
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
