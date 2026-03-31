import React, { useCallback, useEffect, useState } from 'react';
import {
    AlertCircle,
    CalendarDays,
    IdCard,
    LockKeyhole,
    LogOut,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    ShieldCheck,
    UserRound,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AUTH_ROUTES } from '../../app/routes/route.constants.js';
import { getCurrentUser } from '../../features/auth/api.js';
import { clearAuth, getRole, getUser, setRole, setUser } from '../../shared/lib/storage.js';

function pickFirstValue(source, keys) {
    for (const key of keys) {
        const value = source?.[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            return value;
        }
    }
    return '';
}

function getRoleValue(role) {
    if (typeof role === 'string') return role;
    return role?.name || role?.code || role?.value || '';
}

function formatRoleLabel(role) {
    const normalized = String(role || '').toUpperCase();
    const labels = {
        CITIZEN: 'Cong dan',
        COORDINATOR: 'Dieu phoi',
        RESCUER: 'Doi cuu ho',
        MANAGER: 'Quan ly',
        ADMIN: 'Quan tri vien',
    };
    return labels[normalized] || 'Nguoi dung';
}

function formatDate(value) {
    if (!value) return 'Chua cap nhat';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}

function InfoCard({ icon, label, value, muted = false }) {
    const IconComponent = icon;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <IconComponent className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                    <p className={`mt-1 break-words text-sm font-semibold ${muted ? 'text-slate-500' : 'text-slate-900'}`}>
                        {value || 'Chua cap nhat'}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(() => getUser());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const me = await getCurrentUser();
            if (me && typeof me === 'object') {
                setProfile(me);
                setUser(me);
                const role = getRoleValue(me.role);
                if (role) {
                    setRole(role);
                }
                window.dispatchEvent(new Event('auth-user-updated'));
            }
        } catch (err) {
            setError(err?.message || 'Khong the tai thong tin ho so luc nay.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        if (!location.hash) return;
        const sectionId = location.hash.replace('#', '');
        const target = document.getElementById(sectionId);
        if (!target) return;
        window.requestAnimationFrame(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }, [location.hash]);

    const roleValue = getRoleValue(profile?.role) || getRole();
    const displayName = pickFirstValue(profile, ['fullName', 'name']);
    const displayEmail = pickFirstValue(profile, ['email']);
    const displayPhone = pickFirstValue(profile, ['phone', 'phoneNumber']);
    const displayAddress = pickFirstValue(profile, ['address', 'currentAddress']);
    const displayBirthDate = pickFirstValue(profile, ['dateOfBirth', 'birthDate', 'dob']);
    const displayIdentity = pickFirstValue(profile, ['citizenId', 'identityNumber', 'cccd', 'nationalId']);
    const displayCreatedAt = pickFirstValue(profile, ['createdAt', 'createdDate', 'registeredAt']);
    const initials = String(displayName || 'U').trim().charAt(0).toUpperCase();

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-slate-50 shadow-sm">
                <div className="grid gap-6 px-5 py-6 md:grid-cols-[auto,1fr,auto] md:px-8 md:py-8">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-blue-600 text-2xl font-black text-white shadow-lg shadow-blue-200">
                        {initials}
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Ho so tai khoan</p>
                        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                            {displayName || 'Nguoi dung he thong'}
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                            Trang nay tong hop thong tin tai khoan hien tai. Du lieu duoc uu tien dong bo tu backend qua
                            endpoint <code>/auth/me</code> va se tu dong cap nhat lai vao bo nho cuc bo khi tai thanh cong.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3 text-sm">
                            <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700">
                                {formatRoleLabel(roleValue)}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                                {loading ? 'Dang dong bo ho so...' : 'Da tai tu tai khoan hien tai'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-start gap-3 md:justify-end">
                        <button
                            type="button"
                            onClick={loadProfile}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Lam moi
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                clearAuth();
                                navigate(AUTH_ROUTES.LOGIN);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            <LogOut className="h-4 w-4" />
                            Dang xuat
                        </button>
                    </div>
                </div>
            </section>

            {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-semibold">Khong dong bo duoc ho so tu backend.</p>
                        <p className="mt-1">
                            He thong dang hien thong tin luu tam trong trinh duyet. Chi tiet loi: {error}
                        </p>
                    </div>
                </div>
            )}

            <section className="grid gap-4 lg:grid-cols-2">
                <InfoCard icon={UserRound} label="Ho va ten" value={displayName} muted={!displayName} />
                <InfoCard icon={Mail} label="Email" value={displayEmail} muted={!displayEmail} />
                <InfoCard icon={Phone} label="So dien thoai" value={displayPhone} muted={!displayPhone} />
                <InfoCard icon={MapPin} label="Dia chi" value={displayAddress} muted={!displayAddress} />
                <InfoCard icon={CalendarDays} label="Ngay sinh" value={formatDate(displayBirthDate)} muted={!displayBirthDate} />
                <InfoCard icon={IdCard} label="CCCD / Dinh danh" value={displayIdentity} muted={!displayIdentity} />
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.3fr,0.9fr]">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Trang thai tai khoan</h2>
                            <p className="text-sm text-slate-500">Thong tin tong quan de kiem tra nhanh tai khoan hien tai.</p>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vai tro dang dang nhap</p>
                            <p className="mt-2 text-base font-bold text-slate-900">{formatRoleLabel(roleValue)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ngay tao tai khoan</p>
                            <p className="mt-2 text-base font-bold text-slate-900">{formatDate(displayCreatedAt)}</p>
                        </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-blue-50/70 p-4 text-sm leading-6 text-slate-700">
                        Neu mot truong thong tin chua hien dung, ban co the dang xuat va dang nhap lai hoac bam
                        <span className="mx-1 font-semibold text-blue-700">Lam moi</span>
                        de dong bo lai du lieu tu backend.
                    </div>
                </div>

                <div id="bao-mat" className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                            <LockKeyhole className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Cai dat tai khoan</h2>
                            <p className="text-sm text-slate-500">Khu vuc danh cho cac tuy chon bao mat va xu ly phien dang nhap.</p>
                        </div>
                    </div>

                    <div className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            Phien dang nhap hien tai dang su dung thong tin role <span className="font-semibold">{formatRoleLabel(roleValue)}</span>.
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            Neu ban can doi mat khau hoac cap nhat thong tin nhay cam, hien frontend chua co form cap nhat
                            rieng. Ban nen lien he quan tri he thong hoac bo phan ho tro de duoc xu ly dung luong nghiep vu.
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
