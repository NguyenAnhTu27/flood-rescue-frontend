import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    MapPin,
    Crosshair,
    AlertTriangle,
    ChevronRight,
    ChevronLeft,
    Phone,
    CheckCircle2,
} from 'lucide-react';
import { CITIZEN_ROUTES } from '../../app/routes/route.constants.js';
import GoogleMap from '../../features/map/components/GoogleMap.jsx';
import { uploadRescueAttachments } from '../../features/rescue/api.js';
import { createReliefRequest, updateMyCitizenReliefRequest } from '../../features/relief/api.js';
import PrioritySelector from '../../features/rescue/components/PrioritySelector.jsx';
import AttachmentGallery from '../../features/rescue/components/AttachmentGallery.jsx';
import Button from '../../shared/ui/Button.jsx';
import Input from '../../shared/ui/Input.jsx';
import Textarea from '../../shared/ui/Textarea.jsx';
import {
    reverseGeocodeAddress as reverseGeocodeAddressByMap,
    forwardGeocodeAddress as forwardGeocodeAddressByMap,
    searchAddressSuggestions,
} from '../../features/map/lib/geocoding.js';

const STEPS = [
    { id: 1, label: 'Vị trí cứu trợ' },
    { id: 2, label: 'Mô tả tình huống' },
    { id: 3, label: 'Hoàn tất yêu cầu' },
];

