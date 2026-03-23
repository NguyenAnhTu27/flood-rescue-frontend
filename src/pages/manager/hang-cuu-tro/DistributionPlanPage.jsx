import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, MapPin, Navigation, ShieldAlert, Truck, Users } from 'lucide-react';
import { getTeams } from '../../../features/teams/api.js';
import { getAssets } from '../../../features/assets/api.js';
import { assignDistributionTask, listDistributionVouchers } from '../../../features/relief/apiDistribution.js';

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
    const receiverName = dist?.receiverName || dist?.contactName || 'Chua cap nhat';
    const receiverPhone = dist?.receiverPhone || dist?.contactPhone || 'N/A';
    const deliveryAddress = dist?.deliveryAddress || dist?.targetAreaName || dist?.targetArea || dist?.area || 'Chua cap nhat dia chi';
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
    const isAvailable =
        statusRaw.includes('AVAILABLE') ||
        statusRaw.includes('READY') ||
        statusRaw.includes('IDLE') ||
        statusRaw.includes('RANH') ||
        statusRaw === '';

    return {
        id,
        name,
        members,
        statusLabel: isAvailable ? 'San sang' : 'Dang ban',
        isAvailable,
    };
}

function normalizeAsset(asset, idx = 0) {
    const id = asset?.id ?? asset?.assetId ?? idx + 1;
    const code = asset?.code || asset?.assetCode || `PT-${id}`;
    const name = asset?.name || asset?.type || asset?.assetType || `Phuong tien ${id}`;
    const statusRaw = String(asset?.status || '').toUpperCase();
    const isAvailable =
        statusRaw.includes('AVAILABLE') ||
        statusRaw.includes('READY') ||
        statusRaw.includes('IDLE') ||
        statusRaw === '';

    return {
        id,
        code,
        name,
        isAvailable,
        statusLabel: isAvailable ? 'San sang' : 'Khong kha dung',
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
                    listDistributionVouchers({ size: 100 }),
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
                setError(e?.message || 'Khong the tai du lieu dieu phoi');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

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
            setError('Vui long chon phieu dieu phoi.');
            return;
        }
        if (!selectedTeamId) {
            setError('Vui long chon doi giao hang.');
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
            window.alert('Da gan nhiem vu thanh cong.');

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
            setError(e?.message || 'Khong the gan nhiem vu.');
        } finally {
            setSubmitting(false);
        }
    };

    const etaDisplay = selectedDistribution?.eta
        ? new Date(selectedDistribution.eta).toLocaleString('vi-VN')
        : 'Chua co';

    return (
        <div className="space-y-4">
            <div className="text-xs text-slate-500">
                Dieu phoi / <span className="font-semibold text-slate-700">Gan nhiem vu</span>
            </div>

            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Gan Nhiem vu Giao hang Cuu tro</h1>
                <p className="mt-1 text-sm text-slate-500">Dieu phoi doi ngu va phuong tien van chuyen den diem giao hang</p>
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
                            <h2 className="text-sm font-semibold text-slate-900">Danh sach phieu dieu phoi</h2>
                            <span className="text-xs font-semibold text-blue-600">{distributions.length} phieu</span>
                        </div>
                        <div className="max-h-64 space-y-1 overflow-auto p-2">
                            {loading ? (
                                <p className="px-3 py-2 text-sm text-slate-500">Dang tai...</p>
                            ) : distributions.length === 0 ? (
                                <p className="px-3 py-2 text-sm text-slate-500">Khong co phieu dieu phoi nao.</p>
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
                                        <p className="mt-1 text-xs text-slate-500">{dist.requestCode || 'Khong co ma yeu cau'}</p>
                                    </button>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            Thong tin diem giao hang
                        </h2>
                        {selectedDistribution ? (
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Dia diem dich</p>
                                    <p className="mt-1 font-medium text-slate-800">{selectedDistribution.deliveryAddress}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-wide text-slate-400">Nguoi nhan</p>
                                        <p className="mt-1 font-medium text-slate-700">{selectedDistribution.receiverName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] uppercase tracking-wide text-slate-400">Muc do uu tien</p>
                                        <p className="mt-1 font-semibold text-rose-600">{selectedDistribution.priority}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-wide text-slate-400">ETA</p>
                                    <p className="mt-1 font-medium text-slate-700">{etaDisplay}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">Chon phieu dieu phoi de xem thong tin.</p>
                        )}
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <h2 className="text-sm font-semibold text-slate-900">Danh sach Rescue Team</h2>
                            <span className="text-xs font-semibold text-blue-600">{availableTeams.length} doi kha dung</span>
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
                                        <p className="mt-1 text-xs text-slate-500">{team.members} thanh vien</p>
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
                            <h2 className="text-sm font-semibold text-slate-900">Phuong tien kha dung</h2>
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
                        {submitting ? 'Dang gan...' : 'Gan nhiem vu giao hang'}
                    </button>
                </div>

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Navigation className="h-4 w-4 text-blue-600" />
                            Ban do lo trinh cuu tro
                        </h2>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>Trang thai: <span className="font-semibold text-slate-700">{selectedDistribution?.status || 'N/A'}</span></span>
                            <span className="flex items-center gap-1">
                                <Clock3 className="h-3.5 w-3.5" />
                                ETA: <span className="font-semibold text-slate-700">{etaDisplay}</span>
                            </span>
                        </div>
                    </div>

                    <div className="relative h-[360px] overflow-hidden rounded-b-xl border-b border-slate-100">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#dbeafe,transparent_40%),radial-gradient(circle_at_80%_70%,#bfdbfe,transparent_45%),linear-gradient(135deg,#e2e8f0_0%,#cbd5e1_35%,#dbeafe_100%)]" />
                        <div className="absolute inset-0 opacity-30 [background-size:28px_28px] [background-image:linear-gradient(to_right,#94a3b8_1px,transparent_1px),linear-gradient(to_bottom,#94a3b8_1px,transparent_1px)]" />
                        <div className="absolute left-[24%] top-[62%] rounded-full bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white shadow">Kho trung tam</div>
                        <div className="absolute left-[62%] top-[48%] rounded-full bg-rose-500 px-2 py-1 text-[10px] font-semibold text-white shadow">Diem giao</div>
                        <div className="absolute left-[31%] top-[58%] h-[2px] w-[28%] -rotate-[18deg] bg-blue-600/70" />
                        <div className="absolute left-[56%] top-[51%] h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
                        <div className="absolute left-[30%] top-[60%] h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                        <div className="absolute bottom-5 left-5 rounded-md bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow">
                            {selectedDistribution?.priority || 'TRUNG_BINH'}
                        </div>
                    </div>

                    <div className="p-4">
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Users className="h-4 w-4 text-blue-600" />
                            Danh sach hang dieu phoi
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[520px] text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                                        <th className="py-2">Item category</th>
                                        <th className="py-2 text-right">So luong</th>
                                        <th className="py-2">Don vi</th>
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
                                                Khong co dong hang nao.
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
