import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import GoogleMap from '../../features/map/components/MapBox.jsx';
import { MAPBOX_ACCESS_TOKEN } from '../../app/config/env.js';
import { createRescueRequest, uploadRescueAttachments } from '../../features/rescue/api.js';
import PrioritySelector from '../../features/rescue/components/PrioritySelector.jsx';
import AttachmentGallery from '../../features/rescue/components/AttachmentGallery.jsx';
import Button from '../../shared/ui/Button.jsx';
import Input from '../../shared/ui/Input.jsx';
import Textarea from '../../shared/ui/Textarea.jsx';

const STEPS = [
    { id: 1, label: 'Vị trí cứu hộ' },
    { id: 2, label: 'Mô tả tình huống' },
    { id: 3, label: 'Hoàn tất yêu cầu' },
];

export default function RescueRequestCreatePage() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        address: '',
        ward: '',
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

    // Parse full address into 2 fields: address + ward/area
    const splitAddressFields = (fullAddress = '') => {
        const addressParts = fullAddress.split(',').map((part) => part.trim()).filter(Boolean);

        // Swap mapping: first part -> ward, remaining parts -> detailed address
        const firstPart = addressParts[0] || '';
        const remaining = addressParts.slice(1).join(', ');

        return {
            address: remaining || fullAddress || '',
            ward: firstPart,
        };
    };

    // Helper function to reverse geocode coordinates to address via Mapbox
    const reverseGeocodeAddress = async (lat, lng) => {
        if (!MAPBOX_ACCESS_TOKEN) {
            console.warn('Mapbox access token not found, cannot geocode');
            return null;
        }

        try {
            const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=vi&limit=1`,
            );
            const data = await res.json();
            const feature = data.features?.[0];

            if (feature) {
                const fullAddress = feature.place_name;
                const parsed = splitAddressFields(fullAddress);
                setForm((prev) => ({
                    ...prev,
                    address: parsed.address,
                    ward: parsed.ward,
                }));
                console.log('[Geocoding Success]', {
                    lat,
                    lng,
                    fullAddress,
                    addressField: parsed.address,
                    wardField: parsed.ward,
                });

                return fullAddress;
            }

            return null;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return null;
        }
    };

    // Get user's current location on mount
    useEffect(() => {
        if (navigator.geolocation) {
            setIsLoadingGps(true);
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    setMapCenter({ lat, lng });
                    setMarkerPosition({ lat, lng });
                    setForm((prev) => ({
                        ...prev,
                        latitude: lat,
                        longitude: lng,
                    }));

                    // Reverse geocode to get address via Mapbox
                    await reverseGeocodeAddress(lat, lng);
                    setIsLoadingGps(false);
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                    setIsLoadingGps(false);
                    // Keep default center (Ho Chi Minh City)
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        }
    }, []);

    const handleUseGps = async () => {
        if (!navigator.geolocation) {
            alert('Trình duyệt của bạn không hỗ trợ định vị GPS');
            return;
        }

        setIsLoadingGps(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                setMapCenter({ lat, lng });
                setMarkerPosition({ lat, lng });
                setForm((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                }));

                // Reverse geocode to get address via Mapbox
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
        // Update coordinates first
        setForm((prev) => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lng,
        }));

        // Update marker position (this will update the map)
        setMarkerPosition({ lat: location.lat, lng: location.lng });

        // Always auto-fill both fields when address is available
        if (location.address) {
            const parsed = splitAddressFields(location.address);
            setForm((prev) => ({
                ...prev,
                address: parsed.address,
                ward: parsed.ward,
            }));
            return;
        }

        // If no address from map callback, fallback to reverse geocode
        await reverseGeocodeAddress(location.lat, location.lng);
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
        if (!form.address || !form.description || !form.phone) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        if (!form.latitude || !form.longitude) {
            alert('Vui lòng chọn vị trí trên bản đồ hoặc sử dụng GPS');
            return;
        }

        setIsSubmitting(true);

        try {
            // Map FE form data to BE DTO format
            // Combine address and ward into addressText
            const addressText = form.ward
                ? `${form.address}, ${form.ward}`.trim()
                : form.address;

            // 1) Upload attachments first (if any)
            let attachments = [];
            if (form.images && form.images.length > 0) {
                const uploadResult = await uploadRescueAttachments(form.images);
                // uploadResult is expected to be an array of { fileUrl, fileType }
                attachments = Array.isArray(uploadResult) ? uploadResult : [];
            }

            // 2) Prepare request data matching BE RescueRequestCreateRequest DTO
            const requestData = {
                affectedPeopleCount: parseInt(form.peopleCount) || 1,
                description: form.description,
                addressText: addressText,
                priority: form.level, // "HIGH" | "MEDIUM" | "LOW"
                latitude: form.latitude,
                longitude: form.longitude,
                lat: form.latitude,
                lng: form.longitude,
                attachments,
            };

            console.log('[Creating Rescue Request]', requestData);

            // Call API to create rescue request
            const response = await createRescueRequest(requestData);

            console.log('[Rescue Request Created]', response);

            // Redirect to dashboard - it will automatically refresh and show the new request in the list
            navigate(CITIZEN_ROUTES.DASHBOARD, {
                state: {
                    newlyCreatedRequest: response,
                    showSuccessMessage: true
                },
            });
        } catch (error) {
            console.error('[Rescue Request Error]', error);
            alert(error.message || 'Không thể tạo yêu cầu cứu hộ. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                    Tạo yêu cầu cứu hộ khẩn cấp
                </h1>
                <p className="max-w-2xl text-sm text-slate-600">
                    Vui lòng cung cấp chính xác vị trí, tình huống và thông tin liên lạc để lực lượng
                    cứu hộ có thể hỗ trợ nhanh nhất.
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
                                        Địa chỉ cụ thể
                                        {form.latitude && form.longitude && (
                                            <span className="ml-2 text-xs font-normal text-emerald-600">
                                                ✓ Đã có tọa độ: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                                            </span>
                                        )}
                                    </label>
                                    <Input
                                        type="text"
                                        value={form.address}
                                        onChange={handleChange('address')}
                                        placeholder={isLoadingGps ? "Đang lấy địa chỉ từ GPS..." : "Ví dụ: Xã Nam Danh, Thị xã Ba Đồn, Tỉnh Quảng Bình"}
                                        required
                                        disabled={isLoadingGps}
                                    />
                                </div>

                                <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Khu vực / Phường
                                        </label>
                                        <Input
                                            type="text"
                                            value={form.ward}
                                            onChange={handleChange('ward')}
                                            placeholder="Phường, Quận/Huyện, Tỉnh/TP"
                                        />
                                    </div>
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
                                </div>

                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex gap-2">
                                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                    <span>
                                        Cảnh báo: Vị trí có thể chưa chính xác đến địa chỉ cụ thể. Vui lòng kiểm tra
                                        kỹ thông tin trước khi tiếp tục.
                                    </span>
                                </div>
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
                                    {isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu cứu hộ'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
