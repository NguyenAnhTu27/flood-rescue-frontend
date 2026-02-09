import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import {
    PUBLIC_ROUTES,
    AUTH_ROUTES,
    CITIZEN_ROUTES,
    COORDINATOR_ROUTES,
    RESCUER_ROUTES,
    MANAGER_ROUTES,
    ADMIN_ROUTES,
} from './route.constants.js';

/* =========================
   1) Layouts (import thật sau)
   ========================= */
// TODO: thay bằng import thật từ src/layouts/...
function RootLayout({ children }) {
    // Layout chung: Topbar + container
    return (
        <div className="min-h-screen bg-white">
            <div className="sticky top-0 z-10 border-b bg-white">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                    <div className="font-semibold">Flood Rescue</div>
                    <div className="text-sm text-slate-600">Topbar (đồng nhất)</div>
                </div>
            </div>
            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </div>
    );
}

function AuthLayout({ children }) {
    return (
        <div className="min-h-screen bg-white">
            <main className="mx-auto max-w-md px-4 py-10">{children}</main>
        </div>
    );
}

/* =========================
   2) Mock auth (thay bằng store thật sau)
   ========================= */
// TODO: thay bằng zustand store: useAuthStore()
function useAuth() {
    // Demo nhanh: đọc token/role từ localStorage
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role'); // CITIZEN / COORDINATOR / RESCUER / MANAGER / ADMIN
    return { isAuthed: !!token, role };
}

/* =========================
   3) Guards
   ========================= */
function RequireAuth({ children }) {
    const { isAuthed } = useAuth();
    if (!isAuthed) return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
    return children;
}

function RequireRole({ allow, children }) {
    const { role } = useAuth();
    if (!role || !allow.includes(role)) return <Navigate to={PUBLIC_ROUTES.HOME} replace />;
    return children;
}

/* =========================
   4) Placeholder Pages (thay bằng pages thật sau)
   ========================= */
const Page = ({ title }) => (
    <div className="rounded-xl border bg-white p-6">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-slate-600">Placeholder page</p>
    </div>
);

const HomePage = () => <Page title="Home" />;
const EmergencyGuidePage = () => <Page title="Hướng dẫn khẩn cấp" />;
const NotFoundPage = () => <Page title="404 - Không tìm thấy trang" />;

const LoginPage = () => <Page title="Đăng nhập" />;
const RegisterPage = () => <Page title="Đăng ký (Citizen)" />;

/* Citizen */
const CitizenDashboard = () => <Page title="Công dân - Dashboard" />;
const RescueRequestCreatePage = () => <Page title="Công dân - Tạo yêu cầu cứu hộ" />;
const RescueRequestStatusPage = () => <Page title="Công dân - Trạng thái cứu hộ" />;

/* Coordinator */
const CoordinatorDashboard = () => <Page title="Điều phối - Dashboard" />;
const RescueQueuePage = () => <Page title="Điều phối - Danh sách yêu cầu" />;
const RescueVerifyPage = () => <Page title="Điều phối - Xác minh yêu cầu" />;
const RescueAssignPage = () => <Page title="Điều phối - Phân công đội & phương tiện" />;
const TeamWorkloadPage = () => <Page title="Điều phối - Theo dõi đội xử lý nhiều yêu cầu" />;

/* Rescuer */
const RescuerDashboard = () => <Page title="Đội cứu hộ - Dashboard" />;
const MyAssignmentsPage = () => <Page title="Đội cứu hộ - Nhiệm vụ" />;

/* Manager */
const ManagerDashboard = () => <Page title="Quản lý - Dashboard" />;
const InventoryOverviewPage = () => <Page title="Quản lý - Kho hàng (1 kho)" />;
const DistributionPlanPage = () => <Page title="Quản lý - Lập phiếu phân phối" />;
const AssetsManagementPage = () => <Page title="Quản lý - Phương tiện & thiết bị" />;

/* Admin */
const AdminDashboard = () => <Page title="Admin - Dashboard" />;
const UsersManagementPage = () => <Page title="Admin - Quản lý người dùng" />;

/* =========================
   5) Route tree
   ========================= */
