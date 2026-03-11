import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    Phone,
    MessageCircle,
    MapPin,
    Users,
    Camera,
    AlertTriangle,
    CheckCircle2,
    Image as ImageIcon,
    Loader2,
} from 'lucide-react';
import MissionMapView from '../../features/map/components/MissionMapView.jsx';
import { RESCUER_ROUTES } from '../../app/routes/route.constants.js';
import Card from '../../shared/ui/Card.jsx';
import Badge from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';

const VICTIM_STATUS_OPTIONS = [
    { value: 'SAFE', label: 'An toàn' },
    { value: 'INJURED', label: 'Bị thương nhẹ' },
    { value: 'SERIOUS', label: 'Bị thương nặng' },
    { value: 'CRITICAL', label: 'Nguy kịch' },
    { value: 'NOT_FOUND', label: 'Không tìm thấy' },
];

const SUPPLY_CHECKLIST = [
    { id: 'water', label: 'Nước sạch' },
    { id: 'food', label: 'Lương thực' },
    { id: 'medicine', label: 'Thuốc/y tế' },
    { id: 'blanket', label: 'Chăn/mền' },
    { id: 'clothing', label: 'Quần áo' },
    { id: 'flashlight', label: 'Đèn pin' },
];

// Mock citizen data
const MOCK_CITIZEN = {
    name: 'Nguyễn Văn Minh',
    phone: '0901234567',
    address: 'Tầng 2, nhà 15 ngách 4, Phường Bình Thạnh',
    description: 'Nước đang lên nhanh, có người già và trẻ nhỏ cần di chuyển gấp. Tầng 1 đã ngập hoàn toàn.',
    peopleCount: 5,
    supplyNeeds: ['Nước sạch', 'Lương thực', 'Thuốc'],
    photos: [],
    latitude: 10.78,
    longitude: 106.69,
};

