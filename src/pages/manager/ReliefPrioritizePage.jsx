import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../shared/ui/Card.jsx';
import Button from '../../shared/ui/Button.jsx';
import Badge from '../../shared/ui/Badge.jsx';
import { getInventoryIssue, getRescuerReliefRequests, updateRescuerReliefStatus } from '../../features/relief/api.js';
import { updateAssetStatus } from '../../features/assets/api.js';
import GoogleMap from '../../features/map/components/MapBox.jsx';
import { RESCUER_ROUTES } from '../../app/routes/route.constants.js';

function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

function toUpper(value) {
    return String(value || '').trim().toUpperCase();
}

function parsePeopleCount(req) {
    if (Number.isFinite(Number(req?.peopleCount))) return Number(req.peopleCount);
    const note = String(req?.note || '');
    const m = note.match(/(\d+)\s*ng(ư|u)ời/i);
    if (!m) return 1;
    const n = Number(m[1]);
    return Number.isFinite(n) && n > 0 ? n : 1;
}

function priorityLabel(p) {
    const s = toUpper(p);
    if (s === 'HIGH') return { label: 'Khẩn cấp', className: 'bg-rose-100 text-rose-700' };
    if (s === 'MEDIUM') return { label: 'Trung bình', className: 'bg-amber-100 text-amber-700' };
    return { label: 'Thấp', className: 'bg-slate-100 text-slate-700' };
}

function isCompleted(req) {
    const status = toUpper(req?.status);
    const delivery = toUpper(req?.deliveryStatus);
    return ['DONE', 'CANCELLED'].includes(status)
        || ['COMPLETED', 'REJECTED', 'RETURNED_TO_WAREHOUSE'].includes(delivery);
}

function waitingMinutes(req) {
    const src = req?.createdAt || req?.updatedAt;
    if (!src) return 0;
    const t = new Date(src).getTime();
    if (Number.isNaN(t)) return 0;
    const diff = Math.max(0, Date.now() - t);
    return Math.floor(diff / 60000);
}

function priorityOrder(req) {
    const priority = toUpper(req?.priority);
    if (priority === 'HIGH') return 3;
    if (priority === 'MEDIUM') return 2;
    return 1;
}

