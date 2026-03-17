import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, MapPin, Package, RefreshCw, Truck } from 'lucide-react';
import { MANAGER_ROUTES } from '../../../app/routes/route.constants.js';
import { listDistributionVouchers } from '../../../features/relief/apiDistribution.js';

function parseList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

const STATUS_CONFIG = {
    PLANNED: { label: 'Đã lập kế hoạch', color: 'bg-slate-100 text-slate-700', icon: Clock, step: 0 },
    ASSIGNED: { label: 'Đã gán đội', color: 'bg-blue-100 text-blue-700', icon: Truck, step: 1 },
    IN_TRANSIT: { label: 'Đang vận chuyển', color: 'bg-amber-100 text-amber-700', icon: Truck, step: 2 },
    ARRIVED: { label: 'Đã tới điểm giao', color: 'bg-cyan-100 text-cyan-700', icon: MapPin, step: 3 },
    DELIVERING: { label: 'Đang phát hàng', color: 'bg-orange-100 text-orange-700', icon: Package, step: 4 },
    COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700', icon: CheckCircle2, step: 5 },
    CANCELLED: { label: 'Đã huỷ', color: 'bg-red-100 text-red-700', icon: Clock, step: -1 },
};

const TIMELINE_STEPS = [
    { key: 'PLANNED', label: 'Lập kế hoạch' },
    { key: 'ASSIGNED', label: 'Gán đội' },
    { key: 'IN_TRANSIT', label: 'Đang chuyển' },
    { key: 'ARRIVED', label: 'Tới điểm giao' },
    { key: 'DELIVERING', label: 'Phát hàng' },
    { key: 'COMPLETED', label: 'Hoàn thành' },
];

function normalizeDistribution(dist) {
    const id = dist?.id ?? dist?.distributionId;
    const code = dist?.code || dist?.distributionCode || `PPH-${id}`;
    const status = String(dist?.status || 'PLANNED').toUpperCase();
    const area = dist?.deliveryAddress || dist?.targetAreaName || dist?.targetArea || dist?.area || 'Chưa cập nhật';
    const receiver = dist?.receiverName || dist?.contactName || 'N/A';
    const phone = dist?.receiverPhone || dist?.contactPhone || '';
    const teamName = dist?.teamName || dist?.assignedTeamName || '';
    const priority = dist?.priority || 'TRUNG_BINH';
    const createdAt = dist?.createdAt || dist?.createdDate || null;
    const updatedAt = dist?.updatedAt || null;
    const lines = parseList(dist?.lines);

    return { id, code, status, area, receiver, phone, teamName, priority, createdAt, updatedAt, lines };
}

