import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Info, Users, MapPin } from 'lucide-react';

import Card from '../../shared/ui/Card.jsx';
import Button from '../../shared/ui/Button.jsx';
import { prioritizeRescueRequest } from '../../features/coordinator/api.js';

export default function RescuePrioritizePage() {
    const location = useLocation();
    const navigate = useNavigate();

    const rawRequest = location.state?.request || null;
    const requestId = rawRequest?.id;

    const [selectedPriority, setSelectedPriority] = useState(rawRequest?.priority || 'HIGH');
    const [saving, setSaving] = useState(false);

    const request = rawRequest
        ? {
            code: rawRequest.code || rawRequest.id || '',
            address: rawRequest.addressText || rawRequest.address || '',
            peopleCount: rawRequest.peopleCount ?? rawRequest.affectedPeopleCount ?? 0,
            description: rawRequest.description || '',
        }
        : null;
    const priorityBaseScore = selectedPriority === 'HIGH' ? 100 : selectedPriority === 'MEDIUM' ? 60 : 30;
    const vulnerableScore = Math.min((Number(request?.peopleCount) || 0) * 5, 40);
    const totalScore = priorityBaseScore + vulnerableScore;

    const handleConfirm = async () => {
        if (!requestId) {
            window.alert('Không tìm thấy ID yêu cầu để lưu mức độ ưu tiên.');
            return;
        }

        try {
            setSaving(true);
            await prioritizeRescueRequest(requestId, selectedPriority);
            window.alert('Đã cập nhật mức độ ưu tiên cho yêu cầu.');
            navigate(-1);
        } catch (error) {
            console.error('[RescuePrioritizePage] Lỗi khi lưu ưu tiên:', error);
            window.alert('Không thể lưu mức độ ưu tiên. Vui lòng thử lại sau.');
        } finally {
            setSaving(false);
        }
    };

    if (!request) {
        return (
            <div className="flex flex-col gap-4 pb-10">
                <Card className="px-4 py-4 text-center text-sm text-slate-700">
                    Không tìm thấy dữ liệu yêu cầu cứu hộ. Vui lòng mở màn hình này từ danh sách yêu cầu.
                </Card>
                <div className="text-center">
                    <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                        Quay lại
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 pb-10">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    Xử lý Phân loại Ưu tiên
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                    Đánh giá và xác nhận mức độ khẩn cấp để điều phối đội cứu hộ.
                </p>
            </div>

            {/* Thông tin yêu cầu */}
            <Card className="grid gap-4 border-t-4 border-blue-500 px-4 py-4 text-xs text-slate-700 md:grid-cols-3">
                <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 text-blue-500" />
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            MÃ YÊU CẦU
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                            #{request.code}
                        </div>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-blue-500" />
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            VỊ TRÍ
                        </div>
                        <div className="mt-1 text-sm text-slate-900">{request.address || 'Chưa có địa chỉ'}</div>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <Users className="mt-0.5 h-4 w-4 text-blue-500" />
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            SỐ LƯỢNG NGƯỜI
                        </div>
                        <div className="mt-1 text-sm text-slate-900">
                            {request.peopleCount} người cần hỗ trợ
                        </div>
                    </div>
                </div>
            </Card>

            {/* Thiết lập mức độ khẩn cấp */}
            <Card className="space-y-3 px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-sm bg-rose-500" />
                        <span className="text-xs font-semibold text-slate-900">
                            Thiết lập Mức độ Khẩn cấp
                        </span>
                    </div>
                    <button className="text-[11px] font-medium text-blue-600 hover:underline">
                        Gợi ý từ hệ thống
                    </button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    {/* Cao */}
                    <button
                        type="button"
                        onClick={() => setSelectedPriority('HIGH')}
                        className={`group flex flex-col gap-2 rounded-xl border-2 px-3 py-3 text-left shadow-sm transition ${selectedPriority === 'HIGH'
                                ? 'border-rose-500 bg-rose-50/70 hover:border-rose-600 hover:bg-rose-50'
                                : 'border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50/40'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-rose-700">Cao (High)</div>
                                    <div className="text-[11px] text-rose-600">
                                        Nguy hiểm tính mạng, nguy cơ tắc nghẽn
                                    </div>
                                </div>
                            </div>
                            {selectedPriority === 'HIGH' && (
                                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-rose-600 shadow-sm">
                                    Đã chọn
                                </span>
                            )}
                        </div>
                    </button>

                    {/* Trung bình */}
                    <button
                        type="button"
                        onClick={() => setSelectedPriority('MEDIUM')}
                        className={`flex flex-col gap-2 rounded-xl border-2 px-3 py-3 text-left shadow-sm transition ${selectedPriority === 'MEDIUM'
                                ? 'border-amber-300 bg-amber-50/70 hover:border-amber-400 hover:bg-amber-50'
                                : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/40'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-white shadow-sm">
                                <AlertTriangle className="h-3.5 w-3.5" />
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-amber-700">Trung bình</div>
                                <div className="text-[11px] text-amber-600">
                                    Nguy cơ cao, cần xử lý trong ca trực
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Thấp */}
                    <button
                        type="button"
                        onClick={() => setSelectedPriority('LOW')}
                        className={`flex flex-col gap-2 rounded-xl border-2 px-3 py-3 text-left shadow-sm transition ${selectedPriority === 'LOW'
                                ? 'border-slate-400 bg-slate-50 hover:border-slate-500 hover:bg-slate-50'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-400 text-white shadow-sm">
                                <AlertTriangle className="h-3.5 w-3.5" />
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-slate-800">Thấp (Low)</div>
                                <div className="text-[11px] text-slate-600">
                                    Có thể hoãn lại, ưu tiên các ca khẩn cấp hơn
                                </div>
                            </div>
                        </div>
                    </button>
                </div>
            </Card>

            <Card className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-sm bg-slate-700" />
                        <span className="text-xs font-semibold text-slate-900">
                            Hệ thống Điểm Ưu tiên
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50/60">
                        <div className="flex items-center justify-between px-3 py-2">
                            <span>Mức độ khẩn cấp ({selectedPriority})</span>
                            <span className="font-semibold text-slate-900">+{priorityBaseScore}đ</span>
                        </div>
                        <div className="flex items-center justify-between px-3 py-2">
                            <span>Số người cần hỗ trợ ({request?.peopleCount || 0})</span>
                            <span className="font-semibold text-slate-900">+{vulnerableScore}đ</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-4 text-center shadow-sm">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        TỔNG ĐIỂM ƯU TIÊN
                    </div>
                    <div className="mt-2 text-4xl font-extrabold text-blue-600">{totalScore}</div>
                    <div className="mt-1 text-[11px] text-slate-500">Điểm tính theo dữ liệu yêu cầu hiện tại</div>
                </div>
            </Card>

            {/* Footer confirm */}
            <div className="mt-2 rounded-xl bg-blue-50/80 px-4 py-4 text-center text-xs text-blue-800">
                <Button
                    variant="primary"
                    size="md"
                    className="mx-auto mb-2 flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-blue-600 text-sm font-semibold shadow-md hover:bg-blue-700"
                    onClick={handleConfirm}
                    disabled={saving}
                >
                    <CheckCircle2 className="h-4 w-4" />
                    {saving ? 'Đang lưu...' : 'Xác nhận mức độ ưu tiên'}
                </Button>
                <p>
                    Hành động này dùng để sắp xếp hàng đợi, không thay thế quyết định điều phối đội cứu hộ
                    ở bước tiếp theo.
                </p>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mt-2 text-[11px] font-medium text-blue-700 hover:underline"
                >
                    Quay lại trang trước
                </button>
            </div>
        </div>
    );
}
