import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import { MANAGER_ROUTES } from '../../../app/routes/route.constants.js';
import { createAsset } from '../../../features/assets/api.js';

const ASSET_TYPES = [
    { value: 'canoe', label: 'Cano', icon: '🚤' },
    { value: 'water-vehicle', label: 'Xe lội nước', icon: '🚛' },
    { value: 'generator', label: 'Máy phát điện', icon: '⚡' },
];

const ASSET_STATUSES = [
    { value: 'available', label: 'Rảnh' },
    { value: 'in-use', label: 'Đang dùng' },
    { value: 'maintenance', label: 'Bảo trì' },
];

export default function AssetCreatePage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: '',
        status: 'available',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.code?.trim()) {
            setError('Vui lòng nhập mã phương tiện');
            return;
        }
        if (!formData.name?.trim()) {
            setError('Vui lòng nhập tên phương tiện');
            return;
        }
        if (!formData.type) {
            setError('Vui lòng chọn loại phương tiện');
            return;
        }
        try {
            setSubmitting(true);
            setError(null);

            const payload = {
                code: formData.code.trim(),
                name: formData.name.trim(),
                type: formData.type,
                status: formData.status,
            };

            console.log('[AssetCreatePage] Creating asset with payload:', payload);
            const response = await createAsset(payload);
            console.log('[AssetCreatePage] Create asset response:', response);

            window.alert('Tạo phương tiện thành công!');
            navigate(MANAGER_ROUTES.ASSETS_MANAGEMENT);
        } catch (e) {
            console.error('[AssetCreatePage] Create asset error:', e);
            const errorMessage = e?.data?.message || e?.message || 'Không thể tạo phương tiện';
            setError(errorMessage);
            window.alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <button
                    type="button"
                    onClick={() => navigate(MANAGER_ROUTES.ASSETS_MANAGEMENT)}
                    className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                    <ChevronLeft className="h-3 w-3" />
                    Trở về Danh sách phương tiện
                </button>
                <h1 className="text-2xl font-bold text-slate-900">Tạo Phương tiện Mới</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Thêm phương tiện và thiết bị cứu trợ mới vào hệ thống
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                {error && (
                    <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Mã phương tiện */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Mã phương tiện <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => handleChange('code', e.target.value)}
                            placeholder="Ví dụ: CN-042, AM-108, GEN-22"
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            required
                        />
                    </div>

                    {/* Tên phương tiện */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Tên phương tiện <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Ví dụ: Cano Cứu Hộ #CN-042"
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            required
                        />
                    </div>

                    {/* Loại phương tiện */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Loại phương tiện <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {ASSET_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => handleChange('type', type.value)}
                                    className={`flex flex-col items-center rounded-lg border px-4 py-3 text-sm transition ${formData.type === type.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                >
                                    <span className="text-2xl">{type.icon}</span>
                                    <span className="mt-1 font-medium text-slate-900">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Trạng thái */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Trạng thái <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            {ASSET_STATUSES.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>

                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(MANAGER_ROUTES.ASSETS_MANAGEMENT)}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <Save className="h-4 w-4" />
                        {submitting ? 'Đang tạo...' : 'Tạo phương tiện'}
                    </button>
                </div>
            </form>
        </div>
    );
}