export default function AppRoutes() {
    return (
        <Routes>
            {/* -------- PUBLIC -------- */}
            <Route
                path={PUBLIC_ROUTES.HOME}
                element={
                    <RootLayout>
                        <HomePage />
                    </RootLayout>
                }
            />
            <Route
                path={PUBLIC_ROUTES.EMERGENCY_GUIDE}
                element={
                    <RootLayout>
                        <EmergencyGuidePage />
                    </RootLayout>
                }
            />

            {/* -------- AUTH -------- */}
            <Route
                path={AUTH_ROUTES.LOGIN}
                element={
                    <AuthLayout>
                        <LoginPage />
                    </AuthLayout>
                }
            />
            <Route
                path={AUTH_ROUTES.REGISTER}
                element={
                    <AuthLayout>
                        <RegisterPage />
                    </AuthLayout>
                }
            />

            {/* -------- CITIZEN (Private) -------- */}
            <Route
                path={CITIZEN_ROUTES.DASHBOARD}
                element={
                    <RequireAuth>
                        <RequireRole allow={['CITIZEN']}>
                            <RootLayout>
                                <CitizenDashboard />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={CITIZEN_ROUTES.CREATE_RESCUE_REQUEST}
                element={
                    <RequireAuth>
                        <RequireRole allow={['CITIZEN']}>
                            <RootLayout>
                                <RescueRequestCreatePage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={CITIZEN_ROUTES.RESCUE_REQUEST_STATUS}
                element={
                    <RequireAuth>
                        <RequireRole allow={['CITIZEN']}>
                            <RootLayout>
                                <RescueRequestStatusPage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />

            {/* -------- COORDINATOR (Private) -------- */}
            <Route
                path={COORDINATOR_ROUTES.DASHBOARD}
                element={
                    <RequireAuth>
                        <RequireRole allow={['COORDINATOR']}>
                            <RootLayout>
                                <CoordinatorDashboard />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={COORDINATOR_ROUTES.RESCUE_QUEUE}
                element={
                    <RequireAuth>
                        <RequireRole allow={['COORDINATOR']}>
                            <RootLayout>
                                <RescueQueuePage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={COORDINATOR_ROUTES.VERIFY_REQUEST}
                element={
                    <RequireAuth>
                        <RequireRole allow={['COORDINATOR']}>
                            <RootLayout>
                                <RescueVerifyPage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={COORDINATOR_ROUTES.ASSIGN_RESCUE}
                element={
                    <RequireAuth>
                        <RequireRole allow={['COORDINATOR']}>
                            <RootLayout>
                                <RescueAssignPage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={COORDINATOR_ROUTES.TEAM_WORKLOAD}
                element={
                    <RequireAuth>
                        <RequireRole allow={['COORDINATOR']}>
                            <RootLayout>
                                <TeamWorkloadPage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />

            {/* -------- RESCUER (Private) -------- */}
            <Route
                path={RESCUER_ROUTES.DASHBOARD}
                element={
                    <RequireAuth>
                        <RequireRole allow={['RESCUER']}>
                            <RootLayout>
                                <RescuerDashboard />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={RESCUER_ROUTES.MY_ASSIGNMENTS}
                element={
                    <RequireAuth>
                        <RequireRole allow={['RESCUER']}>
                            <RootLayout>
                                <MyAssignmentsPage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />

            {/* -------- MANAGER (Private) -------- */}
            <Route
                path={MANAGER_ROUTES.DASHBOARD}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <RootLayout>
                                <ManagerDashboard />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.INVENTORY_OVERVIEW}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <RootLayout>
                                <InventoryOverviewPage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.DISTRIBUTION_PLAN}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <RootLayout>
                                <DistributionPlanPage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.ASSETS_MANAGEMENT}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <RootLayout>
                                <AssetsManagementPage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />

            {/* -------- ADMIN (Private) -------- */}
            <Route
                path={ADMIN_ROUTES.DASHBOARD}
                element={
                    <RequireAuth>
                        <RequireRole allow={['ADMIN']}>
                            <RootLayout>
                                <AdminDashboard />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={ADMIN_ROUTES.USERS_MANAGEMENT}
                element={
                    <RequireAuth>
                        <RequireRole allow={['ADMIN']}>
                            <RootLayout>
                                <UsersManagementPage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />

            {/* -------- NOT FOUND -------- */}
            <Route
                path={PUBLIC_ROUTES.NOT_FOUND}
                element={
                    <RootLayout>
                        <NotFoundPage />
                    </RootLayout>
                }
            />
        </Routes>
    );
}