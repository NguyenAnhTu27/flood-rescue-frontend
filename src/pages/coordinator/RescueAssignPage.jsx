import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Car, MapPin, CheckCircle2, X, Target, Plus, Minus } from 'lucide-react';

import GoogleMap from '../../features/map/components/GoogleMap.jsx';
import Button from '../../shared/ui/Button.jsx';
import Badge from '../../shared/ui/Badge.jsx';
import { getTeams } from '../../features/teams/api.js';
import { getAssets } from '../../features/assets/api.js';
import {
    assignTaskGroup,
    createTaskGroup,
    getCoordinatorRescueQueue,
    changeRescueRequestStatus,
} from '../../features/coordinator/api.js';
import { COORDINATOR_ROUTES } from '../../app/routes/route.constants.js';

// Mock assets data từ AssetsManagementPage
const mockAssets = [
    { id: '1', code: '#CN-042', name: 'Cano Cứu Hộ #CN-042', licensePlate: '#CN-042', type: 'canoe', assetType: 'BOAT', status: 'AVAILABLE', location: 'Bến Chương Dương, Quận 1', capacity: 8 },
    { id: '2', code: '#AM-108', name: 'Xe Lội Nước #AM-108', licensePlate: '#AM-108', type: 'water-vehicle', assetType: 'TRUCK', status: 'AVAILABLE', location: 'Huyện Bình Chánh, TPHCM', capacity: 12 },
    { id: '3', code: '#GEN-22', name: 'Máy Phát Điện #GEN-22', licensePlate: '#GEN-22', type: 'generator', assetType: 'GENERATOR', status: 'AVAILABLE', location: 'Kho Tổng Thủ Đức', capacity: 0 },
    { id: '4', code: '#CN-091', name: 'Cano Phao #CN-091', licensePlate: '#CN-091', type: 'canoe', assetType: 'BOAT', status: 'AVAILABLE', location: 'Bến Ninh Kiều, Cần Thơ', capacity: 10 },
    { id: '5', code: '#AM-202', name: 'Xe Lội Nước #AM-202', licensePlate: '#AM-202', type: 'water-vehicle', assetType: 'TRUCK', status: 'AVAILABLE', location: 'Kho Tổng Thủ Đức', capacity: 15 },
    { id: '6', code: '#GEN-07', name: 'Máy Phát Điện #GEN-07', licensePlate: '#GEN-07', type: 'generator', assetType: 'GENERATOR', status: 'AVAILABLE', location: 'Trạm y tế xã Phong Nha', capacity: 0 },
];

