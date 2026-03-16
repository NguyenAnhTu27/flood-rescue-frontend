import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Crosshair,
    AlertTriangle,
    ChevronRight,
    ChevronLeft,
    Phone,
} from 'lucide-react';
import { CITIZEN_ROUTES } from '../../app/routes/route.constants.js';
import GoogleMap from '../../features/map/components/MapBox.jsx';
import { createRescueRequest, uploadRescueAttachments } from '../../features/rescue/api.js';
import PrioritySelector from '../../features/rescue/components/PrioritySelector.jsx';
import AttachmentGallery from '../../features/rescue/components/AttachmentGallery.jsx';
import CitizenRequestHeader from '../../features/citizen/components/CitizenRequestHeader.jsx';
import Button from '../../shared/ui/Button.jsx';
import Input from '../../shared/ui/Input.jsx';
import Textarea from '../../shared/ui/Textarea.jsx';
import { reverseGeocodeAddress as reverseGeocodeAddressByMap } from '../../features/map/lib/geocoding.js';

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
    const [gpsError, setGpsError] = useState('');

    const formatGpsFallbackAddress = (lat, lng) =>
        `Vị trí GPS: ${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;

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
    }, []);

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
            alert('Vui lòng chọn vị trí trên bản đồ hoặc sử dụng GPS');
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

            // 2) Prepare request data matching BE RescueRequestCreateRequest DTO
            const requestData = {
                affectedPeopleCount: parseInt(form.peopleCount) || 1,
                description: form.description,
                addressText: addressText,
                latitude: form.latitude,
                longitude: form.longitude,
                locationDescription: form.locationDescription,
                priority: form.level, // "HIGH" | "MEDIUM" | "LOW"
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

    const hasGps = Number.isFinite(Number(form.latitude)) && Number.isFinite(Number(form.longitude));

    return (
        <div className="space-y-6">
            <CitizenRequestHeader
                requestType="RESCUE"
                currentStep={currentStep}
                steps={STEPS}
                hasGps={hasGps}
                priority={form.level}
                title="Tạo yêu cầu cứu hộ khẩn cấp"
                subtitle="Vui lòng cung cấp chính xác vị trí, tình huống và thông tin liên lạc để lực lượng cứu hộ có thể hỗ trợ nhanh nhất."
            />

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
                            <div className="relative flex-1">
                                <GoogleMap
                                    center={mapCenter}
                                    markerPosition={markerPosition}
                                    onLocationSelect={handleLocationSelect}
                                    zoom={15}
                                />
                            </div>
                        </div>
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
                                        Tọa độ + địa chỉ GPS (không sửa được)
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
                                    <Input
                                        type="text"
                                        value={form.address}
                                        placeholder={isLoadingGps ? "Đang lấy địa chỉ từ GPS..." : "Ví dụ: Xã Nam Danh, Thị xã Ba Đồn, Tỉnh Quảng Bình"}
                                        required
                                        disabled
                                    />
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
                            <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
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

                                    <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-3.5">
                                        <div className="flex items-start gap-2.5">
                                            <div className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100">
                                                <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-amber-900">Kiểm tra thông tin trước khi gửi</p>
                                                <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
                                                    Thông tin chính xác giúp đội cứu hộ tiếp cận nhanh và xử lý đúng mức độ khẩn cấp.
                                                </p>
                                            </div>
                                        </div>
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
