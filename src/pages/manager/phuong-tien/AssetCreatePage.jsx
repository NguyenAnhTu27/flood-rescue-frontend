import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import { MANAGER_ROUTES, ADMIN_ROUTES } from '../../../app/routes/route.constants.js';
import { createAsset, getAsset, updateAsset } from '../../../features/assets/api.js';
import { getRole } from '../../../shared/lib/storage.js';

const ASSET_TYPES = [
    { value: 'cano', label: 'Cano', icon: '🚤' },
    { value: 'water-vehicle', label: 'Xe lội nước', icon: '🚛' },
    { value: 'generator', label: 'Máy phát điện', icon: '⚡' },
];

const ASSET_STATUSES = [
    { value: 'available', label: 'Rảnh' },
    { value: 'in-use', label: 'Đang dùng' },
    { value: 'maintenance', label: 'Bảo trì' },
];

function toUiType(rawType) {
    const value = String(rawType || '').trim().toLowerCase().replace('_', '-');
    if (value === 'canoe' || value === 'cano' || value === 'boat') return 'cano';
    if (value === 'water-vehicle' || value === 'water vehicle' || value === 'truck' || value === 'vehicle') return 'water-vehicle';
    if (value === 'generator') return 'generator';
    return '';
}

function toUiStatus(rawStatus) {
    const value = String(rawStatus || '').trim().toLowerCase().replace('_', '-');
    if (value === 'in-use' || value === 'in rescue' || value === 'busy') return 'in-use';
    if (value === 'maintenance') return 'maintenance';
    return 'available';
}

function toApiType(uiType) {
    const normalized = toUiType(uiType);
    if (normalized === 'cano') return 'CANO';
    if (normalized === 'water-vehicle') return 'WATER_VEHICLE';
    if (normalized === 'generator') return 'GENERATOR';
    return 'CANO';
}

function toApiStatus(uiStatus) {
    const normalized = toUiStatus(uiStatus);
    if (normalized === 'in-use') return 'IN_USE';
    if (normalized === 'maintenance') return 'MAINTENANCE';
    return 'AVAILABLE';
}

export default function AssetCreatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const assetId = searchParams.get('id');
    const isEdit = !!assetId;
    const role = getRole();
    const isAdmin = role === 'ADMIN';
    const routes = isAdmin ? ADMIN_ROUTES : MANAGER_ROUTES;
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: '',
        status: 'available',
        location: '',
        description: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load existing asset data if editing
    useEffect(() => {
        if (!isEdit || !assetId) return;
        const loadAsset = async () => {
            try {
                setLoading(true);
                const data = await getAsset(assetId);
                setFormData({
                    code: data?.code || data?.assetCode || '',
                    name: data?.name || data?.assetName || '',
                    type: toUiType(data?.type || data?.assetType),
                    status: toUiStatus(data?.status),
                    location: data?.location || data?.currentLocation || '',
                    description: data?.description || data?.note || '',
                });
            } catch (e) {
                console.error('[AssetCreatePage] Load asset error:', e);
                setError(e?.message || 'Không thể tải thông tin phương tiện');
            } finally {
                setLoading(false);
            }
        };
        loadAsset();
    }, [isEdit, assetId]);

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
        if (!formData.location?.trim()) {
            setError('Vui lòng nhập vị trí');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const payload = {
                code: formData.code.trim(),
                name: formData.name.trim(),
                assetType: toApiType(formData.type),
                status: toApiStatus(formData.status),
                location: formData.location.trim(),
                note: formData.description?.trim() || null,
            };

            console.log('[AssetCreatePage] Saving asset with payload:', payload);
            if (isEdit) {
                await updateAsset(assetId, payload);
                window.alert('Cập nhật phương tiện thành công!');
            } else {
                await createAsset(payload);
                window.alert('Tạo phương tiện thành công!');
            }
            navigate(routes.ASSETS_MANAGEMENT);
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
                    onClick={() => navigate(routes.ASSETS_MANAGEMENT)}
                    className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                    <ChevronLeft className="h-3 w-3" />
                    Trở về Danh sách phương tiện
                </button>
                <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Cập nhật Phương tiện' : 'Tạo Phương tiện Mới'}</h1>
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

                    {/* Vị trí */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Vị trí hiện tại <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => handleChange('location', e.target.value)}
                            placeholder="Ví dụ: Bến Chương Dương, Quận 1"
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            required
                        />
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

                    {/* Mô tả */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Mô tả (tùy chọn)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Ví dụ: Cano cao tốc, công suất 5KW..."
                            rows={3}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(routes.ASSETS_MANAGEMENT)}
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
                        {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo phương tiện'}
                    </button>
                </div>
            </form>
        </div>
    );
}
