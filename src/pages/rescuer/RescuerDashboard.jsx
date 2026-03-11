import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Clock, AlertTriangle, MoreHorizontal, Users as UsersIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Card from '../../shared/ui/Card.jsx';
import Button from '../../shared/ui/Button.jsx';
import Badge from '../../shared/ui/Badge.jsx';
import MissionMapView from '../../features/map/components/MissionMapView.jsx';
import { getRescuerDashboard, getRescuerTaskGroupById } from '../../features/rescuer/api.js';
import { RESCUER_ROUTES } from '../../app/routes/route.constants.js';

function normalizeTeamStatus(statusRaw) {
    const s = String(statusRaw || '').toUpperCase();
    if (s === 'AVAILABLE' || s === 'FREE' || s === 'IDLE') {
        return { label: 'Rảnh', variant: 'success' };
    }
    if (s === 'BUSY') {
        return { label: 'Bận', variant: 'warning' };
    }
    if (s === 'IN_PROGRESS' || s === 'ON_MISSION' || s === 'WORKING') {
        return { label: 'Đang thực hiện nhiệm vụ', variant: 'warning' };
    }
    if (!s) return { label: 'Chưa rõ', variant: 'default' };
    return { label: statusRaw, variant: 'default' };
}

function normalizeMissionStatus(statusRaw) {
    const s = String(statusRaw || '').toUpperCase();
    if (s === 'IN_PROGRESS') return { label: 'Đang làm nhiệm vụ', color: 'bg-amber-100 text-amber-800' };
    if (s === 'ASSIGNED') return { label: 'Đã phân công', color: 'bg-sky-100 text-sky-700' };
    if (s === 'NEW') return { label: 'Mới phân công', color: 'bg-slate-100 text-slate-700' };
    if (s === 'DONE' || s === 'COMPLETED') return { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' };
    if (s === 'CANCELLED') return { label: 'Đã huỷ', color: 'bg-red-100 text-red-700' };
    if (!s) return { label: 'Chưa rõ', color: 'bg-slate-100 text-slate-700' };
    return { label: statusRaw, color: 'bg-slate-100 text-slate-700' };
}

function pickFirstTruthy(...vals) {
    for (const v of vals) {
        if (v !== undefined && v !== null && String(v).trim() !== '') return v;
    }
    return null;
}

function toNumberOrNull(v) {
    if (v === undefined || v === null) return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    const s = String(v).trim();
    if (!s) return null;
    // Handle comma decimal: "16,0544" -> "16.0544"
    const normalized = s.replace(',', '.');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
}

function toArray(v) {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
}

function extractAssetsFromTaskGroup(tg) {
    // Try common shapes from BE
    const assets = [
        ...toArray(tg?.assets),
        ...toArray(tg?.assignedAssets),
        ...toArray(tg?.vehicles),
        ...toArray(tg?.assignedVehicles),
        ...toArray(tg?.asset),
        ...toArray(tg?.assignedAsset),
        ...toArray(tg?.vehicle),
        ...toArray(tg?.assignedVehicle),
    ].filter(Boolean);

    // Sometimes asset is nested inside assignments/resources
    const assignments = toArray(tg?.assignments).concat(toArray(tg?.taskAssignments)).filter(Boolean);
    for (const a of assignments) {
        const nested = pickFirstTruthy(a?.asset, a?.assignedAsset, a?.vehicle, a?.assignedVehicle);
        if (nested) assets.push(nested);

        // Some BEs flatten assignment fields (assetName/assetCode/assetId) instead of nesting objects
        const flatName = pickFirstTruthy(a?.assetName, a?.assignedAssetName, a?.vehicleName, a?.assignedVehicleName);
        const flatCode = pickFirstTruthy(a?.assetCode, a?.assignedAssetCode, a?.vehicleCode, a?.assignedVehicleCode, a?.licensePlate);
        const flatId = pickFirstTruthy(a?.assetId, a?.assignedAssetId, a?.vehicleId, a?.assignedVehicleId);
        if (flatName || flatCode || flatId) {
            assets.push({
                id: flatId,
                name: flatName,
                code: flatCode,
                assetName: flatName,
                assetCode: flatCode,
                licensePlate: a?.licensePlate,
            });
        }
    }

    // Deduplicate by id/code/name if possible
    const seen = new Set();
    return assets.filter((x) => {
        const key = String(
            pickFirstTruthy(x?.id, x?.assetId, x?.code, x?.assetCode, x?.name, x?.licensePlate) || ''
        );
        if (!key) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function mergePreferDetail(base, detail) {
    if (!detail || typeof detail !== 'object') return base;
    const out = { ...(base || {}) };
    for (const [k, v] of Object.entries(detail)) {
        if (v === undefined || v === null) continue;
        out[k] = v;
    }
    return out;
}

function normalizeDashboardResponse(raw) {
    const data = raw || {};

    const team =
        data.team ||
        data.rescueTeam ||
        data.myTeam ||
        (data.data && (data.data.team || data.data.rescueTeam)) ||
        null;

    const listCandidate =
        data.taskGroups ||
        data.missions ||
        data.assignments ||
        data.currentTaskGroups ||
        data.items ||
        data.content ||
        [];

    const list = Array.isArray(listCandidate) ? listCandidate : [];

    const missions = list.map((tg) => {
        const id = pickFirstTruthy(tg?.id, tg?.taskGroupId, tg?.groupId);
        const rescueRequests =
            tg?.rescueRequests ||
            tg?.requests ||
            tg?.rescueRequestList ||
            tg?.rescueRequestDtos ||
            tg?.rescueRequestDTOs ||
            tg?.rescueRequestDetails ||
            tg?.rescueRequestDetailList ||
            [];

        const rescueRequestIds =
            tg?.rescueRequestIds ||
            tg?.requestIds ||
            tg?.rescueRequestsIds ||
            tg?.rescue_request_ids ||
            [];

        const rr0 = Array.isArray(rescueRequests) ? rescueRequests[0] : null;

        const lat = pickFirstTruthy(
            tg?.latitude,
            tg?.lat,
            tg?.location?.latitude,
            tg?.location?.lat,
            tg?.locationLatitude,
            tg?.locationLat,
            rr0?.latitude,
            rr0?.lat,
            rr0?.location?.latitude,
            rr0?.location?.lat,
            rr0?.locationLatitude,
            rr0?.locationLat
        );
        const lng = pickFirstTruthy(
            tg?.longitude,
            tg?.lng,
            tg?.location?.longitude,
            tg?.location?.lng,
            tg?.locationLongitude,
            tg?.locationLng,
            rr0?.longitude,
            rr0?.lng,
            rr0?.location?.longitude,
            rr0?.location?.lng,
            rr0?.locationLongitude,
            rr0?.locationLng
        );

        const affectedPeople =
            Array.isArray(rescueRequests) && rescueRequests.length
                ? rescueRequests.reduce((sum, r) => {
                    const n = Number(pickFirstTruthy(r?.affectedPeopleCount, r?.peopleCount, r?.numberOfPeople, 0));
                    return sum + (Number.isFinite(n) ? n : 0);
                }, 0)
                : Number(pickFirstTruthy(tg?.affectedPeopleCount, tg?.peopleCount, tg?.numberOfPeople, 0)) || 0;

        const countRequests = Array.isArray(rescueRequests) && rescueRequests.length
            ? rescueRequests.length
            : Array.isArray(rescueRequestIds)
                ? rescueRequestIds.length
                : 0;
        const title = countRequests > 0 ? `${countRequests} yêu cầu cứu hộ` : 'Nhiệm vụ cứu hộ';

        const address = pickFirstTruthy(
            tg?.addressText,
            tg?.address,
            tg?.locationText,
            tg?.location?.addressText,
            tg?.location?.address,
            tg?.location?.fullAddress,
            tg?.fullAddress,
            tg?.detailAddress,
            rr0?.addressText,
            rr0?.address,
            rr0?.locationText,
            rr0?.location?.addressText,
            rr0?.location?.address,
            rr0?.location?.fullAddress,
            rr0?.fullAddress,
            rr0?.detailAddress,
            rr0?.locationName,
            tg?.locationName
        );

        const statusInfo = normalizeMissionStatus(pickFirstTruthy(tg?.status, tg?.taskGroupStatus));

        const danger = Boolean(
            pickFirstTruthy(
                tg?.danger,
                tg?.isDangerous,
                rr0?.danger,
                rr0?.isDangerous,
                tg?.priority === 'HIGH',
                rr0?.priority === 'HIGH'
            )
        );

        // Mã nhiệm vụ: chỉ lấy từ dữ liệu thực BE (không tự generate cứng)
        const codeFromBe = pickFirstTruthy(
            rr0?.code,
            rr0?.requestCode,
            rr0?.rescueRequestCode,
            rr0?.citizenRequestCode,
            tg?.code,
            tg?.taskGroupCode,
            tg?.name
        );
        const code = codeFromBe ? String(codeFromBe) : '';

        // "type" tag in UI: derive from status
        const type =
            String(pickFirstTruthy(tg?.status, tg?.taskGroupStatus) || '').toUpperCase() === 'IN_PROGRESS'
                ? 'TẠI HIỆN TRƯỜNG'
                : String(pickFirstTruthy(tg?.status, tg?.taskGroupStatus) || '').toUpperCase() === 'ASSIGNED'
                    ? 'ĐANG DI CHUYỂN'
                    : 'MỚI PHÂN CÔNG';

        const typeColor =
            type === 'TẠI HIỆN TRƯỜNG'
                ? 'bg-emerald-100 text-emerald-700'
                : type === 'ĐANG DI CHUYỂN'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-700';

        const statusDotColor =
            String(pickFirstTruthy(tg?.status, tg?.taskGroupStatus) || '').toUpperCase() === 'IN_PROGRESS'
                ? 'bg-emerald-500'
                : String(pickFirstTruthy(tg?.status, tg?.taskGroupStatus) || '').toUpperCase() === 'ASSIGNED'
                    ? 'bg-blue-500'
                    : String(pickFirstTruthy(tg?.status, tg?.taskGroupStatus) || '').toUpperCase() === 'NEW'
                        ? 'bg-slate-500'
                        : 'bg-emerald-500';

        const assets = extractAssetsFromTaskGroup(tg);
        const assetNameFromTg = pickFirstTruthy(
            tg?.assetName,
            tg?.vehicleName,
            tg?.asset?.name,
            tg?.vehicle?.name,
            tg?.assignedAsset?.name,
            tg?.assignedVehicle?.name
        );
        const assetName = assetNameFromTg
            ? String(assetNameFromTg)
            : assets.length
                ? assets
                    .map((a) =>
                        pickFirstTruthy(a?.name, a?.assetName, a?.code, a?.assetCode, a?.licensePlate)
                    )
                    .filter(Boolean)
                    .join(', ')
                : '';

        return {
            id: id || Math.random().toString(36).slice(2),
            code: code,
            title,
            type,
            typeColor,
            danger,
            address: address ? String(address) : '',
            latitude: toNumberOrNull(lat),
            longitude: toNumberOrNull(lng),
            peopleCount: affectedPeople,
            assetName,
            statusDotColor,
            statusLabel: statusInfo.label,
            statusColor: statusInfo.color,
            raw: tg,
        };
    });

    const teamName = pickFirstTruthy(team?.name, data.teamName, data.rescueTeamName) || 'Đội cứu hộ';
    const area = pickFirstTruthy(team?.area, team?.operationArea, data.area, data.operationArea);
    const memberCount = pickFirstTruthy(team?.memberCount, team?.membersCount, team?.members?.length);
    const teamStatus = normalizeTeamStatus(pickFirstTruthy(team?.status, data.teamStatus));

    const activeTaskGroups = Number(pickFirstTruthy(data.activeTaskGroups, data.totalActiveTaskGroups, missions.length));
    const activeAssignments = Number(pickFirstTruthy(data.activeAssignments, data.totalActiveAssignments));

    return {
        team: {
            name: String(teamName),
            area: area ? String(area) : null,
            memberCount: memberCount !== null ? Number(memberCount) : null,
            status: teamStatus,
        },
        stats: {
            activeTaskGroups: Number.isFinite(activeTaskGroups) ? activeTaskGroups : missions.length,
            activeAssignments: Number.isFinite(activeAssignments) ? activeAssignments : null,
        },
        missions,
    };
}

export default function RescuerDashboard() {
    const navigate = useNavigate();
    const [rawDashboard, setRawDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
    const mountedRef = useRef(true);

    const loadDashboard = useCallback(async () => {
        try {
            if (mountedRef.current) {
                setLoading(true);
                setError('');
            }

            const resp = await getRescuerDashboard();
            if (!mountedRef.current) return;

            // Enrich: dashboard list often has requests/assignments null -> fetch detail by id
            const taskGroups = Array.isArray(resp?.taskGroups) ? resp.taskGroups : [];
            const needDetailIds = taskGroups
                .filter((tg) => tg && tg.id != null && (tg.requests == null || tg.assignments == null))
                .map((tg) => tg.id);

            let enrichedResp = resp;
            if (needDetailIds.length > 0) {
                const detailResults = await Promise.allSettled(
                    needDetailIds.slice(0, 10).map((id) => getRescuerTaskGroupById(id))
                );
                const detailById = new Map();
                for (let i = 0; i < detailResults.length; i++) {
                    const r = detailResults[i];
                    const id = needDetailIds[i];
                    if (r.status === 'fulfilled') {
                        const d = r.value;
                        // Some BEs wrap it: { taskGroup: {...} }
                        const detailObj = d?.taskGroup || d?.task_group || d;
                        if (detailObj && typeof detailObj === 'object') {
                            detailById.set(id, detailObj);
                        }
                    } else {
                        // keep silent; UI will show placeholders for missing fields
                        // console.warn('[RescuerDashboard] Cannot load task group detail', id, r.reason);
                    }
                }

                const mergedTaskGroups = taskGroups.map((tg) => {
                    const d = detailById.get(tg?.id);
                    if (!d) return tg;
                    return mergePreferDetail(tg, d);
                });

                enrichedResp = { ...(resp || {}), taskGroups: mergedTaskGroups };
            }

            setRawDashboard(enrichedResp);
            setLastUpdatedAt(new Date());
        } catch (e) {
            if (!mountedRef.current) return;
            setError(e?.message || 'Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        let intervalId = null;

        loadDashboard();
        // Poll every 20s for "near real-time" updates
        intervalId = window.setInterval(loadDashboard, 20000);

        return () => {
            mountedRef.current = false;
            if (intervalId) window.clearInterval(intervalId);
        };
    }, [loadDashboard]);

    const normalized = useMemo(() => normalizeDashboardResponse(rawDashboard), [rawDashboard]);
    const teamName = normalized.team.name;
    const area = normalized.team.area ? `Khu vực hoạt động: ${normalized.team.area}` : 'Khu vực hoạt động: —';
    const membersInfo =
        normalized.team.memberCount !== null ? `Quân số: ${normalized.team.memberCount} thành viên` : 'Quân số: —';
    const missions = normalized.missions;

    const updatedTimeText = useMemo(() => {
        if (!lastUpdatedAt) return '--:--:--';
        return lastUpdatedAt.toLocaleTimeString('vi-VN', { hour12: false });
    }, [lastUpdatedAt]);

    return (
        <div className="flex flex-col gap-4 pb-6">
            {/* Header: Team summary */}
            <Card className="px-5 py-4 flex flex-col gap-4">
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <UsersIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-lg font-bold text-slate-900 md:text-xl">{teamName}</h1>
                                <Badge variant={normalized.team.status.variant} size="sm" className="uppercase">
                                    {normalized.team.status.label}
                                </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                                <span>{area}</span>
                                <span>•</span>
                                <span>{membersInfo}</span>
                                <span>•</span>
                                <span>
                                    Nhiệm vụ đang theo dõi:{' '}
                                    <span className="font-semibold">
                                        {normalized.stats.activeTaskGroups}
                                    </span>
                                    {normalized.stats.activeAssignments !== null && (
                                        <>
                                            {' '}
                                            (đang xử lý:{' '}
                                            <span className="font-semibold">
                                                {normalized.stats.activeAssignments}
                                            </span>
                                            )
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={loading || missions.length === 0}
                            onClick={() => {
                                // Open update-status page for the first active mission by default
                                const mission = missions[0] || null;
                                const raw = mission?.raw || {};
                                const rr0 =
                                    (Array.isArray(raw?.requests) && raw.requests[0]) ||
                                    (Array.isArray(raw?.rescueRequests) && raw.rescueRequests[0]) ||
                                    null;
                                const requestId =
                                    rr0?.id ||
                                    (Array.isArray(raw?.rescueRequestIds) ? raw.rescueRequestIds[0] : null) ||
                                    (Array.isArray(raw?.requestIds) ? raw.requestIds[0] : null) ||
                                    null;
                                navigate(RESCUER_ROUTES.UPDATE_STATUS, {
                                    state: {
                                        mission,
                                        requestId,
                                        code: mission?.code,
                                        status: mission?.raw?.status || mission?.statusLabel,
                                        statusLabel: mission?.statusLabel,
                                        reportTitle: 'Báo cáo: Cứu hộ Quận 1',
                                        leaderName: normalized?.team?.name || 'Đội cứu hộ',
                                        timeline: mission?.raw?.timeline || [],
                                        pendingReports: 0,
                                    },
                                });
                            }}
                        >
                            Cập nhật trạng thái
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            disabled={loading}
                            onClick={() => {
                                // Manual refresh (without waiting for interval)
                                loadDashboard();
                            }}
                        >
                            Làm mới
                        </Button>
                    </div>
                </div>
                {!!error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {error}
                    </div>
                )}
            </Card>

            {/* Missions list */}
            <Card className="px-5 py-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Nhiệm vụ đang thực hiện
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                            Cập nhật liên tục theo thời gian thực, hiển thị các yêu cầu đang được đội xử lý
                        </div>
                    </div>
                    <div className="hidden text-xs text-slate-500 sm:flex sm:flex-col sm:items-end">
                        <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Cập nhật lúc <span className="font-mono">{updatedTimeText}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Hệ thống sẽ tự động cập nhật khi có lệnh mới</span>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    {loading ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 md:col-span-3">
                            Đang tải danh sách nhiệm vụ...
                        </div>
                    ) : missions.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 md:col-span-3">
                            Hiện tại chưa có nhiệm vụ nào được phân công cho đội.
                        </div>
                    ) : (
                        missions.map((mission) => (
                            <div
                                key={mission.id}
                                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60 shadow-sm"
                            >
                                {/* Map */}
                                <div className="relative h-32 w-full overflow-hidden">
                                    <MissionMapView
                                        center={
                                            Number.isFinite(mission.latitude) && Number.isFinite(mission.longitude)
                                                ? { lat: mission.latitude, lng: mission.longitude }
                                                : { lat: 10.8231, lng: 106.6297 } // Default HCMC
                                        }
                                        markerPosition={
                                            Number.isFinite(mission.latitude) && Number.isFinite(mission.longitude)
                                                ? { lat: mission.latitude, lng: mission.longitude }
                                                : undefined
                                        }
                                        zoom={Number.isFinite(mission.latitude) && Number.isFinite(mission.longitude) ? 15 : 11}
                                    />
                                    {!(Number.isFinite(mission.latitude) && Number.isFinite(mission.longitude)) && (
                                        <div className="absolute inset-x-0 bottom-0 z-10 bg-white/80 px-2 py-1 text-center text-[10px] text-slate-600 backdrop-blur">
                                            Chưa có toạ độ chính xác — tạm hiển thị bản đồ mặc định
                                        </div>
                                    )}
                                    <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700 shadow-sm">
                                        <span className={`inline-flex h-1.5 w-1.5 rounded-full ${mission.statusDotColor || 'bg-emerald-500'}`} />
                                        {mission.code || '—'}
                                    </div>
                                    <div
                                        className={`absolute right-3 top-3 z-10 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${mission.typeColor} shadow-sm`}
                                    >
                                        {mission.type}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col gap-2 p-3 bg-white">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                                                {mission.danger && (
                                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                                )}
                                                <span>{mission.title}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-slate-600">
                                                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                                                <span className="line-clamp-2">{mission.address || '—'}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-slate-600">
                                        <span>
                                            <span className="font-semibold">
                                                {mission.assetName || '—'}
                                            </span>
                                        </span>
                                        <Badge
                                            outline
                                            size="sm"
                                            className={mission.statusColor + ' text-[10px] font-semibold uppercase'}
                                        >
                                            {mission.statusLabel}
                                        </Badge>
                                    </div>

                                    <div className="mt-2 flex items-center justify-between gap-2">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="flex-1 justify-center"
                                            onClick={() => navigate(RESCUER_ROUTES.ASSIGNMENT_DETAIL.replace(':id', mission.id))}
                                        >
                                            Xem chi tiết
                                        </Button>
                                        <Button variant="secondary" size="sm">
                                            Báo cáo nhanh
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer actions */}
                <div className="mt-4 flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-3 text-xs text-slate-500 sm:flex-row sm:items-center">
                    <div>
                        Cập nhật lúc <span className="font-mono">{updatedTimeText}</span> · Hệ thống sẽ tự động hiển thị lệnh mới
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm">
                            Báo cáo nhanh
                        </Button>
                        <Button variant="primary" size="sm">
                            Tạo yêu cầu mới
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
