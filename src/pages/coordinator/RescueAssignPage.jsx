import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, MapPin, Users, X } from 'lucide-react';
import MapBox from '../../features/map/components/MapBox.jsx';
import Button from '../../shared/ui/Button.jsx';
import Badge from '../../shared/ui/Badge.jsx';
import { getTeams } from '../../features/teams/api.js';
import { getAssets } from '../../features/assets/api.js';
import {
    assignTaskGroup,
    changeRescueRequestStatus,
    createTaskGroup,
    getCoordinatorRescueQueue,
    getTaskGroups,
} from '../../features/coordinator/api.js';
import { overloadEmergencyNotification } from '../../features/notifications/api.js';
import { COORDINATOR_ROUTES } from '../../app/routes/route.constants.js';

function toArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

function pickFirst(...values) {
    for (const value of values) {
        if (value !== undefined && value !== null && value !== '') return value;
    }
    return null;
}

function toNumberOrNull(value) {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
}

function statusBadge(status) {
    const s = String(status || '').toUpperCase();
    const map = {
        AVAILABLE: { label: 'Sẵn sàng', variant: 'success' },
        BUSY: { label: 'Đang làm', variant: 'warning' },
        IN_RESCUE: { label: 'Đang đi cứu hộ', variant: 'warning' },
        IN_USE: { label: 'Đang dùng', variant: 'warning' },
        MAINTENANCE: { label: 'Bảo trì', variant: 'error' },
        ACTIVE: { label: 'Hoạt động', variant: 'success' },
    };
    return map[s] || { label: s || 'N/A', variant: 'default' };
}

function emergencyActionLabel(statusRaw) {
    const s = String(statusRaw || '').toUpperCase();
    if (s === 'WAITING_OVERLOAD') return 'ĐANG ĐỢI (QUÁ TẢI)';
    if (s === 'REASSIGNED') return 'ĐÃ ĐIỀU PHỐI ĐỘI KHÁC';
    if (s === 'CONFIRMED') return 'ĐÃ XÁC NHẬN';
    if (s === 'QUEUED') return 'ĐÃ VÀO HÀNG ĐỢI';
    if (s === 'VIEWED') return 'ĐIỀU PHỐI ĐÃ XEM';
    return '';
}

