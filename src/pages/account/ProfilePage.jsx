import React, { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, KeyRound, Mail, MapPin, Navigation, Phone, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import GoogleMap from '../../features/map/components/GoogleMap.jsx';
import { changeMyPassword, getCurrentUser, updateMyProfile } from '../../features/auth/api.js';
import { getRole, getUser, setUser } from '../../shared/lib/storage.js';
import Badge from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';

const DEFAULT_CENTER = { lat: 10.8231, lng: 106.6297 };
const ROLE_LABELS = { CITIZEN: 'Công dân', COORDINATOR: 'Điều phối', RESCUER: 'Đội cứu hộ', MANAGER: 'Quản lý', ADMIN: 'Quản trị viên' };

const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN');
};

export default function ProfilePage() {
    const role = getRole() || getUser()?.role || 'CITIZEN';
    const [profile, setProfile] = useState(() => getUser());
    const [form, setForm] = useState(() => ({ fullName: getUser()?.fullName || '', email: getUser()?.email || '', phone: getUser()?.phone || '' }));
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [notice, setNotice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [gpsReady, setGpsReady] = useState(false);
    const [gpsError, setGpsError] = useState('');
    const [showPasswords, setShowPasswords] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });

    const roleLabel = ROLE_LABELS[profile?.role || role] || profile?.roleName || role;
    const isCitizen = (profile?.role || role) === 'CITIZEN';
    const initials = useMemo(() => String(profile?.fullName || 'ND').trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join(''), [profile?.fullName]);

    useEffect(() => {
        let ignore = false;
        const loadProfile = async () => {
            try {
                setLoading(true);
                const me = await getCurrentUser();
                if (ignore) return;
                setProfile(me);
                setForm({ fullName: me?.fullName || '', email: me?.email || '', phone: me?.phone || '' });
                setUser(me);
                window.dispatchEvent(new Event('auth-user-updated'));
            } catch (error) {
                if (!ignore) setNotice({ type: 'error', text: error?.message || 'Không thể tải hồ sơ cá nhân.' });
            } finally {
                if (!ignore) setLoading(false);
            }
        };
        loadProfile();
        return () => { ignore = true; };
    }, []);

    useEffect(() => {
        if (!notice) return undefined;
        const id = window.setTimeout(() => setNotice(null), 4500);
        return () => window.clearTimeout(id);
    }, [notice]);

    useEffect(() => {
        if (!isCitizen || !navigator.geolocation) {
            if (isCitizen && !navigator.geolocation) setGpsError('Thiết bị không hỗ trợ định vị GPS.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = Number(position?.coords?.latitude);
                const lng = Number(position?.coords?.longitude);
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                    setMapCenter({ lat, lng });
                    setGpsReady(true);
                    setGpsError('');
                    return;
                }
                setGpsError('Không đọc được tọa độ GPS hợp lệ.');
            },
            () => setGpsError('Không thể lấy GPS hiện tại. Đang dùng vị trí mặc định.'),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [isCitizen]);

    const handleProfileChange = ({ target: { name, value } }) => setForm((prev) => ({ ...prev, [name]: value }));
    const handlePasswordChange = ({ target: { name, value } }) => setPasswordForm((prev) => ({ ...prev, [name]: value }));
    const togglePasswordVisibility = (field) => setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));

    const handleReload = async () => {
        try {
            setLoading(true);
            const me = await getCurrentUser();
            setProfile(me);
            setForm({ fullName: me?.fullName || '', email: me?.email || '', phone: me?.phone || '' });
            setUser(me);
            window.dispatchEvent(new Event('auth-user-updated'));
            setNotice({ type: 'success', text: 'Đã làm mới hồ sơ cá nhân.' });
        } catch (error) {
            setNotice({ type: 'error', text: error?.message || 'Không thể làm mới hồ sơ.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitProfile = async (event) => {
        event.preventDefault();
        try {
            setSaving(true);
            const updated = await updateMyProfile({ fullName: form.fullName.trim(), email: form.email.trim() || null, phone: form.phone.trim() || null });
            setProfile(updated);
            setForm({ fullName: updated?.fullName || '', email: updated?.email || '', phone: updated?.phone || '' });
            setUser(updated);
            window.dispatchEvent(new Event('auth-user-updated'));
            setNotice({ type: 'success', text: 'Đã cập nhật hồ sơ cá nhân thành công.' });
        } catch (error) {
            setNotice({ type: 'error', text: error?.message || 'Không thể cập nhật hồ sơ.' });
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitPassword = async (event) => {
        event.preventDefault();
        try {
            setPasswordSaving(true);
            await changeMyPassword(passwordForm);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setNotice({ type: 'success', text: 'Đổi mật khẩu thành công.' });
        } catch (error) {
            setNotice({ type: 'error', text: error?.message || 'Không thể đổi mật khẩu.' });
        } finally {
            setPasswordSaving(false);
        }
    };

    return (
        <div className="space-y-6 pb-8">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_380px]">
                <div className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-7 text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
                    <div className="flex flex-col gap-5 md:flex-row md:items-start">
                        <div className="flex h-28 w-28 items-center justify-center rounded-[28px] border border-blue-500/60 bg-white/10 text-5xl font-extrabold">{initials}</div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold uppercase tracking-[0.45em] text-blue-200">Hồ sơ cá nhân</p>
                            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{profile?.fullName || 'Đang tải hồ sơ...'}</h1>
                            <p className="mt-2 text-lg text-blue-100">{roleLabel}</p>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <Badge variant={profile?.status === 'ACTIVE' ? 'success' : 'warning'} size="lg"><ShieldCheck className="h-4 w-4" />{profile?.status === 'ACTIVE' ? 'Hoạt động' : 'Đang khóa'}</Badge>
                                <Button type="button" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={handleReload}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Làm mới</Button>
                            </div>
                        </div>
                    </div>
                </div>
                <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">Tài khoản</p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">Thông tin hệ thống</h2>
                    <div className="mt-5 space-y-4 text-sm text-slate-600">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vai trò</div><div className="mt-2 text-xl font-bold text-slate-900">{roleLabel}</div></div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lần đăng nhập gần nhất</div><div className="mt-2 text-base font-semibold text-slate-900">{formatDateTime(profile?.lastLoginAt)}</div></div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ngày tạo tài khoản</div><div className="mt-2 text-base font-semibold text-slate-900">{formatDateTime(profile?.createdAt)}</div></div>
                    </div>
                </aside>
            </section>

            {notice && <div className={`rounded-2xl border px-4 py-3 text-sm ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{notice.text}</div>}

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                <form onSubmit={handleSubmitProfile} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">Thông tin cá nhân</p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">Cập nhật hồ sơ của bạn</h2>
                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                        <label><span className="mb-2 block text-sm font-semibold text-slate-700">Họ và tên</span><input name="fullName" value={form.fullName} onChange={handleProfileChange} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" required /></label>
                        <label><span className="mb-2 block text-sm font-semibold text-slate-700">Email</span><div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input name="email" type="email" value={form.email} onChange={handleProfileChange} className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></div></label>
                        <label><span className="mb-2 block text-sm font-semibold text-slate-700">Số điện thoại</span><div className="relative"><Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input name="phone" value={form.phone} onChange={handleProfileChange} className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></div></label>
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600"><div>Team ID: <span className="font-semibold text-slate-900">{profile?.teamId ?? '—'}</span></div><div className="mt-2">Trạng thái gửi yêu cầu: <span className="font-semibold text-slate-900">{profile?.rescueRequestBlocked ? 'Đang bị hạn chế' : 'Bình thường'}</span></div>{profile?.rescueRequestBlockedReason && <p className="mt-2 text-rose-600">{profile.rescueRequestBlockedReason}</p>}</div>
                    </div>
                    <div className="mt-6 flex justify-end"><Button type="submit" variant="primary" disabled={saving}><Save className="h-4 w-4" />{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Button></div>
                </form>
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">Tóm tắt</p><h2 className="mt-2 text-2xl font-bold text-slate-900">Hồ sơ hiện tại</h2><div className="mt-5 space-y-4 text-sm text-slate-600"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Họ và tên</div><div className="mt-2 text-lg font-bold text-slate-900">{profile?.fullName || '—'}</div></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</div><div className="mt-2 text-base font-semibold text-slate-900">{profile?.email || 'Chưa cập nhật'}</div></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Số điện thoại</div><div className="mt-2 text-base font-semibold text-slate-900">{profile?.phone || 'Chưa cập nhật'}</div></div></div></div>
            </section>

            {isCitizen && <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-6 py-4"><h2 className="text-2xl font-bold text-slate-900">Vị trí hiện tại của bạn (GPS)</h2><p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600"><Navigation className="h-4 w-4 text-blue-600" />{gpsReady ? 'Đã lấy GPS thành công' : 'Đang dùng vị trí mặc định'}: {mapCenter.lat.toFixed(6)}, {mapCenter.lng.toFixed(6)}</p>{gpsError && <p className="mt-2 text-sm text-rose-600">{gpsError}</p>}</div><div className="relative h-[360px] bg-slate-100"><GoogleMap center={mapCenter} markerPosition={mapCenter} zoom={14} /><div className="absolute left-4 top-4 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow"><span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" />Vị trí của bạn</span></div></div></section>}

            
            
            {isCitizen && (
                <section id="bao-mat" className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">Bảo mật</p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">Đổi mật khẩu</h2>
                    <form onSubmit={handleSubmitPassword} className="mt-6 grid gap-5 md:grid-cols-3">
                        <label>
                            <span className="mb-2 block text-sm font-semibold text-slate-700">Mật khẩu hiện tại</span>
                            <div className="relative">
                                <input
                                    name="currentPassword"
                                    type={showPasswords.currentPassword ? 'text' : 'password'}
                                    value={passwordForm.currentPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('currentPassword')}
                                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                                    aria-label={showPasswords.currentPassword ? 'Ẩn mật khẩu hiện tại' : 'Hiện mật khẩu hiện tại'}
                                >
                                    {showPasswords.currentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </label>
                        <label>
                            <span className="mb-2 block text-sm font-semibold text-slate-700">Mật khẩu mới</span>
                            <div className="relative">
                                <input
                                    name="newPassword"
                                    type={showPasswords.newPassword ? 'text' : 'password'}
                                    value={passwordForm.newPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('newPassword')}
                                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                                    aria-label={showPasswords.newPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                                >
                                    {showPasswords.newPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </label>
                        <label>
                            <span className="mb-2 block text-sm font-semibold text-slate-700">Xác nhận mật khẩu mới</span>
                            <div className="relative">
                                <input
                                    name="confirmPassword"
                                    type={showPasswords.confirmPassword ? 'text' : 'password'}
                                    value={passwordForm.confirmPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirmPassword')}
                                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                                    aria-label={showPasswords.confirmPassword ? 'Ẩn xác nhận mật khẩu mới' : 'Hiện xác nhận mật khẩu mới'}
                                >
                                    {showPasswords.confirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </label>
                        <div className="md:col-span-3 flex justify-end">
                            <Button type="submit" variant="primary" disabled={passwordSaving}><KeyRound className="h-4 w-4" />{passwordSaving ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}</Button>
                        </div>
                    </form>
                </section>
            )}


        </div>
    );
}
