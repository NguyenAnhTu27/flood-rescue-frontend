import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Facebook, Mail, Menu, Phone, Twitter, X, Youtube } from 'lucide-react';
import { AUTH_ROUTES, MANAGER_ROUTES } from '../app/routes/route.constants.js';
import { clearAuth } from '../shared/lib/storage.js';

const primaryNav = [
    { label: 'Trang chủ', to: MANAGER_ROUTES.DASHBOARD },
    { label: 'Kho hàng', to: MANAGER_ROUTES.INVENTORY_OVERVIEW },
    { label: 'Yêu cầu cứu trợ', to: MANAGER_ROUTES.RELIEF_REQUEST_DASHBOARD },
    { label: 'Theo dõi phân phối', to: MANAGER_ROUTES.DISTRIBUTION_TRACKING },
    { label: 'Phương tiện', to: MANAGER_ROUTES.ASSETS_MANAGEMENT },
    { label: 'Báo cáo', to: MANAGER_ROUTES.REPORTS },
];

export default function ManagerLayout({ children }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        clearAuth();
        navigate(AUTH_ROUTES.LOGIN);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
                <div className="mx-auto flex w-full max-w-[90%] flex-wrap items-center justify-between gap-3 px-2 py-3 lg:px-3">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 md:hidden"
                            onClick={() => setMobileOpen((v) => !v)}
                            aria-label="Open manager menu"
                        >
                            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                        </button>

                        <div className="hidden h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white md:inline-flex">
                            M
                        </div>

                        <div className="hidden md:block">
                            <h1 className="text-lg font-bold text-slate-900">Trung tâm điều hành cứu trợ</h1>
                        </div>

                        <nav className="hidden items-center gap-5 md:flex md:pl-8">
                            {primaryNav.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === MANAGER_ROUTES.DASHBOARD}
                                    className={({ isActive }) =>
                                        `relative px-1 py-2 text-sm font-medium transition ${isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
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

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                            aria-label="Notifications"
                        >
                            <Bell className="h-4 w-4" />
                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                            Đăng xuất
                        </button>
                    </div>
                </div>

                {mobileOpen && (
                    <div className="border-t border-slate-100 bg-white md:hidden">
                        <div className="mx-auto w-full max-w-[90%] px-2 py-3 lg:px-3">
                            <p className="mb-2 text-sm font-semibold text-slate-900">Trung tâm điều hành cứu trợ</p>
                            <nav className="flex flex-col gap-1">
                                {primaryNav.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end={item.to === MANAGER_ROUTES.DASHBOARD}
                                        onClick={() => setMobileOpen(false)}
                                        className={({ isActive }) =>
                                            `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive
                                                ? 'border-l-2 border-blue-600 text-slate-900'
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
                )}
            </header>

            <main className="mx-auto w-full max-w-[90%] px-2 py-5 lg:px-3">{children}</main>

            <footer className="mt-6 border-t border-slate-200 bg-white lg:mt-8">
                <div className="mx-auto w-full max-w-[90%] px-2 py-6 lg:px-3 lg:py-8">
                    <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
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

                        <div className="md:text-right">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Kết nối</h4>
                            <div className="mt-3 flex gap-3 md:justify-end">
                                <Link to="#" className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50">
                                    <Facebook size={16} className="text-slate-600" />
                                </Link>
                                <Link to="#" className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50">
                                    <Twitter size={16} className="text-slate-600" />
                                </Link>
                                <Link to="#" className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50">
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

