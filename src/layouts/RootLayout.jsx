import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
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
import { PUBLIC_ROUTES, CITIZEN_ROUTES, COORDINATOR_ROUTES, RESCUER_ROUTES, MANAGER_ROUTES, ADMIN_ROUTES, ACCOUNT_ROUTES } from "../app/routes/route.constants.js";
import httpClient from "../shared/lib/http.js";
import { clearAuth, clearCitizenBlockState, getCitizenBlockState, getRole, getUser, setCitizenBlockState } from "../shared/lib/storage.js";
import { getMyNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead, queueEmergencyNotification } from "../features/notifications/api.js";
import { getCurrentUser } from "../features/auth/api.js";

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
/**
 * RootLayout: Topbar giống hình mẫu + container
 * - Desktop: logo | nav | notification | user
 * - Mobile: hamburger + dropdown nav
 */
export default function RootLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotif, setLoadingNotif] = useState(false);
    const [queueTarget, setQueueTarget] = useState(null);
    const [queueNote, setQueueNote] = useState('');
    const [queueWithNote, setQueueWithNote] = useState(false);
    const [queueSaving, setQueueSaving] = useState(false);
    const [citizenBlockState, setCitizenBlockStateLocal] = useState(() => getCitizenBlockState());
    const prevUnreadRef = useRef(0);
    const userMenuRef = useRef(null);
    const notifMenuRef = useRef(null);
    const [footerSettings, setFooterSettings] = useState({
        footerBrandName: "QUẢN LÝ CỨU HỘ",
        footerDescription: "Hệ thống hỗ trợ cộng đồng trong tình huống thiên tai khẩn cấp. Thông tin được bảo mật và điều phối theo quy định của cơ quan chức năng.",
        footerTermsLabel: "Điều khoản sử dụng",
        footerTermsUrl: "/dieu-khoan-su-dung",
        footerPrivacyLabel: "Chính sách bảo mật",
        footerPrivacyUrl: "/chinh-sach-bao-mat",
        footerSupportLabel: "Liên hệ hỗ trợ",
        footerSupportUrl: "/lien-he-ho-tro",
        footerSupportEmail: "support@cuuho.gov.vn",
        hotline: "1900-xxxx",
        footerFacebookUrl: "#",
        footerTwitterUrl: "#",
        footerYoutubeUrl: "#",
        footerCopyright: "© 2024 Hệ thống Quản lý Cứu hộ - Cứu trợ. Bản quyền thuộc về Cơ quan chủ quản.",
    });
    const role = getRole();
    const [currentUser, setCurrentUser] = useState(() => getUser());

    useEffect(() => {
        const syncCurrentUser = () => setCurrentUser(getUser());
        syncCurrentUser();
        window.addEventListener('storage', syncCurrentUser);
        window.addEventListener('auth-user-updated', syncCurrentUser);
        return () => {
            window.removeEventListener('storage', syncCurrentUser);
            window.removeEventListener('auth-user-updated', syncCurrentUser);
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const onDocClick = (e) => {
            if (!userMenuRef.current) return;
            if (!userMenuRef.current.contains(e.target)) setUserOpen(false);
            if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) setNotifOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const playAttentionSound = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = 880;
            gain.gain.value = 0.03;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch {
            // ignore
        }
    };

    const syncCitizenBlockStateFromNotifications = (list) => {
        if (role !== 'CITIZEN' || !Array.isArray(list) || list.length === 0) return;
        const events = list
            .filter((n) => ['CITIZEN_REQUEST_BLOCKED', 'CITIZEN_REQUEST_UNBLOCKED'].includes(String(n?.eventCode || '').toUpperCase()))
            .sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());
        if (events.length === 0) return;

        const latest = events[0];
        const code = String(latest?.eventCode || '').toUpperCase();
        if (code === 'CITIZEN_REQUEST_BLOCKED') {
            const reason = String(latest?.content || latest?.title || '').trim();
            const next = {
                blocked: true,
                reason,
                updatedAt: latest?.createdAt || new Date().toISOString(),
            };
            setCitizenBlockState(next);
            setCitizenBlockStateLocal(next);
            return;
        }
        if (code === 'CITIZEN_REQUEST_UNBLOCKED') {
            clearCitizenBlockState();
            setCitizenBlockStateLocal({ blocked: false, reason: '', updatedAt: new Date().toISOString() });
        }
    };

    const loadNotifications = async () => {
        try {
            setLoadingNotif(true);
            const [countResp, listResp] = await Promise.all([
                getUnreadNotificationCount(),
                getMyNotifications({ page: 0, size: 100 }),
            ]);
            const nextUnread = Number(countResp?.unreadCount || 0);
            setUnreadCount(nextUnread);
            const list = Array.isArray(listResp?.content) ? listResp.content : Array.isArray(listResp) ? listResp : [];
            setNotifications(list);
            syncCitizenBlockStateFromNotifications(list);

            if (nextUnread > 0 && prevUnreadRef.current === 0) {
                playAttentionSound();
            }
            prevUnreadRef.current = nextUnread;
        } catch {
            // ignore
        } finally {
            setLoadingNotif(false);
        }
    };

    useEffect(() => {
        loadNotifications();
        const id = window.setInterval(loadNotifications, 15000);
        return () => window.clearInterval(id);
    }, []);

    useEffect(() => {
        if (role !== 'CITIZEN') return undefined;
        let cancelled = false;
        const syncFromAuthMe = async () => {
            try {
                const me = await getCurrentUser();
                if (cancelled) return;
                const blocked = Boolean(me?.rescueRequestBlocked);
                const reason = String(me?.rescueRequestBlockedReason || '').trim();
                if (blocked) {
                    const next = { blocked: true, reason, updatedAt: new Date().toISOString() };
                    setCitizenBlockState(next);
                    setCitizenBlockStateLocal(next);
                }
            } catch {
                if (!cancelled) {
                    setCitizenBlockStateLocal(getCitizenBlockState());
                }
            }
        };
        syncFromAuthMe();
        const id = window.setInterval(syncFromAuthMe, 5000);
        return () => {
            cancelled = true;
            window.clearInterval(id);
        };
    }, [role]);

    useEffect(() => {
        const loadRuntimeSettings = async () => {
            try {
                const runtime = await httpClient.get("/public/runtime-settings");
                setFooterSettings((prev) => ({
                    ...prev,
                    ...runtime,
                }));
            } catch (err) {
                console.error("[RootLayout] load runtime settings error:", err);
            }
        };

        const onSettingsUpdated = () => {
            loadRuntimeSettings();
        };

        loadRuntimeSettings();
        const id = window.setInterval(loadRuntimeSettings, 30000);
        window.addEventListener("runtime-settings-updated", onSettingsUpdated);
        return () => {
            window.clearInterval(id);
            window.removeEventListener("runtime-settings-updated", onSettingsUpdated);
        };
    }, []);

    const navByRole = {
        CITIZEN: [
            { label: "Trang chủ", to: CITIZEN_ROUTES.DASHBOARD },
            { label: "Yêu cầu của tôi", to: CITIZEN_ROUTES.MY_RESCUE_REQUESTS },
            { label: "Hướng dẫn khẩn cấp", to: PUBLIC_ROUTES.EMERGENCY_GUIDE },
        ],
        COORDINATOR: [
            { label: "Trang chủ", to: COORDINATOR_ROUTES.DASHBOARD },
            { label: "Phân công", to: COORDINATOR_ROUTES.ASSIGN_RESCUE },
            { label: "Giám sát nhiệm vụ", to: COORDINATOR_ROUTES.TASK_MONITOR },
            { label: "Theo dõi đội", to: COORDINATOR_ROUTES.TEAM_WORKLOAD },
            { label: "Lịch sử cứu hộ", to: COORDINATOR_ROUTES.TASK_HISTORY },

        ],
        RESCUER: [
            { label: "Trang Chủ", to: RESCUER_ROUTES.DASHBOARD },
            { label: "Sắp xếp cứu trợ", to: RESCUER_ROUTES.RELIEF_PRIORITIZE },
            { label: "Lịch sử", to: RESCUER_ROUTES.SAFETY_GUIDE },
        ],
        MANAGER: [
            { label: "Trang chủ", to: MANAGER_ROUTES.DASHBOARD },
            { label: "Phân phối", to: MANAGER_ROUTES.RELIEF_REQUESTS },
            { label: "Kho hàng", to: MANAGER_ROUTES.INVENTORY_OVERVIEW },
            { label: "Quản lý phương tiện", to: MANAGER_ROUTES.ASSETS_MANAGEMENT },
            { label: "Đội cứu hộ cứu trợ", to: MANAGER_ROUTES.RELIEF_TEAM_MANAGEMENT },
        ],
        ADMIN: [
            { label: "Trang chủ", to: ADMIN_ROUTES.DASHBOARD },
            { label: "Đội cứu hộ", to: ADMIN_ROUTES.TEAMS_MANAGEMENT },
            { label: "Phản hồi hệ thống", to: ADMIN_ROUTES.SYSTEM_FEEDBACKS },
            { label: "Nhật ký", to: ADMIN_ROUTES.AUDIT_LOGS },
        ],
    };
    const navItems = navByRole[role] || [{ label: "Trang chủ", to: PUBLIC_ROUTES.HOME }];

    const isNavItemActive = (to) => {
        if (!to) return false;
        const current = location.pathname;
        const normalized = to.replace(/\/:.*$/, "");
        const exactOnlyPaths = new Set([
            CITIZEN_ROUTES.DASHBOARD,
            COORDINATOR_ROUTES.DASHBOARD,
            RESCUER_ROUTES.DASHBOARD,
            MANAGER_ROUTES.DASHBOARD,
            ADMIN_ROUTES.DASHBOARD,
        ]);
        if (normalized === "/") return current === "/";
        if (exactOnlyPaths.has(normalized)) {
            return current === normalized;
        }
        return current === normalized || current.startsWith(`${normalized}/`);
    };

    const isCitizenHardBlocked = role === 'CITIZEN' && Boolean(citizenBlockState?.blocked);

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
                        <nav className="hidden md:flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-thin py-1">
                            {navItems.map((it) => (
                                <NavLink
                                    key={it.to}
                                    to={it.to}
                                    className={() =>
                                        [
                                            "relative rounded-lg px-3 py-2 text-sm font-semibold transition",
                                            isNavItemActive(it.to)
                                                ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                                                : "text-slate-500 opacity-45 hover:opacity-80 hover:text-slate-700",
                                        ].join(" ")
                                    }
                                >
                                    {it.label}
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
                            <div ref={notifMenuRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNotifOpen((v) => !v);
                                        if (!notifOpen) loadNotifications();
                                    }}
                                    className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-50 ${unreadCount > 0 ? 'animate-pulse' : ''}`}
                                    aria-label="Notifications"
                                >
                                    <Bell size={18} className={`${unreadCount > 0 ? 'text-rose-600' : 'text-slate-600'}`} />
                                    {unreadCount > 0 && (
                                        <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {notifOpen && (
                                    <div className="absolute right-0 z-50 mt-2 w-96 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                                        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                                            <div className="text-sm font-semibold text-slate-900">Thông báo</div>
                                            <button
                                                type="button"
                                                className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                                onClick={async () => {
                                                    await markAllNotificationsRead();
                                                    await loadNotifications();
                                                }}
                                            >
                                                Xác nhận đã xem tất cả
                                            </button>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {loadingNotif ? (
                                                <div className="p-3 text-xs text-slate-500">Đang tải...</div>
                                            ) : notifications.length === 0 ? (
                                                <div className="p-3 text-xs text-slate-500">Không có thông báo mới.</div>
                                            ) : (
                                                notifications.map((n) => (
                                                    <div key={n.id} className={`border-b border-slate-100 p-3 ${n.read ? 'bg-white' : 'bg-rose-50/40'}`}>
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <div className="text-xs font-semibold text-slate-900">{n.title || 'Thông báo'}</div>
                                                                <div className="mt-1 text-xs text-slate-600">{n.content || '—'}</div>
                                                                {n.actionStatus && (
                                                                    <div className="mt-1 text-[11px] font-semibold text-blue-700">Trạng thái: {n.actionStatus}</div>
                                                                )}
                                                                <div className="mt-1 text-[10px] text-slate-500">{n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : '—'}</div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                {!n.read && (
                                                                    <button
                                                                        type="button"
                                                                        className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                                                                        onClick={async () => {
                                                                            await markNotificationRead(n.id);
                                                                            await loadNotifications();
                                                                        }}
                                                                    >
                                                                        Đã xem
                                                                    </button>
                                                                )}
                                                                {role === 'COORDINATOR'
                                                                    && String(n.eventCode || '').toUpperCase() === 'RESCUER_EMERGENCY'
                                                                    && String(n.actionStatus || '').toUpperCase() !== 'QUEUED' && (
                                                                        <button
                                                                            type="button"
                                                                            className="rounded-md border border-blue-200 px-2 py-1 text-[10px] font-semibold text-blue-700 hover:bg-blue-50"
                                                                            onClick={() => {
                                                                                setQueueTarget(n);
                                                                                setQueueWithNote(false);
                                                                                setQueueNote('');
                                                                            }}
                                                                        >
                                                                            Đưa vào hàng đợi
                                                                        </button>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

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
                                            {currentUser?.fullName || "Người dùng"}
                                        </div>
                                        <div className="text-[11px] text-slate-500">{role || "Guest"}</div>
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
                                                {currentUser?.fullName || "Người dùng"}
                                            </div>
                                            <div className="text-xs text-slate-500">{role || "Guest"}</div>
                                        </div>
                                        <div className="h-px bg-slate-200" />
                                        <div className="py-1">
                                            {role && (
                                                <>
                                                    <Link
                                                        to={ACCOUNT_ROUTES.PROFILE}
                                                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                                        onClick={() => setUserOpen(false)}
                                                    >
                                                        Hồ sơ cá nhân
                                                    </Link>
                                                    {role === 'CITIZEN' && (
                                                        <>
                                                            <Link
                                                                to={`${ACCOUNT_ROUTES.PROFILE}#bao-mat`}
                                                                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                                                onClick={() => setUserOpen(false)}
                                                            >
                                                                Cài đặt tài khoản
                                                            </Link>
                                                            <div className="h-px bg-slate-200 my-1" />
                                                            <Link
                                                                to={CITIZEN_ROUTES.FEEDBACK}
                                                                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                                                onClick={() => setUserOpen(false)}
                                                            >
                                                                Đánh giá hệ thống
                                                            </Link>
                                                        </>
                                                    )}
                                                    <div className="h-px bg-slate-200 my-1" />
                                                </>
                                            )}
                                            <Link
                                                to={PUBLIC_ROUTES.HOME}
                                                className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    setUserOpen(false);
                                                    clearAuth();
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
                                {role === 'CITIZEN' && !isCitizenHardBlocked && (
                                    <Link
                                        to={CITIZEN_ROUTES.CREATE_RESCUE_REQUEST}
                                        onClick={() => setMobileOpen(false)}
                                        className="mb-2 block rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                    >
                                        Tạo yêu cầu cứu hộ
                                    </Link>
                                )}
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

            {queueTarget && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
                        <h3 className="text-sm font-bold text-slate-900">Đưa yêu cầu khẩn cấp vào hàng đợi</h3>
                        <p className="mt-1 text-xs text-slate-600">
                            Hành động này mặc định đánh dấu đã xem và tạo yêu cầu khẩn cấp mới trong danh sách chờ.
                        </p>
                        <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={queueWithNote}
                                onChange={(e) => setQueueWithNote(e.target.checked)}
                            />
                            Thêm mô tả bổ sung
                        </label>
                        {queueWithNote && (
                            <textarea
                                rows={4}
                                value={queueNote}
                                onChange={(e) => setQueueNote(e.target.value)}
                                placeholder="Mô tả thêm (tùy chọn)"
                                className="mt-2 w-full rounded-lg border border-slate-200 p-2 text-sm"
                            />
                        )}
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                onClick={() => setQueueTarget(null)}
                                disabled={queueSaving}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                disabled={queueSaving}
                                onClick={async () => {
                                    try {
                                        setQueueSaving(true);
                                        await queueEmergencyNotification(queueTarget.id, {
                                            direct: !queueWithNote,
                                            note: queueWithNote ? queueNote : null,
                                        });
                                        setQueueTarget(null);
                                        await loadNotifications();
                                    } catch (e) {
                                        window.alert(e?.message || 'Không thể đưa yêu cầu vào hàng đợi.');
                                    } finally {
                                        setQueueSaving(false);
                                    }
                                }}
                            >
                                {queueSaving ? 'Đang xử lý...' : 'Xác nhận đưa vào hàng đợi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCitizenHardBlocked && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl">
                        <h2 className="text-2xl font-extrabold text-rose-700">Bạn bị khóa sử dụng hệ thống</h2>
                        <p className="mt-2 text-sm text-slate-700">
                            Tài khoản của bạn đang bị điều phối khóa tạm thời. Bạn chưa thể sử dụng các chức năng trong menu.
                        </p>

                        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-rose-700">Mô tả</div>
                            <div className="mt-1 text-sm font-medium text-rose-900">
                                {citizenBlockState?.reason || "Không có mô tả chi tiết từ điều phối."}
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Số điện thoại khiếu nại</div>
                                <a href={normalizeExternalUrl(`tel:${footerSettings.hotline || ""}`)} className="mt-1 block text-base font-bold text-blue-700">
                                    {footerSettings.hotline || "1900-xxxx"}
                                </a>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email khiếu nại</div>
                                <a href={normalizeExternalUrl(`mailto:${footerSettings.footerSupportEmail || ""}`)} className="mt-1 block break-all text-base font-bold text-blue-700">
                                    {footerSettings.footerSupportEmail || "support@cuuho.gov.vn"}
                                </a>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                                onClick={() => {
                                    clearAuth();
                                    navigate(PUBLIC_ROUTES.HOME);
                                }}
                            >
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                    <li>
                                        <a href={resolveFooterLink(footerSettings.footerSupportUrl, PUBLIC_ROUTES.SUPPORT_CONTACT)} target="_blank" rel="noreferrer" className="hover:text-blue-600">
                                            {footerSettings.footerSupportLabel}
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Thông tin</h4>
                                <div className="mt-3 space-y-2 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Mail size={16} className="shrink-0 text-slate-500" />
                                        <a href={normalizeExternalUrl(`mailto:${footerSettings.footerSupportEmail || ""}`)} className="break-all hover:text-blue-600">
                                            {footerSettings.footerSupportEmail}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone size={16} className="shrink-0 text-slate-500" />
                                        <a href={normalizeExternalUrl(`tel:${footerSettings.hotline || ""}`)} className="hover:text-blue-600">
                                            {footerSettings.hotline || "1900-xxxx"}
                                        </a>
                                    </div>
                                </div>
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

                    <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-500 sm:text-sm">
                        {footerSettings.footerCopyright}
                    </div>
                </div>
            </footer>
        </div>
    );
}
