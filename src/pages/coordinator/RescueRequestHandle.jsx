import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    MapPin,
    X,
    User,
    Truck,
    Ambulance,
    Users,
    ArrowUpDown,
    LayoutGrid,
    ChevronUp,
    Car,
} from 'lucide-react';
import GoogleMap from '../../features/map/components/GoogleMap.jsx';
import { COORDINATOR_ROUTES } from '../../app/routes/route.constants.js';

const STATUS_FILTERS = [
    { id: 'all', label: 'Tất cả', value: null },
    { id: 'moving', label: 'Đang di chuyển', value: 'moving' },
    { id: 'onscene', label: 'Tại hiện trường', value: 'onscene' },
];

const STATUS_TAG = {
    moving: { label: 'ĐANG DI CHUYỂN', class: 'bg-blue-600 text-white' },
    onscene: { label: 'TẠI HIỆN TRƯỜNG', class: 'bg-amber-500 text-white' },
    completed: { label: 'HOÀN TẤT', class: 'bg-green-600 text-white' },
};

const MOCK_TASKS = [
    { id: 'NV-2024-001', status: 'moving', team: 'Đội Cứu hộ số 4 (Alpha)', location: 'Tràng Tiền, Hoàn Kiếm, Hà Nội', lat: 21.0245, lng: 105.8532 },
    { id: 'NV-2024-002', status: 'onscene', team: 'Đội PCCC & CNCH - Ba Đình', location: 'Ngọc Khánh, Ba Đình', lat: 21.0312, lng: 105.8123 },
    { id: 'NV-2024-005', status: 'completed', team: 'Đội Phản ứng Nhanh - Cầu Giấy', location: 'Xuân Thủy, Cầu Giấy', lat: 21.0334, lng: 105.7845 },
    { id: 'NV-2024-009', status: 'moving', team: 'Đội Cứu hộ Thủy nạn - Tây Hồ', location: 'Bến Nhật Bản, Tây Hồ', lat: 21.0621, lng: 105.8234 },
];

const MOCK_DETAIL = {
    id: 'NV-2024-001',
    priority: 'ƯU TIÊN',
    description: 'Yêu cầu hỗ trợ cứu hộ khẩn cấp tại cửa hàng bách hóa',
    address: '45 Tràng Tiền, Hoàn Kiếm, TP. Hà Nội',
    reporter: 'Nguyễn Văn A - 0912 xxxxx',
    reporterQuote: '"Có khói đen bốc lên từ kho hàng phía sau.."',
    resources: [
        { type: 'truck', name: 'Xe chữa cháy 01-HNI', status: 'ONLINE' },
        { type: 'ambulance', name: 'Xe cứu thương 02-EMS', status: 'ONLINE' },
    ],
    personnelCount: 12,
    log: [
        { time: '14:15', text: 'Tiếp nhận yêu cầu qua tổng đài 114' },
        { time: '14:30', text: 'Điều động Đội Cứu hộ Số 4' },
        { time: 'Đang chờ', text: 'Tiếp cận hiện trường...', pending: true },
    ],
};

const HANOI_CENTER = { lat: 21.0285, lng: 105.8542 };

