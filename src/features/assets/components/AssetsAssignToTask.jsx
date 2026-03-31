import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Check, Filter, Truck, Sailboat, Zap, MapPin, Clock, Navigation } from 'lucide-react';
import { MANAGER_ROUTES } from '../../../app/routes/route.constants.js';
import GoogleMap from '../../map/components/MapBox.jsx';
import { getAssets } from '../api.js';
import { getTaskGroupById, assignTaskGroup } from '../../coordinator/api.js';
import { listReliefRequests, getReliefRequest } from '../../relief/api.js';

const VEHICLE_ICONS = {
    truck: Truck,
    canoe: Sailboat,
    generator: Zap,
};

export default function AssetsAssignToTask() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const taskIdFromParams = searchParams.get('taskId');
    const taskCodeFromParams = searchParams.get('code'); // mã yêu cầu/mã nhiệm vụ truyền từ danh sách yêu cầu

    const [reliefRequests, setReliefRequests] = useState([]);
    const [selectedRequestCode, setSelectedRequestCode] = useState(taskCodeFromParams || '');
    const [taskId, setTaskId] = useState(taskIdFromParams || null);
    const [task, setTask] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicles, setSelectedVehicles] = useState([]);
    const [mapView, setMapView] = useState('terrain'); // 'satellite' or 'terrain'
    const [mapCenter, setMapCenter] = useState({ lat: 16.0544, lng: 108.2022 });
    const [, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [error, setError] = useState(null);

    // Load danh sách relief requests để hiển thị trong dropdown
    useEffect(() => {
        const loadReliefRequests = async () => {
            try {
                setLoadingRequests(true);
                const data = await listReliefRequests({ page: 0, size: 100 }); // Lấy tối đa 100 requests

                let requestsList = [];
                if (Array.isArray(data)) requestsList = data;
                else if (Array.isArray(data?.content)) requestsList = data.content;
                else if (Array.isArray(data?.data)) requestsList = data.data;
                else if (Array.isArray(data?.items)) requestsList = data.items;

                setReliefRequests(requestsList);

                // Nếu có code từ params và chưa có selectedRequestCode, set nó
                if (taskCodeFromParams && !selectedRequestCode) {
                    setSelectedRequestCode(taskCodeFromParams);
                    // Tìm request tương ứng và set taskId
                    const foundRequest = requestsList.find(
                        (req) => req.code === taskCodeFromParams || req.id === taskCodeFromParams
                    );
                    if (foundRequest) {
                        setTaskId(foundRequest.id);
                    }
                }
            } catch (e) {
                console.warn('[AssetsAssignToTask] Could not load relief requests:', e);
                setReliefRequests([]);
            } finally {
                setLoadingRequests(false);
            }
        };

        loadReliefRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load task info & available vehicles từ BE
    useEffect(() => {
        const loadData = async () => {
            // Nếu không có taskId và không có selectedRequestCode, không load
            if (!taskId && !selectedRequestCode) {
                setLoadingData(false);
                return;
            }

            // Nếu có selectedRequestCode nhưng reliefRequests chưa load xong, đợi
            if (selectedRequestCode && reliefRequests.length === 0 && loadingRequests) {
                return;
            }

            try {
                setLoadingData(true);
                setError(null);

                let taskData = null;
                let numericTaskId = null;
                let currentTaskId = taskId;

                // Nếu có selectedRequestCode, tìm request tương ứng và lấy taskId
                if (selectedRequestCode && reliefRequests.length > 0) {
                    const selectedRequest = reliefRequests.find(
                        (req) => req.code === selectedRequestCode || req.id === selectedRequestCode
                    );
                    if (selectedRequest) {
                        numericTaskId = Number(selectedRequest.id);
                        currentTaskId = selectedRequest.id;
                        if (taskId !== selectedRequest.id) {
                            setTaskId(selectedRequest.id);
                        }

                        // Thử load task group từ taskId
                        try {
                            if (Number.isFinite(numericTaskId)) {
                                taskData = await getTaskGroupById(numericTaskId);
                            }
                        } catch (e) {
                            console.warn('[AssetsAssignToTask] Could not load task group, trying relief request:', e);
                            // Nếu không tìm thấy task group, thử load relief request
                            try {
                                const reliefReq = await getReliefRequest(selectedRequest.id);
                                taskData = reliefReq;
                            } catch (e2) {
                                console.warn('[AssetsAssignToTask] Could not load relief request:', e2);
                            }
                        }
                    }
                } else if (taskId) {
                    // Nếu có taskId trực tiếp, load task group
                    numericTaskId = Number(taskId);
                    currentTaskId = taskId;
                    if (Number.isFinite(numericTaskId)) {
                        try {
                            taskData = await getTaskGroupById(numericTaskId);
                        } catch (e) {
                            console.warn('[AssetsAssignToTask] Could not load task group:', e);
                        }
                    }
                }

                // Load available vehicles
                const assetsRes = await Promise.allSettled([getAssets({ status: 'available' })]);

                // Task info
                if (taskData) {
                    const t = taskData;
                    const mappedTask = {
                        id: t.id || currentTaskId || numericTaskId,
                        code: selectedRequestCode || t.code || t.taskCode || t.id || currentTaskId,
                        title: t.title || t.name || t.description || '',
                        location: t.location || t.area || t.address || '',
                        priority: t.priority || t.priorityLevel || '',
                        reliefType: t.reliefType || t.reliefCategory || '',
                        weight: t.totalWeight || t.estimatedWeight || '',
                        image: t.imageUrl || '',
                        lat: t.lat || t.latitude || 16.0544,
                        lng: t.lng || t.longitude || 108.2022,
                    };
                    setTask(mappedTask);
                    setMapCenter({ lat: mappedTask.lat, lng: mappedTask.lng });
                } else if (selectedRequestCode && reliefRequests.length > 0) {
                    // Nếu không load được task data, dùng thông tin từ selected request
                    const selectedRequest = reliefRequests.find(
                        (req) => req.code === selectedRequestCode || req.id === selectedRequestCode
                    );
                    if (selectedRequest) {
                        const mappedTask = {
                            id: selectedRequest.id,
                            code: selectedRequest.code || selectedRequest.id,
                            title: `Yêu cầu cứu trợ ${selectedRequest.code || selectedRequest.id}`,
                            location: selectedRequest.area || selectedRequest.location || '',
                            priority: selectedRequest.priority || '',
                            reliefType: selectedRequest.items?.map((i) => (typeof i === 'string' ? i : i.name)).join(', ') || '',
                            weight: selectedRequest.totalWeight || selectedRequest.estimatedWeight || '',
                            image: '',
                            lat: selectedRequest.latitude || 16.0544,
                            lng: selectedRequest.longitude || 108.2022,
                        };
                        setTask(mappedTask);
                        setMapCenter({ lat: mappedTask.lat, lng: mappedTask.lng });
                    }
                }

                // Assets list
                if (assetsRes[0].status === 'fulfilled') {
                    const data = assetsRes[0].value;
                    let list = [];
                    if (Array.isArray(data)) list = data;
                    else if (Array.isArray(data?.content)) list = data.content;
                    else if (Array.isArray(data?.data)) list = data.data;
                    else if (Array.isArray(data?.items)) list = data.items;

                    const mappedVehicles = list.map((asset) => ({
                        id: asset.id,
                        code: asset.code || asset.assetCode || `AS-${asset.id}`,
                        type: asset.typeLabel || asset.type || asset.name || 'Phương tiện',
                        driver: asset.driverName || asset.contactName || 'Chưa gán lái xe',
                        distance: asset.distanceKm ?? null,
                        time: asset.etaMinutes ?? null,
                        capacity: asset.capacityPercent ?? null,
                        status: asset.status || 'available',
                        statusLabel:
                            asset.statusLabel ||
                            (asset.status === 'in-use'
                                ? 'Đang dùng'
                                : asset.status === 'maintenance'
                                    ? 'Bảo trì'
                                    : 'Sẵn sàng'),
                        lat: asset.lat || asset.latitude || 16.0544,
                        lng: asset.lng || asset.longitude || 108.2022,
                        vehicleType: asset.category || asset.type || 'truck',
                    }));

                    setVehicles(mappedVehicles);
                } else {
                    setVehicles([]);
                }
            } catch (e) {
                console.error('[AssetsAssignToTask] Load data error:', e);
                setError(e?.message || 'Không thể tải dữ liệu nhiệm vụ / phương tiện.');
                setVehicles([]);
            } finally {
                setLoadingData(false);
            }
        };

        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taskId, selectedRequestCode, reliefRequests.length]);

    const handleSelectVehicle = (vehicle) => {
        setSelectedVehicles((prev) => {
            const isSelected = prev.some((v) => v.id === vehicle.id);
            if (isSelected) {
                return prev.filter((v) => v.id !== vehicle.id);
            } else {
                return [...prev, vehicle];
            }
        });
    };

    const handleConfirm = async () => {
        if (selectedVehicles.length === 0) {
            window.alert('Vui lòng chọn ít nhất một phương tiện');
            return;
        }
        try {
            setLoading(true);
            setError(null);

            const numericTaskId = Number(taskId);
            if (!Number.isFinite(numericTaskId)) {
                throw new Error('Không tìm thấy taskGroupId hợp lệ để gán phương tiện.');
            }
            if (Number.isFinite(numericTaskId)) {
                await Promise.all(
                    selectedVehicles.map((v) =>
                        assignTaskGroup({
                            taskGroupId: numericTaskId,
                            teamId: null,
                            assetId: v.id,
                            note: null,
                        }),
                    ),
                );
            }

            window.alert(`Đã gán ${selectedVehicles.length} phương tiện vào nhiệm vụ ${taskId}`);
            navigate(MANAGER_ROUTES.ASSETS_MANAGEMENT);
        } catch (e) {
            console.error('[AssetsAssignToTask] Assign error:', e);
            const msg =
                e?.status === 403
                    ? 'Bạn không có quyền phân công phương tiện cho nhiệm vụ này (403).'
                    : e?.message || 'Không thể gán phương tiện. Vui lòng thử lại.';
            setError(msg);
            window.alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAssign = async (vehicle) => {
        setSelectedVehicles([vehicle]);
        try {
            setLoading(true);
            setError(null);

            const numericTaskId = Number(taskId);
            if (!Number.isFinite(numericTaskId)) {
                throw new Error('Không tìm thấy taskGroupId hợp lệ để gán phương tiện.');
            }
            if (Number.isFinite(numericTaskId)) {
                await assignTaskGroup({
                    taskGroupId: numericTaskId,
                    teamId: null,
                    assetId: vehicle.id,
                    note: null,
                });
            }

            window.alert(`Đã gán phương tiện ${vehicle.code} vào nhiệm vụ ${taskId}`);
            navigate(MANAGER_ROUTES.ASSETS_MANAGEMENT);
        } catch (e) {
            console.error('[AssetsAssignToTask] Quick assign error:', e);
            const msg =
                e?.status === 403
                    ? 'Bạn không có quyền phân công phương tiện cho nhiệm vụ này (403).'
                    : e?.message || 'Không thể gán phương tiện. Vui lòng thử lại.';
            setError(msg);
            window.alert(msg);
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <p className="text-slate-500">Đang tải dữ liệu nhiệm vụ và phương tiện...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-slate-50">
            {/* Header */}
            <div className="border-b border-slate-200 bg-white px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <nav className="mb-2 text-xs text-slate-500">
                            Trang chủ / Nhiệm vụ cứu trợ / Điều phối phương tiện
                        </nav>
                        <h1 className="text-2xl font-bold text-slate-900">Gán Phương tiện vào Nhiệm vụ</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Chọn phương tiện phù hợp để gán vào nhiệm vụ cứu trợ
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate(MANAGER_ROUTES.ASSETS_MANAGEMENT)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Quay lại
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedVehicles.length === 0}
                            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Check className="h-4 w-4" />
                            Xác nhận Gán phương tiện
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="border-b border-slate-200 bg-rose-50 px-6 py-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-96 overflow-y-auto border-r border-slate-200 bg-white">
                    {/* Task Details */}
                    <div className="border-b border-slate-200 p-5">
                        <div className="mb-3">
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Chọn mã yêu cầu cứu trợ:
                            </label>
                            <select
                                value={selectedRequestCode}
                                onChange={(e) => {
                                    const code = e.target.value;
                                    setSelectedRequestCode(code);
                                    // Tìm request tương ứng và set taskId
                                    const selectedRequest = reliefRequests.find(
                                        (req) => req.code === code || req.id === code
                                    );
                                    if (selectedRequest) {
                                        setTaskId(selectedRequest.id);
                                    }
                                }}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loadingRequests}
                            >
                                <option value="">-- Chọn mã yêu cầu --</option>
                                {reliefRequests.map((request) => (
                                    <option key={request.id} value={request.code || request.id}>
                                        {request.code || request.id} - {request.area || request.location || 'N/A'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">
                                CHI TIẾT NHIỆM VỤ #{task?.code || task?.id || taskId || '--'}
                            </h2>
                        </div>
                        <p className="mb-3 text-sm font-medium text-slate-900">{task?.title || 'Chưa có thông tin nhiệm vụ'}</p>
                        <p className="mb-3 text-sm text-slate-600">{task?.location || 'Chưa có địa điểm'}</p>
                        {task?.image && (
                            <div className="mb-3 overflow-hidden rounded-lg">
                                <img
                                    src={task.image}
                                    alt="Task area"
                                    className="h-24 w-full object-cover"
                                />
                            </div>
                        )}
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="font-medium text-slate-700">LOẠI CỨU TRỢ:</span>{' '}
                                <span className="text-slate-900">{task?.reliefType || 'Chưa cập nhật'}</span>
                            </div>
                            <div>
                                <span className="font-medium text-slate-700">KHỐI LƯỢNG:</span>{' '}
                                <span className="text-slate-900">{task?.weight || 'Chưa cập nhật'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Available Vehicles */}
                    <div className="p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900">
                                Phương tiện rảnh ({vehicles.length})
                            </h3>
                            <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                                <Filter className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {vehicles.map((vehicle) => {
                                const isSelected = selectedVehicles.some((v) => v.id === vehicle.id);
                                const VehicleIcon = VEHICLE_ICONS[vehicle.vehicleType] || Truck;
                                return (
                                    <div
                                        key={vehicle.id}
                                        className={`cursor-pointer rounded-lg border-2 p-4 transition ${isSelected
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                        onClick={() => handleSelectVehicle(vehicle)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                                <VehicleIcon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="mb-1 flex items-center justify-between">
                                                    <p className="font-semibold text-slate-900">
                                                        {vehicle.type} - {vehicle.code}
                                                    </p>
                                                </div>
                                                <p className="mb-2 text-xs text-slate-600">
                                                    Tài xế: {vehicle.driver}
                                                </p>
                                                <div className="mb-2 flex items-center gap-4 text-xs">
                                                    {vehicle.distance != null && (
                                                        <span className="font-medium text-green-600">
                                                            {vehicle.distance} km
                                                        </span>
                                                    )}
                                                    {vehicle.time != null && (
                                                        <span className="text-slate-500">- {vehicle.time} phút</span>
                                                    )}
                                                </div>
                                                {vehicle.capacity !== undefined && (
                                                    <div className="mb-2">
                                                        <div className="mb-1 flex items-center justify-between text-xs">
                                                            <span className="text-slate-600">Dung tích</span>
                                                            <span className="font-medium text-slate-900">
                                                                {vehicle.capacity}%
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                                                            <div
                                                                className={`h-full ${isSelected ? 'bg-green-500' : 'bg-slate-400'
                                                                    }`}
                                                                style={{ width: `${vehicle.capacity}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                {vehicle.depth && (
                                                    <p className="mb-2 text-xs text-slate-600">
                                                        {vehicle.depth} Độ sâu
                                                    </p>
                                                )}
                                                <p className="text-xs font-medium text-slate-700">{vehicle.status}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Selected Count & Quick Assign */}
                        {selectedVehicles.length > 0 && (
                            <div className="mt-4 space-y-3 rounded-lg border border-green-200 bg-green-50 p-4">
                                <p className="text-sm font-medium text-slate-900">
                                    Đã chọn: {String(selectedVehicles.length).padStart(2, '0')} Phương tiện
                                </p>
                                {selectedVehicles.map((vehicle) => (
                                    <button
                                        key={vehicle.id}
                                        onClick={() => handleQuickAssign(vehicle)}
                                        className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                                    >
                                        Gán {vehicle.code} ngay
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Map Area */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Map Header */}
                    <div className="border-b border-slate-200 bg-white px-6 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white">
                                    Live Tracking
                                </button>
                                <p className="text-sm text-slate-600">
                                    Hiển thị vùng ngập lụt thực tế từ vệ tinh
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setMapView('satellite')}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${mapView === 'satellite'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    Vệ tinh
                                </button>
                                <button
                                    onClick={() => setMapView('terrain')}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${mapView === 'terrain'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    Địa hình
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Map Container */}
                    <div className="relative flex-1">
                        <GoogleMap
                            center={mapCenter}
                            zoom={13}
                        />
                        {/* Map Controls Overlay */}
                        <div className="absolute right-4 top-4 flex flex-col gap-2">
                            <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm hover:bg-slate-50">
                                <span className="text-lg font-semibold">+</span>
                            </button>
                            <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm hover:bg-slate-50">
                                <span className="text-lg font-semibold">−</span>
                            </button>
                            <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-white shadow-sm hover:bg-green-700">
                                <Navigation className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Map Legend */}
                        <div className="absolute bottom-4 left-4 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
                            <h4 className="mb-3 text-sm font-bold text-slate-900">CHỦ GIẢI BẢN ĐỒ</h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-500" />
                                    <span className="text-slate-700">Điểm nhiệm vụ</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Truck className="h-4 w-4 text-green-600" />
                                    <span className="text-slate-700">Phương tiện rảnh</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Truck className="h-4 w-4 text-slate-400" />
                                    <span className="text-slate-700">Đang bận</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-12 bg-blue-500" />
                                    <span className="text-slate-700">Vùng ngập</span>
                                </div>
                            </div>
                        </div>

                        {/* Map Info Bar */}
                        <div className="absolute bottom-4 right-4 flex items-center gap-6 rounded-lg border border-slate-200 bg-white px-6 py-3 shadow-lg">
                            <div>
                                <p className="text-xs font-medium text-slate-500">ƯỚC TÍNH DI CHUYỂN</p>
                                <p className="text-sm font-semibold text-slate-900">-12 Phút tiếp cận</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500">TUYẾN ĐƯỜNG</p>
                                <p className="text-sm font-semibold text-slate-900">
                                    Thông suốt (Ưu tiên xe cứu trợ)
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-semibold text-green-600">
                                    Sẵn sàng điều phối ngay lập tức
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
