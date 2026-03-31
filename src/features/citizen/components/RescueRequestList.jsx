/**
 * Example Component - Shows how to use API calls
 * This is a reference implementation for connecting FE to BE
 */

import React, { useState, useEffect } from 'react';
import { getMyRescueRequests } from '../api.js';

export default function RescueRequestList() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch data on component mount
    useEffect(() => {
        fetchRequests();
    }, []);

    /**
     * Fetch rescue requests from API
     */
    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError(null);

            // Call API with optional filters
            const response = await getMyRescueRequests({
                status: 'pending', // Optional filter
                page: 1,
                limit: 10,
            });

            // Handle response (adjust based on your backend format)
            // If backend returns: { data: [...], total: 10 }
            // Or just: [...]
            setRequests(Array.isArray(response) ? response : response.data || []);
        } catch (err) {
            setError(err.message || 'Không thể tải danh sách yêu cầu');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-slate-600">Đang tải...</div>
            </div>
        );
    }

    // Error state
    if (error && requests.length === 0) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-red-700">{error}</p>
                <button
                    onClick={fetchRequests}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    // Empty state
    if (requests.length === 0) {
        return (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
                <p className="text-slate-600">Chưa có yêu cầu cứu hộ nào</p>
            </div>
        );
    }

    // Success state - render list
    return (
        <div className="space-y-4">
            {error && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                    {error}
                </div>
            )}

            <div className="space-y-3">
                {requests.map((request) => (
                    <div
                        key={request.id}
                        className="rounded-lg border border-slate-200 bg-white p-4"
                    >
                        <h3 className="font-semibold text-slate-900">{request.location}</h3>
                        <p className="mt-1 text-sm text-slate-600">{request.description}</p>
                        <div className="mt-2 text-xs text-slate-500">
                            Trạng thái: {request.status} | Ngày tạo: {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
