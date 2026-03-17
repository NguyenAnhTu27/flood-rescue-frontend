import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Clock, AlertTriangle, MoreHorizontal, Users as UsersIcon, Crosshair } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Card from '../../shared/ui/Card.jsx';
import Button from '../../shared/ui/Button.jsx';
import Badge from '../../shared/ui/Badge.jsx';
import RescueBeacon from '../../shared/ui/RescueBeacon.jsx';
import MissionMapView from '../../features/map/components/MissionMapView.jsx';
import { getRescuerDashboard, getRescuerTaskGroupById, returnRescuerTeamAssets, updateRescuerTeamLocation } from '../../features/rescuer/api.js';
import { getRescuerReliefRequests } from '../../features/relief/api.js';
import { RESCUER_ROUTES } from '../../app/routes/route.constants.js';
import { useVisibleInterval } from '../../shared/hooks/useVisibleInterval.js';

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

function normalizeAssetStatus(statusRaw) {
    const s = String(statusRaw || '').toUpperCase();
    if (s === 'IN_USE') return { label: 'Đang sử dụng', color: 'bg-amber-100 text-amber-700' };
    if (s === 'AVAILABLE') return { label: 'Sẵn sàng', color: 'bg-green-100 text-green-700' };
    if (s === 'MAINTENANCE') return { label: 'Bảo trì', color: 'bg-slate-100 text-slate-700' };
    if (s === 'BROKEN' || s === 'INACTIVE') return { label: 'Không khả dụng', color: 'bg-red-100 text-red-700' };
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

        const missionStatusRaw = pickFirstTruthy(tg?.status, tg?.taskGroupStatus);
        const normalizedStatus = String(missionStatusRaw || '').toUpperCase();
        const statusInfo = normalizeMissionStatus(missionStatusRaw);

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
            tg?.code,
            tg?.taskGroupCode,
            tg?.name,
            rr0?.code,
            rr0?.requestCode,
            rr0?.rescueRequestCode,
            rr0?.citizenRequestCode
        );
        const code = codeFromBe ? String(codeFromBe) : '';

        // "type" tag in UI: derive from status
        const type =
            normalizedStatus === 'IN_PROGRESS'
                ? 'TẠI HIỆN TRƯỜNG'
                : normalizedStatus === 'ASSIGNED'
                    ? 'ĐANG DI CHUYỂN'
                    : 'MỚI PHÂN CÔNG';

        const typeColor =
            type === 'TẠI HIỆN TRƯỜNG'
                ? 'bg-emerald-100 text-emerald-700'
                : type === 'ĐANG DI CHUYỂN'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-700';

        const statusDotColor =
            normalizedStatus === 'IN_PROGRESS'
                ? 'bg-emerald-500'
                : normalizedStatus === 'ASSIGNED'
                    ? 'bg-blue-500'
                    : normalizedStatus === 'NEW'
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
            normalizedStatus,
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
    const heldAssetsRaw = toArray(pickFirstTruthy(data.heldAssets, data.teamAssets, data.assets));
    const heldAssets = heldAssetsRaw.map((a) => {
        const status = normalizeAssetStatus(pickFirstTruthy(a?.status, a?.assetStatus));
        return {
            id: pickFirstTruthy(a?.id, a?.assetId, a?.vehicleId) || Math.random().toString(36).slice(2),
            code: pickFirstTruthy(a?.code, a?.assetCode, a?.vehicleCode) || null,
            name: pickFirstTruthy(a?.name, a?.assetName, a?.vehicleName) || 'Phương tiện',
            type: pickFirstTruthy(a?.assetType, a?.type, a?.vehicleType) || null,
            statusLabel: status.label,
            statusColor: status.color,
        };
    });

    return {
        team: {
            name: String(teamName),
            area: area ? String(area) : null,
            memberCount: memberCount !== null ? Number(memberCount) : null,
            status: teamStatus,
            latitude: toNumberOrNull(pickFirstTruthy(team?.currentLatitude, data.teamLatitude)),
            longitude: toNumberOrNull(pickFirstTruthy(team?.currentLongitude, data.teamLongitude)),
            locationText: pickFirstTruthy(team?.currentLocationText, data.teamLocationText) || null,
            locationUpdatedAt: pickFirstTruthy(team?.currentLocationUpdatedAt, data.teamLocationUpdatedAt) || null,
        },
        stats: {
            activeTaskGroups: Number.isFinite(activeTaskGroups) ? activeTaskGroups : missions.length,
            activeAssignments: Number.isFinite(activeAssignments) ? activeAssignments : null,
        },
        heldAssets,
        missions,
    };
}