export default function ReliefRequestCreatePage({
    afterCreateNavigateTo = CITIZEN_ROUTES.MY_RELIEF_REQUESTS,
    autoLocateOnMount = true,
    allowAddressSearch = false,
    showUseGpsButton = true,
}) {
    const location = useLocation();
    const navigate = useNavigate();
    const editingRequest = location.state?.request || null;
    const editingRequestId = Number(location.state?.requestId || editingRequest?.id || 0) || 0;
    const isEditMode = editingRequestId > 0;
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        address: '',
        locationDescription: '',
        description: '',
        peopleCount: '',
        level: 'MEDIUM',
        phone: '',
        images: [],
        latitude: null,
        longitude: null,
    });
    const [mapCenter, setMapCenter] = useState({ lat: 10.8231, lng: 106.6297 }); // Default: Ho Chi Minh City
    const [markerPosition, setMarkerPosition] = useState(null);
    const [isLoadingGps, setIsLoadingGps] = useState(false);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
    const [gpsError, setGpsError] = useState('');

    const formatGpsFallbackAddress = (lat, lng) =>
        `Vị trí GPS: ${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;

    const parseNoteField = (note, label) => {
        const lines = String(note || '').split('\n');
        const line = lines.find((ln) => ln.trim().startsWith(`${label}:`));
        if (!line) return '';
        return line.replace(`${label}:`, '').trim();
    };

    useEffect(() => {
        if (!isEditMode || !editingRequest) return;

        const lat = Number(editingRequest.citizenLatitude ?? editingRequest.latitude);
        const lng = Number(editingRequest.citizenLongitude ?? editingRequest.longitude);
        const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
        const note = editingRequest.note || '';
        const peopleCountRaw = parseNoteField(note, 'Số người cần hỗ trợ');
        const levelRaw = parseNoteField(note, 'Mức độ ưu tiên');

        setForm((prev) => ({
            ...prev,
            address: editingRequest.citizenAddressText || editingRequest.targetArea || prev.address,
            locationDescription: parseNoteField(note, 'Mô tả vị trí') || editingRequest.citizenLocationDescription || prev.locationDescription,
            description: parseNoteField(note, 'Mô tả') || prev.description,
            peopleCount: String(parseInt(peopleCountRaw, 10) || prev.peopleCount || ''),
            level: ['LOW', 'MEDIUM', 'HIGH'].includes(levelRaw) ? levelRaw : prev.level,
            phone: parseNoteField(note, 'SĐT liên hệ') || prev.phone,
            latitude: hasCoords ? lat : prev.latitude,
            longitude: hasCoords ? lng : prev.longitude,
        }));

        if (hasCoords) {
            setMapCenter({ lat, lng });
            setMarkerPosition({ lat, lng });
        }
    }, [isEditMode, editingRequest]);

    const handleChange = (field) => (e) => {
        setForm((prev) => ({
            ...prev,
            [field]: e.target.value,
        }));
    };

    const handleLevelChange = (level) => {
        setForm((prev) => ({ ...prev, level }));
    };

    const handleImagesChange = (files) => {
        setForm((prev) => ({
            ...prev,
            images: files,
        }));
    };

    // Helper function to reverse geocode coordinates to address
    const reverseGeocodeAddress = async (lat, lng) => {
        const fallbackAddress = formatGpsFallbackAddress(lat, lng);

        try {
            const address = await reverseGeocodeAddressByMap(lat, lng);
            if (address) {
                setForm((prev) => ({
                    ...prev,
                    address,
                }));
                return address;
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
        }

        setForm((prev) => ({
            ...prev,
            address: prev.address || fallbackAddress,
        }));
        return fallbackAddress;
    };

    // Get user's current location on mount
    useEffect(() => {
        if (!autoLocateOnMount) return;
        if (isEditMode) return;
        if (navigator.geolocation) {
            setIsLoadingGps(true);
            setGpsError('');
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const fallbackAddress = formatGpsFallbackAddress(lat, lng);

                    setMapCenter({ lat, lng });
                    setMarkerPosition({ lat, lng });
                    setForm((prev) => ({
                        ...prev,
                        latitude: lat,
                        longitude: lng,
                        address: fallbackAddress,
                    }));

                    // Reverse geocode to get address (will wait for Google Maps if needed)
                    await reverseGeocodeAddress(lat, lng);
                    setIsLoadingGps(false);
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                    setIsLoadingGps(false);
                    setGpsError('Không thể lấy vị trí GPS tự động. Vui lòng bấm "Lấy vị trí GPS của tôi" và cho phép quyền vị trí.');
                    // Keep default center (Ho Chi Minh City)
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        }
    }, [autoLocateOnMount, isEditMode]);

    const handleUseGps = async () => {
        if (!navigator.geolocation) {
            alert('Trình duyệt của bạn không hỗ trợ định vị GPS');
            return;
        }

        setIsLoadingGps(true);
        setGpsError('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const fallbackAddress = formatGpsFallbackAddress(lat, lng);

                setMapCenter({ lat, lng });
                setMarkerPosition({ lat, lng });
                setForm((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                    address: fallbackAddress,
                }));

                // Reverse geocode to get address (will wait for Google Maps if needed)
                await reverseGeocodeAddress(lat, lng);
                setIsLoadingGps(false);
            },
            (error) => {
                setIsLoadingGps(false);
                let errorMessage = 'Không thể lấy vị trí GPS. ';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép trong cài đặt trình duyệt.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Vị trí không khả dụng.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'Hết thời gian chờ. Vui lòng thử lại.';
                        break;
                    default:
                        errorMessage += 'Vui lòng kiểm tra quyền truy cập vị trí của trình duyệt.';
                }

                alert(errorMessage);
                setGpsError(errorMessage);
                console.error('Geolocation error:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const handleLocationSelect = async (location) => {
        const fallbackAddress = formatGpsFallbackAddress(location.lat, location.lng);
        // Update coordinates first
        setForm((prev) => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lng,
            address: prev.address || fallbackAddress,
        }));

        // Update marker position (this will update the map)
        setMarkerPosition({ lat: location.lat, lng: location.lng });

        // Update address if geocoding succeeded from map
        if (location.address) {
            setForm((prev) => ({
                ...prev,
                address: location.address,
            }));
        } else {
            // If no address from map, manually reverse geocode
            await reverseGeocodeAddress(location.lat, location.lng);
        }
    };

    const applyAddressResult = (result, fallbackKeyword = '') => {
        if (!result || !Number.isFinite(Number(result.lat)) || !Number.isFinite(Number(result.lng))) return;
        const lat = Number(result.lat);
        const lng = Number(result.lng);
        const address = result.address || fallbackKeyword;
        setMapCenter({ lat, lng });
        setMarkerPosition({ lat, lng });
        setForm((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            address,
        }));
    };

    const handleSearchAddress = async () => {
        const keyword = String(form.address || '').trim();
        if (!keyword) {
            alert('Vui lòng nhập địa chỉ hoặc từ khóa vị trí để tìm.');
            return;
        }

        try {
            setIsSearchingAddress(true);
            const result = await forwardGeocodeAddressByMap(keyword);
            if (!result || !Number.isFinite(Number(result.lat)) || !Number.isFinite(Number(result.lng))) {
                alert('Không tìm thấy vị trí phù hợp. Vui lòng thử từ khóa chi tiết hơn.');
                return;
            }

            applyAddressResult(result, keyword);
            setShowAddressSuggestions(false);
        } catch (error) {
            console.error('Forward geocoding error:', error);
            alert('Không thể tìm vị trí lúc này. Vui lòng thử lại.');
        } finally {
            setIsSearchingAddress(false);
        }
    };

    useEffect(() => {
        if (!allowAddressSearch || isEditMode) return;
        const keyword = String(form.address || '').trim();
        if (keyword.length < 3) {
            setAddressSuggestions([]);
            setShowAddressSuggestions(false);
            setIsLoadingSuggestions(false);
            return;
        }

        let cancelled = false;
        const timer = window.setTimeout(async () => {
            try {
                setIsLoadingSuggestions(true);
                const suggestions = await searchAddressSuggestions(keyword, 5);
                if (cancelled) return;
                setAddressSuggestions(Array.isArray(suggestions) ? suggestions : []);
                setShowAddressSuggestions(true);
            } catch {
                if (cancelled) return;
                setAddressSuggestions([]);
                setShowAddressSuggestions(false);
            } finally {
                if (!cancelled) setIsLoadingSuggestions(false);
            }
        }, 300);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [allowAddressSearch, form.address, isEditMode]);

    const handleAddressInputChange = (e) => {
        handleChange('address')(e);
        if (allowAddressSearch) {
            setShowAddressSuggestions(true);
        }
    };

    const handleChooseSuggestion = (item) => {
        applyAddressResult(item, form.address);
        setShowAddressSuggestions(false);
    };

    const goNext = () => {
        if (currentStep < 3) setCurrentStep((s) => s + 1);
    };

    const goPrev = () => {
        if (currentStep > 1) setCurrentStep((s) => s - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Validate required fields
        if (!form.address || !form.description || !form.phone || !form.locationDescription) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        if (!form.latitude || !form.longitude) {
            alert('Vui lòng chọn vị trí trên bản đồ hoặc tìm vị trí trước khi gửi.');
            return;
        }

        setIsSubmitting(true);

        try {
            // Map FE form data to BE DTO format
            const addressText = form.address;

            // 1) Upload attachments first (if any)
            let attachments = [];
            if (form.images && form.images.length > 0) {
                const uploadResult = await uploadRescueAttachments(form.images);
                // uploadResult is expected to be an array of { fileUrl, fileType }
                attachments = Array.isArray(uploadResult) ? uploadResult : [];
            }

            const detailLines = [
                `Loại yêu cầu: CỨU TRỢ`,
                `Mô tả: ${form.description}`,
                `Số người cần hỗ trợ: ${parseInt(form.peopleCount) || 1}`,
                `Mức độ ưu tiên: ${form.level}`,
                `SĐT liên hệ: ${form.phone}`,
                `Mô tả vị trí: ${form.locationDescription}`,
                `Tọa độ: ${form.latitude}, ${form.longitude}`,
                `Ảnh hiện trường: ${attachments.map((a) => a.fileUrl).join(', ') || 'Không có'}`,
            ];

            const payload = {
                targetArea: addressText,
                addressText: addressText,
                latitude: form.latitude,
                longitude: form.longitude,
                locationDescription: form.locationDescription || null,
                note: detailLines.join('\n'),
                lines: [],
            };

            const response = isEditMode
                ? await updateMyCitizenReliefRequest(editingRequestId, payload)
                : await createReliefRequest(payload);

            const nextRequestId = Number(response?.id || editingRequestId || 0) || undefined;
            if (isEditMode && nextRequestId) {
                navigate(CITIZEN_ROUTES.RELIEF_REQUEST_STATUS, {
                    state: {
                        requestId: nextRequestId,
                        request: response || editingRequest,
                        successMessage: 'Đã cập nhật thêm thông tin yêu cầu cứu trợ.',
                    },
                });
            } else {
                navigate(afterCreateNavigateTo);
            }
        } catch (error) {
            console.error('[Relief Request Error]', error);
            alert(error.message || (isEditMode
                ? 'Không thể cập nhật yêu cầu cứu trợ. Vui lòng thử lại.'
                : 'Không thể tạo yêu cầu cứu trợ. Vui lòng thử lại.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                    {isEditMode ? 'Cập nhật yêu cầu cứu trợ' : 'Tạo yêu cầu cứu trợ khẩn cấp'}
                </h1>
                <p className="max-w-2xl text-sm text-slate-600">
                    {isEditMode
                        ? 'Chỉnh sửa thông tin mới nhất để đội cứu trợ nhận đúng tình trạng thực tế.'
                        : 'Vui lòng cung cấp chính xác vị trí, tình huống và thông tin liên lạc để lực lượng cứu trợ có thể hỗ trợ nhanh nhất.'}
                </p>
            </div>

            {/* Step indicator */}
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {STEPS.map((step, index) => {
                        const isActive = currentStep === step.id;
                        const isDone = currentStep > step.id;
                        return (
                            <div key={step.id} className="flex items-center gap-3">
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : isDone
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-100 text-slate-500'
                                        }`}
                                >
                                    {isDone ? (
                                        <CheckCircle2 className="h-5 w-5" />
                                    ) : (
                                        step.id
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span
                                        className={`text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-500'
                                            }`}
                                    >
                                        Bước {step.id}
                                    </span>
                                    <span className="text-xs text-slate-500">{step.label}</span>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div className="hidden md:block h-px w-12 bg-slate-200" />
                                )}
                            </div>
                        );
                    })}
                </div>
                <span className="hidden md:inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    Thời gian xử lý ưu tiên cho yêu cầu có vị trí và thông tin rõ ràng
                </span>
            </div>

            {/* Main content */}
            <form
                onSubmit={handleSubmit}
                className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] items-start"
            >
                {/* Left column: Map / Preview */}
                <div className="space-y-4">
                    {/* Google Maps */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="flex h-[340px] flex-col">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                                <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1">
                                    <MapPin className="h-4 w-4 text-blue-600" />
                                    <span className="text-xs font-medium text-slate-700">
                                        Bản đồ khu vực cứu hộ
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                    Đã kết nối trung tâm điều phối
                                </div>
                            </div>
                            <div className="relative flex-1">
                                <GoogleMap
                                    center={mapCenter}
                                    markerPosition={markerPosition}
                                    onLocationSelect={handleLocationSelect}
                                    zoom={15}
                                />
                            </div>
                            <div className="px-4 py-2 border-t border-slate-200 bg-slate-50">
                                <p className="text-[10px] text-slate-500">
                                    💡 Nhấp vào bản đồ hoặc kéo marker để chọn vị trí cứu hộ
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step helper text */}
                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
                        {currentStep === 1 && (
                            <span>
                                Hãy đảm bảo địa chỉ và vị trí trên bản đồ là chính xác để đội cứu hộ dễ dàng
                                tiếp cận.
                            </span>
                        )}
                        {currentStep === 2 && (
                            <span>
                                Mô tả càng chi tiết, lực lượng điều phối càng có thể chuẩn bị đúng nguồn lực
                                cần thiết.
                            </span>
                        )}
                        {currentStep === 3 && (
                            <span>
                                Hãy kiểm tra lại thông tin liên hệ và tải lên hình ảnh hiện trường (nếu có) để
                                hỗ trợ đánh giá mức độ khẩn cấp.
                            </span>
                        )}
                    </div>
                </div>

                {/* Right column: Form steps */}
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    {currentStep === 1 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-semibold text-slate-900">Bước 1: Vị trí cứu hộ</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Tọa độ + địa chỉ vị trí đã chọn
                                    </label>
                                    <Input
                                        type="text"
                                        value={
                                            form.latitude && form.longitude && form.address
                                                ? `${form.latitude.toFixed(6)}, ${form.longitude.toFixed(6)} - ${form.address}`
                                                : 'Chưa có vị trí GPS'
                                        }
                                        readOnly
                                        disabled
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Địa chỉ cụ thể
                                        {form.latitude && form.longitude && (
                                            <span className="ml-2 text-xs font-normal text-emerald-600">
                                                ✓ Đã có tọa độ: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                                            </span>
                                        )}
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                type="text"
                                                value={form.address}
                                                onChange={allowAddressSearch ? handleAddressInputChange : undefined}
                                                onFocus={() => {
                                                    if (allowAddressSearch && addressSuggestions.length > 0) {
                                                        setShowAddressSuggestions(true);
                                                    }
                                                }}
                                                placeholder={isLoadingGps ? "Đang lấy địa chỉ từ GPS..." : "Ví dụ: Xã Nam Danh, Thị xã Ba Đồn, Tỉnh Quảng Bình"}
                                                required
                                                disabled={!allowAddressSearch}
                                            />
                                            {allowAddressSearch && showAddressSuggestions && (isLoadingSuggestions || addressSuggestions.length > 0) && (
                                                <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                                                    {isLoadingSuggestions && (
                                                        <div className="px-3 py-2 text-xs text-slate-500">Đang gợi ý địa chỉ...</div>
                                                    )}
                                                    {!isLoadingSuggestions && addressSuggestions.map((item, idx) => (
                                                        <button
                                                            key={`${item.address || 'address'}-${idx}`}
                                                            type="button"
                                                            onClick={() => handleChooseSuggestion(item)}
                                                            className="w-full border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 last:border-b-0"
                                                        >
                                                            {item.address || `${item.lat}, ${item.lng}`}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {allowAddressSearch && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={handleSearchAddress}
                                                disabled={isSearchingAddress}
                                            >
                                                {isSearchingAddress ? 'Đang tìm...' : 'Tìm vị trí'}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Mô tả vị trí (điểm nhận biết)
                                        </label>
                                        <Textarea
                                            rows={2}
                                            value={form.locationDescription}
                                            onChange={handleChange('locationDescription')}
                                            placeholder="Ví dụ: trước cổng trường, hẻm bên trái UBND, gần cầu..."
                                            required
                                        />
                                    </div>
                                    {showUseGpsButton && (
                                        <div className="flex items-end">
                                            <Button
                                                type="button"
                                                variant="info"
                                                size="sm"
                                                fullWidth
                                                onClick={handleUseGps}
                                                disabled={isLoadingGps}
                                            >
                                                {isLoadingGps ? (
                                                    <>
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                                                        <span>Đang lấy vị trí...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Crosshair className="h-4 w-4" />
                                                        Lấy vị trí GPS của tôi
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex gap-2">
                                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                    <span>
                                        Cảnh báo: Vị trí có thể chưa chính xác đến địa chỉ cụ thể. Vui lòng kiểm tra
                                        kỹ thông tin trước khi tiếp tục.
                                    </span>
                                </div>
                                {gpsError && (
                                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                                        {gpsError}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-semibold text-slate-900">Bước 2: Mô tả tình huống</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Nội dung sự việc
                                    </label>
                                    <Textarea
                                        rows={4}
                                        value={form.description}
                                        onChange={handleChange('description')}
                                        placeholder="Mô tả chi tiết tình huống, mức nước, người mắc kẹt, tình trạng sức khoẻ..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Số người cần hỗ trợ
                                    </label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={form.peopleCount}
                                        onChange={handleChange('peopleCount')}
                                        placeholder="Ví dụ: 4"
                                    />
                                </div>

                                <div>
                                    <label className="mb-3 block text-sm font-medium text-slate-700">
                                        Mức độ khẩn cấp
                                    </label>
                                    <PrioritySelector
                                        value={form.level}
                                        onChange={handleLevelChange}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Bước 3: Hoàn tất yêu cầu
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Upload images */}
                                <AttachmentGallery
                                    files={form.images}
                                    onChange={handleImagesChange}
                                    maxFiles={10}
                                    maxSizeMB={10}
                                />

                                {/* Contact info */}
                                <div className="space-y-3">
                                    <span className="text-sm font-medium text-slate-700">
                                        Thông tin liên hệ
                                    </span>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-slate-700">
                                            Số điện thoại liên hệ
                                        </label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate-400">
                                                +84
                                            </span>
                                            <Input
                                                type="tel"
                                                value={form.phone}
                                                onChange={handleChange('phone')}
                                                className="pl-10"
                                                placeholder="09xx xxx xxx"
                                                required
                                            />
                                            <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            Đội cứu hộ sẽ liên hệ qua số điện thoại này để xác minh và cập nhật trạng
                                            thái.
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-800 flex gap-2">
                                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                        <span>
                                            Vui lòng kiểm tra lại toàn bộ thông tin trước khi gửi yêu cầu. Hành động
                                            nguy hiểm hoặc thông tin không chính xác có thể làm chậm trễ việc cứu hộ.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer actions */}
                    <div className="mt-2 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={goPrev}
                            disabled={currentStep === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Quay lại
                        </Button>

                        <div className="flex gap-3">
                            {currentStep < 3 && (
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={goNext}
                                >
                                    Tiếp tục
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            )}

                            {currentStep === 3 && (
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? (isEditMode ? 'Đang cập nhật...' : 'Đang gửi yêu cầu...')
                                        : (isEditMode ? 'Cập nhật thông tin cứu trợ' : 'Gửi yêu cầu cứu trợ')}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
