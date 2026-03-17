import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CITIZEN_ROUTES } from '../../../app/routes/route.constants.js';
import { createRescueRequest, uploadRescueAttachments } from '../api.js';

export function useRescueSubmit() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const submitRequest = async (form) => {
        if (isSubmitting) return;

        const normalizedPhone = String(form.phone || '').replace(/\s+/g, '').trim();

        if (!form.address || !form.description || !normalizedPhone || !form.locationDescription) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        if (!/^(0[3-9]\d{8}|\+84[3-9]\d{8})$/.test(normalizedPhone)) {
            alert('Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng 0xxxxxxxxx hoặc +84xxxxxxxxx.');
            return;
        }

        if (!form.latitude || !form.longitude) {
            alert('Vui lòng chọn vị trí trên bản đồ hoặc sử dụng GPS');
            return;
        }

        setIsSubmitting(true);

        try {
            const addressText = form.address;
            let attachments = [];
            if (form.images && form.images.length > 0) {
                const uploadResult = await uploadRescueAttachments(form.images);
                attachments = Array.isArray(uploadResult) ? uploadResult : [];
            }

            const peopleCount = parseInt(form.peopleCount) || 1;
            const requestData = {
                affectedPeopleCount: peopleCount,
                description: form.description,
                addressText: addressText,
                latitude: form.latitude,
                longitude: form.longitude,
                locationDescription: form.locationDescription,
                priority: form.level,
                contactPhone: normalizedPhone,
                attachments,
                peopleCount,
                urgency: form.level,
                address: addressText,
                targetArea: addressText,
                phone: normalizedPhone,
            };

            const response = await createRescueRequest(requestData);

            navigate(CITIZEN_ROUTES.DASHBOARD, {
                state: {
                    newlyCreatedRequest: response,
                    showSuccessMessage: true
                },
            });
        } catch (error) {
            console.error('[Rescue Request Error]', error);
            const rawErrors = error?.data?.errors;
            const rawMessage = error?.data?.message;
            const firstValidationError =
                rawErrors && typeof rawErrors === 'object'
                    ? Object.values(rawErrors).flat().find(Boolean)
                    : null;
            const normalizedMessage = Array.isArray(rawMessage)
                ? rawMessage.find(Boolean)
                : (typeof rawMessage === 'string' ? rawMessage : null);

            alert(firstValidationError || normalizedMessage || error.message || 'Không thể tạo yêu cầu cứu hộ. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return { submitRequest, isSubmitting };
}