function formatWaiting(minutes) {
    if (!minutes || minutes <= 0) return 'Vừa tạo';
    if (minutes < 60) return `${minutes} phút`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}p`;
}

function extractCoordinates(req) {
    const lat = Number(req?.citizenLatitude ?? req?.latitude ?? req?.lat);
    const lng = Number(req?.citizenLongitude ?? req?.longitude ?? req?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    const raw = String(req?.citizenLocationDescription || req?.locationDescription || req?.citizenAddressText || '');
    const match = raw.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (match) {
        const mLat = Number(match[1]);
        const mLng = Number(match[2]);
        if (Number.isFinite(mLat) && Number.isFinite(mLng)) return { lat: mLat, lng: mLng };
    }
    return null;
}

function isNewRequest(req) {
    const delivery = toUpper(req?.deliveryStatus);
    return delivery === 'MANAGER_APPROVED' || delivery === 'REQUESTED' || delivery === '';
}

function deliveryRank(statusRaw) {
    const s = toUpper(statusRaw);
    if (s === 'ARRIVED_RELIEF_POINT' || s === 'COMPLETED') return 3;
    if (s === 'ARRIVED_WAREHOUSE') return 2;
    if (s === 'RESCUER_RECEIVED' || s === 'MANAGER_APPROVED' || s === 'REQUESTED' || !s) return 1;
    return 1;
}

function formatQty(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '0';
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export default function ReliefPrioritizePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [requests, setRequests] = useState([]);
    const [newRequests, setNewRequests] = useState([]);
    const [orderedRequests, setOrderedRequests] = useState([]);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [savingRequestId, setSavingRequestId] = useState(null);
    const [savingBoardStage, setSavingBoardStage] = useState(false);
    const [returningAssetId, setReturningAssetId] = useState(null);
    const [boardStage, setBoardStage] = useState(1);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            const reqResp = await getRescuerReliefRequests({ page: 0, size: 500 });
            const baseList = normalizeList(reqResp);

            const issueIds = Array.from(
                new Set(
                    baseList
                        .map((r) => Number(r?.assignedIssueId || 0))
                        .filter((id) => id > 0)
                )
            ).slice(0, 200);

            if (issueIds.length === 0) {
                setRequests(baseList);
                return;
            }

            const issueResults = await Promise.allSettled(
                issueIds.map((id) => getInventoryIssue(id))
            );
            const issueById = new Map();
            for (let i = 0; i < issueResults.length; i += 1) {
                const result = issueResults[i];
                const issueId = issueIds[i];
                if (result.status !== 'fulfilled') continue;
                const lines = Array.isArray(result.value?.lines) ? result.value.lines : [];
                issueById.set(issueId, {
                    code: result.value?.code || `#${issueId}`,
                    lines,
                    assetId: result.value?.assetId ?? null,
                    assetCode: result.value?.assetCode || null,
                    assetName: result.value?.assetName || null,
                });
            }

            const enriched = baseList.map((r) => {
                const issueId = Number(r?.assignedIssueId || 0);
                if (!issueId) return r;
                const issue = issueById.get(issueId);
                if (!issue) return r;
                const hasLines = Array.isArray(r?.lines) && r.lines.length > 0;
                return {
                    ...r,
                    assignedIssueCode: r?.assignedIssueCode || issue.code,
                    assignedAssetId: r?.assignedAssetId ?? issue.assetId ?? null,
                    assignedAssetCode: r?.assignedAssetCode || issue.assetCode || null,
                    assignedAssetName: r?.assignedAssetName || issue.assetName || null,
                    lines: hasLines
                        ? r.lines
                        : issue.lines.map((line) => ({
                            id: line?.id,
                            itemCategoryId: line?.itemCategoryId,
                            itemCode: line?.itemCode,
                            itemName: line?.itemName,
                            qty: line?.qty,
                            unit: line?.unit,
                        })),
                };
            });
            setRequests(enriched);
        } catch (e) {
            setError(e?.message || 'Không thể tải danh sách sắp xếp yêu cầu cứu trợ.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const prioritized = useMemo(() => {
        return requests
            .filter((r) => !isCompleted(r))
            .map((r) => {
                const wait = waitingMinutes(r);
                return {
                    ...r,
                    waiting: wait,
                    people: parsePeopleCount(r),
                };
            })
            .sort((a, b) => {
                const p = priorityOrder(b) - priorityOrder(a);
                if (p !== 0) return p;
                return b.waiting - a.waiting;
            });
    }, [requests]);

    useEffect(() => {
        setOrderedRequests((prev) => {
            const byId = new Map(prioritized.map((r) => [Number(r.id), r]));
            const keptOrdered = prev
                .filter((r) => byId.has(Number(r.id)))
                .map((r) => byId.get(Number(r.id)));
            const keptOrderedIds = new Set(keptOrdered.map((r) => Number(r.id)));

            setNewRequests((prevNew) => {
                const keptNew = prevNew
                    .filter((r) => byId.has(Number(r.id)) && !keptOrderedIds.has(Number(r.id)))
                    .map((r) => byId.get(Number(r.id)));
                const usedIds = new Set([...keptOrderedIds, ...keptNew.map((r) => Number(r.id))]);
                const incomingNew = prioritized.filter((r) => !usedIds.has(Number(r.id)) && isNewRequest(r));
                return [...keptNew, ...incomingNew];
            });

            const usedByOrdered = new Set(keptOrderedIds);
            const incomingOrdered = prioritized.filter((r) => !usedByOrdered.has(Number(r.id)) && !isNewRequest(r));
            return [...keptOrdered, ...incomingOrdered];
        });
    }, [prioritized]);

    useEffect(() => {
        if (!orderedRequests.length) {
            setSelectedRequestId(null);
            return;
        }
        if (selectedRequestId == null || !orderedRequests.some((r) => Number(r.id) === Number(selectedRequestId))) {
            setSelectedRequestId(Number(orderedRequests[0].id));
        }
    }, [orderedRequests, selectedRequestId]);

    const selectedRequest = useMemo(() => {
        return orderedRequests.find((r) => Number(r.id) === Number(selectedRequestId))
            || newRequests.find((r) => Number(r.id) === Number(selectedRequestId))
            || null;
    }, [orderedRequests, newRequests, selectedRequestId]);

    const selectedCoords = useMemo(
        () => extractCoordinates(selectedRequest),
        [selectedRequest]
    );

    const warehouseNeedByRequest = useMemo(() => {
        return orderedRequests.map((req) => ({
            requestId: req.id,
            taskCode: req.code || `#${req.id}`,
            issueCode: req.assignedIssueCode || (req.assignedIssueId ? `#${req.assignedIssueId}` : '—'),
            area: req.targetArea || req.citizenAddressText || '—',
            lines: Array.isArray(req.lines) ? req.lines : [],
        }));
    }, [orderedRequests]);

    const warehouseNeedTotal = useMemo(() => {
        const map = new Map();
        for (const req of orderedRequests) {
            const lines = Array.isArray(req.lines) ? req.lines : [];
            for (const line of lines) {
                const itemCategoryId = Number(line?.itemCategoryId || 0);
                const code = line?.itemCode || `#${itemCategoryId || 'N/A'}`;
                const name = line?.itemName || 'Không rõ tên';
                const unit = line?.unit || '';
                const key = `${itemCategoryId}|${unit}|${code}`;
                const prev = map.get(key) || { itemCategoryId, code, name, unit, qty: 0 };
                prev.qty += Number(line?.qty || 0);
                map.set(key, prev);
            }
        }
        return Array.from(map.values()).sort((a, b) => String(a.code).localeCompare(String(b.code)));
    }, [orderedRequests]);

    useEffect(() => {
        if (!orderedRequests.length) {
            setBoardStage(1);
            return;
        }
        const ranks = orderedRequests.map((r) => deliveryRank(r?.deliveryStatus));
        const allAtLeast2 = ranks.every((rk) => rk >= 2);
        const allAtLeast3 = ranks.every((rk) => rk >= 3);
        if (allAtLeast3) {
            setBoardStage(3);
            return;
        }
        if (allAtLeast2) {
            setBoardStage(2);
            return;
        }
        setBoardStage(1);
    }, [orderedRequests]);

    const moveFromNewToOrdered = async (sourceId) => {
        if (!sourceId) return;
        const source = newRequests.find((r) => Number(r.id) === Number(sourceId));
        if (!source) return;

        setNewRequests((prev) => prev.filter((r) => Number(r.id) !== Number(sourceId)));
        setOrderedRequests((prev) => [...prev, source]);

        try {
            setSavingRequestId(Number(sourceId));
            // Persist to DB: once arranged by rescuer, mark as received/ready-to-handle.
            await updateRescuerReliefStatus(Number(sourceId), {
                status: 'RESCUER_RECEIVED',
                note: 'Đội đã đưa yêu cầu vào danh sách sắp xếp ưu tiên.',
            });
            setRequests((prev) => prev.map((r) => (
                Number(r.id) === Number(sourceId)
                    ? { ...r, deliveryStatus: 'RESCUER_RECEIVED', updatedAt: new Date().toISOString() }
                    : r
            )));
        } catch (e) {
            window.alert(e?.message || 'Không thể lưu trạng thái yêu cầu vào hệ thống. Đang tải lại dữ liệu.');
            await loadData();
        } finally {
            setSavingRequestId(null);
        }
    };

    const handleChangeBoardStage = async (targetStage) => {
        if (savingBoardStage) return;
        if (targetStage === boardStage) return;
        if (![1, 2, 3].includes(targetStage)) return;
        if (orderedRequests.length === 0) {
            setBoardStage(targetStage);
            return;
        }

        try {
            setSavingBoardStage(true);
            const statusByStage = {
                1: { status: 'RESCUER_RECEIVED', note: 'Cập nhật trạng thái chung: Chưa đi lấy hàng.' },
                2: { status: 'ARRIVED_WAREHOUSE', note: 'Cập nhật trạng thái chung: Đã tới kho.' },
                3: { status: 'ARRIVED_RELIEF_POINT', note: 'Cập nhật trạng thái chung: Bắt đầu giao.' },
            };
            const payload = statusByStage[targetStage];
            await Promise.all(
                orderedRequests.map((r) =>
                    updateRescuerReliefStatus(Number(r.id), payload)
                )
            );
            await loadData();
        } catch (e) {
            window.alert(e?.message || 'Không thể lưu trạng thái chung vào hệ thống.');
        } finally {
            setSavingBoardStage(false);
        }
    };

    const moveOrderedByStep = (requestId, step) => {
        setOrderedRequests((prev) => {
            const idx = prev.findIndex((r) => Number(r.id) === Number(requestId));
            if (idx < 0) return prev;
            const targetIdx = idx + step;
            if (targetIdx < 0 || targetIdx >= prev.length) return prev;
            const next = [...prev];
            const [item] = next.splice(idx, 1);
            next.splice(targetIdx, 0, item);
            return next;
        });
    };

    const getAssetLabel = (req) => {
        return req?.assignedAssetCode
            || req?.assignedAssetName
            || (req?.assignedAssetId ? `#${req.assignedAssetId}` : '—');
    };

    const handleReturnAsset = async (req) => {
        const assetId = Number(req?.assignedAssetId || 0);
        if (!assetId) {
            window.alert('Yêu cầu này chưa có phương tiện để trả.');
            return;
        }
        const confirmed = window.confirm(`Xác nhận trả phương tiện ${getAssetLabel(req)} về trạng thái sẵn sàng?`);
        if (!confirmed) return;
        try {
            setReturningAssetId(assetId);
            try {
                await updateAssetStatus(assetId, 'AVAILABLE');
            } catch {
                await updateAssetStatus(assetId, 'available');
            }
            await loadData();
            window.alert('Đã trả phương tiện thành công.');
        } catch (e) {
            window.alert(e?.message || 'Không thể trả phương tiện. Vui lòng thử lại.');
        } finally {
            setReturningAssetId(null);
        }
    };

    return (
        <div className="space-y-4">
            <Card className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Sắp xếp yêu cầu cứu trợ</h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Gợi ý thứ tự đi cứu trợ trước dựa trên mức độ ưu tiên, thời gian chờ và số người ảnh hưởng.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="primary" size="sm">{newRequests.length} mới</Badge>
                        <Badge variant="primary" size="sm">{orderedRequests.length} đã sắp xếp</Badge>
                        <Button type="button" variant="primary" onClick={loadData} disabled={loading}>
                            <RefreshCw className="h-4 w-4" />
                            Làm mới
                        </Button>
                    </div>
                </div>
            </Card>

            {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
            )}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_460px]">
                <div className="space-y-4">
                    <Card className="p-0 overflow-hidden">
                        <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
                            Yêu cầu mới
                        </div>
                        {loading ? (
                            <div className="p-6 text-sm text-slate-500">Đang tải dữ liệu...</div>
                        ) : newRequests.length === 0 ? (
                            <div className="p-6 text-sm text-slate-500">Không có yêu cầu mới.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr className="border-b border-slate-200 text-left text-slate-600">
                                            <th className="px-3 py-2 font-semibold">Mã yêu cầu</th>
                                            <th className="px-3 py-2 font-semibold">Khu vực</th>
                                            <th className="px-3 py-2 font-semibold">Mức độ</th>
                                            <th className="px-3 py-2 font-semibold">Số người</th>
                                            <th className="px-3 py-2 font-semibold">Bản đồ</th>
                                            <th className="px-3 py-2 font-semibold text-center">Chuyển</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {newRequests.map((req) => {
                                            const p = priorityLabel(req.priority);
                                            const hasCoords = Boolean(extractCoordinates(req));
                                            const isSaving = Number(savingRequestId) === Number(req.id);
                                            return (
                                                <tr
                                                    key={req.id}
                                                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                                                >
                                                    <td className="px-3 py-2 font-semibold text-slate-900">{req.code || `#${req.id}`}</td>
                                                    <td className="px-3 py-2 text-slate-700">{req.targetArea || req.citizenAddressText || '—'}</td>
                                                    <td className="px-3 py-2">
                                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.className}`}>{p.label}</span>
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-700">{req.people}</td>
                                                    <td className="px-3 py-2 text-slate-700">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedRequestId(Number(req.id));
                                                            }}
                                                            disabled={isSaving}
                                                            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                                                        >
                                                            {isSaving ? 'Đang lưu...' : hasCoords ? 'Xem map' : 'Không có tọa độ'}
                                                        </button>
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                void moveFromNewToOrdered(Number(req.id));
                                                            }}
                                                            disabled={isSaving}
                                                            className="inline-flex items-center gap-1 rounded-md border border-blue-300 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                                                        >
                                                            <ArrowDown className="h-3.5 w-3.5" />
                                                            Chuyển xuống
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>

                    <Card className="p-0 overflow-hidden">
                        <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
                            Bảng đã sắp xếp ưu tiên
                        </div>
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Trạng thái chung của bảng</div>
                            <div className="flex items-center gap-1.5 text-[11px]">
                                <button
                                    type="button"
                                    onClick={() => void handleChangeBoardStage(1)}
                                    disabled={savingBoardStage}
                                    className={`rounded-full px-2 py-0.5 ${boardStage === 1 ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'}`}
                                >
                                    {savingBoardStage && boardStage !== 1 ? 'Đang lưu...' : 'Chưa đi lấy hàng'}
                                </button>
                                <span className={`${boardStage === 2 ? 'text-blue-600' : 'text-slate-300'}`}>→</span>
                                <button
                                    type="button"
                                    onClick={() => void handleChangeBoardStage(2)}
                                    disabled={savingBoardStage}
                                    className={`rounded-full px-2 py-0.5 ${boardStage === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                                >
                                    {savingBoardStage && boardStage !== 2 ? 'Đang lưu...' : 'Đã tới kho'}
                                </button>
                                <span className={`${boardStage === 3 ? 'text-emerald-600' : 'text-slate-300'}`}>→</span>
                                <button
                                    type="button"
                                    onClick={() => void handleChangeBoardStage(3)}
                                    disabled={savingBoardStage}
                                    className={`rounded-full px-2 py-0.5 ${boardStage === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                                >
                                    {savingBoardStage && boardStage !== 3 ? 'Đang lưu...' : 'Bắt đầu giao'}
                                </button>
                            </div>
                        </div>
                        {boardStage === 2 && (
                            <div className="space-y-3 border-b border-slate-200 bg-amber-50/50 p-4">
                                <div className="text-xs font-semibold uppercase text-amber-700">
                                    Thống kê hàng cần lấy ở kho
                                </div>

                                <div className="rounded-lg border border-amber-200 bg-white p-3">
                                    <div className="mb-2 text-sm font-semibold text-slate-900">Theo từng yêu cầu</div>
                                    {warehouseNeedByRequest.length === 0 ? (
                                        <div className="text-sm text-slate-500">Chưa có yêu cầu trong bảng đã sắp xếp.</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {warehouseNeedByRequest.map((req) => (
                                                <div key={req.requestId} className="rounded-md border border-slate-200 p-2">
                                                    <div className="text-xs font-semibold text-slate-700">
                                                        Task: {req.taskCode} | Phiếu xuất: {req.issueCode}
                                                    </div>
                                                    <div className="mt-0.5 text-xs text-slate-500">
                                                        {req.area}
                                                    </div>
                                                    {req.lines.length === 0 ? (
                                                        <div className="mt-1 text-xs text-slate-500">Không có danh sách hàng.</div>
                                                    ) : (
                                                        <div className="mt-1 text-xs text-slate-600">
                                                            {req.lines.map((line) => `${line.itemCode || line.itemName}: ${formatQty(line.qty)} ${line.unit || ''}`).join(' | ')}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-lg border border-amber-200 bg-white p-3">
                                    <div className="mb-2 text-sm font-semibold text-slate-900">Bảng tổng cần lấy ở kho</div>
                                    {warehouseNeedTotal.length === 0 ? (
                                        <div className="text-sm text-slate-500">Không có dữ liệu tổng hợp hàng cần lấy.</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-slate-200 text-left text-slate-600">
                                                        <th className="px-2 py-2 font-semibold">Mã hàng</th>
                                                        <th className="px-2 py-2 font-semibold">Tên hàng</th>
                                                        <th className="px-2 py-2 font-semibold text-right">Tổng SL cần lấy</th>
                                                        <th className="px-2 py-2 font-semibold">Đơn vị</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {warehouseNeedTotal.map((row) => (
                                                        <tr key={`${row.itemCategoryId}-${row.unit}-${row.code}`} className="border-b border-slate-100 last:border-0">
                                                            <td className="px-2 py-2 font-semibold text-slate-900">{row.code}</td>
                                                            <td className="px-2 py-2 text-slate-700">{row.name}</td>
                                                            <td className="px-2 py-2 text-right font-semibold text-blue-700">{formatQty(row.qty)}</td>
                                                            <td className="px-2 py-2 text-slate-700">{row.unit || '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {loading ? (
                            <div className="p-6 text-sm text-slate-500">Đang tải dữ liệu...</div>
                        ) : orderedRequests.length === 0 ? (
                            <div className="p-6 text-sm text-slate-500">Chưa có yêu cầu nào trong bảng đã sắp xếp.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr className="border-b border-slate-200 text-left text-slate-600">
                                            <th className="px-3 py-3 font-semibold">Thứ tự</th>
                                            <th className="px-3 py-3 font-semibold">Mã yêu cầu</th>
                                            <th className="px-3 py-3 font-semibold">Khu vực</th>
                                            <th className="px-3 py-3 font-semibold">Mức độ</th>
                                            <th className="px-3 py-3 font-semibold">Số người</th>
                                            <th className="px-3 py-3 font-semibold">Chờ xử lý</th>
                                            <th className="px-3 py-3 font-semibold">Phương tiện</th>
                                            <th className="px-3 py-3 font-semibold">Bản đồ</th>
                                            <th className="px-3 py-3 text-center font-semibold">Sắp xếp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orderedRequests.map((req, idx) => {
                                            const p = priorityLabel(req.priority);
                                            const hasCoords = Boolean(extractCoordinates(req));
                                            return (
                                                <tr
                                                    key={req.id}
                                                    onClick={() => navigate(RESCUER_ROUTES.RELIEF_PRIORITIZE_DETAIL.replace(':id', String(req.id)))}
                                                    className={`cursor-pointer border-b border-slate-100 last:border-0 ${idx === 0 ? 'bg-rose-50/50' : 'hover:bg-slate-50'}`}
                                                >
                                                    <td className="px-3 py-3">
                                                        <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold ${idx === 0 ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                                            {idx + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 font-semibold text-slate-900">{req.code || `#${req.id}`}</td>
                                                    <td className="px-3 py-3 text-slate-700">{req.targetArea || req.citizenAddressText || '—'}</td>
                                                    <td className="px-3 py-3">
                                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.className}`}>{p.label}</span>
                                                    </td>
                                                    <td className="px-3 py-3 text-slate-700">{req.people}</td>
                                                    <td className="px-3 py-3 text-slate-700">{formatWaiting(req.waiting)}</td>
                                                    <td className="px-3 py-3 text-slate-700">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs">{getAssetLabel(req)}</span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    void handleReturnAsset(req);
                                                                }}
                                                                disabled={!req?.assignedAssetId || Number(returningAssetId) === Number(req?.assignedAssetId)}
                                                                className="inline-flex w-fit items-center rounded-md border border-emerald-300 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                                                            >
                                                                {Number(returningAssetId) === Number(req?.assignedAssetId) ? 'Đang trả...' : 'Trả phương tiện'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-slate-700">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedRequestId(Number(req.id));
                                                            }}
                                                            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                                        >
                                                            {hasCoords ? 'Xem map' : 'Không có tọa độ'}
                                                        </button>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    moveOrderedByStep(req.id, -1);
                                                                }}
                                                                disabled={idx === 0}
                                                                className="rounded-md border border-slate-300 p-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                                                            >
                                                                <ChevronUp className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    moveOrderedByStep(req.id, 1);
                                                                }}
                                                                disabled={idx === orderedRequests.length - 1}
                                                                className="rounded-md border border-slate-300 p-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                                                            >
                                                                <ChevronDown className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>

                <Card className="p-0 overflow-hidden">
                    <div className="border-b border-slate-200 px-4 py-3">
                        <div className="text-sm font-semibold text-slate-900">Bản đồ yêu cầu đã chọn</div>
                        <div className="mt-1 text-xs text-slate-500">
                            {selectedRequest ? `${selectedRequest.code || `#${selectedRequest.id}`} - ${selectedRequest.targetArea || selectedRequest.citizenAddressText || 'Chưa có địa chỉ'}` : 'Chưa chọn yêu cầu'}
                        </div>
                    </div>
                    <div className="h-[540px]">
                        <GoogleMap
                            center={selectedCoords || { lat: 10.8231, lng: 106.6297 }}
                            markerPosition={selectedCoords || null}
                            zoom={selectedCoords ? 15 : 11}
                        />
                    </div>
                </Card>
            </div>
        </div>
    );
}
