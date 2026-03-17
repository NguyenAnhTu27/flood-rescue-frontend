import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Facebook, Mail, Menu, Phone, Twitter, X, Youtube, LogOut, User, ChevronDown } from 'lucide-react';
import { AUTH_ROUTES, MANAGER_ROUTES, PUBLIC_ROUTES } from '../app/routes/route.constants.js';
import { clearAuth } from '../shared/lib/storage.js';

const primaryNav = [
    { label: 'Trang chủ', to: MANAGER_ROUTES.DASHBOARD },
    { label: 'Kho hàng', to: MANAGER_ROUTES.INVENTORY_OVERVIEW },
    { label: 'Yêu cầu cứu trợ', to: MANAGER_ROUTES.RELIEF_REQUEST_DASHBOARD },
    { label: 'Phương tiện', to: MANAGER_ROUTES.ASSETS_MANAGEMENT },
];

export default function ManagerLayout({ children }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const notifRef = useRef(null);
    const profileRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        function handleClickOutside(event) {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        clearAuth();
        navigate(AUTH_ROUTES.LOGIN);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="sticky top-4 z-40 mx-auto w-[calc(100%-2rem)] max-w-7xl rounded-xl border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl transition-all duration-300">
                <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 md:hidden"
                            onClick={() => setMobileOpen((v) => !v)}
                            aria-label="Open manager menu"
                        >
                            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                        </button>

                        {/* Avatar đã được chuyển qua góc phải */}

                        <div className="hidden md:block">
                            <h1 className="text-lg font-bold text-slate-900">Trung tâm điều hành cứu trợ</h1>
                        </div>

                        <nav aria-label="Main navigation" className="hidden items-center gap-5 md:flex md:pl-8">
                            {primaryNav.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === MANAGER_ROUTES.DASHBOARD}
                                    className={({ isActive }) =>
                                        `relative px-1 py-2 rounded-sm text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            {item.label}
                                            <span
                                                className={`absolute -bottom-[1px] left-0 h-0.5 w-full rounded-full transition ${isActive ? 'bg-blue-600' : 'bg-transparent'
                                                    }`}
                                            />
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Notifications */}
                        <div className="relative" ref={notifRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowNotifications(!showNotifications);
                                    setShowProfileMenu(false);
                                }}
                                className={`relative inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${
                                    showNotifications ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                                aria-label="Notifications"
                            >
                                <Bell className="h-4 w-4" />
                                <span className="absolute right-2.5 top-2.5 flex h-2 w-2">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                                </span>
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md border border-slate-200 bg-white p-4 shadow-lg ring-1 ring-black/5 focus:outline-none">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-slate-900">Thông báo mới</h3>
                                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600">0</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 mb-3">
                                            <Bell className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-900">Chưa có thông báo</p>
                                        <p className="mt-1 text-xs text-slate-500">Bạn đã xem hết tất cả thông báo hệ thống.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="hidden h-6 w-px bg-slate-200 md:block"></div>

                        {/* Profile & Logout */}
                        <div className="relative" ref={profileRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowProfileMenu(!showProfileMenu);
                                    setShowNotifications(false);
                                }}
                                className="flex items-center gap-2 rounded-md border border-transparent p-1 pr-2 transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 font-bold text-blue-700 shadow-sm">
                                    M
                                </div>
                                <div className="hidden flex-col items-start md:flex">
                                    <span className="text-[13px] font-semibold tracking-tight text-slate-700">Tài khoản Quản lý</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hệ thống</span>
                                </div>
                                <ChevronDown className="ml-1 h-4 w-4 text-slate-400" />
                            </button>

                            {/* Profile Dropdown */}
                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-56 origin-top-right overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                                    <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                                        <p className="text-sm font-medium text-slate-900">Quản trị viên</p>
                                        <p className="truncate text-xs text-slate-500">admin@cuuho.gov.vn</p>
                                    </div>
                                    <div className="p-1.5">
                                        <button className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-blue-600">
                                            <User className="h-4 w-4" />
                                            Hồ sơ cá nhân
                                        </button>
                                        <button 
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div
                    className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
                        mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                    aria-hidden={!mobileOpen}
                >
                    <div className="border-t border-slate-100/50 bg-white/50 backdrop-blur-md">
                        <div className="mx-auto w-full px-4 py-3">
                            <p className="mb-2 text-sm font-semibold text-slate-900">Trung tâm điều hành cứu trợ</p>
                            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
                                {primaryNav.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end={item.to === MANAGER_ROUTES.DASHBOARD}
                                        onClick={() => setMobileOpen(false)}
                                        className={({ isActive }) =>
                                            `rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isActive
                                                ? 'bg-slate-50 border-l-2 border-blue-600 text-slate-900'
                                                : 'text-slate-700 hover:bg-slate-100'
                                            }`
                                        }
                                    >
                                        {item.label}
                                    </NavLink>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">{children}</main>

            <footer className="mt-6 border-t border-slate-200 bg-white lg:mt-8">
                <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600">
                                    <span className="text-sm font-extrabold text-white">✳</span>
                                </div>
                                <span className="text-sm font-bold">QUẢN LÝ CỨU HỘ</span>
                            </div>
                            <p className="max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
                                Hệ thống hỗ trợ cộng đồng trong tình huống thiên tai khẩn cấp. Thông tin được bảo mật
                                và điều phối theo quy định của cơ quan chức năng.
                            </p>
                        </div>

                        <div className="flex gap-10">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Liên kết</h4>
                                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                    <li>
                                        <Link to={PUBLIC_ROUTES.TERMS_OF_USE} className="hover:text-blue-600">
                                            Tuyên bố miễn trừ trách nhiệm
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to={PUBLIC_ROUTES.PRIVACY_POLICY} className="hover:text-blue-600">
                                            Chính sách bảo mật
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to={PUBLIC_ROUTES.SUPPORT_CONTACT} className="hover:text-blue-600">
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

                        <div className="md:text-right">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Kết nối</h4>
                            <div className="mt-3 flex gap-3 md:justify-end">
                                <Link to="#" className="rounded-md border border-slate-200 bg-white p-2 hover:bg-slate-50">
                                    <Facebook size={16} className="text-slate-600" />
                                </Link>
                                <Link to="#" className="rounded-md border border-slate-200 bg-white p-2 hover:bg-slate-50">
                                    <Twitter size={16} className="text-slate-600" />
                                </Link>
                                <Link to="#" className="rounded-md border border-slate-200 bg-white p-2 hover:bg-slate-50">
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
