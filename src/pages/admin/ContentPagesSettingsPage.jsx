import React, { useEffect, useState } from 'react';
import { getAdminContentPages, updateAdminContentPages } from '../../features/content-pages/api.js';

const DEFAULT_VALUES = {
    termsTitle: 'Điều khoản sử dụng',
    termsContent: '',
    termsLabel: 'Điều khoản sử dụng',
    privacyTitle: 'Chính sách bảo mật',
    privacyContent: '',
    privacyLabel: 'Chính sách bảo mật',
    supportTitle: 'Liên hệ hỗ trợ',
    supportContent: '',
    supportLabel: 'Liên hệ hỗ trợ',
};

export default function ContentPagesSettingsPage() {
    const [form, setForm] = useState(DEFAULT_VALUES);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const load = async () => {
        try {
            setMessage('');
            const data = await getAdminContentPages();
            setForm((prev) => ({ ...prev, ...data }));
        } catch (e) {
            setMessage(e?.message || 'Không thể tải nội dung trang.');
        }
    };

    useEffect(() => {
        load();
    }, []);

    const save = async () => {
        try {
            setSaving(true);
            setMessage('');
            const resp = await updateAdminContentPages(form);
            setMessage(resp?.message || 'Đã lưu nội dung trang.');
            window.dispatchEvent(new Event('runtime-settings-updated'));
            await load();
        } catch (e) {
            setMessage(e?.message || 'Không thể lưu nội dung trang.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h1 className="text-2xl font-bold text-slate-900">Nội dung trang công khai</h1>
                <p className="mt-1 text-slate-600">Admin có thể chỉnh sửa nội dung Điều khoản, Chính sách bảo mật, Liên hệ hỗ trợ.</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5">
                <div className="grid gap-4">
                    <label className="space-y-1">
                        <span className="text-sm text-slate-600">Tiêu đề trang Điều khoản sử dụng</span>
                        <input value={form.termsTitle} onChange={(e) => updateField('termsTitle', e.target.value)} className="w-full rounded-lg border p-2" />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm text-slate-600">Nội dung Điều khoản sử dụng</span>
                        <textarea value={form.termsContent} onChange={(e) => updateField('termsContent', e.target.value)} rows={8} className="w-full rounded-lg border p-2" />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm text-slate-600">Nhãn link ở footer (Điều khoản)</span>
                        <input value={form.termsLabel} onChange={(e) => updateField('termsLabel', e.target.value)} className="w-full rounded-lg border p-2" />
                    </label>
                </div>

                <div className="grid gap-4">
                    <label className="space-y-1">
                        <span className="text-sm text-slate-600">Tiêu đề trang Chính sách bảo mật</span>
                        <input value={form.privacyTitle} onChange={(e) => updateField('privacyTitle', e.target.value)} className="w-full rounded-lg border p-2" />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm text-slate-600">Nội dung Chính sách bảo mật</span>
                        <textarea value={form.privacyContent} onChange={(e) => updateField('privacyContent', e.target.value)} rows={8} className="w-full rounded-lg border p-2" />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm text-slate-600">Nhãn link ở footer (Chính sách)</span>
                        <input value={form.privacyLabel} onChange={(e) => updateField('privacyLabel', e.target.value)} className="w-full rounded-lg border p-2" />
                    </label>
                </div>

                <div className="grid gap-4">
                    <label className="space-y-1">
                        <span className="text-sm text-slate-600">Tiêu đề trang Liên hệ hỗ trợ</span>
                        <input value={form.supportTitle} onChange={(e) => updateField('supportTitle', e.target.value)} className="w-full rounded-lg border p-2" />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm text-slate-600">Nội dung Liên hệ hỗ trợ</span>
                        <textarea value={form.supportContent} onChange={(e) => updateField('supportContent', e.target.value)} rows={8} className="w-full rounded-lg border p-2" />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm text-slate-600">Nhãn link ở footer (Liên hệ)</span>
                        <input value={form.supportLabel} onChange={(e) => updateField('supportLabel', e.target.value)} className="w-full rounded-lg border p-2" />
                    </label>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={save}
                        disabled={saving}
                        className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
                    >
                        {saving ? 'Đang lưu...' : 'Lưu nội dung'}
                    </button>
                    {message && <p className="text-sm text-emerald-600">{message}</p>}
                </div>
            </section>
        </div>
    );
}
