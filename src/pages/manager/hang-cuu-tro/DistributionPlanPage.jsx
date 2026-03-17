import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, MapPin, Navigation, ShieldAlert, Truck, Users } from 'lucide-react';
import { getTeams } from '../../../features/teams/api.js';
import { getAssets } from '../../../features/assets/api.js';
import { assignDistributionTask, listDistributionVouchers } from '../../../features/relief/apiDistribution.js';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

function parseList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

function parseDateValue(value) {
    if (!value) return 0;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function normalizeDistribution(dist, idx = 0) {
    const id = dist?.id ?? dist?.distributionId ?? idx + 1;
    const code = dist?.code || dist?.distributionCode || `PPH-${id}`;
    const requestCode = dist?.reliefRequestCode || dist?.requestCode || '';
    const receiverName = dist?.receiverName || dist?.contactName || 'Chưa cập nhật';
    const receiverPhone = dist?.receiverPhone || dist?.contactPhone || 'N/A';
    const deliveryAddress = dist?.deliveryAddress || dist?.targetAreaName || dist?.targetArea || dist?.area || 'Chưa cập nhật địa chỉ';
    const priority = dist?.priority || 'TRUNG_BINH';
    const status = String(dist?.status || 'PLANNED').toUpperCase();
    const eta = dist?.eta || dist?.plannedAt || null;
    const createdAt = dist?.createdAt || dist?.createdDate || dist?.createdTime || null;
    const lines = parseList(dist?.lines);

    return {
        id,
        code,
        requestCode,
        receiverName,
        receiverPhone,
        deliveryAddress,
        priority,
        status,
        eta,
        createdAt,
        createdAtTs: parseDateValue(createdAt),
        teamId: dist?.teamId ?? dist?.assignedTeamId ?? null,
        assetId: dist?.assetId ?? null,
        lines,
    };
}

function normalizeTeam(team, idx = 0) {
    const id = team?.id ?? team?.teamId ?? idx + 1;
    const name = team?.name || team?.teamName || `Doi ${id}`;
    const members = team?.memberCount ?? team?.members ?? 0;
    const statusRaw = String(team?.status || team?.availability || '').toUpperCase();
    const isAvailable = ['AVAILABLE', 'READY', 'IDLE', 'STANDBY', 'RANH', 'ACTIVE', ''].includes(statusRaw);

    return {
        id,
        name,
        members,
        statusLabel: isAvailable ? 'Sẵn sàng' : 'Đang bận',
        isAvailable,
    };
}

function normalizeAsset(asset, idx = 0) {
    const id = asset?.id ?? asset?.assetId ?? idx + 1;
    const code = asset?.code || asset?.assetCode || `PT-${id}`;
    const name = asset?.name || asset?.type || asset?.assetType || `Phuong tien ${id}`;
    const statusRaw = String(asset?.status || '').toUpperCase();
    const isAvailable = ['AVAILABLE', 'READY', 'IDLE', 'STANDBY', 'RANH', 'ACTIVE', ''].includes(statusRaw);

    return {
        id,
        code,
        name,
        isAvailable,
        statusLabel: isAvailable ? 'Sẵn sàng' : 'Không khả dụng',
    };
}

export default function DistributionPlanPage() {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [distributions, setDistributions] = useState([]);
    const [teams, setTeams] = useState([]);
    const [assets, setAssets] = useState([]);

    const [selectedDistributionId, setSelectedDistributionId] = useState(null);
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [selectedAssetId, setSelectedAssetId] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError('');

                const [distRes, teamRes, assetRes] = await Promise.allSettled([
                    listDistributionVouchers({ status: 'PLANNED', size: 100 }),
                    getTeams(),
                    getAssets(),
                ]);

                const distList = distRes.status === 'fulfilled' ? parseList(distRes.value) : [];
                const teamList = teamRes.status === 'fulfilled' ? parseList(teamRes.value) : [];
                const assetList = assetRes.status === 'fulfilled' ? parseList(assetRes.value) : [];

                const normalizedDist = distList
                    .map((dist, idx) => normalizeDistribution(dist, idx))
                    .sort((a, b) => {
                        if (a.createdAtTs !== b.createdAtTs) return b.createdAtTs - a.createdAtTs;
                        return String(b.code).localeCompare(String(a.code));
                    });

                const normalizedTeams = teamList.map((team, idx) => normalizeTeam(team, idx));
                const normalizedAssets = assetList.map((asset, idx) => normalizeAsset(asset, idx));

                setDistributions(normalizedDist);
                setTeams(normalizedTeams);
                setAssets(normalizedAssets);

                if (normalizedDist.length > 0) {
                    const first = normalizedDist[0];
                    setSelectedDistributionId(first.id);
                    setSelectedTeamId(first.teamId);
                    setSelectedAssetId(first.assetId);
                }
            } catch (e) {
                setError(e?.message || 'Không thể tải dữ liệu điều phối');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        if (!selectedDistributionId) return;

        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

        const map = new mapboxgl.Map({
            container: 'plan-map-container',
            style: 'mapbox://styles/mapbox/light-v11',
            center: [105.8544, 21.0285],
            zoom: 12,
            interactive: false
        });

        new mapboxgl.Marker({ color: '#2563eb' })
            .setLngLat([105.80, 21.0])
            .addTo(map);

        new mapboxgl.Marker({ color: '#e11d48' })
            .setLngLat([105.90, 21.05])
            .addTo(map);

        return () => map.remove();
    }, [selectedDistributionId]);

    const selectedDistribution = useMemo(
        () => distributions.find((dist) => dist.id === selectedDistributionId) || null,
        [distributions, selectedDistributionId]
    );

    const availableTeams = useMemo(() => teams.filter((team) => team.isAvailable || team.id === selectedTeamId), [teams, selectedTeamId]);
    const availableAssets = useMemo(() => assets.filter((asset) => asset.isAvailable || asset.id === selectedAssetId), [assets, selectedAssetId]);

    const handleSelectDistribution = (dist) => {
        setSelectedDistributionId(dist.id);
        setSelectedTeamId(dist.teamId);
        setSelectedAssetId(dist.assetId);
    };

    const handleAssignTask = async () => {
        if (!selectedDistribution) {
            setError('Vui lòng chọn phiếu điều phối.');
            return;
        }
        if (!selectedTeamId) {
            setError('Vui lòng chọn đội giao hàng.');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            const payload = {
                teamId: Number(selectedTeamId),
                assetId: selectedAssetId ? Number(selectedAssetId) : undefined,
                status: 'ASSIGNED',
            };

            await assignDistributionTask(selectedDistribution.id, payload);
            window.alert('Đã gán nhiệm vụ thành công.');

            setDistributions((prev) =>
                prev.map((dist) =>
                    dist.id === selectedDistribution.id
                        ? {
                            ...dist,
                            teamId: Number(selectedTeamId),
                            assetId: selectedAssetId ? Number(selectedAssetId) : null,
                            status: 'ASSIGNED',
                        }
                        : dist
                )
            );
        } catch (e) {
            setError(e?.message || 'Không thể gán nhiệm vụ.');
        } finally {
            setSubmitting(false);
        }
    };

    const etaDisplay = selectedDistribution?.eta
        ? new Date(selectedDistribution.eta).toLocaleString('vi-VN')
        : 'Chưa có';

    return (
        <div className="space-y-4">
            <div className="text-xs text-slate-500">
                Điều phối / <span className="font-semibold text-slate-700">Gán nhiệm vụ</span>
            </div>

            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Gán Nhiệm Vụ Giao Hàng Cứu Trợ</h1>
                <p className="mt-1 text-sm text-slate-500">Điều phối đội ngũ và phương tiện vận chuyển đến điểm giao hàng</p>
            </div>

            {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4">
                    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <h2 className="text-sm font-semibold text-slate-900">Danh sách phiếu điều phối</h2>
                            <span className="text-xs font-semibold text-blue-600">{distributions.length} phiếu</span>
                        </div>
                        <div className="max-h-64 space-y-1 overflow-auto p-2">
                            {loading ? (
                                <p className="px-3 py-2 text-sm text-slate-500">Đang tải...</p>
                            ) : distributions.length === 0 ? (
                                <p className="px-3 py-2 text-sm text-slate-500">Không có phiếu điều phối nào.</p>
                            ) : (
                                distributions.map((dist) => (
                                    <button
                                        key={dist.id}
                                        type="button"
                                        onClick={() => handleSelectDistribution(dist)}
                                        className={`w-full rounded-lg px-3 py-2 text-left transition ${
                                            dist.id === selectedDistributionId ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <p className="text-sm font-semibold text-slate-800">{dist.code}</p>
                                        <p className="mt-1 text-xs text-slate-500">{dist.requestCode || 'Không có mã yêu cầu'}</p>
                                    </button>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            Thông tin điểm giao hàng
                        </h2>
                        {selectedDistribution ? (
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Địa điểm đích</p>
                                    <p className="mt-1 font-medium text-slate-800">{selectedDistribution.deliveryAddress}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-wide text-slate-400">Người nhận</p>
                                        <p className="mt-1 font-medium text-slate-700">{selectedDistribution.receiverName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] uppercase tracking-wide text-slate-400">Mức độ ưu tiên</p>
                                        <p className="mt-1 font-semibold text-rose-600">{selectedDistribution.priority}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-wide text-slate-400">ETA</p>
                                    <p className="mt-1 font-medium text-slate-700">{etaDisplay}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">Chọn phiếu điều phối để xem thông tin.</p>
                        )}
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <h2 className="text-sm font-semibold text-slate-900">Danh sách Đội Cứu Hộ</h2>
                            <span className="text-xs font-semibold text-blue-600">{availableTeams.length} đội khả dụng</span>
                        </div>
                        <div className="space-y-1 p-2">
                            {availableTeams.map((team) => (
                                <button
                                    key={team.id}
                                    type="button"
                                    onClick={() => setSelectedTeamId(team.id)}
                                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                                        selectedTeamId === team.id ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
                                    }`}
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{team.name}</p>
                                        <p className="mt-1 text-xs text-slate-500">{team.members} thành viên</p>
                                    </div>
                                    <span className={`text-xs font-semibold ${team.isAvailable ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        {team.statusLabel}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-4 py-3">
                            <h2 className="text-sm font-semibold text-slate-900">Phương tiện khả dụng</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-3">
                            {availableAssets.map((vehicle) => (
                                <button
                                    key={vehicle.id}
                                    type="button"
                                    onClick={() => setSelectedAssetId(vehicle.id)}
                                    className={`rounded-lg border p-3 text-left transition ${
                                        selectedAssetId === vehicle.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <Truck className="h-4 w-4" />
                                        <span className="text-xs font-semibold">{vehicle.statusLabel}</span>
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-slate-800">{vehicle.name}</p>
                                    <p className="text-xs text-slate-500">ID: {vehicle.code}</p>
                                </button>
                            ))}
                        </div>
                    </section>

                    <button
                        type="button"
                        disabled={submitting || !selectedDistribution}
                        onClick={handleAssignTask}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <ShieldAlert className="h-4 w-4" />
                        {submitting ? 'Đang gán...' : 'Gán nhiệm vụ giao hàng'}
                    </button>
                </div>

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Navigation className="h-4 w-4 text-blue-600" />
                            Bản đồ lộ trình cứu trợ
                        </h2>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>Trạng thái: <span className="font-semibold text-slate-700">{selectedDistribution?.status || 'N/A'}</span></span>
                            <span className="flex items-center gap-1">
                                <Clock3 className="h-3.5 w-3.5" />
                                ETA: <span className="font-semibold text-slate-700">{etaDisplay}</span>
                            </span>
                        </div>
                    </div>

                    <div id="plan-map-container" className="relative h-[360px] overflow-hidden rounded-b-xl border-b border-slate-100" />

                    <div className="p-4">
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Users className="h-4 w-4 text-blue-600" />
                            Danh sách hàng điều phối
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[520px] text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                                        <th className="py-2">Item category</th>
                                        <th className="py-2 text-right">Số lượng</th>
                                        <th className="py-2">Đơn vị</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(selectedDistribution?.lines || []).map((line, idx) => (
                                        <tr key={`${line?.id || idx}`}>
                                            <td className="py-2 text-slate-700">{line?.itemName || line?.itemCode || `Item #${line?.itemCategoryId || idx + 1}`}</td>
                                            <td className="py-2 text-right font-medium text-slate-800">{Number(line?.qty || 0).toLocaleString('vi-VN')}</td>
                                            <td className="py-2 text-slate-600">{line?.unit || '-'}</td>
                                        </tr>
                                    ))}
                                    {(selectedDistribution?.lines || []).length === 0 && (
                                        <tr>
                                            <td className="py-3 text-slate-500" colSpan={3}>
                                                Không có dòng hàng nào.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
