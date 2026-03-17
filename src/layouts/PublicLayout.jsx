import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Home as HomeIcon, LogIn, Mail, Phone, Facebook, Twitter, Youtube, ArrowRight, ShieldAlert } from "lucide-react";

import { AUTH_ROUTES, PUBLIC_ROUTES } from "../app/routes/route.constants.js";
import httpClient from "../shared/lib/http.js";

const normalizeExternalUrl = (url) => {
    const value = String(url || "").trim();
    if (!value || value === "#") return "#";
    if (value.startsWith("/")) return value;
    const lower = value.toLowerCase();
    if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("mailto:") || lower.startsWith("tel:")) {
        return value;
    }
    return `https://${value}`;
};

const resolveFooterLink = (rawUrl, fallbackPath) => {
    const value = String(rawUrl || "").trim();
    if (!value || value === "#") return fallbackPath;
    if (value === "/dieu-khoan-su-dung") return PUBLIC_ROUTES.TERMS_OF_USE;
    return normalizeExternalUrl(value);
};

function Container({ children, className = "" }) {
    return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

export default function PublicLayout({ children }) {
    const location = useLocation();
    const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
    const [footerSettings, setFooterSettings] = useState({
        footerBrandName: "CỨU HỘ KHẨN CẤP",
        footerDescription: "Nền tảng điều phối cứu hộ và cứu trợ lũ lụt với thông tin thời gian thực, quy trình rõ ràng và liên lạc khẩn cấp tập trung.",
        footerTermsLabel: "Tuyên bố miễn trừ trách nhiệm",
        footerTermsUrl: PUBLIC_ROUTES.TERMS_OF_USE,
        footerPrivacyLabel: "Chính sách bảo mật",
        footerPrivacyUrl: PUBLIC_ROUTES.PRIVACY_POLICY,
        footerSupportLabel: "Liên hệ hỗ trợ",
        footerSupportUrl: PUBLIC_ROUTES.SUPPORT_CONTACT,
        footerSupportEmail: "support@cuuho.gov.vn",
        hotline: "1900-xxxx",
        footerFacebookUrl: "#",
        footerTwitterUrl: "#",
        footerYoutubeUrl: "#",
        footerCopyright: "© 2024 Hệ thống Cứu hộ - Cứu trợ. Bản quyền thuộc về Cơ quan chủ quản.",
    });

    useEffect(() => {
        const loadRuntimeSettings = async () => {
            try {
                const runtime = await httpClient.get("/public/runtime-settings");
                setFooterSettings((prev) => ({
                    ...prev,
                    ...runtime,
                }));
            } catch {
                // Keep defaults on public pages.
            }
        };
        loadRuntimeSettings();
    }, []);

    useEffect(() => {
        const onScroll = () => {
            setIsHeaderScrolled(window.scrollY > 12);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const navItems = useMemo(
        () => [
            { label: "Giới thiệu", to: PUBLIC_ROUTES.HOME },
            { label: "Hướng dẫn", to: PUBLIC_ROUTES.EMERGENCY_GUIDE },
            { label: "Liên hệ", to: PUBLIC_ROUTES.SUPPORT_CONTACT },
        ],
        []
    );

    const pageLabel = useMemo(() => {
        if (location.pathname === PUBLIC_ROUTES.EMERGENCY_GUIDE) return "Hướng dẫn khẩn cấp";
        if (location.pathname === PUBLIC_ROUTES.SUPPORT_CONTACT) return "Liên hệ hỗ trợ";
        if (location.pathname === PUBLIC_ROUTES.TERMS_OF_USE) return "Tuyên bố miễn trừ trách nhiệm";
        if (location.pathname === PUBLIC_ROUTES.PRIVACY_POLICY) return "Chính sách bảo mật";
        return "Trang chủ";
    }, [location.pathname]);

    return (
        <div className="relative min-h-screen bg-[#eef6ff] text-slate-900">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.82),_rgba(238,246,255,0.58))]" />
            <div className="pointer-events-none absolute left-[-8rem] top-32 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl glass-float" />
            <div className="pointer-events-none absolute right-[-6rem] top-20 h-96 w-96 rounded-full bg-blue-200/35 blur-3xl glass-float" style={{ animationDelay: '1.6s' }} />
            <div className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-white/60 blur-3xl" />

            <header
                className={[
                    'fixed inset-x-0 top-0 z-[90] border-b backdrop-blur-xl transition-all duration-300',
                    isHeaderScrolled
                        ? 'border-slate-200/90 bg-white/96 shadow-[0_12px_28px_rgba(15,23,42,0.14)]'
                        : 'border-white/60 bg-white/85',
                ].join(' ')}
            >
                <Container className={`relative z-10 transition-all duration-300 ${isHeaderScrolled ? 'py-1.5' : 'py-3'}`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <Link to={PUBLIC_ROUTES.HOME} className="flex items-center gap-4 rounded-[22px] px-1 py-1">
                            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-400 shadow-[0_18px_40px_rgba(14,116,144,0.28)]">
                                <HomeIcon className="text-white" size={22} strokeWidth={2.2} />
                            </div>
                            <div>
                                <p className="text-base font-extrabold tracking-[0.12em] text-blue-700">CỨU HỘ KHẨN CẤP</p>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Emergency Relief System</p>
                            </div>
                        </Link>

                        <div className={`hidden items-center gap-2 rounded-full border border-white/70 bg-white/[0.35] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl lg:flex transition-all duration-300 ${isHeaderScrolled ? 'px-2 py-1' : 'px-3 py-2'}`}>
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        [
                                            `rounded-full font-semibold transition ${isHeaderScrolled ? 'px-4 py-2 text-xs' : 'px-5 py-3 text-sm'}`,
                                            isActive
                                                ? "bg-white/85 text-blue-700 shadow-[0_8px_24px_rgba(148,163,184,0.18)]"
                                                : "text-slate-600 hover:bg-white/[0.55] hover:text-slate-900",
                                        ].join(" ")
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>

                        <div className="flex items-center justify-between gap-4 lg:justify-end">
                            <div className={`hidden rounded-[20px] border border-white/70 bg-white/[0.35] text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl sm:block transition-all duration-300 ${isHeaderScrolled ? 'px-3 py-2' : 'px-4 py-3'}`}>
                                <p className="text-sm font-bold text-slate-800">{pageLabel}</p>
                                <p className="text-xs text-slate-500">Cổng thông tin công khai</p>
                            </div>
                            <Link
                                to={AUTH_ROUTES.LOGIN}
                                className={`inline-flex items-center gap-2 rounded-[18px] border border-blue-200/70 bg-blue-600 font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700 ${isHeaderScrolled ? 'px-4 py-2 text-xs' : 'px-5 py-3 text-sm'}`}
                            >
                                <LogIn size={16} className="shrink-0" />
                                Đăng nhập
                            </Link>
                        </div>
                    </div>

                    <div className={`flex flex-wrap gap-2 lg:hidden transition-all duration-300 ${isHeaderScrolled ? 'mt-2' : 'mt-4'}`}>
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    [
                                        "rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-xl transition",
                                        isActive
                                            ? "border-white/80 bg-white/85 text-blue-700 shadow-sm"
                                            : "border-white/60 bg-white/[0.35] text-slate-600 hover:bg-white/[0.55]",
                                    ].join(" ")
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                </Container>
            </header>

            <div className={`transition-all duration-300 ${isHeaderScrolled ? 'h-[108px] lg:h-[78px]' : 'h-[132px] lg:h-[96px]'}`} />

            <Container className="relative z-10 mt-2">
                <section className="glass-panel reveal-rise flex flex-col gap-3 rounded-[24px] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-rose-50 text-rose-600">
                            <ShieldAlert size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Thông tin công khai</p>
                            <p className="text-sm font-semibold text-slate-800">
                                Đang xem: {pageLabel}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a
                            href={normalizeExternalUrl(`tel:${footerSettings.hotline || ""}`)}
                            className="inline-flex items-center gap-2 rounded-[14px] border border-blue-100 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-white"
                        >
                            <Phone size={14} />
                            Hotline
                        </a>
                        <Link
                            to={PUBLIC_ROUTES.EMERGENCY_GUIDE}
                            className="inline-flex items-center gap-2 rounded-[14px] border border-amber-100 bg-amber-50/80 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
                        >
                            Hướng dẫn khẩn cấp
                        </Link>
                    </div>
                </section>
            </Container>

            <main className="relative z-10 pb-14 pt-6 sm:pt-8">{children}</main>

            <footer className="relative z-10 border-t border-white/60 bg-white/80 backdrop-blur-xl">
                <Container className="py-7 sm:py-8">
                    <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr_0.8fr]">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-400 shadow-[0_12px_28px_rgba(14,116,144,0.22)]">
                                    <HomeIcon className="text-white" size={18} strokeWidth={2.2} />
                                </div>
                                <div>
                                    <p className="text-sm font-extrabold tracking-[0.12em] text-blue-700">{footerSettings.footerBrandName}</p>
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Public Information Portal</p>
                                </div>
                            </div>
                            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">{footerSettings.footerDescription}</p>
                        </div>

                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Liên kết</p>
                            <div className="mt-4 space-y-3">
                                <a href={resolveFooterLink(footerSettings.footerTermsUrl, PUBLIC_ROUTES.TERMS_OF_USE)} className="glass-hover flex items-center justify-between rounded-2xl border border-white/70 bg-white/40 px-4 py-3 text-sm font-medium text-slate-700 backdrop-blur-xl hover:bg-white/65">
                                    {footerSettings.footerTermsLabel}
                                    <ArrowRight size={14} className="text-slate-400" />
                                </a>
                                <a href={resolveFooterLink(footerSettings.footerPrivacyUrl, PUBLIC_ROUTES.PRIVACY_POLICY)} className="glass-hover flex items-center justify-between rounded-2xl border border-white/70 bg-white/40 px-4 py-3 text-sm font-medium text-slate-700 backdrop-blur-xl hover:bg-white/65">
                                    {footerSettings.footerPrivacyLabel}
                                    <ArrowRight size={14} className="text-slate-400" />
                                </a>
                                <a href={resolveFooterLink(footerSettings.footerSupportUrl, PUBLIC_ROUTES.SUPPORT_CONTACT)} className="glass-hover flex items-center justify-between rounded-2xl border border-white/70 bg-white/40 px-4 py-3 text-sm font-medium text-slate-700 backdrop-blur-xl hover:bg-white/65">
                                    {footerSettings.footerSupportLabel}
                                    <ArrowRight size={14} className="text-slate-400" />
                                </a>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Liên hệ</p>
                            <div className="mt-4 space-y-3">
                                <a href={normalizeExternalUrl(`mailto:${footerSettings.footerSupportEmail || ""}`)} className="glass-hover flex items-center gap-3 rounded-2xl border border-white/70 bg-white/40 px-4 py-3 text-sm text-slate-700 backdrop-blur-xl hover:bg-white/65">
                                    <Mail size={16} className="text-blue-600" />
                                    <span className="truncate">{footerSettings.footerSupportEmail}</span>
                                </a>
                                <a href={normalizeExternalUrl(`tel:${footerSettings.hotline || ""}`)} className="glass-hover flex items-center gap-3 rounded-2xl border border-white/70 bg-white/40 px-4 py-3 text-sm text-slate-700 backdrop-blur-xl hover:bg-white/65">
                                    <Phone size={16} className="text-blue-600" />
                                    <span>{footerSettings.hotline || "1900-xxxx"}</span>
                                </a>
                                <div className="flex gap-3 pt-1">
                                    <a href={normalizeExternalUrl(footerSettings.footerFacebookUrl)} className="glass-chip h-11 w-11 justify-center"><Facebook size={16} /></a>
                                    <a href={normalizeExternalUrl(footerSettings.footerTwitterUrl)} className="glass-chip h-11 w-11 justify-center"><Twitter size={16} /></a>
                                    <a href={normalizeExternalUrl(footerSettings.footerYoutubeUrl)} className="glass-chip h-11 w-11 justify-center"><Youtube size={16} /></a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-7 border-t border-white/60 pt-5 text-center text-sm text-slate-500">{footerSettings.footerCopyright}</div>
                </Container>
            </footer>
        </div>
    );
}