function toList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    return [];
}

function fmtDateTime(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('vi-VN');
}

export default function RescuerDashboard() {
    const navigate = useNavigate();
    const [rawDashboard, setRawDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reliefRequests, setReliefRequests] = useState([]);
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
    const [updatingMyLocation, setUpdatingMyLocation] = useState(false);
    const [returningAssets, setReturningAssets] = useState(false);
    const mountedRef = useRef(true);
    const requestIdRef = useRef(0);

    const loadDashboard = useCallback(async () => {
        const requestId = ++requestIdRef.current;

        try {
            if (mountedRef.current) {
                setLoading(true);
                setError('');
            }

            const [resp, reliefResp] = await Promise.all([
                getRescuerDashboard(),
                getRescuerReliefRequests({ page: 0, size: 100 }),
            ]);
            if (!mountedRef.current || requestId !== requestIdRef.current) return;

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
                if (!mountedRef.current || requestId !== requestIdRef.current) return;

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
            setReliefRequests(toList(reliefResp));
            setLastUpdatedAt(new Date());
        } catch (e) {
            if (!mountedRef.current || requestId !== requestIdRef.current) return;
            setError(e?.message || 'Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
        } finally {
            if (mountedRef.current && requestId === requestIdRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        loadDashboard();
        return () => {
            mountedRef.current = false;
        };
    }, [loadDashboard]);

    useVisibleInterval(loadDashboard, 20000);

    const normalized = useMemo(() => normalizeDashboardResponse(rawDashboard), [rawDashboard]);
    const teamName = normalized.team.name;
    const area = normalized.team.area ? `Khu vực hoạt động: ${normalized.team.area}` : 'Khu vực hoạt động: —';
    const membersInfo =
        normalized.team.memberCount !== null ? `Quân số: ${normalized.team.memberCount} thành viên` : 'Quân số: —';
    const missions = normalized.missions;
    const heldAssets = normalized.heldAssets;
    const activeMissions = useMemo(
        () => missions.filter((m) => ['NEW', 'ASSIGNED', 'IN_PROGRESS'].includes(m?.normalizedStatus || '')),
        [missions]
    );
    const canReturnAssets = !loading && activeMissions.length === 0 && heldAssets.length > 0;
    const criticalCount = activeMissions.filter((m) => m.danger).length;

    const updatedTimeText = useMemo(() => {
        if (!lastUpdatedAt) return '--:--:--';
        return lastUpdatedAt.toLocaleTimeString('vi-VN', { hour12: false });
    }, [lastUpdatedAt]);

    const teamGpsText = useMemo(() => {
        if (!Number.isFinite(normalized.team.latitude) || !Number.isFinite(normalized.team.longitude)) {
            return 'Chưa có vị trí đội';
        }
        return `${normalized.team.latitude.toFixed(6)}, ${normalized.team.longitude.toFixed(6)}`;
    }, [normalized.team.latitude, normalized.team.longitude]);

    const handleUpdateMyGps = useCallback(() => {
        if (!navigator.geolocation) {
            window.alert('Trình duyệt không hỗ trợ GPS.');
            return;
        }
        setUpdatingMyLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const latitude = pos.coords.latitude;
                    const longitude = pos.coords.longitude;
                    const locationText = `GPS ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                    await updateRescuerTeamLocation({ latitude, longitude, locationText });
                    await loadDashboard();
                } catch (e) {
                    window.alert(e?.message || 'Không thể cập nhật vị trí đội cứu hộ.');
                } finally {
                    setUpdatingMyLocation(false);
                }
            },
            (error) => {
                setUpdatingMyLocation(false);
                window.alert(error?.message || 'Không lấy được vị trí GPS.');
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    }, [loadDashboard]);

    const handleReturnAssets = useCallback(async () => {
        if (!canReturnAssets || returningAssets) return;
        const ok = window.confirm(`Xác nhận trả ${heldAssets.length} tài sản về trạng thái sẵn sàng?`);
        if (!ok) return;
        try {
            setReturningAssets(true);
            const resp = await returnRescuerTeamAssets();
            const count = Number(resp?.returnedAssetCount ?? heldAssets.length);
            window.alert(`Đã trả ${Number.isFinite(count) ? count : heldAssets.length} tài sản.`);
            await loadDashboard();
        } catch (e) {
            window.alert(e?.message || 'Không thể trả tài sản lúc này.');
        } finally {
            setReturningAssets(false);
        }
    }, [canReturnAssets, heldAssets.length, loadDashboard, returningAssets]);

    const newReliefRequests = useMemo(
        () => reliefRequests.filter((r) => {
            const s = String(r?.deliveryStatus || '').toUpperCase();
            return s === 'MANAGER_APPROVED' || s === 'REQUESTED' || s === '';
        }),
        [reliefRequests]
    );


    return (
        <div className="flex flex-col gap-5 pb-8">
            {/* Header: Team summary */}
            <Card variant="elevated" className="relative animate-fade-in-up overflow-hidden border-white/70 bg-gradient-to-br from-white via-white to-blue-50/70 px-6 py-6">
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-blue-100/60 via-sky-50/20 to-transparent" />
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-[0_10px_24px_rgba(37,99,235,0.24)]">
                            <UsersIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="font-display text-xl font-bold tracking-[-0.02em] text-ink-900 md:text-2xl">{teamName}</h1>
                                <Badge variant={normalized.team.status.variant} size="sm" className="uppercase shadow-sm">
                                    {normalized.team.status.label}
                                </Badge>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                                <div className="rounded-lg border border-white/80 bg-white/80 px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur-sm">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Khu vực</div>
                                    <div className="mt-1 text-sm font-medium text-ink-900">{area.replace('Khu vực hoạt động: ', '')}</div>
                                </div>
                                <div className="rounded-lg border border-white/80 bg-white/80 px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur-sm">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Quân số</div>
                                    <div className="mt-1 text-sm font-medium text-ink-900">{membersInfo.replace('Quân số: ', '')}</div>
                                </div>
                                <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-3 py-2 shadow-[0_8px_24px_rgba(37,99,235,0.08)]">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">Nhiệm vụ đang theo dõi</div>
                                    <div className="mt-1 text-sm font-semibold text-ink-900">
                                        {normalized.stats.activeTaskGroups}
                                        {normalized.stats.activeAssignments !== null && ` · đang xử lý ${normalized.stats.activeAssignments}`}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Phương tiện đang giữ</div>
                                    <div className="mt-1 text-sm font-semibold text-ink-900">{heldAssets.length}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <RescueBeacon count={criticalCount} isCritical={criticalCount > 0} />
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white/85"
                            disabled={loading || updatingMyLocation}
                            onClick={handleUpdateMyGps}
                        >
                            <Crosshair className="h-4 w-4" />
                            {updatingMyLocation ? 'Đang lấy GPS...' : 'Lấy vị trí của tôi'}
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white/85"
                            disabled={loading || activeMissions.length === 0}
                            onClick={() => {
                                const mission = activeMissions[0] || null;
                                const missionId = mission?.raw?.id || mission?.id;
                                if (!missionId) return;
                                navigate(RESCUER_ROUTES.ASSIGNMENT_DETAIL.replace(':id', String(missionId)));
                            }}
                        >
                            Mở nhiệm vụ gần nhất
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            className="shadow-[0_12px_28px_rgba(13,148,136,0.22)]"
                            disabled={loading}
                            onClick={() => {
                                // Manual refresh (without waiting for interval)
                                loadDashboard();
                            }}
                        >
                            Làm mới
                        </Button>
                        {canReturnAssets && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white/80"
                                disabled={returningAssets}
                                onClick={handleReturnAssets}
                            >
                                {returningAssets ? 'Đang trả tài sản...' : 'Trả phương tiện / thiết bị'}
                            </Button>
                        )}
                    </div>
                </div>
                {!!error && (
                    <div className="rounded-lg border border-red-200 bg-red-50/90 px-4 py-3 text-xs text-red-700 shadow-[0_8px_20px_rgba(239,68,68,0.08)]">
                        {error}
                    </div>
                )}
                <div className="rounded-lg border border-slate-200/80 bg-white/80 px-4 py-3 text-xs text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.04)] backdrop-blur-sm">
                    Vị trí đội hiện tại: <span className="font-mono">{teamGpsText}</span>
                    {normalized.team.locationText ? ` • ${normalized.team.locationText}` : ''}
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white/85 shadow-[0_14px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                    <div className="border-b border-slate-200/80 bg-gradient-to-r from-white via-blue-50/60 to-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                        Bản đồ vị trí đội cứu hộ
                    </div>
                    <div className="h-48">
                        <MissionMapView
                            center={
                                Number.isFinite(normalized.team.latitude) && Number.isFinite(normalized.team.longitude)
                                    ? { lat: normalized.team.latitude, lng: normalized.team.longitude }
                                    : { lat: 10.8231, lng: 106.6297 }
                            }
                            markerPosition={
                                Number.isFinite(normalized.team.latitude) && Number.isFinite(normalized.team.longitude)
                                    ? { lat: normalized.team.latitude, lng: normalized.team.longitude }
                                    : undefined
                            }
                            zoom={Number.isFinite(normalized.team.latitude) && Number.isFinite(normalized.team.longitude) ? 15 : 11}
                        />
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200/80 bg-white/90 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
                    <div className="border-b border-slate-200/80 bg-gradient-to-r from-white via-slate-50 to-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
                        Phương tiện đội đang giữ ({heldAssets.length})
                    </div>
                    {heldAssets.length === 0 ? (
                        <div className="px-4 py-4 text-xs text-slate-500">
                            Hiện đội chưa giữ phương tiện nào.
                        </div>
                    ) : (
                        <div className="grid gap-3 p-4 md:grid-cols-2">
                            {heldAssets.map((asset) => (
                                <div key={asset.id} className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-semibold text-slate-900">
                                                {asset.name}
                                            </div>
                                            <div className="text-xs text-slate-600">
                                                {asset.code || '—'}{asset.type ? ` • ${asset.type}` : ''}
                                            </div>
                                        </div>
                                        <Badge outline size="sm" className={asset.statusColor + ' text-[10px] font-semibold uppercase'}>
                                            {asset.statusLabel}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Missions list */}
            <Card className="animate-fade-in-up px-6 py-5" style={{ animationDelay: '80ms' }}>
                <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                            Nhiệm vụ đang thực hiện
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
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
                        <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-5 text-sm text-slate-600 md:col-span-3">
                            Đang tải danh sách nhiệm vụ...
                        </div>
                    ) : activeMissions.length === 0 ? (
                        <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-5 text-sm text-slate-600 md:col-span-3">
                            Hiện tại chưa có nhiệm vụ nào được phân công cho đội.
                        </div>
                    ) : (
                        activeMissions.map((mission, index) => (
                            <div
                                key={mission.id}
                                className="animate-fade-in-up flex flex-col overflow-hidden rounded-lg border border-slate-200/80 bg-white/90 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float"
                                style={{ animationDelay: `${120 + index * 40}ms` }}
                            >
                                {/* Map */}
                                <div className="relative h-32 w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-blue-900 via-neutral-900 to-slate-900">
                                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_left,#22c55e_0,transparent_55%),radial-gradient(circle_at_bottom_right,#0ea5e9_0,transparent_55%)]" />
                                    <div className="relative z-10 flex h-full flex-col justify-between p-3">
                                        <div className="flex items-center justify-between text-[11px] text-slate-200">
                                            <span className="inline-flex items-center gap-1">
                                                <span className={`inline-flex h-1.5 w-1.5 rounded-full ${mission.statusDotColor || 'bg-emerald-500'} ${mission.normalizedStatus === 'IN_PROGRESS' ? 'animate-pulse-urgent' : ''}`} />
                                                {mission.code || '—'}
                                            </span>
                                            <span className="font-mono opacity-80">
                                                {Number.isFinite(mission.latitude) && Number.isFinite(mission.longitude)
                                                    ? `${mission.latitude.toFixed(4)}, ${mission.longitude.toFixed(4)}`
                                                    : 'Chưa có toạ độ'}
                                            </span>
                                        </div>
                                        <div className="mt-2 line-clamp-2 text-sm font-medium text-slate-50">
                                            {mission.address || '—'}
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col gap-3 bg-white p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                                                {mission.danger && (
                                                    <AlertTriangle className="h-3.5 w-3.5 text-urgent-500" />
                                                )}
                                                <span>{mission.title}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm font-medium text-ink-900">
                                                <MapPin className="h-3.5 w-3.5 text-blue-600" />
                                                <span className="line-clamp-2">{mission.address || '—'}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                            aria-label="Thêm tuỳ chọn"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
                                        <span className="min-w-0">
                                            <span className="block truncate font-semibold text-ink-900">
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
                                            onClick={() => {
                                                const missionId = mission?.raw?.id || mission?.id;
                                                if (!missionId) return;
                                                const path = RESCUER_ROUTES.ASSIGNMENT_DETAIL.replace(':id', String(missionId));
                                                navigate(path, { state: { mission: mission?.raw || mission } });
                                            }}
                                        >
                                            Xem chi tiết
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="bg-white"
                                            onClick={() => {
                                                const missionId = mission?.raw?.id || mission?.id;
                                                if (!missionId) return;
                                                navigate(RESCUER_ROUTES.ASSIGNMENT_DETAIL.replace(':id', String(missionId)));
                                            }}
                                        >
                                            Cập nhật trạng thái
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
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                const mission = activeMissions[0] || null;
                                const missionId = mission?.raw?.id || mission?.id;
                                if (!missionId) return;
                                navigate(RESCUER_ROUTES.ASSIGNMENT_DETAIL.replace(':id', String(missionId)));
                            }}
                        >
                            Cập nhật trạng thái
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(RESCUER_ROUTES.MY_ASSIGNMENTS)}
                        >
                            Xem tất cả nhiệm vụ
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Relief requests assigned to rescuer team */}
            <Card className="animate-fade-in-up px-6 py-5" style={{ animationDelay: '120ms' }}>
                <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                            Yêu cầu cứu trợ mới
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                            Các yêu cầu vừa được giao cho đội và cần đưa vào kế hoạch sắp xếp.
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="primary" size="sm">{newReliefRequests.length} mới</Badge>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(RESCUER_ROUTES.RELIEF_PRIORITIZE)}
                        >
                            Mở bảng sắp xếp
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                    {loading ? (
                        <div className="p-4 text-sm text-slate-500">Đang tải yêu cầu mới...</div>
                    ) : newReliefRequests.length === 0 ? (
                        <div className="p-4 text-sm text-slate-500">Không có yêu cầu mới.</div>
                    ) : (
                        <table className="w-full min-w-[760px]">
                            <thead className="bg-gradient-to-r from-slate-50 via-white to-slate-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Mã yêu cầu</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Khu vực</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Mức độ</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Cập nhật</th>
                                </tr>
                            </thead>
                            <tbody>
                                {newReliefRequests.map((r) => (
                                    <tr key={r.id} className="border-t border-slate-100">
                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900">{r.code || `#${r.id}`}</td>
                                        <td className="px-3 py-2 text-sm text-slate-700">{r.targetArea || r.citizenAddressText || '—'}</td>
                                        <td className="px-3 py-2 text-sm text-slate-700">{r.priority || '—'}</td>
                                        <td className="px-3 py-2 text-sm text-slate-600">{fmtDateTime(r.updatedAt || r.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>

        </div>
    );
}
