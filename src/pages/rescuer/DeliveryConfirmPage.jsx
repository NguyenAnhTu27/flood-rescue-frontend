import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CheckCircle2,
    Package,
    XCircle,
    AlertTriangle,
    Camera,
    Loader2,
    Image as ImageIcon,
} from 'lucide-react';
import { RESCUER_ROUTES } from '../../app/routes/route.constants.js';

const mockTaskRequests = [
    { id: '01', status: 'COMPLETED', completedAt: '14:00', label: 'Yêu cầu #01' },
    { id: '02', status: 'COMPLETED', completedAt: '15:15', label: 'Yêu cầu #02' },
    { id: '03', status: 'IN_PROGRESS', completedAt: null, label: 'Yêu cầu #03' },
];

export default function DeliveryConfirmPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        resultStatus: 'SUCCESS_RESCUED',
        resultNotes: '',
        images: [],
    });

    const handleChange = (field) => (e) => {
        setFormData((prev) => ({
            ...prev,
            [field]: e.target.value,
        }));
    };

    const handleImagesChange = (e) => {
        const files = Array.from(e.target.files || []);
        setFormData((prev) => ({
            ...prev,
            images: files,
        }));
    };

    const handleCompleteRequest = (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        // TODO: Gọi API hoàn tất yêu cầu
        setTimeout(() => {
            setIsSubmitting(false);
            // Navigate back or show success
        }, 1000);
    };

    const handleCompleteTask = () => {
        // TODO: Gọi API hoàn tất nhiệm vụ
        alert('Chỉ có thể hoàn tất nhiệm vụ sau khi tất cả yêu cầu đã được xử lý xong.');
    };

    const completedCount = mockTaskRequests.filter((r) => r.status === 'COMPLETED').length;
    const totalCount = mockTaskRequests.length;
    const progress = (completedCount / totalCount) * 100;
    const canCompleteTask = completedCount === totalCount;

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
            {/* Main Content */}
            <div className="space-y-6">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <button
                        onClick={() => navigate(RESCUER_ROUTES.MY_ASSIGNMENTS)}
                        className="hover:text-green-600"
                    >
                        Nhiệm vụ #MS-102
                    </button>
                    <span>/</span>
                    <span>Yêu cầu #03</span>
                    <span>/</span>
                    <span className="font-medium text-green-600">Hoàn tất Yêu cầu</span>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleCompleteRequest}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <h1 className="mb-6 text-2xl font-bold text-slate-900">
                        Kết quả xử lý hiện tại
                    </h1>

                    {/* Result Status */}
                    <div className="mb-6">
                        <label className="mb-4 block text-sm font-semibold text-slate-900">
                            TRẠNG THÁI KẾT QUẢ
                        </label>
                        <div className="space-y-3">
                            <label
                                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                                    formData.resultStatus === 'SUCCESS_RESCUED'
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-slate-200 bg-white hover:bg-slate-50'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="resultStatus"
                                    value="SUCCESS_RESCUED"
                                    checked={formData.resultStatus === 'SUCCESS_RESCUED'}
                                    onChange={handleChange('resultStatus')}
                                    className="mt-1 h-4 w-4 border-slate-300 text-green-600 focus:ring-green-500"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        <span className="font-semibold text-slate-900">
                                            Đã cứu người thành công
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Người bị nạn đã được đưa đến khu vực an toàn.
                                    </p>
                                </div>
                            </label>

                            <label
                                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                                    formData.resultStatus === 'SUCCESS_DELIVERED'
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-slate-200 bg-white hover:bg-slate-50'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="resultStatus"
                                    value="SUCCESS_DELIVERED"
                                    checked={formData.resultStatus === 'SUCCESS_DELIVERED'}
                                    onChange={handleChange('resultStatus')}
                                    className="mt-1 h-4 w-4 border-slate-300 text-green-600 focus:ring-green-500"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-5 w-5 text-green-600" />
                                        <span className="font-semibold text-slate-900">
                                            Đã giao hàng cứu trợ
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Thực phẩm và nhu yếu phẩm đã chuyển đến đúng hạn.
                                    </p>
                                </div>
                            </label>

                            <label
                                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                                    formData.resultStatus === 'CANNOT_PROCESS'
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-slate-200 bg-white hover:bg-slate-50'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="resultStatus"
                                    value="CANNOT_PROCESS"
                                    checked={formData.resultStatus === 'CANNOT_PROCESS'}
                                    onChange={handleChange('resultStatus')}
                                    className="mt-1 h-4 w-4 border-slate-300 text-red-600 focus:ring-red-500"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <XCircle className="h-5 w-5 text-red-600" />
                                        <span className="font-semibold text-slate-900">
                                            Không thể xử lý (Ghi rõ lý do)
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Tình huống cấp bách, hiện trường bị cô lập hoặc lý do khác.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Result Notes */}
                    <div className="mb-6">
                        <label className="mb-2 block text-sm font-semibold text-slate-900">
                            GHI CHÚ KẾT QUẢ
                        </label>
                        <textarea
                            rows={4}
                            value={formData.resultNotes}
                            onChange={handleChange('resultNotes')}
                            className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                            placeholder="Nhập chi tiết quá trình xử lý và các lưu ý đặc biệt..."
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="mb-6">
                        <label className="mb-2 block text-sm font-semibold text-slate-900">
                            ẢNH XÁC NHẬN HOÀN TẤT
                        </label>
                        <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-600 transition hover:border-green-400 hover:bg-green-50/50">
                            <Camera className="h-6 w-6 text-slate-500" />
                            <span className="font-medium">Tải ảnh lên</span>
                            <span className="text-xs text-slate-500">PNG, JPG tối đa 10MB</span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImagesChange}
                                className="hidden"
                            />
                        </label>
                        {formData.images.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {formData.images.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                                    >
                                        <ImageIcon className="h-4 w-4 text-slate-500" />
                                        <span className="max-w-[200px] truncate">{file.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                {/* Task Status */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-slate-900">
                        Trạng thái Nhiệm vụ #MS-102
                    </h3>

                    <div className="space-y-3">
                        {mockTaskRequests.map((request) => (
                            <div
                                key={request.id}
                                className={`rounded-lg border p-3 ${
                                    request.status === 'COMPLETED'
                                        ? 'border-green-200 bg-green-50'
                                        : 'border-orange-200 bg-orange-50'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-900">
                                        {request.label}
                                    </span>
                                    {request.status === 'COMPLETED' ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                            <CheckCircle2 className="h-3 w-3" />
                                            XONG
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                            ĐANG XỬ LÝ
                                        </span>
                                    )}
                                </div>
                                {request.completedAt && (
                                    <p className="mt-1 text-xs text-slate-600">
                                        Hoàn thành lúc {request.completedAt}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Progress */}
                    <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700">Tiến độ chung</span>
                            <span className="font-semibold text-slate-900">{progress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                                className="h-full rounded-full bg-green-500 transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        {!canCompleteTask && (
                            <p className="mt-2 text-xs text-slate-600">
                                Cần hoàn tất "Yêu cầu #03" để có thể hoàn thành nhiệm vụ.
                            </p>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>
                            Việc hoàn tất nhiệm vụ chỉ được thực hiện sau khi tất cả các yêu cầu con
                            đã được xử lý xong. Vui lòng kiểm tra kỹ trước khi xác nhận.
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="lg:col-span-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-6 py-4">
                <div className="text-sm text-slate-600">
                    Đang thao tác: Trần Văn A (Đội Cứu hộ 01)
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCompleteRequest}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-green-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-green-400"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4" />
                        )}
                        Hoàn tất yêu cầu
                    </button>
                    <button
                        onClick={handleCompleteTask}
                        disabled={!canCompleteTask}
                        className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-md transition ${
                            canCompleteTask
                                ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg'
                                : 'cursor-not-allowed bg-slate-300 text-slate-500'
                        }`}
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Hoàn tất nhiệm vụ
                    </button>
                </div>
            </div>
        </div>
    );
}
