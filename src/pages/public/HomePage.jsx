import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Home as HomeIcon,
    MapPin,
    LogIn,
    BellRing,
    HeartPulse,
    Facebook,
    Twitter,
    Youtube,
} from "lucide-react";

import { AUTH_ROUTES, PUBLIC_ROUTES, CITIZEN_ROUTES } from "../../app/routes/route.constants.js";
import httpClient from "../../shared/lib/http.js";

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
    return normalizeExternalUrl(value);
};

/** ============ Small UI helpers ============ */
function Container({ children, className = "" }) {
    return <div className={`mx-auto w-full max-w-[90%] px-2 lg:px-3 ${className}`}>{children}</div>;
}

function IconBadge({ children, className = "" }) {
    return (
        <div
            className={[
                "flex items-center justify-center rounded-xl",
                "h-10 w-10 sm:h-11 sm:w-11",
                "bg-blue-50 border border-blue-100",
                "shrink-0",
                className,
            ].join(" ")}
        >
            {children}
        </div>
    );
}

function PrimaryButton({ to, children }) {
    return (
        <Link
            to={to}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
        >
            {children}
        </Link>
    );
}

function SecondaryButton({ to, children }) {
    return (
        <Link
            to={to}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
            {children}
        </Link>
    );
}

export default function HomePage() {
    const [footerSettings, setFooterSettings] = useState({
        footerBrandName: "QUẢN LÝ CỨU HỘ",
        footerDescription: "Hệ thống hỗ trợ cộng đồng trong tình huống thiên tai khẩn cấp. Thông tin được bảo mật và điều phối theo quy định của cơ quan chức năng.",
        footerTermsLabel: "Điều khoản sử dụng",
        footerTermsUrl: PUBLIC_ROUTES.TERMS_OF_USE,
        footerPrivacyLabel: "Chính sách bảo mật",
        footerPrivacyUrl: PUBLIC_ROUTES.PRIVACY_POLICY,
        footerFacebookUrl: "#",
        footerTwitterUrl: "#",
        footerYoutubeUrl: "#",
        footerCopyright: "© 2024 Hệ thống Quản lý Cứu hộ - Cứu trợ. Bản quyền thuộc về Cơ quan chủ quản.",
    });

    useEffect(() => {
        const loadRuntimeSettings = async () => {
            try {
                const runtime = await httpClient.get("/public/runtime-settings");
                setFooterSettings((prev) => ({
                    ...prev,
                    ...runtime,
                }));
            } catch (err) {
                console.error("[HomePage] load runtime settings error:", err);
            }
        };
        loadRuntimeSettings();
    }, []);

    return (
        <div className="min-h-screen bg-white text-slate-900">
            {/* ================= Header ================= */}
            <header className="sticky top-0 z-50 border-b border-slate-200  bg-white/90 backdrop-blur">
                <Container>
                    <div className="flex h-14 items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                                <HomeIcon className="text-white" size={18} strokeWidth={2.2} />
                            </div>
                            <span className="text-sm font-bold tracking-wide">QUẢN LÝ CỨU HỘ</span>
                        </div>

                        {/* Nav */}
                        <nav className="hidden items-center gap-8 md:flex">
                            <Link to={PUBLIC_ROUTES.HOME} className="text-sm font-medium text-slate-700 hover:text-blue-600">
                                Giới thiệu
                            </Link>
                            <Link
                                to={PUBLIC_ROUTES.EMERGENCY_GUIDE}
                                className="text-sm font-medium text-slate-700 hover:text-blue-600"
                            >
                                Hướng dẫn
                            </Link>
                        </nav>

                        {/* Login */}
                        <Link
                            to={AUTH_ROUTES.LOGIN}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                            <LogIn size={16} className="shrink-0" />
                            Đăng nhập
                        </Link>
                    </div>
                </Container>
            </header>

            {/* ================= Hero ================= */}
            <main >
                <section className="pt-10 sm:pt-14">
                    <Container>
                        <div className="grid items-center gap-10 lg:grid-cols-2">
                            {/* Left */}
                            <div>
                                <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold tracking-wider text-blue-700">
                                    HỆ THỐNG HỖ TRỢ KHẨN CẤP
                                </div>

                                <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
                                    Hệ thống Quản lý <br className="hidden sm:block" />
                                    Cứu hộ - Cứu trợ Lũ lụt
                                </h1>

                                <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                                    Sứ mệnh kết nối người dân và đội ngũ cứu hộ trong thời gian thực, đảm bảo hỗ trợ nhanh nhất và chính
                                    xác nhất đến các khu vực bị ảnh hưởng bởi thiên tai.
                                </p>

                                <div className="mt-6 flex flex-wrap gap-3">
                                    <PrimaryButton to={AUTH_ROUTES.LOGIN}>Gửi yêu cầu cứu hộ</PrimaryButton>
                                </div>
                            </div>

                            {/* Right image card */}
                            <div className="lg:justify-self-end">
                                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                                    <div className="overflow-hidden rounded-xl bg-slate-100">
                                        {/* Bạn thay src theo ảnh thật của bạn */}
                                        <img
                                            src="https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1200&auto=format&fit=crop"
                                            alt="Hero"
                                            className="h-[280px] w-full object-cover sm:h-[340px] lg:h-[360px] lg:w-[420px]"
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Container>
                </section>

                {/* ================= Emergency Guide ================= */}
                <section className="pt-16 sm:pt-20">
                    <Container>
                        <div className="text-center">
                            <h2 className="text-xl font-extrabold tracking-wide sm:text-2xl">HƯỚNG DẪN KHẨN CẤP</h2>
                            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                                Các bước cần thực hiện ngay lập tức để đảm bảo an toàn cho bản thân và gia đình khi lũ lụt xảy ra.
                            </p>
                        </div>

                        <div className="mt-10 grid gap-4 sm:gap-6 md:grid-cols-3">
                            {/* Card 1 */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                                <IconBadge>
                                    <BellRing className="text-blue-600" size={20} />
                                </IconBadge>
                                <h3 className="mt-4 text-sm font-bold sm:text-base">Tiếp nhận thông tin</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                    Luôn cập nhật thông tin từ các nguồn chính thống, sạc đầy pin điện thoại và chuẩn bị sẵn pin dự phòng.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                                <IconBadge>
                                    <MapPin className="text-blue-600" size={20} />
                                </IconBadge>
                                <h3 className="mt-4 text-sm font-bold sm:text-base">Xác định vị trí</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                    Sử dụng bản đồ của hệ thống để tìm khu vực an toàn hoặc gửi tọa độ GPS cho đội cứu hộ.
                                </p>
                            </div>

                            {/* Card 3 */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                                <IconBadge>
                                    <HeartPulse className="text-blue-600" size={20} />
                                </IconBadge>
                                <h3 className="mt-4 text-sm font-bold sm:text-base">Hỗ trợ y tế</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                    Thực hiện sơ cứu cơ bản và thông báo ngay cho hệ thống nếu có người bị thương cần hỗ trợ y tế khẩn cấp.
                                </p>
                            </div>
                        </div>
                    </Container>
                </section>

                {/* ================= CTA Box (gray) ================= */}
                <section className="pt-16 sm:pt-20">
                    <Container>
                        <div className="rounded-2xl bg-slate-100 px-5 py-10 text-center sm:px-10">
                            <h3 className="text-xl font-extrabold sm:text-2xl">Bạn đang cần hỗ trợ khẩn cấp?</h3>
                            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
                                Đừng ngần ngại. Hãy đăng nhập để gửi yêu cầu cứu hộ ngay bây giờ.
                            </p>

                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                <PrimaryButton to={AUTH_ROUTES.REGISTER}>Đăng ký nhận hỗ trợ</PrimaryButton>
                            </div>
                        </div>
                    </Container>
                </section>

                {/* ================= Footer ================= */}
                <footer className="mt-16 border-t border-slate-200 bg-white">
                    <Container className="py-10">
                        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                            {/* Left */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                                        <HomeIcon className="text-white" size={18} strokeWidth={2.2} />
                                    </div>
                                    <span className="text-sm font-bold">{footerSettings.footerBrandName}</span>
                                </div>
                                <p className="max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
                                    {footerSettings.footerDescription}
                                </p>
                            </div>

                            {/* Mid links */}
                            <div className="flex gap-10">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Liên kết</h4>
                                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                        <li>
                                            <a href={resolveFooterLink(footerSettings.footerTermsUrl, PUBLIC_ROUTES.TERMS_OF_USE)} target="_blank" rel="noreferrer" className="hover:text-blue-600">
                                                {footerSettings.footerTermsLabel}
                                            </a>
                                        </li>
                                        <li>
                                            <a href={resolveFooterLink(footerSettings.footerPrivacyUrl, PUBLIC_ROUTES.PRIVACY_POLICY)} target="_blank" rel="noreferrer" className="hover:text-blue-600">
                                                {footerSettings.footerPrivacyLabel}
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Social */}
                            <div className="md:text-right">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Kết nối</h4>
                                <div className="mt-3 flex gap-3 md:justify-end">
                                    <a
                                        href={normalizeExternalUrl(footerSettings.footerFacebookUrl)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
                                    >
                                        <Facebook size={16} className="text-slate-600" />
                                    </a>
                                    <a
                                        href={normalizeExternalUrl(footerSettings.footerTwitterUrl)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
                                    >
                                        <Twitter size={16} className="text-slate-600" />
                                    </a>
                                    <a
                                        href={normalizeExternalUrl(footerSettings.footerYoutubeUrl)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
                                    >
                                        <Youtube size={16} className="text-slate-600" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 border-t border-slate-200 pt-6 text-center text-xs text-slate-500 sm:text-sm">
                            {footerSettings.footerCopyright}
                        </div>
                    </Container>
                </footer>
            </main>
        </div>
    );
}
