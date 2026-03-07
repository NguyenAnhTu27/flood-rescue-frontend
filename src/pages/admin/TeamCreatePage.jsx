import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Save, Plus, Trash2 } from 'lucide-react';
import { ADMIN_ROUTES } from '../../app/routes/route.constants.js';
import { createTeam, getTeam, updateTeam } from '../../features/teams/api.js';

export default function TeamCreatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const teamId = searchParams.get('id');
    const isEdit = !!teamId;

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        leaderId: null,
        leaderName: '',
        location: '',
        description: '',
    });
    const [members, setMembers] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Load team data if editing
    useEffect(() => {
        if (isEdit && teamId) {
            const loadTeam = async () => {
                try {
                    setLoading(true);
                    const data = await getTeam(teamId);
                    setFormData({
                        name: data.name || '',
                        code: data.code || '',
                        leaderId: data.leaderId || data.leader?.id || null,
                        leaderName: data.leaderName || data.leader?.name || '',
                        location: data.location || data.area || '',
                        description: data.description || '',
                    });
                    setMembers(data.members || []);
                } catch (e) {
                    console.error('[TeamCreatePage] Load team error:', e);
                    setError(e?.message || 'Không thể tải thông tin đội');
                } finally {
                    setLoading(false);
                }
            };
            loadTeam();
        }
    }, [isEdit, teamId]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddMember = () => {
        setMembers([...members, { name: '', phone: '', role: 'member' }]);
    };

    const handleChangeMember = (index, field, value) => {
        setMembers((prev) =>
            prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
        );
    };

    const handleRemoveMember = (index) => {
        setMembers((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name?.trim()) {
            setError('Vui lòng nhập tên đội');
            return;
        }
        if (!formData.code?.trim()) {
            setError('Vui lòng nhập mã đội');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const payload = {
                name: formData.name.trim(),
                code: formData.code.trim(),
                leaderId: formData.leaderId || null,
                leaderName: formData.leaderName?.trim() || null,
                location: formData.location?.trim() || null,
                description: formData.description?.trim() || null,
                members: members.filter((m) => m.name?.trim()),
            };

            console.log('[TeamCreatePage] Submitting team:', payload);

            if (isEdit) {
                await updateTeam(teamId, payload);
                window.alert('Cập nhật đội cứu hộ thành công!');
            } else {
                await createTeam(payload);
                window.alert('Tạo đội cứu hộ thành công!');
            }

            navigate(ADMIN_ROUTES.TEAMS_MANAGEMENT);
        } catch (e) {
            console.error('[TeamCreatePage] Submit error:', e);
            const errorMessage = e?.data?.message || e?.message || 'Không thể lưu đội cứu hộ';
            setError(errorMessage);
            window.alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-10">
                <div className="text-center text-sm text-slate-500">
                    <p>Đang tải thông tin đội...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <button
                    type="button"
                    onClick={() => navigate(ADMIN_ROUTES.TEAMS_MANAGEMENT)}
                    className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                    <ChevronLeft className="h-3 w-3" />
                    Trở về Quản lý đội cứu hộ
                </button>
                <h1 className="text-2xl font-bold text-slate-900">
                    {isEdit ? 'Cập nhật Đội Cứu Hộ' : 'Tạo Đội Cứu Hộ Mới'}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    {isEdit
                        ? 'Cập nhật thông tin đội cứu hộ trong hệ thống'
                        : 'Thêm đội cứu hộ mới vào hệ thống'}
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                {error && (
                    <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Tên đội */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Tên đội <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Ví dụ: Đội Cứu Hộ Số 1"
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            required
                        />
                    </div>

                    {/* Mã đội */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Mã đội <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => handleChange('code', e.target.value)}
                            placeholder="Ví dụ: TEAM-001"
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            required
                        />
                    </div>

                    {/* Đội trưởng */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Tên đội trưởng
                            </label>
                            <input
                                type="text"
                                value={formData.leaderName}
                                onChange={(e) => handleChange('leaderName', e.target.value)}
                                placeholder="Ví dụ: Nguyễn Văn A"
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                ID đội trưởng (tùy chọn)
                            </label>
                            <input
                                type="number"
                                value={formData.leaderId || ''}
                                onChange={(e) => handleChange('leaderId', e.target.value ? Number(e.target.value) : null)}
                                placeholder="ID người dùng"
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>

                    {/* Vị trí */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Vị trí
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => handleChange('location', e.target.value)}
                            placeholder="Ví dụ: Quận 1, TP.HCM"
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    {/* Mô tả */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Mô tả (tùy chọn)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Mô tả về đội cứu hộ..."
                            rows={3}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    {/* Thành viên */}
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-700">
                                Thành viên
                            </label>
                            <button
                                type="button"
                                onClick={handleAddMember}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <Plus className="h-3 w-3" />
                                Thêm thành viên
                            </button>
                        </div>
                        <div className="space-y-2">
                            {members.map((member, index) => (
                                <div
                                    key={index}
                                    className="flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
                                >
                                    <input
                                        type="text"
                                        value={member.name}
                                        onChange={(e) => handleChangeMember(index, 'name', e.target.value)}
                                        placeholder="Tên thành viên"
                                        className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                    />
                                    <input
                                        type="text"
                                        value={member.phone}
                                        onChange={(e) => handleChangeMember(index, 'phone', e.target.value)}
                                        placeholder="SĐT"
                                        className="w-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMember(index)}
                                        className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {members.length === 0 && (
                                <p className="text-sm text-slate-500">Chưa có thành viên nào. Click "Thêm thành viên" để thêm.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(ADMIN_ROUTES.TEAMS_MANAGEMENT)}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <Save className="h-4 w-4" />
                        {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật đội' : 'Tạo đội'}
                    </button>
                </div>
            </form>
        </div>
    );
}
