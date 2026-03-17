import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, LogIn, UserPlus, Mail, Phone } from 'lucide-react';
import { AUTH_ROUTES, PUBLIC_ROUTES } from '../app/routes/route.constants.js';

export default function AuthLayout({ children }) {
    const location = useLocation();
    const isLoginPage = location.pathname === AUTH_ROUTES.LOGIN;

    return (
        <div className="relative flex min-h-screen flex-col bg-[#eef6ff] text-slate-900">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.82),_rgba(238,246,255,0.58))]" />
            <div className="pointer-events-none absolute left-[-8rem] top-32 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl glass-float" />
            <div className="pointer-events-none absolute right-[-6rem] top-20 h-96 w-96 rounded-full bg-blue-200/35 blur-3xl glass-float" style={{ animationDelay: '1.6s' }} />

            <header className="fixed inset-x-0 top-0 z-[90] border-b border-white/70 bg-white/92 shadow-[0_10px_26px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <Link
                            to={PUBLIC_ROUTES.HOME}
                            className="flex items-center gap-4 rounded-[22px] px-1 py-1"
                            aria-label="Về trang giới thiệu"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-400 shadow-[0_18px_40px_rgba(14,116,144,0.28)]">
                                <HomeIcon className="text-white" size={22} strokeWidth={2.2} />
                            </div>
                            <div>
                                <p className="text-base font-extrabold tracking-[0.12em] text-blue-700">CỨU HỘ KHẨN CẤP</p>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Auth Portal</p>
                            </div>
                        </Link>

                        <nav className="hidden items-center gap-2 rounded-full border border-white/70 bg-white/[0.35] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl md:flex">
                            <Link
                                to={PUBLIC_ROUTES.HOME}
                                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/[0.55] hover:text-slate-900"
                            >
                                Giới thiệu
                            </Link>
                            <Link
                                to={PUBLIC_ROUTES.EMERGENCY_GUIDE}
                                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/[0.55] hover:text-slate-900"
                            >
                                Hướng dẫn
                            </Link>
                            <Link
                                to={PUBLIC_ROUTES.SUPPORT_CONTACT}
                                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/[0.55] hover:text-slate-900"
                            >
                                Liên hệ
                            </Link>
                        </nav>

                        <div className="flex items-center gap-2">
                            <Link
                                to={AUTH_ROUTES.LOGIN}
                                className={[
                                    'inline-flex items-center gap-2 rounded-[14px] px-4 py-2 text-sm font-semibold transition',
                                    isLoginPage
                                        ? 'bg-blue-600 text-white shadow-[0_12px_26px_rgba(37,99,235,0.28)]'
                                        : 'border border-white/70 bg-white/70 text-slate-700 hover:bg-white',
                                ].join(' ')}
                            >
                                <LogIn size={14} />
                                Đăng nhập
                            </Link>
                            <Link
                                to={AUTH_ROUTES.REGISTER}
                                className={[
                                    'inline-flex items-center gap-2 rounded-[14px] px-4 py-2 text-sm font-semibold transition',
                                    !isLoginPage
                                        ? 'bg-blue-600 text-white shadow-[0_12px_26px_rgba(37,99,235,0.28)]'
                                        : 'border border-white/70 bg-white/70 text-slate-700 hover:bg-white',
                                ].join(' ')}
                            >
                                <UserPlus size={14} />
                                Đăng ký
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="h-[132px] lg:h-[84px]" />

            <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
                {children}
            </main>

            <div className="relative z-10 mt-auto border-t border-slate-200/80 bg-white/95 shadow-[0_-8px_20px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:grid-cols-[1.2fr_1fr_1fr] sm:px-6 lg:px-8">
                    <div>
                        <p className="text-sm font-extrabold tracking-[0.12em] text-blue-700">CỨU HỘ KHẨN CẤP</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                            Cổng xác thực dành cho người dùng hệ thống cứu hộ và cứu trợ.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
                        <Link to={PUBLIC_ROUTES.HOME} className="transition hover:text-blue-700">Giới thiệu</Link>
                        <Link to={PUBLIC_ROUTES.EMERGENCY_GUIDE} className="transition hover:text-blue-700">Hướng dẫn khẩn cấp</Link>
                        <Link to={PUBLIC_ROUTES.SUPPORT_CONTACT} className="transition hover:text-blue-700">Liên hệ hỗ trợ</Link>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                        <a href="mailto:support@cuuho.gov.vn" className="inline-flex items-center gap-2 transition hover:text-blue-700">
                            <Mail size={14} />
                            support@cuuho.gov.vn
                        </a>
                        <a href="tel:1900-xxxx" className="inline-flex items-center gap-2 transition hover:text-blue-700">
                            <Phone size={14} />
                            1900-xxxx
                        </a>
                    </div>
                </div>
                <div className="border-t border-slate-200/80 px-4 py-3 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
                    © 2024 Hệ thống Cứu hộ - Cứu trợ Quốc gia. All rights reserved.
                </div>
            </div>
        </div>
    );
}
