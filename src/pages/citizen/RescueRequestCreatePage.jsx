import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MapPin,
    Crosshair,
    AlertTriangle,
    ChevronRight,
    ChevronLeft,
    Phone,
    Upload,
    Image as ImageIcon,
    CheckCircle2,
} from 'lucide-react';
import { CITIZEN_ROUTES } from '../../app/routes/route.constants.js';

const STEPS = [
    { id: 1, label: 'Vị trí cứu hộ' },
    { id: 2, label: 'Mô tả tình huống' },
    { id: 3, label: 'Hoàn tất yêu cầu' },
];

export default function RescueRequestCreatePage() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        address: '72 Lê Thánh Tôn, Bến Nghé, Quận 1',
        ward: 'Phường Bến Nghé, Quận 1, TP. HCM',
        description:
            'Ví dụ: Nước đang dâng tràn vào nhà, có người già và trẻ em bị kẹt, cần xuồng cứu hộ...',
        peopleCount: '4',
        level: 'MEDIUM',
        phone: '',
        images: [],
    });

    const handleChange = (field) => (e) => {
        setForm((prev) => ({
            ...prev,
            [field]: e.target.value,
        }));
    };

    const handleLevelChange = (level) => {
        setForm((prev) => ({ ...prev, level }));
    };

    const handleImagesChange = (e) => {
        const files = Array.from(e.target.files || []);
        setForm((prev) => ({
            ...prev,
            images: files,
        }));
    };

    const handleUseGps = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Chỉ demo: hiển thị toạ độ vào mô tả
                setForm((prev) => ({
                    ...prev,
                    description:
                        prev.description +
                        `\n\n[Vị trí GPS: ${position.coords.latitude.toFixed(
                            5,
                        )}, ${position.coords.longitude.toFixed(5)}]`,
                }));
            },
            () => {
                // Bỏ qua lỗi, không cần thông báo phức tạp
            },
        );
    };

    const goNext = () => {
        if (currentStep < 3) setCurrentStep((s) => s + 1);
    };

    const goPrev = () => {
        if (currentStep > 1) setCurrentStep((s) => s - 1);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        // TODO: Gửi dữ liệu lên API
        // Hiện tại chỉ giả lập và điều hướng sang trang trạng thái
        setTimeout(() => {
            setIsSubmitting(false);
            navigate(CITIZEN_ROUTES.RESCUE_REQUEST_STATUS);
        }, 800);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                    Tạo yêu cầu cứu hộ khẩn cấp
                </h1>
                <p className="max-w-2xl text-sm text-slate-600">
                    Vui lòng cung cấp chính xác vị trí, tình huống và thông tin liên lạc để lực lượng
                    cứu hộ có thể hỗ trợ nhanh nhất.
                </p>
            </div>

            {/* Step indicator */}
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {STEPS.map((step, index) => {
                        const isActive = currentStep === step.id;
                        const isDone = currentStep > step.id;
                        return (
                            <div key={step.id} className="flex items-center gap-3">
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                                        isActive
                                            ? 'bg-blue-600 text-white'
                                            : isDone
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    {isDone ? (
                                        <CheckCircle2 className="h-5 w-5" />
                                    ) : (
                                        step.id
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span
                                        className={`text-sm font-medium ${
                                            isActive ? 'text-slate-900' : 'text-slate-500'
                                        }`}
                                    >
                                        Bước {step.id}
                                    </span>
                                    <span className="text-xs text-slate-500">{step.label}</span>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div className="hidden md:block h-px w-12 bg-slate-200" />
                                )}
                            </div>
                        );
                    })}
                </div>
                <span className="hidden md:inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    Thời gian xử lý ưu tiên cho yêu cầu có vị trí và thông tin rõ ràng
                </span>
            </div>

            {/* Main content */}
            <form
                onSubmit={handleSubmit}
                className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] items-start"
            >
                {/* Left column: Map / Preview */}
                <div className="space-y-4">
                    {/* Map / Illustration */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.18),_transparent_60%)]" />
                        <div className="relative flex h-[340px] flex-col">
                            <div className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 shadow-sm">
                                    <MapPin className="h-4 w-4 text-blue-600" />
                                    <span className="text-xs font-medium text-slate-700">
                                        Bản đồ khu vực cứu hộ
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 shadow-sm text-xs text-slate-600">
                                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                    Đã kết nối trung tâm điều phối
                                </div>
                            </div>
                            <div className="relative flex-1">
                                <div className="absolute inset-4 rounded-xl border border-slate-200 bg-[url('https://maps.gstatic.com/mapfiles/api-3/images/google4_hdpi.png')] bg-cover bg-center opacity-10" />
                                <div className="relative flex h-full items-center justify-center">
                                    <div className="relative">
                                        <div className="h-40 w-40 rounded-full bg-blue-200/50" />
                                        <div className="absolute inset-6 rounded-full bg-blue-300/60" />
                                        <div className="absolute inset-10 flex items-center justify-center rounded-full bg-blue-600 shadow-xl shadow-blue-500/40">
                                            <MapPin className="h-8 w-8 text-white" />
                                        </div>
                                    </div>
                                </div>
                                <div className="pointer-events-none absolute inset-x-6 bottom-4 flex justify-between text-[10px] font-medium text-slate-600">
                                    <span>Thu phóng</span>
                                    <span>Kéo để thay đổi vùng ảnh hưởng (mô phỏng)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step helper text */}
                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
                        {currentStep === 1 && (
                            <span>
                                Hãy đảm bảo địa chỉ và vị trí trên bản đồ là chính xác để đội cứu hộ dễ dàng
                                tiếp cận.
                            </span>
                        )}
                        {currentStep === 2 && (
                            <span>
                                Mô tả càng chi tiết, lực lượng điều phối càng có thể chuẩn bị đúng nguồn lực
                                cần thiết.
                            </span>
                        )}
                        {currentStep === 3 && (
                            <span>
                                Hãy kiểm tra lại thông tin liên hệ và tải lên hình ảnh hiện trường (nếu có) để
                                hỗ trợ đánh giá mức độ khẩn cấp.
                            </span>
                        )}
                    </div>
                </div>

                {/* Right column: Form steps */}
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    {currentStep === 1 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-semibold text-slate-900">Bước 1: Vị trí cứu hộ</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Địa chỉ cụ thể
                                    </label>
                                    <input
                                        type="text"
                                        value={form.address}
                                        onChange={handleChange('address')}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Ví dụ: 72 Lê Thánh Tôn, Bến Nghé, Quận 1"
                                        required
                                    />
                                </div>

                                <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Khu vực / Phường
                                        </label>
                                        <input
                                            type="text"
                                            value={form.ward}
                                            onChange={handleChange('ward')}
                                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="Phường, Quận/Huyện, Tỉnh/TP"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={handleUseGps}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                        >
                                            <Crosshair className="h-4 w-4" />
                                            Lấy vị trí GPS của tôi
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex gap-2">
                                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                    <span>
                                        Cảnh báo: Vị trí có thể chưa chính xác đến địa chỉ cụ thể. Vui lòng kiểm tra
                                        kỹ thông tin trước khi tiếp tục.
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-semibold text-slate-900">Bước 2: Mô tả tình huống</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Nội dung sự việc
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={form.description}
                                        onChange={handleChange('description')}
                                        className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Mô tả chi tiết tình huống, mức nước, người mắc kẹt, tình trạng sức khoẻ..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Số người cần hỗ trợ
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={form.peopleCount}
                                        onChange={handleChange('peopleCount')}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Ví dụ: 4"
                                    />
                                </div>

                                <div>
                                    <label className="mb-3 block text-sm font-medium text-slate-700">
                                        Mức độ khẩn cấp
                                    </label>
                                    <div className="space-y-3">
                                        <button
                                            type="button"
                                            onClick={() => handleLevelChange('HIGH')}
                                            className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${
                                                form.level === 'HIGH'
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-slate-200 hover:border-red-400 hover:bg-red-50/40'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                                                    <span className="font-semibold text-red-700">Cao</span>
                                                </div>
                                                <p className="mt-1 text-xs text-red-700">
                                                    Nguy hiểm trực tiếp đến tính mạng, cần cứu hộ ngay lập tức.
                                                </p>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleLevelChange('MEDIUM')}
                                            className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${
                                                form.level === 'MEDIUM'
                                                    ? 'border-amber-500 bg-amber-50'
                                                    : 'border-slate-200 hover:border-amber-400 hover:bg-amber-50/40'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                                    <span className="font-semibold text-amber-700">
                                                        Trung bình
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs text-amber-700">
                                                    Khu vực nguy hiểm nhưng tạm thời ổn định, cần hỗ trợ sớm.
                                                </p>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleLevelChange('LOW')}
                                            className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${
                                                form.level === 'LOW'
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/40'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                                                    <span className="font-semibold text-blue-700">Thấp</span>
                                                </div>
                                                <p className="mt-1 text-xs text-blue-700">
                                                    Cần hỗ trợ nhưng chưa đe doạ trực tiếp đến tính mạng.
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Bước 3: Hoàn tất yêu cầu
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Upload images */}
                                <div className="space-y-3">
                                    <span className="text-sm font-medium text-slate-700">
                                        Ảnh minh hoạ hiện trường
                                    </span>
                                    <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-600 transition hover:border-blue-400 hover:bg-blue-50/50">
                                        <Upload className="h-5 w-5 text-slate-500" />
                                        <span className="font-medium">
                                            Nhấn để tải ảnh hoặc kéo thả
                                        </span>
                                        <span className="text-[11px] text-slate-500">
                                            Hỗ trợ JPG, PNG tối đa 10MB
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImagesChange}
                                            className="hidden"
                                        />
                                    </label>

                                    {form.images.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {form.images.slice(0, 3).map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-600"
                                                >
                                                    <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                                                    <span className="line-clamp-1 max-w-[120px]">
                                                        {file.name}
                                                    </span>
                                                </div>
                                            ))}
                                            {form.images.length > 3 && (
                                                <span className="text-[11px] text-slate-500">
                                                    +{form.images.length - 3} ảnh khác
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Contact info */}
                                <div className="space-y-3">
                                    <span className="text-sm font-medium text-slate-700">
                                        Thông tin liên hệ
                                    </span>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-slate-700">
                                            Số điện thoại liên hệ
                                        </label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate-400">
                                                +84
                                            </span>
                                            <input
                                                type="tel"
                                                value={form.phone}
                                                onChange={handleChange('phone')}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-10 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                placeholder="09xx xxx xxx"
                                                required
                                            />
                                            <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            Đội cứu hộ sẽ liên hệ qua số điện thoại này để xác minh và cập nhật trạng
                                            thái.
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-800 flex gap-2">
                                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                        <span>
                                            Vui lòng kiểm tra lại toàn bộ thông tin trước khi gửi yêu cầu. Hành động
                                            nguy hiểm hoặc thông tin không chính xác có thể làm chậm trễ việc cứu hộ.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer actions */}
                    <div className="mt-2 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            onClick={goPrev}
                            disabled={currentStep === 1}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Quay lại
                        </button>

                        <div className="flex gap-3">
                            {currentStep < 3 && (
                                <button
                                    type="button"
                                    onClick={goNext}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg"
                                >
                                    Tiếp tục
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            )}

                            {currentStep === 3 && (
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-blue-400"
                                >
                                    {isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu cứu hộ'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
