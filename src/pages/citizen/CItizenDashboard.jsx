import React, { useState, useEffect } from "react";
import { Plus, Shield, Package, AlertTriangle, PhoneCall, Eye, CheckCircle2, Clock, Truck, Flag, Info, List } from "lucide-react";
import { CITIZEN_ROUTES } from "../../app/routes/route.constants.js";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getMyRescueRequests } from "../../features/citizen/api.js";
import GoogleMap from "../../features/map/components/GoogleMap.jsx";
import Button from "../../shared/ui/Button.jsx";

export default function CitizenDashboard() {
    const [latestRequest, setLatestRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch requests when component mounts
    useEffect(() => {
        fetchRequests();

        // Check if user just created a new request
        if (location.state?.showSuccessMessage) {
            setShowSuccessMessage(true);
            window.history.replaceState({}, document.title);
            setTimeout(() => setShowSuccessMessage(false), 5000);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    // Separate effect to handle state changes
    useEffect(() => {
        if (location.state?.showSuccessMessage) {
            fetchRequests();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getMyRescueRequests({
                page: 1,
                limit: 1, // Only get the latest one
            });

            // Handle different response formats
            let requestsList = [];
            if (Array.isArray(response)) {
                requestsList = response;
            } else if (response?.data && Array.isArray(response.data)) {
                requestsList = response.data;
            } else if (response?.content && Array.isArray(response.content)) {
                requestsList = response.content;
            } else if (response?.items && Array.isArray(response.items)) {
                requestsList = response.items;
            }

            // Get the latest request (first one, sorted by createdAt desc from backend)
            setLatestRequest(requestsList.length > 0 ? requestsList[0] : null);
        } catch (err) {
            setError(err.message || 'Không thể tải thông tin yêu cầu');
            console.error('[Dashboard] Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatStatus = (status) => {
        const statusMap = {
            PENDING: { label: 'CHỜ XỬ LÝ', color: 'bg-yellow-500' },
            IN_PROGRESS: { label: 'ĐANG XỬ LÝ', color: 'bg-green-500' },
            COMPLETED: { label: 'HOÀN THÀNH', color: 'bg-blue-500' },
            CANCELLED: { label: 'ĐÃ HỦY', color: 'bg-slate-500' },
        };
        return statusMap[status] || statusMap.PENDING;
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    // Get timeline steps based on request status
    const getTimelineSteps = (request) => {
        if (!request) return [];

        const steps = [
            {
                id: 1,
                title: 'Yêu cầu đã gửi',
                description: 'Hệ thống đã nhận được yêu cầu cứu hộ của bạn',
                time: request.createdAt ? `${formatTime(request.createdAt)}, ${formatDate(request.createdAt)}` : '',
                status: 'done',
                icon: CheckCircle2,
            },
            {
                id: 2,
                title: 'Đã xác minh',
                description: 'Yêu cầu đã được xác minh và đang được xử lý',
                time: request.status !== 'PENDING' ? `${formatTime(request.updatedAt || request.createdAt)}, ${formatDate(request.updatedAt || request.createdAt)}` : '',
                status: request.status !== 'PENDING' ? 'done' : 'pending',
                icon: CheckCircle2,
            },
            {
                id: 3,
                title: 'Đang thực hiện',
                description: 'Đội cứu hộ đang trên đường đến vị trí của bạn',
                time: '',
                status: request.status === 'IN_PROGRESS' ? 'current' : request.status === 'COMPLETED' ? 'done' : 'pending',
                icon: Truck,
            },
            {
                id: 4,
                title: 'Hoàn thành',
                description: 'Công tác cứu hộ đã hoàn tất',
                time: request.status === 'COMPLETED' ? 'Dự kiến hoàn tất trong 30-45 phút' : 'Dự kiến hoàn tất trong 30-45 phút',
                status: request.status === 'COMPLETED' ? 'done' : 'pending',
                icon: Flag,
            },
        ];

        return steps;
    };

    // Parse address to get coordinates (mock for now, should come from backend)
    const getMapCenter = (request) => {
        // Default to Ho Chi Minh City
        if (!request || !request.addressText) {
            return { lat: 10.8231, lng: 106.6297 };
        }
        // In real app, coordinates should come from backend
        // For now, return default
        return { lat: 10.8231, lng: 106.6297 };
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-slate-600">Đang tải...</div>
            </div>
        );
    }

    // Error state
    if (error && !latestRequest) {
        return (
            <div className="space-y-10 pb-10">
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                    <p className="text-red-700 mb-4">{error}</p>
                    <button
                        onClick={fetchRequests}
                        className="text-sm text-red-600 hover:text-red-800 underline"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    // Empty state - no requests yet
    if (!latestRequest) {
        return (
            <div className="space-y-10 pb-10">
                {/* Empty state card */}
                <section>
                    <div className="rounded-3xl bg-white px-6 py-10 shadow-sm ring-1 ring-slate-200">
                        <div className="flex flex-col items-center text-center">
                            {/* Icon circle */}
                            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 ring-4 ring-blue-100">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500">
                                    <Shield className="h-8 w-8 text-white" />
                                </div>
                            </div>

                            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                                Bạn chưa có yêu cầu cứu hộ nào
                            </h1>
                            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
                                Nếu bạn hoặc người thân đang gặp nguy hiểm trong vùng lũ, hãy gửi yêu cầu cứu hộ ngay để trung tâm điều
                                phối và các đội cứu nạn có thể tiếp cận kịp thời.
                            </p>

                            <Button
                                to={CITIZEN_ROUTES.CREATE_RESCUE_REQUEST}
                                variant="primary"
                                size="lg"
                                className="mt-8"
                            >
                                <Plus className="h-4 w-4" />
                                Tạo yêu cầu cứu hộ mới
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Safety tips */}
                <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                        Hướng dẫn an toàn
                    </h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                                <Package className="h-5 w-5 text-orange-500" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900">
                                Chuẩn bị vật dụng thiết yếu
                            </h3>
                            <p className="mt-2 text-xs leading-relaxed text-slate-600">
                                Nước uống, thực phẩm khô, đèn pin và bộ sơ cứu y tế.
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                                <Shield className="h-5 w-5 text-emerald-500" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900">
                                Kỹ năng sinh tồn trong lũ
                            </h3>
                            <p className="mt-2 text-xs leading-relaxed text-slate-600">
                                Cách di chuyển an toàn và nhận biết các khu vực nguy hiểm.
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900">
                                Danh sách hotline khẩn cấp
                            </h3>
                            <p className="mt-2 text-xs leading-relaxed text-slate-600">
                                Các đầu số cứu hộ tại địa phương và đường dây nóng trung ương.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Call 115 section */}
                <section className="pt-4">
                    <div className="rounded-2xl bg-slate-50 px-6 py-6 text-center">
                        <p className="text-xs text-slate-500 mb-3">
                            Cần hỗ trợ khẩn cấp qua điện thoại?
                        </p>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-red-600 hover:shadow-lg"
                        >
                            <PhoneCall className="h-4 w-4" />
                            Gọi ngay 115
                        </button>
                    </div>
                </section>
            </div>
        );
    }

    // Has request - show status view with map and timeline
    const statusInfo = formatStatus(latestRequest.status);
    const timelineSteps = getTimelineSteps(latestRequest);
    const mapCenter = getMapCenter(latestRequest);

    return (
        <div className="space-y-6 pb-10">
            {/* Header with link to all requests */}
            <section>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Trạng thái yêu cầu cứu hộ
                        </h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Theo dõi tiến độ yêu cầu cứu hộ mới nhất của bạn
                        </p>
                    </div>
                    <Button
                        to={CITIZEN_ROUTES.MY_RESCUE_REQUESTS}
                        variant="secondary"
                        size="lg"
                    >
                        <List className="h-4 w-4" />
                        Xem tất cả yêu cầu
                    </Button>
                </div>
            </section>

            {/* Success message */}
            {showSuccessMessage && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Yêu cầu cứu hộ đã được gửi thành công!</span>
                    </div>
                    <button
                        onClick={() => setShowSuccessMessage(false)}
                        className="text-green-600 hover:text-green-800"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Map Section with Overlay */}
            <section className="relative">
                <div className="relative h-[400px] w-full overflow-hidden rounded-2xl bg-slate-100">
                    <GoogleMap
                        center={mapCenter}
                        zoom={15}
                        markerPosition={mapCenter}
                    />

                    {/* Status Overlay Banner */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`h-2 w-2 rounded-full ${statusInfo.color}`} />
                            <span className="text-sm font-semibold text-white">{statusInfo.label}</span>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">
                            Yêu cầu cứu hộ của bạn
                        </h2>
                        <p className="text-xs text-slate-200">
                            Mã yêu cầu: {latestRequest.code || `#${latestRequest.id}`} - Cập nhật lúc {formatTime(latestRequest.updatedAt || latestRequest.createdAt)}
                        </p>
                    </div>
                </div>
            </section>

            {/* Timeline Section */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-lg font-semibold text-slate-900">
                    Tiến độ xử lý
                </h3>

                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-slate-200" />

                    <div className="space-y-6">
                        {timelineSteps.map((step, index) => {
                            const isLast = index === timelineSteps.length - 1;
                            const isDone = step.status === 'done';
                            const isCurrent = step.status === 'current';
                            const Icon = step.icon;

                            return (
                                <div key={step.id} className="relative flex gap-4">
                                    {/* Icon */}
                                    <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white">
                                        <div
                                            className={`flex h-7 w-7 items-center justify-center rounded-full ${isDone
                                                ? 'bg-green-500 text-white'
                                                : isCurrent
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-slate-200 text-slate-400'
                                                }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 pb-6">
                                        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {step.title}
                                                    </p>
                                                    <p className="text-xs text-slate-600 mt-1">
                                                        {step.description}
                                                    </p>
                                                </div>
                                                {step.time && (
                                                    <div className="mt-2 flex items-center gap-1 text-xs text-slate-500 sm:mt-0">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{step.time}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Important Information */}
            <section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">
                            Thông tin quan trọng
                        </h4>
                        <p className="text-xs text-blue-800 mb-3">
                            Chỉ được tạo yêu cầu mới khi yêu cầu trước đã hoàn tất hoặc bị hủy.
                        </p>
                        <button
                            type="button"
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                        >
                            TÌM HIỂU THÊM
                        </button>
                    </div>
                </div>
            </section>

            {/* Action Buttons */}
            <section className="flex flex-col gap-3 sm:flex-row">
                <Button
                    onClick={() => navigate(CITIZEN_ROUTES.RESCUE_DETAIL, { state: { request: latestRequest } })}
                    variant="primary"
                    size="lg"
                    fullWidth
                >
                    <Eye className="h-4 w-4" />
                    Xem chi tiết yêu cầu
                </Button>
                <Button
                    to={CITIZEN_ROUTES.CREATE_RESCUE_REQUEST}
                    variant="secondary"
                    size="lg"
                    fullWidth
                >
                    <Plus className="h-4 w-4" />
                    Tạo yêu cầu mới
                </Button>
            </section>
        </div>
    );
}