export default function RescueAssignPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // Nhận request data từ location.state (có thể là 1 request hoặc nhiều requests)
    const initialRequests = Array.isArray(location.state?.requests)
        ? location.state.requests
        : location.state?.request
            ? [location.state.request]
            : [];
    const taskGroupId = location.state?.taskGroupId || null;

    // State nhiệm vụ (request) để phân công
    const [requests, setRequests] = useState(initialRequests);
    const [availableRequests, setAvailableRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState(
        initialRequests?.[0]?.id ? String(initialRequests[0].id) : ''
    );

    // State cho teams và assets
    const [teams, setTeams] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    // State cho selection
    const [selectedTeamIds, setSelectedTeamIds] = useState([]);
    const [selectedAssetIds, setSelectedAssetIds] = useState([]);
    const [assigning, setAssigning] = useState(false);

    // Tính toán vị trí trung tâm từ requests
    const mapCenter = requests.length > 0
        ? {
            lat: requests[0].latitude ?? requests[0].lat ?? 16.0544,
            lng: requests[0].longitude ?? requests[0].lng ?? 108.2022,
        }
        : { lat: 16.0544, lng: 108.2022 }; // Default: Da Nang

    // Log để debug
    useEffect(() => {
        console.log('[RescueAssignPage] Initial data from location.state:', {
            requests: initialRequests,
            taskGroupId,
            locationState: location.state,
        });
    }, [initialRequests, taskGroupId, location.state]);

    // Nếu đi vào trang này mà không truyền request/taskGroupId từ trang trước,
    // thì cần tải danh sách yêu cầu để user chọn "nhiệm vụ" cần phân công.
    useEffect(() => {
        const shouldLoad = !taskGroupId && (!Array.isArray(initialRequests) || initialRequests.length === 0);
        if (!shouldLoad) {
            // Nếu đã có requests từ location.state, set vào state luôn
            if (initialRequests.length > 0) {
                console.log('[RescueAssignPage] Using requests from location.state:', initialRequests);
                setRequests(initialRequests);
                setSelectedRequestId(String(initialRequests[0].id));
            }
            return;
        }

        const loadRequests = async () => {
            try {
                setLoadingRequests(true);
                console.log('[RescueAssignPage] Loading pending requests...');

                // Thử load không filter status trước, nếu không có thì thử với PENDING
                let data;
                try {
                    data = await getCoordinatorRescueQueue({
                        page: 0,
                        size: 50
                    });
                } catch (err) {
                    // Nếu lỗi, thử với status PENDING
                    console.log('[RescueAssignPage] Retrying with PENDING status filter...');
                    data = await getCoordinatorRescueQueue({
                        status: 'PENDING',
                        page: 0,
                        size: 50
                    });
                }

                console.log('[RescueAssignPage] Raw response from API:', data);

                // Handle different response formats
                let list = [];
                if (Array.isArray(data)) {
                    list = data;
                } else if (data?.content && Array.isArray(data.content)) {
                    list = data.content;
                } else if (data?.data) {
                    if (Array.isArray(data.data)) {
                        list = data.data;
                    } else if (data.data?.content && Array.isArray(data.data.content)) {
                        list = data.data.content;
                    } else if (data.data?.items && Array.isArray(data.data.items)) {
                        list = data.data.items;
                    }
                } else if (data?.items && Array.isArray(data.items)) {
                    list = data.items;
                } else if (data?.list && Array.isArray(data.list)) {
                    list = data.list;
                }

                // Filter chỉ lấy PENDING nếu có
                if (list.length > 0) {
                    const pendingOnly = list.filter(r =>
                        !r.status || r.status === 'PENDING' || r.status === 'pending'
                    );
                    list = pendingOnly.length > 0 ? pendingOnly : list;
                }

                console.log('[RescueAssignPage] Parsed requests list:', list);
                setAvailableRequests(Array.isArray(list) ? list : []);

                if (list.length === 0) {
                    console.warn('[RescueAssignPage] No requests found. Response was:', data);
                } else {
                    console.log(`[RescueAssignPage] Loaded ${list.length} requests successfully`);
                }
            } catch (e) {
                console.error('[RescueAssignPage] Error loading pending requests:', e);
                console.error('[RescueAssignPage] Error details:', {
                    message: e?.message,
                    status: e?.status,
                    data: e?.data,
                    fullError: e,
                });
                setAvailableRequests([]);
                // Show error to user
                if (e?.message) {
                    console.error('[RescueAssignPage] Error message:', e.message);
                }
            } finally {
                setLoadingRequests(false);
            }
        };

        loadRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // Khi user chọn 1 request trong dropdown → set nhiệm vụ đang phân công
        if (!selectedRequestId) return;
        const found = availableRequests.find((r) => String(r.id) === String(selectedRequestId));
        if (found) {
            console.log('[RescueAssignPage] Selected request from dropdown:', found);
            setRequests([found]);
        }
    }, [selectedRequestId, availableRequests]);

    // Khi có requests từ location.state, cập nhật availableRequests để dropdown có thể hiển thị
    useEffect(() => {
        if (initialRequests.length > 0 && availableRequests.length === 0) {
            console.log('[RescueAssignPage] Setting availableRequests from initialRequests:', initialRequests);
            setAvailableRequests(initialRequests);
        }
    }, [initialRequests, availableRequests.length]);

    // Load teams và assets từ DB (giống như AssetsManagementPage)
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                console.log('[RescueAssignPage] Loading teams and assets...');

                // Load teams
                let teamsList = [];
                try {
                    const teamsData = await getTeams();
                    console.log('[RescueAssignPage] Teams response:', teamsData);

                    if (Array.isArray(teamsData)) {
                        teamsList = teamsData;
                    } else if (Array.isArray(teamsData?.data)) {
                        teamsList = teamsData.data;
                    } else if (Array.isArray(teamsData?.content)) {
                        teamsList = teamsData.content;
                    } else if (Array.isArray(teamsData?.items)) {
                        teamsList = teamsData.items;
                    }
                    console.log('[RescueAssignPage] Parsed teams:', teamsList.length);
                } catch (e) {
                    console.error('[RescueAssignPage] Error loading teams:', e);
                }

                // Load assets từ API (giống hệt AssetsManagementPage)
                let assetsList = [];
                try {
                    // Gọi API không filter để lấy tất cả (giống AssetsManagementPage)
                    const assetsData = await getAssets();
                    console.log('[RescueAssignPage] Assets API response:', assetsData);

                    // Parse response format (giống hệt AssetsManagementPage)
                    if (Array.isArray(assetsData)) {
                        assetsList = assetsData;
                    } else if (Array.isArray(assetsData?.content)) {
                        assetsList = assetsData.content;
                    } else if (Array.isArray(assetsData?.data)) {
                        assetsList = assetsData.data;
                    } else if (Array.isArray(assetsData?.items)) {
                        assetsList = assetsData.items;
                    }

                    console.log('[RescueAssignPage] Parsed assets from API:', assetsList.length);

                    // Map dữ liệu từ API để đảm bảo có đủ field cho UI
                    if (assetsList.length > 0) {
                        assetsList = assetsList.map((asset) => ({
                            ...asset,
                            id: asset.id,
                            code: asset.code || asset.assetCode || asset.licensePlate || `#PT-${asset.id}`,
                            name: asset.name || asset.typeLabel || asset.type || 'Phương tiện',
                            licensePlate: asset.licensePlate || asset.code || asset.assetCode || 'N/A',
                            status: asset.status || 'AVAILABLE',
                            assetType: asset.assetType || asset.type?.toUpperCase() || asset.category,
                            capacity: asset.capacity || asset.capacityPercent || 0,
                        }));
                    }
                } catch (e) {
                    console.warn('[RescueAssignPage] Could not load assets from API:', e);
                    // Nếu API fail, dùng mock data (giống AssetsManagementPage)
                    assetsList = [];
                }

                // Nếu không có assets từ API, dùng mock data (giống AssetsManagementPage)
                if (assetsList.length === 0) {
                    console.warn('[RescueAssignPage] No assets from API, using mock data');
                    assetsList = mockAssets.map((asset) => ({
                        ...asset,
                        id: asset.id,
                        code: asset.code || asset.licensePlate,
                        name: asset.name || 'Phương tiện',
                        licensePlate: asset.licensePlate || asset.code,
                        status: asset.status || 'AVAILABLE',
                        assetType: asset.assetType || asset.type?.toUpperCase(),
                        capacity: asset.capacity || 0,
                    }));
                }

                setTeams(teamsList);
                setAssets(assetsList);

                console.log('[RescueAssignPage] Final assets list:', assetsList.length, assetsList);
            } catch (error) {
                console.error('[RescueAssignPage] Error loading data:', error);
                // Fallback: dùng mock data nếu có lỗi
                setAssets(mockAssets);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Toggle team selection
    const toggleTeam = (teamId) => {
        setSelectedTeamIds((prev) =>
            prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
        );
    };

    // Toggle asset selection
    const toggleAsset = (assetId) => {
        setSelectedAssetIds((prev) =>
            prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
        );
    };

    // Tính khoảng cách (mock - có thể thay bằng tính toán thực tế từ coordinates)
    const calculateDistance = (item) => {
        // Mock distance - trong thực tế sẽ tính từ vị trí item đến vị trí request
        if (item.distance !== undefined) return item.distance;
        return (Math.random() * 5).toFixed(1);
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const statusMap = {
            AVAILABLE: { label: 'RẢNH', variant: 'success' },
            BUSY: { label: 'ĐANG LÀM', variant: 'warning' },
            ON_MISSION: { label: 'ĐANG LÀM', variant: 'warning' },
            MAINTENANCE: { label: 'BẢO TRÌ', variant: 'error' },
        };
        return statusMap[status] || { label: status, variant: 'default' };
    };

    // Handle assign task
    const handleAssign = async () => {
        if (selectedTeamIds.length === 0) {
            window.alert('Vui lòng chọn ít nhất một đội cứu hộ.');
            return;
        }

        if (!taskGroupId && (!requests || requests.length === 0)) {
            window.alert('Không có nhiệm vụ để phân công. Hãy chọn 1 yêu cầu cứu hộ trước.');
            return;
        }

        try {
            setAssigning(true);

            // Nếu đã có sẵn taskGroupId (ví dụ từ màn hình khác truyền sang) thì chỉ cần gán đội + phương tiện
            if (taskGroupId) {
                for (const teamId of selectedTeamIds) {
                    const assetId = selectedAssetIds.length > 0 ? selectedAssetIds[0] : null;
                    await assignTaskGroup({
                        taskGroupId,
                        teamId,
                        assetId,
                    });
                }
            } else if (requests.length > 0) {
                // 1) Tạo task group mới từ danh sách yêu cầu đang chọn
                const requestIds = requests.map((r) => r.id).filter(Boolean);
                if (requestIds.length === 0) {
                    window.alert('Không tìm thấy ID yêu cầu cứu hộ hợp lệ để tạo nhóm nhiệm vụ.');
                    return;
                }

                const primaryTeamId = selectedTeamIds[0];

                const created = await createTaskGroup({
                    rescueRequestIds: requestIds,
                    assignedTeamId: primaryTeamId,
                    // Có thể thêm note nếu cần: note: 'Gom nhóm từ màn hình phân công'
                });

                // Lấy id task group từ nhiều format response khác nhau
                const newTaskGroupId =
                    created?.id ||
                    created?.taskGroupId ||
                    created?.groupId ||
                    created?.data?.id ||
                    created?.data?.taskGroupId;

                if (!newTaskGroupId) {
                    console.error('[RescueAssignPage] Cannot determine new taskGroupId from response:', created);
                    window.alert('Tạo nhóm nhiệm vụ thất bại: không lấy được mã nhóm nhiệm vụ từ phản hồi BE.');
                    return;
                }

                console.log('[RescueAssignPage] Created task group successfully with id:', newTaskGroupId);

                // 2) Gán các đội & phương tiện vào task group vừa tạo
                for (const teamId of selectedTeamIds) {
                    const assetId = selectedAssetIds.length > 0 ? selectedAssetIds[0] : null;
                    await assignTaskGroup({
                        taskGroupId: newTaskGroupId,
                        teamId,
                        assetId,
                    });
                }
            }

            // Sau khi gán đội & phương tiện thành công, cập nhật trạng thái các yêu cầu trong DB
            const requestIdsToUpdate = (requests || []).map((r) => r.id).filter(Boolean);
            for (const reqId of requestIdsToUpdate) {
                try {
                    // Đưa yêu cầu sang trạng thái IN_PROGRESS để không còn là PENDING trong hàng đợi
                    await changeRescueRequestStatus(reqId, 'IN_PROGRESS');
                } catch (e) {
                    console.error('[RescueAssignPage] Cannot change status for request', reqId, e);
                }
            }

            // Sau khi phân công xong, loại bỏ các yêu cầu vừa được gán khỏi danh sách chọn ở dropdown
            if (!taskGroupId && Array.isArray(requests) && requests.length > 0) {
                const usedIds = requests
                    .map((r) => (r && r.id != null ? String(r.id) : null))
                    .filter(Boolean);

                if (usedIds.length > 0) {
                    setAvailableRequests((prev) =>
                        prev.filter((r) => !usedIds.includes(String(r.id)))
                    );
                }
            }

            window.alert('Phân công nhiệm vụ (gộp đội & phương tiện) thành công!');
            // Quay về dashboard của điều phối viên và reload dữ liệu
            navigate(COORDINATOR_ROUTES.DASHBOARD, {
                state: { refresh: true }, // Signal để dashboard reload
            });
        } catch (error) {
            console.error('[RescueAssignPage] Error assigning task:', error);
            window.alert('Không thể phân công nhiệm vụ. Vui lòng thử lại sau.');
        } finally {
            setAssigning(false);
        }
    };

    // Tính thời gian phản hồi dự kiến (mock)
    const estimatedResponseTime = '~ 12 phút';

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col gap-0 overflow-hidden">
            {/* Main content: 3 columns */}
            <div className="flex flex-1 gap-0 overflow-hidden">
                {/* Left: Đội cứu hộ */}
                <div className="flex w-80 flex-col border-r border-slate-200 bg-white">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                        <h2 className="text-sm font-bold text-slate-900">Đội cứu hộ</h2>
                        <p className="mt-0.5 text-xs text-slate-600">Chọn các đội để phân công</p>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center p-8">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                            </div>
                        ) : teams.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-500">Chưa có đội cứu hộ nào</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {teams.map((team) => {
                                    const isSelected = selectedTeamIds.includes(team.id);
                                    const statusBadge = getStatusBadge(team.status || 'AVAILABLE');
                                    const distance = calculateDistance(team);

                                    return (
                                        <label
                                            key={team.id}
                                            className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-slate-50 ${isSelected ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleTeam(team.id)}
                                                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <div className="text-xs font-semibold text-slate-900">
                                                            {team.name || 'Đội cứu hộ'}
                                                        </div>
                                                        <div className="mt-0.5 text-[11px] text-slate-600">
                                                            {team.specialization || team.description || 'Cứu hộ nước'}
                                                        </div>
                                                    </div>
                                                    <Badge variant={statusBadge.variant} size="sm">
                                                        {statusBadge.label}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                                    <span>{distance} km</span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {team.memberCount || team.members?.length || 5} thành viên
                                                    </span>
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Center: Map */}
                <div className="relative flex-1 flex flex-col bg-slate-100">
                    {/* Map Header */}
                    <div className="absolute left-0 right-0 top-0 z-10 bg-white/95 px-4 py-2 shadow-sm backdrop-blur">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    ĐIỀU PHỐI / PHÂN CÔNG
                                </div>
                                <div className="mt-0.5 text-sm font-bold text-slate-900">Phân công Đội & Phương tiện</div>
                                <div className="mt-0.5 text-xs text-slate-600">
                                    {requests.length > 0
                                        ? `Gom nhóm ${requests.length} yêu cầu tại ${requests[0].addressText || requests[0].address || 'Quận Liên Chiểu'}`
                                        : 'Chọn đội và phương tiện để phân công nhiệm vụ'}
                                </div>
                            </div>
                            {!taskGroupId && (
                                <div className="min-w-[260px]">
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        {requests.length > 0 ? 'Yêu cầu đã chọn' : 'Chọn yêu cầu cần phân công'}
                                    </div>
                                    <select
                                        className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
                                        value={selectedRequestId}
                                        onChange={(e) => {
                                            const newId = e.target.value;
                                            setSelectedRequestId(newId);
                                            if (newId) {
                                                const found = availableRequests.find((r) => String(r.id) === String(newId));
                                                if (found) {
                                                    setRequests([found]);
                                                }
                                            } else {
                                                setRequests([]);
                                            }
                                        }}
                                        disabled={loadingRequests}
                                    >
                                        <option value="">
                                            {loadingRequests
                                                ? 'Đang tải danh sách...'
                                                : availableRequests.length === 0
                                                    ? '-- Không có yêu cầu --'
                                                    : '-- Chọn yêu cầu --'}
                                        </option>
                                        {availableRequests.map((r) => {
                                            const requestCode = r.code || r.requestCode || `#${r.id}`;
                                            const peopleCount = r.affectedPeopleCount || r.peopleCount || r.numberOfPeople || '-';
                                            const address = r.addressText || r.address || '';
                                            const isSelected = String(r.id) === selectedRequestId;
                                            return (
                                                <option key={r.id} value={String(r.id)}>
                                                    {isSelected ? '✓ ' : ''}{requestCode} • {peopleCount} người {address ? `• ${address.substring(0, 20)}` : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    {!loadingRequests && availableRequests.length === 0 && (
                                        <div className="mt-1 text-[10px] text-amber-600">
                                            Không có yêu cầu PENDING. Vui lòng kiểm tra lại.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Map */}
                    <div className="flex-1 pt-16">
                        <GoogleMap center={mapCenter} zoom={13} />
                    </div>

                    {/* Map Controls (mock) */}
                    <div className="absolute right-4 top-20 z-10 flex flex-col gap-1 rounded-lg border border-slate-200 bg-white shadow-md">
                        <button className="p-2 text-slate-600 hover:bg-slate-50">
                            <Plus className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-slate-600 hover:bg-slate-50">
                            <Minus className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-slate-600 hover:bg-slate-50">
                            <Target className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Right: Phương tiện */}
                <div className="flex w-80 flex-col border-l border-slate-200 bg-white">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                        <h2 className="text-sm font-bold text-slate-900">Phương tiện</h2>
                        <p className="mt-0.5 text-xs text-slate-600">Chọn phương tiện hỗ trợ</p>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center p-8">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                            </div>
                        ) : assets.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-500">Chưa có phương tiện nào</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {assets.map((asset) => {
                                    const isSelected = selectedAssetIds.includes(asset.id);
                                    const statusBadge = getStatusBadge(asset.status || 'AVAILABLE');
                                    const distance = calculateDistance(asset);

                                    return (
                                        <label
                                            key={asset.id}
                                            className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-slate-50 ${isSelected ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleAsset(asset.id)}
                                                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <div className="text-xs font-semibold text-slate-900">
                                                            {asset.name || 'Phương tiện'}
                                                        </div>
                                                        <div className="mt-0.5 text-[11px] text-slate-600">
                                                            Biển số: {asset.licensePlate || asset.code || 'N/A'}
                                                        </div>
                                                    </div>
                                                    <Badge variant={statusBadge.variant} size="sm">
                                                        {statusBadge.label}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                                    <span>{distance} km</span>
                                                    {asset.capacity && <span>{asset.capacity} người</span>}
                                                    {asset.assetType === 'BOAT' && <span>Đường thủy</span>}
                                                    {asset.status === 'MAINTENANCE' && (
                                                        <span className="text-amber-600">Dự kiến: 2h tới</span>
                                                    )}
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3">
                {/* Left: Summary */}
                <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-slate-700">ĐÃ CHỌN</span>
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Users className="h-4 w-4" />
                        <span>{selectedTeamIds.length} Đội</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Car className="h-4 w-4" />
                        <span>{selectedAssetIds.length} Phương tiện</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                        <MapPin className="h-4 w-4" />
                        <span>{requests.length} Yêu cầu</span>
                    </div>
                </div>

                {/* Center: Estimated time */}
                <div className="text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        THỜI GIAN PHẢN HỒI DỰ KIẾN
                    </div>
                    <div className="mt-0.5 text-sm font-bold text-blue-600">{estimatedResponseTime}</div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                        <X className="h-4 w-4" />
                        Hủy bỏ
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleAssign} disabled={assigning}>
                        <CheckCircle2 className="h-4 w-4" />
                        {assigning ? 'Đang phân công...' : 'Phân công Nhiệm vụ'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
