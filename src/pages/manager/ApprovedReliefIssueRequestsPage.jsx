import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Truck, FileText, Users } from 'lucide-react';
import { listInventoryIssues, listReliefRequests } from '../../features/relief/api.js';
import { getTeams } from '../../features/teams/api.js';
import Button from '../../shared/ui/Button.jsx';
import Card from '../../shared/ui/Card.jsx';
import Badge from '../../shared/ui/Badge.jsx';

function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function firstTruthy(...values) {
    for (const value of values) {
        if (value !== undefined && value !== null && value !== '') return value;
    }
    return null;
}

function toUpper(value) {
    return String(value || '').trim().toUpperCase();
}

function isApprovedIssue(issue) {
    const status = toUpper(issue?.status);
    return ['APPROVED', 'DONE', 'MANAGER_APPROVED', 'COMPLETED'].includes(status);
}

function isApprovedDelivery(deliveryStatus) {
    const status = toUpper(deliveryStatus);
    return ['MANAGER_APPROVED', 'RESCUER_RECEIVED', 'ARRIVED_WAREHOUSE', 'ARRIVED_RELIEF_POINT', 'COMPLETED'].includes(status);
}

function formatDateTime(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('vi-VN');
}

function deliveryLabel(status) {
    const s = toUpper(status);
    if (s === 'MANAGER_APPROVED') return 'Đã duyệt';
    if (s === 'RESCUER_RECEIVED') return 'Đội đã nhận';
    if (s === 'ARRIVED_WAREHOUSE') return 'Đã tới kho';
    if (s === 'ARRIVED_RELIEF_POINT') return 'Đã tới điểm cứu trợ';
    if (s === 'COMPLETED') return 'Hoàn thành';
    if (s === 'REJECTED') return 'Từ chối';
    return s || 'REQUESTED';
}

export default function ApprovedReliefIssueRequestsPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [reliefRequests, setReliefRequests] = useState([]);
    const [issues, setIssues] = useState([]);
    const [teams, setTeams] = useState([]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            const [reliefResp, issuesResp, teamsResp] = await Promise.all([
                listReliefRequests({ page: 0, size: 500 }),
                listInventoryIssues({ page: 0, size: 500 }),
                getTeams({ page: 0, size: 500 }),
            ]);
            setReliefRequests(normalizeList(reliefResp));
            setIssues(normalizeList(issuesResp));
            setTeams(normalizeList(teamsResp));
        } catch (e) {
            setError(e?.message || 'Không thể tải danh sách yêu cầu cứu trợ đã duyệt phiếu xuất.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const rows = useMemo(() => {
        const teamById = new Map(teams.map((t) => [Number(t.id), t]));
        const reliefById = new Map(reliefRequests.map((r) => [Number(r.id), r]));
        const reliefByCode = new Map(
            reliefRequests
                .filter((r) => r?.code)
                .map((r) => [String(r.code).trim().toUpperCase(), r])
        );

        const map = new Map();

        for (const issue of issues) {
            if (!isApprovedIssue(issue)) continue;

            const reliefId = toNumber(firstTruthy(
                issue?.reliefRequestId,
                issue?.relief_request_id,
                issue?.requestId
            ));
            const reliefCode = firstTruthy(issue?.reliefRequestCode, issue?.requestCode);

            const relief = reliefId
                ? reliefById.get(reliefId) || null
                : (reliefCode ? reliefByCode.get(String(reliefCode).trim().toUpperCase()) || null : null);

            const linkedReliefId = toNumber(relief?.id);
            if (!linkedReliefId) continue;

            const teamId = toNumber(firstTruthy(issue?.assignedTeamId, issue?.assigned_team_id, relief?.assignedTeamId));
            const team = teamId ? teamById.get(teamId) : null;
            const key = linkedReliefId;

            const row = {
                id: linkedReliefId,
                requestCode: relief?.code || `#${linkedReliefId}`,
                issueCode: issue?.code || `#${issue?.id || '—'}`,
                issueId: issue?.id || relief?.assignedIssueId || null,
                teamName: firstTruthy(issue?.assignedTeamName, team?.name, issue?.assignedTeamCode, team?.code, teamId ? `Đội #${teamId}` : null),
                teamId: teamId || null,
                deliveryStatus: firstTruthy(relief?.deliveryStatus, issue?.status, relief?.status),
                address: firstTruthy(relief?.targetArea, relief?.citizenAddressText, relief?.addressText, relief?.locationText, relief?.description, '—'),
                updatedAt: firstTruthy(issue?.approvedAt, issue?.updatedAt, issue?.createdAt, relief?.updatedAt, relief?.createdAt),
            };

            const existing = map.get(key);
            if (!existing) {
                map.set(key, row);
            } else {
                const existingTs = new Date(existing.updatedAt || 0).getTime();
                const nextTs = new Date(row.updatedAt || 0).getTime();
                if (nextTs >= existingTs) {
                    map.set(key, row);
                }
            }
        }

        for (const relief of reliefRequests) {
            const reliefId = toNumber(relief?.id);
            if (!reliefId || map.has(reliefId)) continue;

            const hasIssueLink = toNumber(relief?.assignedIssueId) !== null || toNumber(relief?.issueId) !== null;
            if (!hasIssueLink && !isApprovedDelivery(relief?.deliveryStatus)) continue;

            const teamId = toNumber(relief?.assignedTeamId);
            const team = teamId ? teamById.get(teamId) : null;
            map.set(reliefId, {
                id: reliefId,
                requestCode: relief?.code || `#${reliefId}`,
                issueCode: relief?.assignedIssueCode || (relief?.assignedIssueId ? `#${relief.assignedIssueId}` : '—'),
                issueId: relief?.assignedIssueId || relief?.issueId || null,
                teamName: firstTruthy(team?.name, team?.code, teamId ? `Đội #${teamId}` : null),
                teamId: teamId || null,
                deliveryStatus: firstTruthy(relief?.deliveryStatus, relief?.status),
                address: firstTruthy(relief?.targetArea, relief?.citizenAddressText, relief?.addressText, relief?.locationText, relief?.description, '—'),
                updatedAt: firstTruthy(relief?.updatedAt, relief?.createdAt),
            });
        }

        return Array.from(map.values()).sort((a, b) => {
            const ta = new Date(a.updatedAt || 0).getTime();
            const tb = new Date(b.updatedAt || 0).getTime();
            return tb - ta;
        });
    }, [issues, reliefRequests, teams]);

    return (
        <div className="space-y-4">
            <Card className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Yêu cầu cứu trợ đã duyệt phiếu xuất</h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Danh sách yêu cầu đã duyệt phiếu xuất và đội được phân công giao hàng.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="primary" size="sm">{rows.length} yêu cầu</Badge>
                        <Button type="button" variant="primary" onClick={loadData} disabled={loading}>
                            <RefreshCw className="h-4 w-4" />
                            Làm mới
                        </Button>
                    </div>
                </div>
            </Card>

            {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
            )}

            <Card className="p-0 overflow-hidden">
                {loading ? (
                    <div className="p-6 text-sm text-slate-500">Đang tải dữ liệu...</div>
                ) : rows.length === 0 ? (
                    <div className="p-6 text-sm text-slate-500">Chưa có yêu cầu nào được duyệt phiếu xuất.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-200 text-left text-slate-600">
                                    <th className="px-4 py-3 font-semibold">
                                        <div className="flex items-center gap-1"><FileText className="h-4 w-4" />Yêu cầu</div>
                                    </th>
                                    <th className="px-4 py-3 font-semibold">Phiếu xuất</th>
                                    <th className="px-4 py-3 font-semibold">
                                        <div className="flex items-center gap-1"><Users className="h-4 w-4" />Đội giao hàng</div>
                                    </th>
                                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                                    <th className="px-4 py-3 font-semibold">Địa chỉ / Mô tả</th>
                                    <th className="px-4 py-3 font-semibold text-right">Cập nhật</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.id} className="border-b border-slate-100 last:border-0">
                                        <td className="px-4 py-3 font-semibold text-slate-900">{row.requestCode}</td>
                                        <td className="px-4 py-3 text-slate-700">{row.issueCode}</td>
                                        <td className="px-4 py-3 text-slate-700">
                                            <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                                <Truck className="h-3.5 w-3.5" />
                                                {row.teamName || 'Chưa phân công'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">{deliveryLabel(row.deliveryStatus)}</td>
                                        <td className="px-4 py-3 text-slate-600">{row.address}</td>
                                        <td className="px-4 py-3 text-right text-slate-500">{formatDateTime(row.updatedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
