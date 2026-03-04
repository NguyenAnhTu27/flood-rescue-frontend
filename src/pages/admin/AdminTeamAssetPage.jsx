import React, { useEffect, useState } from 'react';

import { createTeam, getTeams } from '../../features/admin/api.js';
import { createAsset } from '../../features/assets/api.js';
import Button from '../../shared/ui/Button.jsx';
import Input from '../../shared/ui/Input.jsx';

export default function AdminTeamAssetPage() {
    // ===== TEAM =====
    const [teamName, setTeamName] = useState('');
    const [teamDesc, setTeamDesc] = useState('');
    const [teamStatus, setTeamStatus] = useState('AVAILABLE'); // Rảnh
    const [teams, setTeams] = useState([]);
    const [loadingTeam, setLoadingTeam] = useState(false);

    // ===== ASSET =====
    const [assetCode, setAssetCode] = useState('');
    const [assetName, setAssetName] = useState('');
    const [assetType, setAssetType] = useState('BOAT');
    const [assetCapacity, setAssetCapacity] = useState('');
    const [assetTeamId, setAssetTeamId] = useState('');
    const [assetNote, setAssetNote] = useState('');
    const [assetStatus, setAssetStatus] = useState('AVAILABLE'); // Rảnh
    const [loadingAsset, setLoadingAsset] = useState(false);

    useEffect(() => {
        loadTeams();
    }, []);

    async function loadTeams() {
        try {
            const data = await getTeams();
            setTeams(data || []);
        } catch (e) {
            console.error('[AdminTeamAssetPage] loadTeams error:', e);
        }
    }

    async function handleCreateTeam(e) {
        e.preventDefault();
        if (!teamName.trim()) {
            window.alert('Vui lòng nhập tên đội cứu hộ');
            return;
        }

        try {
            setLoadingTeam(true);
            // Build payload - chỉ gửi các field có giá trị
            const payload = {
                name: teamName.trim(),
            };

            // Chỉ thêm description nếu có giá trị (không gửi null hoặc empty)
            if (teamDesc?.trim()) {
                payload.description = teamDesc.trim();
            }

            // Thử không gửi status khi tạo mới (BE có thể tự set mặc định)
            // Nếu BE yêu cầu status, uncomment dòng dưới
            // payload.status = teamStatus;

            console.log('[AdminTeamAssetPage] Creating team with payload:', payload);
            const result = await createTeam(payload);
            console.log('[AdminTeamAssetPage] Team created successfully:', result);

            window.alert('Tạo đội cứu hộ thành công');
            setTeamName('');
            setTeamDesc('');
            setTeamStatus('AVAILABLE');
            await loadTeams();
        } catch (e) {
            console.error('[AdminTeamAssetPage] createTeam error:', e);
            const errorMessage = e?.message || e?.data?.message || e?.data?.error || 'Không xác định được lỗi';
            console.error('[AdminTeamAssetPage] Error details:', {
                message: errorMessage,
                status: e?.status,
                data: e?.data,
                fullError: e,
            });
            window.alert(`Tạo đội cứu hộ thất bại: ${errorMessage}`);
        } finally {
            setLoadingTeam(false);
        }
    }

    async function handleCreateAsset(e) {
        e.preventDefault();
        if (!assetCode.trim() || !assetName.trim() || !assetType.trim()) return;

        try {
            setLoadingAsset(true);
            const payload = {
                code: assetCode.trim(),
                name: assetName.trim(),
                assetType: assetType.trim(),
                assignedTeamId: assetTeamId ? Number(assetTeamId) : null,
            };

            if (assetCapacity) {
                payload.capacity = Number(assetCapacity);
            }

            if (assetNote && assetNote.trim()) {
                payload.note = assetNote.trim();
            }

            // Tạm thời KHÔNG gửi status khi tạo mới để tránh xung đột DTO
            // Nếu BE yêu cầu status, có thể mở lại dòng dưới
            // payload.status = assetStatus;

            console.log('[AdminTeamAssetPage] Creating asset with payload:', payload);
            await createAsset(payload);
            window.alert('Tạo phương tiện thành công');
            setAssetCode('');
            setAssetName('');
            setAssetType('BOAT');
            setAssetCapacity('');
            setAssetTeamId('');
            setAssetNote('');
            setAssetStatus('AVAILABLE');
        } catch (e) {
            console.error('[AdminTeamAssetPage] createAsset error:', e);
            window.alert('Tạo phương tiện thất bại');
        } finally {
            setLoadingAsset(false);
        }
    }

    return (
        <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4">
            {/* Form tạo đội */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-slate-900">Tạo Đội Cứu hộ</h2>

                <form className="space-y-3" onSubmit={handleCreateTeam}>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Tên đội cứu hộ *</label>
                        <Input
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="Ví dụ: Đội Cứu hộ số 1"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Mô tả</label>
                        <Input
                            value={teamDesc}
                            onChange={(e) => setTeamDesc(e.target.value)}
                            placeholder="Mô tả ngắn về đội"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Trạng thái đội</label>
                        <select
                            className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
                            value={teamStatus}
                            onChange={(e) => setTeamStatus(e.target.value)}
                        >
                            <option value="AVAILABLE">Rảnh (AVAILABLE)</option>
                            <option value="BUSY">Đang bận (BUSY)</option>
                            <option value="ON_MISSION">Đang thực hiện nhiệm vụ (ON_MISSION)</option>
                        </select>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" size="sm" disabled={loadingTeam}>
                            {loadingTeam ? 'Đang tạo...' : 'Tạo đội'}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Form tạo phương tiện */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-slate-900">Tạo Phương tiện / Thiết bị</h2>

                <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreateAsset}>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Mã phương tiện *</label>
                        <Input
                            value={assetCode}
                            onChange={(e) => setAssetCode(e.target.value)}
                            placeholder="ASSET-BOAT-01"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Tên phương tiện *</label>
                        <Input
                            value={assetName}
                            onChange={(e) => setAssetName(e.target.value)}
                            placeholder="Tàu cứu hộ 01"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Loại phương tiện *</label>
                        <select
                            className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
                            value={assetType}
                            onChange={(e) => setAssetType(e.target.value)}
                        >
                            <option value="BOAT">Thuyền / Tàu (BOAT)</option>
                            <option value="TRUCK">Xe tải (TRUCK)</option>
                            <option value="CAR">Xe ô tô (CAR)</option>
                            <option value="OTHER">Khác (OTHER)</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Sức chứa (số người / kg)</label>
                        <Input
                            type="number"
                            value={assetCapacity}
                            onChange={(e) => setAssetCapacity(e.target.value)}
                            placeholder="Ví dụ: 10"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Gán cho đội (tuỳ chọn)</label>
                        <select
                            className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
                            value={assetTeamId}
                            onChange={(e) => setAssetTeamId(e.target.value)}
                        >
                            <option value="">-- Chưa gán --</option>
                            {teams.map((team) => (
                                <option key={team.id} value={team.id}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Trạng thái phương tiện</label>
                        <select
                            className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
                            value={assetStatus}
                            onChange={(e) => setAssetStatus(e.target.value)}
                        >
                            <option value="AVAILABLE">Rảnh (AVAILABLE)</option>
                            <option value="BUSY">Đang bận (BUSY)</option>
                            <option value="ON_MISSION">Đang thực hiện nhiệm vụ (ON_MISSION)</option>
                        </select>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-medium text-slate-700">Ghi chú</label>
                        <Input
                            value={assetNote}
                            onChange={(e) => setAssetNote(e.target.value)}
                            placeholder="Ghi chú thêm (biển số, vị trí đậu, ...)"
                        />
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                        <Button type="submit" size="sm" disabled={loadingAsset}>
                            {loadingAsset ? 'Đang tạo...' : 'Tạo phương tiện'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