export default function DistributionTrackingPage() {
    const navigate = useNavigate();
    const [distributions, setDistributions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await listDistributionVouchers({ size: 100 });
            const list = parseList(res).map(normalizeDistribution);
            list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            setDistributions(list);
            if (list.length > 0 && !selectedId) setSelectedId(list[0].id);
        } catch (e) {
            setError(e?.message || 'Không thể tải danh sách phiếu điều phối.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const filtered = useMemo(() => {
        if (!statusFilter) return distributions;
        return distributions.filter((d) => d.status === statusFilter);
    }, [distributions, statusFilter]);

    const selected = useMemo(
        () => distributions.find((d) => d.id === selectedId) || null,
        [distributions, selectedId],
    );

    const currentStep = selected ? (STATUS_CONFIG[selected.status]?.step ?? 0) : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Theo dõi Phân phối</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Giám sát tiến trình giao hàng cứu trợ thời gian thực
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={loadData}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(MANAGER_ROUTES.DISTRIBUTION_PLAN)}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Gán nhiệm vụ
                    </button>
                </div>
            </div>

            {/* Status filter tabs */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setStatusFilter(null)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        !statusFilter ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    Tất cả ({distributions.length})
                </button>
                {Object.entries(STATUS_CONFIG)
                    .filter(([key]) => key !== 'CANCELLED')
                    .map(([key, cfg]) => {
                        const count = distributions.filter((d) => d.status === key).length;
                        return (
                            <button
                                key={key}
                                onClick={() => setStatusFilter(key)}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                    statusFilter === key ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                {cfg.label} ({count})
                            </button>
                        );
                    })}
            </div>

            {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Distribution List */}
                <div className="space-y-2 lg:col-span-1">
                    <h2 className="text-sm font-semibold text-slate-900">
                        Danh sách phiếu ({filtered.length})
                    </h2>
                    {loading ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                            <RefreshCw className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                            <p className="mt-2">Đang tải...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                            Không có phiếu nào.
                        </div>
                    ) : (
                        <div className="max-h-[600px] space-y-2 overflow-auto">
                            {filtered.map((dist) => {
                                const cfg = STATUS_CONFIG[dist.status] || STATUS_CONFIG.PLANNED;
                                const isSelected = selectedId === dist.id;
                                return (
                                    <button
                                        key={dist.id}
                                        type="button"
                                        onClick={() => setSelectedId(dist.id)}
                                        className={`w-full rounded-lg border p-3 text-left transition ${
                                            isSelected
                                                ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200'
                                                : 'border-slate-200 bg-white hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-slate-900">{dist.code}</span>
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                                                {cfg.label}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500 line-clamp-1">{dist.area}</p>
                                        {dist.teamName && (
                                            <p className="mt-0.5 text-xs text-blue-600 font-medium">Đội: {dist.teamName}</p>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Detail + Timeline */}
                <div className="space-y-4 lg:col-span-2">
                    {selected ? (
                        <>
                            {/* Timeline */}
                            <div className="rounded-xl border border-slate-200 bg-white p-5">
                                <h3 className="mb-4 text-sm font-semibold text-slate-900">
                                    Tiến trình giao hàng — {selected.code}
                                </h3>
                                <div className="flex items-center justify-between">
                                    {TIMELINE_STEPS.map((step, idx) => {
                                        const isCompleted = currentStep >= idx;
                                        const isCurrent = currentStep === idx;
                                        return (
                                            <div key={step.key} className="flex flex-1 flex-col items-center">
                                                <div className="relative flex w-full items-center justify-center">
                                                    {idx > 0 && (
                                                        <div
                                                            className={`absolute left-0 right-1/2 top-1/2 h-0.5 -translate-y-1/2 ${
                                                                currentStep >= idx ? 'bg-blue-500' : 'bg-slate-200'
                                                            }`}
                                                        />
                                                    )}
                                                    {idx < TIMELINE_STEPS.length - 1 && (
                                                        <div
                                                            className={`absolute left-1/2 right-0 top-1/2 h-0.5 -translate-y-1/2 ${
                                                                currentStep > idx ? 'bg-blue-500' : 'bg-slate-200'
                                                            }`}
                                                        />
                                                    )}
                                                    <div
                                                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                                                            isCurrent
                                                                ? 'border-blue-500 bg-blue-500 text-white ring-4 ring-blue-100'
                                                                : isCompleted
                                                                    ? 'border-blue-500 bg-blue-500 text-white'
                                                                    : 'border-slate-200 bg-white text-slate-400'
                                                        }`}
                                                    >
                                                        {isCompleted ? '✓' : idx + 1}
                                                    </div>
                                                </div>
                                                <p
                                                    className={`mt-2 text-center text-[10px] font-medium ${
                                                        isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                                                    }`}
                                                >
                                                    {step.label}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Detail info */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Thông tin giao hàng
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Người nhận</span>
                                            <span className="font-medium text-slate-900">{selected.receiver}</span>
                                        </div>
                                        {selected.phone && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">SĐT</span>
                                                <span className="font-medium text-blue-600">{selected.phone}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Địa chỉ</span>
                                            <span className="max-w-[200px] text-right font-medium text-slate-900">{selected.area}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Đội giao</span>
                                            <span className="font-medium text-slate-900">{selected.teamName || 'Chưa gán'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Ưu tiên</span>
                                            <span className="font-semibold text-rose-600">{selected.priority}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Danh sách hàng
                                    </h4>
                                    {selected.lines.length === 0 ? (
                                        <p className="text-sm text-slate-500">Không có dòng hàng.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {selected.lines.map((line, idx) => (
                                                <div
                                                    key={line?.id || idx}
                                                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                                                >
                                                    <span className="text-sm text-slate-700">
                                                        {line?.itemName || line?.itemCode || `Mặt hàng #${idx + 1}`}
                                                    </span>
                                                    <span className="text-sm font-medium text-slate-900">
                                                        {Number(line?.qty || 0).toLocaleString('vi-VN')} {line?.unit || ''}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Lịch sử
                                </h4>
                                <div className="space-y-1 text-sm">
                                    {selected.createdAt && (
                                        <div className="flex justify-between text-slate-600">
                                            <span>Tạo phiếu</span>
                                            <span>{new Date(selected.createdAt).toLocaleString('vi-VN')}</span>
                                        </div>
                                    )}
                                    {selected.updatedAt && (
                                        <div className="flex justify-between text-slate-600">
                                            <span>Cập nhật cuối</span>
                                            <span>{new Date(selected.updatedAt).toLocaleString('vi-VN')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                            <Package className="mx-auto h-10 w-10 text-slate-300" />
                            <p className="mt-3 text-sm text-slate-500">Chọn phiếu để xem chi tiết tiến trình.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