export default function RescueAssignPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const initialRequests = useMemo(() => {
        if (Array.isArray(location.state?.requests)) return location.state.requests;
        if (location.state?.request) return [location.state.request];
        return [];
    }, [location.state]);
    const preferredRequestId = useMemo(() => {
        const byState = location.state?.autoSelectRequestId;
        if (byState !== undefined && byState !== null && byState !== '') return String(byState);
        if (initialRequests?.[0]?.id !== undefined && initialRequests?.[0]?.id !== null) return String(initialRequests[0].id);
        return '';
    }, [location.state, initialRequests]);

    const taskGroupId = location.state?.taskGroupId || null;

    const [availableRequests, setAvailableRequests] = useState([]);
    const [mergeMode, setMergeMode] = useState(false);
    const [selectedRequestIds, setSelectedRequestIds] = useState(
        initialRequests?.[0]?.id ? [String(initialRequests[0].id)] : []
    );
    const [detailRequestId, setDetailRequestId] = useState('');
    const [loadingRequests, setLoadingRequests] = useState(false);

    const [teams, setTeams] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loadingResources, setLoadingResources] = useState(true);

    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [selectedAssetId, setSelectedAssetId] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [overloadOpen, setOverloadOpen] = useState(false);
    const [overloadNote, setOverloadNote] = useState('');
    const [overloading, setOverloading] = useState(false);

    const selectedRequests = useMemo(
        () => availableRequests.filter((r) => selectedRequestIds.includes(String(r.id))),
        [availableRequests, selectedRequestIds]
    );
    const selectedRequest = useMemo(
        () => (selectedRequests.length > 0 ? selectedRequests[0] : null),
        [selectedRequests]
    );
    const detailRequest = useMemo(
        () => availableRequests.find((r) => String(r.id) === String(detailRequestId)) || null,
        [availableRequests, detailRequestId]
    );
    const selectedTeam = useMemo(
        () => teams.find((t) => String(t.id) === String(selectedTeamId)) || null,
        [teams, selectedTeamId]
    );
    const availableAssetsForTeam = useMemo(() => {
        const teamIdNum = toNumberOrNull(selectedTeamId);
        if (teamIdNum === null) return [];

        return assets.filter((asset) => {
            const rawAssignedTeamId = toNumberOrNull(
                pickFirst(asset?.assignedTeamId, asset?.assigned_team_id, asset?.teamId)
            );
            const assignedTeamId = rawAssignedTeamId !== null && rawAssignedTeamId > 0
                ? rawAssignedTeamId
                : null;
            const status = String(asset?.status || '').toUpperCase();

            // Có thể dùng lại tài sản đội đang giữ (IN_USE/AVAILABLE),
            // hoặc lấy tài sản rảnh chưa thuộc đội nào.
            if (assignedTeamId === teamIdNum) {
                return status === 'IN_USE' || status === 'AVAILABLE';
            }
            if (assignedTeamId === null) {
                return status === 'AVAILABLE';
            }
            return false;
        });
    }, [assets, selectedTeamId]);
    const blockedTeamId = toNumberOrNull(selectedRequest?.sourceTeamId);
    const showMergedDetail = mergeMode && selectedRequests.length > 1;
    const mergedDetail = useMemo(() => {
        if (!showMergedDetail) return null;
        const sumPeople = selectedRequests.reduce((acc, req) => {
            const count = Number(req?.affectedPeopleCount ?? req?.peopleCount);
            return acc + (Number.isFinite(count) ? count : 0);
        }, 0);
        const allAttachments = selectedRequests.flatMap((req) => (Array.isArray(req?.attachments) ? req.attachments : []));
        return {
            code: `GỘP ${selectedRequests.length} YÊU CẦU`,
            people: sumPeople || '—',
            address: selectedRequests.map((req) => req.addressText || '—').join('\n'),
            locationDescription: selectedRequests
                .map((req) => req.locationDescription || req.citizenLocationDescription || '—')
                .join('\n'),
            description: selectedRequests
                .map((req) => `(${req.code || `#${req.id}`}) ${req.description || '—'}`)
                .join('\n'),
            coordinates: selectedRequests
                .map((req) => {
                    const lat = Number(req.latitude || req.lat);
                    const lng = Number(req.longitude || req.lng);
                    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
                    return `${req.code || `#${req.id}`}: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                })
                .filter(Boolean)
                .join('\n') || '—',
            attachmentsCount: allAttachments.length,
        };
    }, [showMergedDetail, selectedRequests]);

    const mapCenter = {
        lat: Number(selectedRequest?.latitude || selectedRequest?.lat || selectedTeam?.currentLatitude) || 16.0544,
        lng: Number(selectedRequest?.longitude || selectedRequest?.lng || selectedTeam?.currentLongitude) || 108.2022,
    };

    useEffect(() => {
        const loadRequests = async () => {
            try {
                setLoadingRequests(true);

                const resp = await getCoordinatorRescueQueue({ status: 'VERIFIED', page: 0, size: 100 });
                const list = toArray(resp);
                const merged = [...list];
                if (initialRequests.length > 0) {
                    initialRequests.forEach((r) => {
                        if (!merged.some((x) => String(x?.id) === String(r?.id))) {
                            merged.unshift(r);
                        }
                    });
                }
                setAvailableRequests(merged);

                if (preferredRequestId && merged.some((r) => String(r?.id) === preferredRequestId)) {
                    setSelectedRequestIds([preferredRequestId]);
                } else if (merged[0]?.id) {
                    setSelectedRequestIds([String(merged[0].id)]);
                }
                const detailId = (preferredRequestId && merged.some((r) => String(r?.id) === preferredRequestId))
                    ? preferredRequestId
                    : (merged[0]?.id ? String(merged[0].id) : '');
                setDetailRequestId(detailId);
            } catch (e) {
                console.error('[RescueAssignPage] load verified requests error', e);
                setAvailableRequests([]);
            } finally {
                setLoadingRequests(false);
            }
        };

        loadRequests();
    }, [initialRequests, preferredRequestId]);

    useEffect(() => {
        const loadResources = async () => {
            try {
                setLoadingResources(true);
                const teamsResp = await getTeams();
                const taskGroupsResp = await getTaskGroups({ page: 0, size: 500 });
                const assetsResp = await getAssets();

                const teamsRaw = toArray(teamsResp)
                    .map((t) => ({
                        ...t,
                        id: pickFirst(t?.id, t?.teamId, t?.team_id),
                    }))
                    .filter((t) => toNumberOrNull(t.id) !== null);
                const activeStatuses = new Set(['NEW', 'ASSIGNED', 'IN_PROGRESS']);
                const taskGroups = toArray(taskGroupsResp);
                const activeTaskCountByTeamId = taskGroups.reduce((acc, tg) => {
                    const teamId = toNumberOrNull(pickFirst(tg?.assignedTeamId, tg?.teamId, tg?.assigned_team_id));
                    const status = String(tg?.status || '').toUpperCase();
                    if (teamId === null || !activeStatuses.has(status)) return acc;
                    acc[teamId] = (acc[teamId] || 0) + 1;
                    return acc;
                }, {});
                const teamsWithTaskCount = teamsRaw.map((t) => {
                    const teamId = toNumberOrNull(t.id);
                    return {
                        ...t,
                        activeTaskCount: teamId === null ? 0 : (activeTaskCountByTeamId[teamId] || 0),
                    };
                });
                const teamsList = blockedTeamId
                    ? teamsWithTaskCount.filter((t) => Number(t.id) !== Number(blockedTeamId))
                    : teamsWithTaskCount;
                const assetsList = toArray(assetsResp)
                    .map((a) => ({
                        ...a,
                        id: pickFirst(a?.id, a?.assetId, a?.vehicleId),
                    }))
                    .filter((a) => toNumberOrNull(a?.id) !== null);

                setTeams(teamsList);
                setAssets(assetsList);

                if (teamsList[0]?.id) setSelectedTeamId(String(teamsList[0].id));
            } catch (e) {
                console.error('[RescueAssignPage] load teams error', e);
                setTeams([]);
                setAssets([]);
            } finally {
                setLoadingResources(false);
            }
        };

        loadResources();
    }, [blockedTeamId]);

    useEffect(() => {
        if (blockedTeamId && Number(selectedTeamId) === Number(blockedTeamId)) {
            const next = teams.find((t) => Number(t.id) !== Number(blockedTeamId));
            setSelectedTeamId(next?.id ? String(next.id) : '');
        }
    }, [blockedTeamId, selectedTeamId, teams]);

    useEffect(() => {
        if (!selectedAssetId) return;
        const stillValid = availableAssetsForTeam.some((a) => String(a.id) === String(selectedAssetId));
        if (!stillValid) {
            setSelectedAssetId('');
        }
    }, [availableAssetsForTeam, selectedAssetId]);

    useEffect(() => {
        if (!mergeMode && selectedRequestIds.length > 1) {
            setSelectedRequestIds([selectedRequestIds[0]]);
        }
    }, [mergeMode, selectedRequestIds]);

    const toggleRequestSelection = (requestId) => {
        const id = String(requestId);
        if (!mergeMode) {
            setSelectedRequestIds([id]);
            return;
        }
        setSelectedRequestIds((prev) => {
            if (prev.includes(id)) {
                return prev.filter((x) => x !== id);
            }
            return [...prev, id];
        });
    };

    const handleAssign = async () => {
        if (!selectedTeamId) {
            window.alert('Vui lòng chọn đội cứu hộ để phân công.');
            return;
        }
        if (!selectedAssetId) {
            window.alert('Vui lòng chọn tài sản cho đội cứu hộ trước khi phân công.');
            return;
        }

        const requestIdsToAssign = selectedRequests
            .map((req) => toNumberOrNull(req?.id))
            .filter((id) => id !== null);

        if (!taskGroupId && requestIdsToAssign.length === 0) {
            window.alert('Vui lòng chọn yêu cầu đã xác minh để phân công.');
            return;
        }

        try {
            setAssigning(true);

            const teamIdNum = toNumberOrNull(selectedTeamId);
            if (teamIdNum === null) {
                throw new Error('ID đội cứu hộ không hợp lệ. Vui lòng tải lại trang và thử lại.');
            }
            let targetTaskGroupId = taskGroupId;

            if (!targetTaskGroupId) {
                const requestCodes = selectedRequests.map((req) => req.code || `#${req.id}`).join(', ');
                const created = await createTaskGroup({
                    rescueRequestIds: requestIdsToAssign,
                    assignedTeamId: teamIdNum,
                    note: requestIdsToAssign.length > 1
                        ? `Gộp ${requestIdsToAssign.length} yêu cầu: ${requestCodes}`
                        : `Phân công từ trang điều phối cho yêu cầu ${selectedRequest?.code || selectedRequest?.id}`,
                });
                targetTaskGroupId = pickFirst(created?.id, created?.taskGroupId, created?.data?.id);
                if (!targetTaskGroupId) {
                    throw new Error('Không lấy được taskGroupId sau khi tạo nhóm nhiệm vụ.');
                }
            }

            const targetTaskGroupNum = toNumberOrNull(targetTaskGroupId);
            if (targetTaskGroupNum === null) {
                throw new Error('ID nhóm nhiệm vụ không hợp lệ.');
            }

            await assignTaskGroup({
                taskGroupId: targetTaskGroupNum,
                teamId: teamIdNum,
                assetId: toNumberOrNull(selectedAssetId),
            });

            // Sau phân công, request từ VERIFIED -> ASSIGNED (1 hoặc nhiều yêu cầu khi gộp)
            for (const requestId of requestIdsToAssign) {
                await changeRescueRequestStatus(requestId, 'ASSIGNED', 'Đã phân công đội cứu hộ');
            }

            window.alert(
                requestIdsToAssign.length > 1
                    ? `Phân công thành công và đã gộp ${requestIdsToAssign.length} yêu cầu cho cùng đội cứu hộ.`
                    : 'Phân công nhiệm vụ thành công. Yêu cầu đã chuyển sang ASSIGNED.'
            );
            navigate(COORDINATOR_ROUTES.TASK_MONITOR, { state: { refresh: true } });
        } catch (e) {
            console.error('[RescueAssignPage] assign error', e);
            window.alert(e?.message || 'Không thể phân công nhiệm vụ. Vui lòng thử lại.');
        } finally {
            setAssigning(false);
        }
    };

    const handleOverload = async () => {
        if (!selectedRequest?.id || !selectedRequest?.emergency) {
            window.alert('Chỉ áp dụng quá tải cho yêu cầu khẩn cấp.');
            return;
        }
        if (!String(overloadNote || '').trim()) {
            window.alert('Vui lòng nhập mô tả chi tiết trước khi báo quá tải.');
            return;
        }
        try {
            setOverloading(true);
            await overloadEmergencyNotification(Number(selectedRequest.id), overloadNote.trim());
            setOverloadOpen(false);
            setOverloadNote('');
            window.alert('Đã báo quá tải. Yêu cầu tiếp tục ở hàng đợi và được đánh dấu đang đợi.');
            const resp = await getCoordinatorRescueQueue({ status: 'VERIFIED', page: 0, size: 100 });
            const list = toArray(resp);
            setAvailableRequests(list);
            if (list.some((r) => String(r?.id) === String(selectedRequest.id))) {
                setSelectedRequestIds([String(selectedRequest.id)]);
            }
        } catch (e) {
            window.alert(e?.message || 'Không thể gửi trạng thái quá tải.');
        } finally {
            setOverloading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4.5rem)] min-h-[760px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex min-h-0 flex-1 overflow-hidden">
                <div className="flex w-[22rem] shrink-0 flex-col border-r border-slate-200">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                        <h2 className="text-sm font-bold text-slate-900">Đội cứu hộ</h2>
                        <p className="mt-0.5 text-xs text-slate-600">Chọn 1 đội để nhận nhiệm vụ</p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loadingResources ? (
                            <div className="p-4 text-xs text-slate-500">Đang tải đội cứu hộ...</div>
                        ) : teams.length === 0 ? (
                            <div className="p-4 text-xs text-slate-500">Chưa có đội cứu hộ nào.</div>
                        ) : (
                            teams.map((team) => {
                                const checked = String(team.id) === String(selectedTeamId);
                                const badge = statusBadge(team.workloadStatus || team.status || team.teamStatus || 'ACTIVE');
                                return (
                                    <label key={team.id} className={`flex cursor-pointer items-start gap-3 border-b border-slate-100 px-4 py-3 ${checked ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                                        <input
                                            type="radio"
                                            name="selectedTeam"
                                            checked={checked}
                                            onChange={() => setSelectedTeamId(String(team.id))}
                                            className="mt-1 h-4 w-4"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-xs font-semibold text-slate-900">{team.name || `Team #${team.id}`}</p>
                                                <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
                                            </div>
                                            <p className="mt-0.5 text-[11px] text-slate-500">{team.memberCount || team.members?.length || 0} thành viên</p>
                                            <p className="mt-0.5 text-[11px] font-semibold text-indigo-700">
                                                Task đang có: {Number(team.activeTaskCount || 0)}
                                            </p>
                                            {Number.isFinite(Number(team.currentLatitude)) && Number.isFinite(Number(team.currentLongitude)) && (
                                                <p className="mt-0.5 text-[11px] text-blue-700">
                                                    GPS: {Number(team.currentLatitude).toFixed(6)}, {Number(team.currentLongitude).toFixed(6)}
                                                </p>
                                            )}
                                        </div>
                                    </label>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col bg-slate-100">
                    <div className="z-10 border-b border-slate-200 bg-white px-4 py-3">
                        <div className="grid gap-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Điều phối / Phân công</p>
                                <h3 className="text-sm font-bold text-slate-900">Phân công yêu cầu đã xác minh cho đội cứu hộ</h3>
                                <p className="mt-0.5 text-xs text-slate-600">
                                    Chỉ hiển thị yêu cầu trạng thái VERIFIED để phân công.
                                </p>
                                {selectedRequest?.emergency && (
                                    <p className="mt-1 text-xs font-semibold text-amber-700">
                                        Trạng thái hàng đợi: {emergencyActionLabel(selectedRequest?.emergencyActionStatus) || 'CHỜ XỬ LÝ'}
                                    </p>
                                )}
                                {Number.isFinite(Number(selectedTeam?.currentLatitude)) && Number.isFinite(Number(selectedTeam?.currentLongitude)) && (
                                    <p className="mt-1 text-xs font-semibold text-blue-700">
                                        Vị trí đội được chọn: {Number(selectedTeam.currentLatitude).toFixed(6)}, {Number(selectedTeam.currentLongitude).toFixed(6)}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-slate-600">
                                    Tài sản khả dụng cho đội (phương tiện + thiết bị): {availableAssetsForTeam.length}
                                </p>
                                {blockedTeamId && (
                                    <p className="mt-1 text-xs font-semibold text-rose-700">
                                        Yêu cầu khẩn cấp: không thể phân công lại cho đội #{blockedTeamId} (đội đã gửi khẩn cấp).
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="min-h-[460px] flex-1">
                        <MapBox
                            center={mapCenter}
                            markerPosition={
                                Number.isFinite(Number(selectedRequest?.latitude || selectedRequest?.lat))
                                    && Number.isFinite(Number(selectedRequest?.longitude || selectedRequest?.lng))
                                    ? {
                                        lat: Number(selectedRequest?.latitude || selectedRequest?.lat),
                                        lng: Number(selectedRequest?.longitude || selectedRequest?.lng),
                                    }
                                    : undefined
                            }
                            additionalMarkers={
                                [
                                    ...(Number.isFinite(Number(selectedTeam?.currentLatitude))
                                        && Number.isFinite(Number(selectedTeam?.currentLongitude))
                                        ? [{
                                            lat: Number(selectedTeam.currentLatitude),
                                            lng: Number(selectedTeam.currentLongitude),
                                            title: `Vị trí đội ${selectedTeam?.name || selectedTeam?.code || selectedTeam?.id}`,
                                        }]
                                        : []),
                                    ...selectedRequests
                                        .slice(1)
                                        .map((req) => {
                                            const lat = Number(req?.latitude || req?.lat);
                                            const lng = Number(req?.longitude || req?.lng);
                                            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
                                            return {
                                                lat,
                                                lng,
                                                title: `Yêu cầu ${req?.code || `#${req?.id}`}`,
                                            };
                                        })
                                        .filter(Boolean),
                                ]
                            }
                            zoom={13}
                        />
                    </div>
                </div>

                <div className="flex w-[22rem] shrink-0 flex-col border-l border-slate-200">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">Yêu cầu VERIFIED</h2>
                                <p className="mt-0.5 text-xs text-slate-600">Chọn yêu cầu để xem map và phân công</p>
                            </div>
                            <label className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={mergeMode}
                                    onChange={(e) => setMergeMode(e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300"
                                />
                                Gộp
                            </label>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loadingRequests ? (
                            <div className="p-4 text-xs text-slate-500">Đang tải yêu cầu VERIFIED...</div>
                        ) : availableRequests.length === 0 ? (
                            <div className="p-4 text-xs text-slate-500">Không có yêu cầu VERIFIED.</div>
                        ) : (
                            availableRequests.map((request) => {
                                const checked = selectedRequestIds.includes(String(request.id));
                                const emergencyBadge = request.emergency
                                    ? (emergencyActionLabel(request.emergencyActionStatus) || 'KHẨN CẤP')
                                    : null;
                                return (
                                    <div key={request.id} className={`border-b border-slate-100 px-4 py-3 ${checked ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                                        <label className="flex cursor-pointer items-start gap-3">
                                            <input
                                                type={mergeMode ? 'checkbox' : 'radio'}
                                                name="selectedRequest"
                                                checked={checked}
                                                onChange={() => toggleRequestSelection(request.id)}
                                                className="mt-1 h-4 w-4"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="truncate text-xs font-semibold text-slate-900">{request.code || `Yêu cầu #${request.id}`}</p>
                                                    <Badge variant="success" size="sm">VERIFIED</Badge>
                                                </div>
                                                <p className="mt-0.5 text-[11px] text-slate-600">Địa chỉ: {request.addressText || 'Không có địa chỉ'}</p>
                                                <p className="mt-0.5 text-[11px] text-slate-500">Số người: {request.affectedPeopleCount ?? '-'}</p>
                                                {emergencyBadge && (
                                                    <p className="mt-0.5 text-[11px] font-semibold text-amber-700">{emergencyBadge}</p>
                                                )}
                                            </div>
                                        </label>
                                        <div className="mt-2 flex justify-end">
                                            <button
                                                type="button"
                                                className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-white"
                                                onClick={() => setDetailRequestId(String(request.id))}
                                            >
                                                Xem chi tiết
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <div className="max-h-[34vh] overflow-y-auto border-t border-slate-200 bg-white px-4 py-3">
                <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Chọn tài sản cho đội <span className="text-rose-600">*</span>
                    </label>
                    <p className="mt-1 text-xs text-slate-500">
                        Bao gồm mọi tài sản đã tạo ở trang Manager (cano, xe, thiết bị...). Bắt buộc chọn 1 tài sản khi phân công.
                    </p>
                    <select
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                        value={selectedAssetId}
                        onChange={(e) => setSelectedAssetId(e.target.value)}
                        disabled={!selectedTeamId || loadingResources}
                    >
                        <option value="">-- Chọn tài sản --</option>
                        {availableAssetsForTeam.map((asset) => {
                            const code = asset?.code || asset?.assetCode || `#${asset.id}`;
                            const name = asset?.name || asset?.assetName || 'Tài sản';
                            const status = String(asset?.status || '').toUpperCase();
                            const type = asset?.assetType || asset?.type || asset?.category || null;
                            const assignedTeamId = toNumberOrNull(
                                pickFirst(asset?.assignedTeamId, asset?.assigned_team_id, asset?.teamId)
                            );
                            const heldTag = assignedTeamId === toNumberOrNull(selectedTeamId) ? 'đang giữ' : 'rảnh';
                            return (
                                <option key={asset.id} value={String(asset.id)}>
                                    {code} - {name}{type ? ` - ${type}` : ''} ({status || 'N/A'}, {heldTag})
                                </option>
                            );
                        })}
                    </select>
                </div>

                <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">
                        {showMergedDetail ? 'Chi tiết yêu cầu gộp' : 'Chi tiết yêu cầu'}
                    </h4>
                    <span className="text-xs text-slate-500">
                        {showMergedDetail
                            ? `${selectedRequests.length} yêu cầu`
                            : (detailRequest ? (detailRequest.code || `#${detailRequest.id}`) : 'Chưa chọn')}
                    </span>
                </div>
                {showMergedDetail && mergedDetail ? (
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="min-w-full text-left text-xs">
                            <tbody>
                                <tr className="border-b border-slate-100">
                                    <th className="w-48 bg-slate-50 px-3 py-2 font-semibold text-slate-600">Mã yêu cầu</th>
                                    <td className="px-3 py-2 text-slate-800">{mergedDetail.code}</td>
                                    <th className="w-44 bg-slate-50 px-3 py-2 font-semibold text-slate-600">Tổng số người ảnh hưởng</th>
                                    <td className="px-3 py-2 text-slate-800">{mergedDetail.people}</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                    <th className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">Địa chỉ</th>
                                    <td className="whitespace-pre-line px-3 py-2 text-slate-800" colSpan={3}>{mergedDetail.address}</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                    <th className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">Mô tả vị trí</th>
                                    <td className="whitespace-pre-line px-3 py-2 text-slate-800" colSpan={3}>{mergedDetail.locationDescription}</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                    <th className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">Mô tả yêu cầu</th>
                                    <td className="whitespace-pre-line px-3 py-2 text-slate-800" colSpan={3}>{mergedDetail.description}</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                    <th className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">Tọa độ</th>
                                    <td className="whitespace-pre-line px-3 py-2 text-slate-800" colSpan={3}>{mergedDetail.coordinates}</td>
                                </tr>
                                <tr>
                                    <th className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">Ảnh đính kèm</th>
                                    <td className="px-3 py-2 text-slate-800" colSpan={3}>
                                        {mergedDetail.attachmentsCount > 0 ? `${mergedDetail.attachmentsCount} ảnh đính kèm` : 'Không có ảnh'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ) : !detailRequest ? (
                    <p className="text-xs text-slate-500">Chưa có yêu cầu để hiển thị chi tiết.</p>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="min-w-full text-left text-xs">
                            <tbody>
                                <tr className="border-b border-slate-100">
                                    <th className="w-48 bg-slate-50 px-3 py-2 font-semibold text-slate-600">Mã yêu cầu</th>
                                    <td className="px-3 py-2 text-slate-800">{detailRequest.code || `#${detailRequest.id}`}</td>
                                    <th className="w-44 bg-slate-50 px-3 py-2 font-semibold text-slate-600">Số người ảnh hưởng</th>
                                    <td className="px-3 py-2 text-slate-800">{detailRequest.affectedPeopleCount ?? detailRequest.peopleCount ?? '—'}</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                    <th className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">Địa chỉ</th>
                                    <td className="px-3 py-2 text-slate-800" colSpan={3}>{detailRequest.addressText || '—'}</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                    <th className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">Mô tả vị trí</th>
                                    <td className="px-3 py-2 text-slate-800" colSpan={3}>
                                        {detailRequest.locationDescription || detailRequest.citizenLocationDescription || '—'}
                                    </td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                    <th className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">Mô tả yêu cầu</th>
                                    <td className="px-3 py-2 text-slate-800" colSpan={3}>{detailRequest.description || '—'}</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                    <th className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">Tọa độ</th>
                                    <td className="px-3 py-2 text-slate-800" colSpan={3}>
                                        {Number.isFinite(Number(detailRequest.latitude || detailRequest.lat))
                                            && Number.isFinite(Number(detailRequest.longitude || detailRequest.lng))
                                            ? `${Number(detailRequest.latitude || detailRequest.lat).toFixed(6)}, ${Number(detailRequest.longitude || detailRequest.lng).toFixed(6)}`
                                            : '—'}
                                    </td>
                                </tr>
                                <tr>
                                    <th className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">Ảnh đính kèm</th>
                                    <td className="px-3 py-2 text-slate-800" colSpan={3}>
                                        {!Array.isArray(detailRequest.attachments) || detailRequest.attachments.length === 0
                                            ? 'Không có ảnh'
                                            : `${detailRequest.attachments.length} ảnh đính kèm`}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3">
                <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">ĐÃ CHỌN</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" />{selectedTeamId ? '1 đội' : '0 đội'}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{selectedRequests.length} yêu cầu VERIFIED</span>
                    <span className="inline-flex items-center gap-1">
                        {selectedAssetId ? '1 tài sản' : '0 tài sản'}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                        <X className="h-4 w-4" />Hủy
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOverloadOpen(true)}
                        disabled={overloading || !selectedRequest?.emergency || selectedRequests.length !== 1}
                    >
                        Quá tải
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleAssign} disabled={assigning || !selectedAssetId || (!taskGroupId && selectedRequests.length === 0)}>
                        <CheckCircle2 className="h-4 w-4" />
                        {assigning ? 'Đang phân công...' : 'Phân công nhiệm vụ'}
                    </Button>
                </div>
            </div>

            {overloadOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
                        <h3 className="text-sm font-bold text-slate-900">Báo quá tải yêu cầu khẩn cấp</h3>
                        <p className="mt-1 text-xs text-slate-600">
                            Gửi thông báo cho rescuer rằng hiện không còn đội rảnh và yêu cầu tiếp tục ở trạng thái đang đợi.
                        </p>
                        <textarea
                            rows={4}
                            value={overloadNote}
                            onChange={(e) => setOverloadNote(e.target.value)}
                            placeholder="Nhập mô tả chi tiết tình trạng quá tải..."
                            className="mt-3 w-full rounded-lg border border-slate-200 p-2 text-sm"
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                onClick={() => setOverloadOpen(false)}
                                disabled={overloading}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                                onClick={handleOverload}
                                disabled={overloading}
                            >
                                {overloading ? 'Đang gửi...' : 'Xác nhận quá tải'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