export default function FieldUpdatePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state || {};

    const citizen = state?.citizen || MOCK_CITIZEN;

    const [formData, setFormData] = useState({
        notes: '',
        actualPeopleCount: citizen.peopleCount || 0,
        victimStatus: 'SAFE',
        suppliesChecked: [],
        images: [],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const peopleCountDiff = formData.actualPeopleCount - (citizen.peopleCount || 0);

    const handleChange = (field) => (e) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handlePeopleCountChange = (delta) => {
        setFormData((prev) => ({
            ...prev,
            actualPeopleCount: Math.max(0, prev.actualPeopleCount + delta),
        }));
    };

    const handleSupplyToggle = (supplyId) => {
        setFormData((prev) => ({
            ...prev,
            suppliesChecked: prev.suppliesChecked.includes(supplyId)
                ? prev.suppliesChecked.filter((s) => s !== supplyId)
                : [...prev.suppliesChecked, supplyId],
        }));
    };

    const handleImagesChange = (e) => {
        const files = Array.from(e.target.files || []);
        setFormData((prev) => ({ ...prev, images: files }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        // TODO: Gọi API cập nhật hiện trường
        setTimeout(() => {
            setIsSubmitting(false);
            navigate(-1);
        }, 1000);
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-slate-600">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1 hover:text-blue-600">
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                </button>
                <span>/</span>
                <span className="font-medium text-slate-900">Cập nhật hiện trường #{id}</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Left column: Thông tin từ Công dân */}
                <div className="space-y-4">
                    {/* Victim contact card */}
                    <Card className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">{citizen.name}</h2>
                                <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                    {citizen.phone}
                                </div>
                                <div className="mt-1 flex items-start gap-2 text-sm text-slate-600">
                                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                                    <span>{citizen.address}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <a
                                    href={`tel:${citizen.phone}`}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                                >
                                    <Phone className="h-4 w-4" />
                                </a>
                                <a
                                    href={`https://zalo.me/${citizen.phone}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                </a>
                            </div>
                        </div>

                        {/* Mini map */}
                        <div className="mt-4 h-36 overflow-hidden rounded-lg">
                            <MissionMapView
                                center={{ lat: citizen.latitude, lng: citizen.longitude }}
                                markerPosition={{ lat: citizen.latitude, lng: citizen.longitude }}
                                zoom={15}
                            />
                        </div>
                    </Card>

                    {/* Original info from citizen */}
                    <Card className="p-5">
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                            Thông tin từ Công dân
                        </h3>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-slate-500">Mô tả tình huống</label>
                                <p className="mt-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 italic">
                                    "{citizen.description}"
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Số người cần cứu</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Users className="h-4 w-4 text-blue-500" />
                                        <span className="text-lg font-bold text-slate-900">{citizen.peopleCount}</span>
                                        <span className="text-sm text-slate-500">người</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-500">Nhu cầu hỗ trợ</label>
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                    {(citizen.supplyNeeds || []).map((need, i) => (
                                        <Badge key={i} size="sm" variant="info">
                                            {need}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right column: Ghi nhận thực tế */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Card className="p-5">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                            Ghi nhận Thực tế
                        </h3>

                        {/* Actual notes */}
                        <div className="mb-4">
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Ghi chú hiện trường
                            </label>
                            <textarea
                                rows={4}
                                value={formData.notes}
                                onChange={handleChange('notes')}
                                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Mô tả tình trạng thực tế tại hiện trường..."
                            />
                        </div>

                        {/* Actual people count */}
                        <div className="mb-4">
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Số người thực tế
                            </label>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => handlePeopleCountChange(-1)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                                >
                                    −
                                </button>
                                <span className="min-w-[3rem] text-center text-xl font-bold text-slate-900">
                                    {formData.actualPeopleCount}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handlePeopleCountChange(1)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                                >
                                    +
                                </button>
                                {peopleCountDiff !== 0 && (
                                    <Badge
                                        size="sm"
                                        className={
                                            peopleCountDiff > 0
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-green-100 text-green-700'
                                        }
                                    >
                                        {peopleCountDiff > 0 ? `+${peopleCountDiff}` : peopleCountDiff}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Anomaly alert */}
                        {peopleCountDiff !== 0 && (
                            <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                <p>
                                    Số người thực tế{' '}
                                    {peopleCountDiff > 0 ? 'nhiều hơn' : 'ít hơn'}{' '}
                                    so với báo cáo ban đầu ({Math.abs(peopleCountDiff)} người).
                                    Thông tin sẽ được cập nhật cho điều phối viên.
                                </p>
                            </div>
                        )}

                        {/* Victim status */}
                        <div className="mb-4">
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Tình trạng nạn nhân
                            </label>
                            <select
                                value={formData.victimStatus}
                                onChange={handleChange('victimStatus')}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                {VICTIM_STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Supply checklist */}
                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Kiểm tra hàng cứu trợ
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {SUPPLY_CHECKLIST.map((item) => (
                                    <label
                                        key={item.id}
                                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                                            formData.suppliesChecked.includes(item.id)
                                                ? 'border-blue-300 bg-blue-50 text-blue-700'
                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.suppliesChecked.includes(item.id)}
                                            onChange={() => handleSupplyToggle(item.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        {item.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Photo upload */}
                        <div className="mb-4">
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Ảnh hiện trường
                            </label>
                            <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-600 transition hover:border-blue-400 hover:bg-blue-50/30">
                                <Camera className="h-5 w-5 text-slate-400" />
                                <span className="text-xs font-medium">Tải ảnh lên</span>
                                <span className="text-[10px] text-slate-400">PNG, JPG tối đa 10MB</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImagesChange}
                                    className="hidden"
                                />
                            </label>
                            {formData.images.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {formData.images.map((file, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600"
                                        >
                                            <ImageIcon className="h-3 w-3 text-slate-400" />
                                            <span className="max-w-[140px] truncate">{file.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Submit */}
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={() => navigate(-1)}
                        >
                            Huỷ
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang gửi...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Gửi cập nhật
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
