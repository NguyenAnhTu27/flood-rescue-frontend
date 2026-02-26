import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
    Bell,
    ChevronDown,
    Menu,
    X,
    Mail,
    Phone,
    Facebook,
    Twitter,
    Youtube,
} from "lucide-react";
import { PUBLIC_ROUTES, CITIZEN_ROUTES } from "../app/routes/route.constants.js";
/**
 * RootLayout: Topbar giống hình mẫu + container
 * - Desktop: logo | nav | notification | user
 * - Mobile: hamburger + dropdown nav
 */
export default function RootLayout({ children }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);
    const userMenuRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const onDocClick = (e) => {
            if (!userMenuRef.current) return;
            if (!userMenuRef.current.contains(e.target)) setUserOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const navItems = [
        { label: "Trang chủ", to: CITIZEN_ROUTES.DASHBOARD },
        { label: "Yêu cầu của tôi", to: CITIZEN_ROUTES.MY_RESCUE_REQUESTS },
        { label: "Bản đồ cứu trợ", to: "/cong-dan/ban-do-cuu-tro" },
        { label: "Hướng dẫn an toàn", to: "/cong-dan/huong-dan-an-toan" },
    ];

    const navLinkClass = ({ isActive }) =>
        [
            "relative px-2 py-2 text-sm font-medium transition",
            isActive ? "text-blue-600" : "text-slate-700 hover:text-blue-600",
        ].join(" ");

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Topbar */}
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
                <div className="mx-auto w-full max-w-[90%] px-2 lg:px-3">
                    <div className="flex h-14 items-center justify-between">
                        {/* Left: Logo */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
                                {/* Logo mark */}
                                <span className="text-lg font-black text-white">✳</span>
                            </div>

                            <div className="leading-tight">
                                <div className="text-sm font-extrabold tracking-wide text-blue-600">
                                    CỨU HỘ KHẨN CẤP
                                </div>                                <div className="text-[10px] font-semibold tracking-wider text-slate-400">
                                    EMERGENCY RELIEF SYSTEM
                                </div>
                            </div>
                        </div>

                        {/* Center: Nav (desktop) */}
                        <nav className="hidden md:flex items-center gap-7">
                            {navItems.map((it) => (
                                <NavLink key={it.to} to={it.to} className={navLinkClass}>
                                    {({ isActive }) => (
                                        <>
                                            {it.label}
                                            {/* underline active like image */}
                                            <span
                                                className={[
                                                    "absolute left-0 -bottom-[14px] h-[2px] w-full rounded-full transition",
                                                    isActive ? "bg-blue-600" : "bg-transparent",
                                                ].join(" ")}
                                            />
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </nav>

                        {/* Right: actions */}
                        <div className="flex items-center gap-3">
                            {/* Mobile menu toggle */}
                            <button
                                type="button"
                                className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"
                                onClick={() => setMobileOpen((v) => !v)}
                                aria-label="Toggle menu"
                            >
                                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                            </button>

                            {/* Notification */}
                            <button
                                type="button"
                                className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-50"
                                aria-label="Notifications"
                            >
                                <Bell size={18} className="text-slate-600" />
                                {/* red dot */}
                                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                            </button>

                            {/* Divider */}
                            <div className="hidden sm:block h-7 w-px bg-slate-200" />

                            {/* User */}
                            <div ref={userMenuRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setUserOpen((v) => !v)}
                                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                                    aria-label="User menu"
                                >
                                    <div className="hidden sm:block text-right leading-tight">
                                        <div className="text-xs font-semibold text-slate-900">
                                            Nguyễn Văn A
                                        </div>
                                        <div className="text-[11px] text-slate-500">Citizen</div>
                                    </div>

                                    {/* Avatar */}
                                    <div className="relative">
                                        <img
                                            src="https://i.pravatar.cc/80?img=12"
                                            alt="avatar"
                                            className="h-9 w-9 rounded-full object-cover"
                                        />
                                        {/* online dot */}
                                        <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                                    </div>

                                    <ChevronDown size={16} className="text-slate-500 hidden sm:block" />
                                </button>

                                {/* Dropdown */}
                                {userOpen && (
                                    <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                                        <div className="px-4 py-3">
                                            <div className="text-sm font-semibold text-slate-900">
                                                Nguyễn Văn A
                                            </div>
                                            <div className="text-xs text-slate-500">Citizen</div>
                                        </div>
                                        <div className="h-px bg-slate-200" />
                                        <div className="py-1">
                                            <Link
                                                to="/citizen/profile"
                                                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                                onClick={() => setUserOpen(false)}
                                            >
                                                Hồ sơ cá nhân
                                            </Link>
                                            <Link
                                                to="/citizen/settings"
                                                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                                onClick={() => setUserOpen(false)}
                                            >
                                                Cài đặt
                                            </Link>
                                            <div className="h-px bg-slate-200 my-1" />
                                            <Link
                                                to={PUBLIC_ROUTES.HOME}
                                                className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    setUserOpen(false);
                                                    // TODO: logout logic
                                                }}
                                            >
                                                Đăng xuất
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile nav panel */}
                    {mobileOpen && (
                        <div className="md:hidden pb-3">
                            <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                                {navItems.map((it) => (
                                    <NavLink
                                        key={it.to}
                                        to={it.to}
                                        onClick={() => setMobileOpen(false)}
                                        className={({ isActive }) =>
                                            [
                                                "block rounded-lg px-3 py-2 text-sm font-medium",
                                                isActive
                                                    ? "bg-blue-50 text-blue-700"
                                                    : "text-slate-700 hover:bg-slate-50",
                                            ].join(" ")
                                        }
                                    >
                                        {it.label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Main content */}
            <main className="mx-auto w-full max-w-[90%] px-2 lg:px-3 py-4 lg:py-6 flex-1">{children}</main>

            {/* Shared Footer */}
            <footer className="mt-6 lg:mt-8 border-t border-slate-200 bg-white">
                <div className="mx-auto w-full max-w-[90%] px-2 lg:px-3 py-6 lg:py-8">
                    <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                        {/* Left */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                                    <span className="text-sm font-extrabold text-white">✳</span>
                                </div>
                                <span className="text-sm font-bold">QUẢN LÝ CỨU HỘ</span>
                            </div>
                            <p className="max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
                                Hệ thống hỗ trợ cộng đồng trong tình huống thiên tai khẩn cấp. Thông tin được bảo mật
                                và điều phối theo quy định của cơ quan chức năng.
                            </p>
                        </div>

                        {/* Mid links */}
                        <div className="flex gap-10">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Liên kết</h4>
                                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                    <li>
                                        <Link to="#" className="hover:text-blue-600">
                                            Điều khoản sử dụng
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="#" className="hover:text-blue-600">
                                            Chính sách bảo mật
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="#" className="hover:text-blue-600">
                                            Liên hệ hỗ trợ
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Thông tin</h4>
                                <div className="mt-3 space-y-2 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Mail size={16} className="shrink-0 text-slate-500" />
                                        <span className="break-all">support@cuuho.gov.vn</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone size={16} className="shrink-0 text-slate-500" />
                                        <span>1900-xxxx</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Social */}
                        <div className="md:text-right">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Kết nối</h4>
                            <div className="mt-3 flex gap-3 md:justify-end">
                                <Link
                                    to="#"
                                    className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
                                >
                                    <Facebook size={16} className="text-slate-600" />
                                </Link>
                                <Link
                                    to="#"
                                    className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
                                >
                                    <Twitter size={16} className="text-slate-600" />
                                </Link>
                                <Link
                                    to="#"
                                    className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
                                >
                                    <Youtube size={16} className="text-slate-600" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-500 sm:text-sm">
                        © 2024 Hệ thống Quản lý Cứu hộ - Cứu trợ. Bản quyền thuộc về Cơ quan chủ quản.
                    </div>
                </div>
            </footer>
        </div>
    );
}