export default function RescueRequestHandle() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(null);
    const [selectedTask, setSelectedTask] = useState(MOCK_TASKS[0]);
    const [mapZoom, setMapZoom] = useState(13);
    const [showDetail, setShowDetail] = useState(true);

    const filteredTasks = useMemo(() => {
        let list = [...MOCK_TASKS];
        if (statusFilter) {
            list = list.filter((t) => t.status === statusFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (t) =>
                    t.id.toLowerCase().includes(q) ||
                    t.team.toLowerCase().includes(q) ||
                    t.location.toLowerCase().includes(q)
            );
        }
        return list;
    }, [statusFilter, searchQuery]);

    const mapCenter = selectedTask
        ? { lat: selectedTask.lat, lng: selectedTask.lng }
        : HANOI_CENTER;

    const handleTaskSelect = (task) => {
        setSelectedTask(task);
        setShowDetail(true);
    };

    const handleCloseDetail = () => {
        setShowDetail(false);
    };

    const handleEscalation = () => {
        navigate(COORDINATOR_ROUTES.ESCALATION);
    };

    return (
        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-100">
            {/* ===== LEFT: Danh sách nhiệm vụ ===== */}
            <div className="flex w-[320px] shrink-0 flex-col border-r border-slate-200 bg-white">
                <div className="border-b border-slate-200 p-4">
                    <h2 className="font-semibold text-slate-900">Danh sách Nhiệm vụ</h2>
                    <div className="relative mt-3">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Mã NV, đội, địa điểm.."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div className="mt-3 flex gap-1">
                        {STATUS_FILTERS.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setStatusFilter(f.value)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                    statusFilter === f.value
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredTasks.map((task) => {
                        const tag = STATUS_TAG[task.status] || STATUS_TAG.moving;
                        const isSelected = selectedTask?.id === task.id;
                        return (
                            <button
                                key={task.id}
                                type="button"
                                onClick={() => handleTaskSelect(task)}
                                className={`w-full border-b border-slate-100 p-4 text-left transition ${
                                    isSelected ? 'bg-blue-50 ring-inset ring-2 ring-blue-200' : 'hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-slate-900">#{task.id}</span>
                                    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${tag.class}`}>
                                        {tag.label}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs font-medium text-slate-700">{task.team}</p>
                                <div className="mt-1 flex items-start gap-1.5 text-xs text-slate-500">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                    <span>{task.location}</span>
                                </div>
                            </button>
                        );
                    })}
                    {filteredTasks.length === 0 && (
                        <div className="p-6 text-center text-sm text-slate-500">
                            Không có nhiệm vụ nào phù hợp
                        </div>
                    )}
                </div>
            </div>

            {/* ===== CENTER: Bản đồ ===== */}
            <div className="relative flex-1 flex flex-col min-w-0">
                <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={() => setMapZoom((z) => Math.min(18, z + 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
                    >
                        <span className="text-lg font-bold text-slate-600">+</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMapZoom((z) => Math.max(10, z - 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
                    >
                        <span className="text-lg font-bold text-slate-600">−</span>
                    </button>
                    <button
                        type="button"
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        Gần trung tâm
                    </button>
                </div>
                <div className="absolute bottom-3 left-3 z-10 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-sm">
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-600">
                        Chỉ giải bản đồ
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                        <li className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                <Car className="h-3 w-3" />
                            </span>
                            Đội cứu hộ (Đang di chuyển)
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-red-500" />
                            Điểm sự cố (Chưa xử lý)
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-amber-500" />
                            Vị trí hiện trường
                        </li>
                    </ul>
                </div>
                <div className="h-full w-full">
                    <GoogleMap
                        center={mapCenter}
                        zoom={mapZoom}
                        markerPosition={selectedTask ? { lat: selectedTask.lat, lng: selectedTask.lng } : null}
                    />
                </div>
            </div>

            {/* ===== RIGHT: Chi tiết nhiệm vụ ===== */}
            {showDetail && selectedTask && (
                <div className="flex w-[380px] shrink-0 flex-col border-l border-slate-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-slate-200 p-4">
                        <h2 className="font-semibold text-slate-900">Chi tiết Nhiệm vụ</h2>
                        <button
                            type="button"
                            onClick={handleCloseDetail}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-slate-900">#{MOCK_DETAIL.id}</span>
                            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold uppercase text-red-700">
                                {MOCK_DETAIL.priority}
                            </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{MOCK_DETAIL.description}</p>

                        <div className="mt-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Thông tin hiện trường
                            </h3>
                            <div className="mt-2 space-y-2">
                                <div className="flex gap-2 text-sm text-slate-700">
                                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                                    <span>{MOCK_DETAIL.address}</span>
                                </div>
                                <div className="flex gap-2 text-sm">
                                    <User className="h-4 w-4 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="font-medium text-slate-700">{MOCK_DETAIL.reporter}</p>
                                        <p className="mt-0.5 text-xs italic text-slate-500">{MOCK_DETAIL.reporterQuote}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Tài nguyên phân bổ
                            </h3>
                            <ul className="mt-2 space-y-2">
                                {MOCK_DETAIL.resources.map((r, i) => (
                                    <li key={i} className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            {r.type === 'truck' ? (
                                                <Truck className="h-4 w-4 text-slate-500" />
                                            ) : (
                                                <Ambulance className="h-4 w-4 text-slate-500" />
                                            )}
                                            {r.name}
                                        </span>
                                        <span className="font-medium text-green-600">{r.status}</span>
                                    </li>
                                ))}
                                <li className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-slate-500" />
                                        Nhân sự {MOCK_DETAIL.personnelCount} thành viên
                                    </span>
                                    <button type="button" className="text-blue-600 hover:underline text-xs font-medium">
                                        Xem chi tiết
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div className="mt-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Nhật ký nhiệm vụ
                            </h3>
                            <ul className="mt-2 space-y-3">
                                {MOCK_DETAIL.log.map((entry, i) => (
                                    <li key={i} className="flex gap-3">
                                        <span className={`shrink-0 text-xs font-medium ${entry.pending ? 'text-amber-600' : 'text-slate-500'}`}>
                                            {entry.time}
                                        </span>
                                        <span className={entry.pending ? 'text-sm text-amber-700' : 'text-sm text-slate-700'}>
                                            {entry.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <ArrowUpDown className="h-4 w-4" />
                                Điều chỉnh
                            </button>
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <LayoutGrid className="h-4 w-4" />
                                Tách/Gộp
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={handleEscalation}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
                        >
                            <ChevronUp className="h-4 w-4" />
                            LEO THANG (ESCALATION)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
