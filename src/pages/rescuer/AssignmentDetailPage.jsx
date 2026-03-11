import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Ship,
    Users,
    Clock,
    MapPin,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    Play,
    RefreshCw,
    AlertTriangle,
    Phone,
    MessageCircle,
    Navigation,
    Plus,
    Minus,
} from 'lucide-react';
import { RESCUER_ROUTES } from '../../app/routes/route.constants.js';

const mockRequests = [
    {
        id: 'RQ-882',
        priority: 'HIGH',
        priorityLabel: 'MỨC ĐỘ: ĐỎ (KHẨN CẤP)',
        priorityColor: 'red',
        timeAgo: '10 phút trước',
        status: 'NOT_RECEIVED',
        statusLabel: 'Chưa tiếp nhận',
        peopleCount: 5,
        location: 'Tầng 2, nhà 15 ngách 4',
        description: 'Nước đang lên nhanh, có người già và trẻ nhỏ cần di chuyển gấp.',
        avatar: '👨',
    },
    {
        id: 'RQ-885',
        priority: 'MEDIUM',
        priorityLabel: 'MỨC ĐỘ: CAM (CẦN HỖ TRỢ SỚM)',
        priorityColor: 'orange',
        timeAgo: '25 phút trước',
        status: 'IN_PROGRESS',
        statusLabel: 'Đang cứu hộ',
        peopleCount: 2,
        location: 'Đầu ngõ 12 Phố Huế',
        description: '',
        avatar: '👨',
    },
    {
        id: 'RQ-879',
        priority: 'COMPLETED',
        priorityLabel: 'HOÀN THÀNH',
        priorityColor: 'green',
        timeAgo: '',
        status: 'COMPLETED',
        statusLabel: 'Đã hoàn thành',
        peopleCount: 3,
        location: 'Hẻm 44 Trần Hưng Đạo',
        description: '',
        avatar: '👩',
    },
];

export default function AssignmentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isMoving, setIsMoving] = useState(false);

    const getPriorityBadgeClass = (priority) => {
        const classes = {
            HIGH: 'bg-red-500 text-white',
            MEDIUM: 'bg-orange-500 text-white',
            COMPLETED: 'bg-green-500 text-white',
        };
        return classes[priority] || 'bg-slate-500 text-white';
    };

    const getRequestCardBorder = (priority) => {
        const borders = {
            HIGH: 'border-l-4 border-l-red-500',
            MEDIUM: 'border-l-4 border-l-orange-500',
            COMPLETED: 'border-l-4 border-l-green-500',
        };
        return borders[priority] || 'border-l-4 border-l-slate-300';
    };

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* Main Content */}
            <div className="space-y-6">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <button
                        onClick={() => navigate(RESCUER_ROUTES.MY_ASSIGNMENTS)}
                        className="hover:text-blue-600"
                    >
                        Danh sách nhiệm vụ
                    </button>
                    <span>/</span>
                    <span className="font-medium text-slate-900">Chi tiết #{id}</span>
                </div>

                {/* Task Info */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Nhiệm vụ: #{id}
                            </h1>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Ship className="h-4 w-4 text-blue-600" />
                                    Cano 05
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-600" />
                                    Đội: 4 người
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-600" />
                                    Dự kiến: 45 phút
                                </div>
                            </div>
                        </div>
                        <button className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-amber-600">
                            Chuẩn bị xuất phát
                        </button>
                    </div>
                </div>

                {/* Request List */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Danh sách yêu cầu cứu hộ ({mockRequests.length})
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                            Ưu tiên xử lý theo thứ tự khẩn cấp
                        </p>
                    </div>

                    <div className="space-y-4">
                        {mockRequests.map((request) => (
                            <div
                                key={request.id}
                                className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md ${getRequestCardBorder(
                                    request.priority,
                                )}`}
                            >
                                <div className="mb-3 flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="mb-2 flex items-center gap-2">
                                            <span
                                                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${getPriorityBadgeClass(
                                                    request.priority,
                                                )}`}
                                            >
                                                {request.priorityLabel}
                                            </span>
                                            {request.timeAgo && (
                                                <span className="text-xs text-slate-500">
                                                    {request.timeAgo}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-sm font-semibold text-slate-900">
                                                Yêu cầu #{request.id}
                                            </span>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                    request.status === 'COMPLETED'
                                                        ? 'bg-green-100 text-green-700'
                                                        : request.status === 'IN_PROGRESS'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-slate-100 text-slate-700'
                                                }`}
                                            >
                                                {request.status === 'COMPLETED' && (
                                                    <CheckCircle2 className="mr-1 inline h-3 w-3" />
                                                )}
                                                {request.statusLabel}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg">
                                        {request.avatar}
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-slate-400" />
                                        {request.peopleCount} người
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-slate-400" />
                                        {request.location}
                                    </div>
                                    {request.description && (
                                        <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs italic text-slate-700">
                                            "{request.description}"
                                        </p>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <button
                                        onClick={() =>
                                            navigate(
                                                RESCUER_ROUTES.UPDATE_STATUS.replace(
                                                    ':id',
                                                    request.id,
                                                ),
                                            )
                                        }
                                        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        Cập nhật trạng thái
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                {/* Live Tracking */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-slate-900">
                        THEO DÕI TRỰC TIẾP
                    </h3>

                    {/* Map Widget */}
                    <div className="relative mb-4 h-48 overflow-hidden rounded-lg bg-gradient-to-br from-green-50 to-blue-50">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-24 w-24 rounded-full bg-blue-200/50" />
                            <div className="absolute inset-6 rounded-full bg-blue-300/60" />
                            <div className="absolute inset-10 flex flex-col items-center justify-center rounded-full bg-blue-600">
                                <MapPin className="h-6 w-6 text-white" />
                                <span className="mt-1 text-[10px] font-medium text-white">
                                    Vị trí hiện tại
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={() => navigate(RESCUER_ROUTES.MISSION_MAP.replace(':id', id))}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                        >
                            <Navigation className="h-4 w-4" />
                            Mở bản đồ theo dõi
                        </button>
                        <button
                            onClick={() => setIsMoving(!isMoving)}
                            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-md transition ${
                                isMoving
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            <Play className="h-4 w-4" />
                            {isMoving ? 'Đang di chuyển' : 'Bắt đầu di chuyển'}
                        </button>
                        <button
                            onClick={() => navigate(RESCUER_ROUTES.FIELD_UPDATE.replace(':id', id))}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Cập nhật hiện trường
                        </button>
                        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-red-700">
                            <AlertTriangle className="h-4 w-4" />
                            Báo cáo sự cố khẩn
                        </button>
                    </div>
                </div>

                {/* Team Info */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-slate-900">
                        THÔNG TIN ĐỘI HÌNH
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">Nguyễn Văn A</p>
                                <p className="text-xs text-slate-600">Đội trưởng</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                                <Users className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">Trần Thị D</p>
                                <p className="text-xs text-slate-600">Y sĩ cứu hộ</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
