import React from 'react';
import { Route, Routes } from 'react-router-dom';

import {
    PUBLIC_ROUTES,
    AUTH_ROUTES,
    CITIZEN_ROUTES,
    COORDINATOR_ROUTES,
    RESCUER_ROUTES,
    MANAGER_ROUTES,
    ADMIN_ROUTES,
} from './route.constants.js';
import RootLayout from '../../layouts/RootLayout.jsx';
import AuthLayout from '../../layouts/AuthLayout.jsx';
import RequireAuth from '../../shared/guards/RequireAuth.jsx';
import RequireRole from '../../shared/guards/RequireRole.jsx';

// Public
import HomePage from '../../pages/public/HomePage.jsx';
import EmergencyGuidePage from '../../pages/public/EmergencyGuidePage.jsx';
import NotFoundPage from '../../pages/public/NotFoundPage.jsx';

// Auth
import LoginPage from '../../pages/auth/LoginPage.jsx';
import RegisterPage from '../../pages/auth/RegisterPage.jsx';

// Citizen
import CitizenDashboard from '../../pages/citizen/CItizenDashboard.jsx';
import RescueRequestCreatePage from '../../pages/citizen/RescueRequestCreatePage.jsx';
import RescueRequestStatusPage from '../../pages/citizen/RescueRequestStatusPage.jsx';
import FeedbackPage from '../../pages/citizen/FeedbackPage.jsx';

// Coordinator
import CoordinatorDashboard from '../../pages/coordinator/CoordinatorDashboard.jsx';
import RescueQueuePage from '../../pages/coordinator/RescueQueuePage.jsx';
import RescueVerifyPage from '../../pages/coordinator/RescueVerifyPage.jsx';
import RescueAssignPage from '../../pages/coordinator/RescueAssignPage.jsx';
import RescueRequestHandle from '../../pages/coordinator/RescueRequestHandle.jsx';
import RescueRequestMerge from '../../pages/coordinator/RescueRequestMerge.jsx';
import TeamWorkloadPage from '../../pages/coordinator/TeamWorkloadPage.jsx';

// Rescuer
import RescuerDashboard from '../../pages/rescuer/RescuerDashboard.jsx';
import MyAssignmentsPage from '../../pages/rescuer/MyAssignmentsPage.jsx';

// Manager
import ManagerDashboard from '../../pages/manager/ManagerDashboard.jsx';
import InventoryOverviewPage from '../../pages/manager/InventoryOverviewPage.jsx';
import DistributionPlanPage from '../../pages/manager/DistributionPlanPage.jsx';
import AssetsManagementPage from '../../pages/manager/AssetsManagementPage.jsx';
import AssetCreatePage from '../../pages/manager/AssetCreatePage.jsx';
import AssetsAssignToTask from '../../features/assets/components/AssetsAssignToTask.jsx';
import ReceiptCreatePage from '../../pages/manager/ReceiptCreatePage.jsx';
import IssueCreatePage from '../../pages/manager/IssueCreatePage.jsx';
import ItemCategoriesPage from '../../pages/manager/ItemCategoriesPage.jsx';
import ReliefRequestDashboardPage from '../../pages/manager/ReliefRequestDashboardPage.jsx';
import ReliefRequestCreatePage from '../../pages/manager/ReliefRequestCreatePage.jsx';

// Admin
import AdminDashboard from '../../pages/admin/AdminDashboard.jsx';
import UserManagementPage from '../../pages/admin/UserManagementPage.jsx';
import RolesPermissionsPage from '../../pages/admin/RolesPermissionsPage.jsx';
import SystemCatalogPage from '../../pages/admin/SystemCatalogPage.jsx';
import NotificationTemplatesPage from '../../pages/admin/NotificationTemplatesPage.jsx';
import SystemSettingsPage from '../../pages/admin/SystemSettingsPage.jsx';
import AuditLogsPage from '../../pages/admin/AuditLogsPage.jsx';

/* =========================
   5) Route tree
   ========================= */
export default function AppRoutes() {
    return (
        <Routes>
            {/* -------- PUBLIC -------- */}
            <Route
                path={PUBLIC_ROUTES.HOME}
                element={<HomePage />}
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
            <Route
                path={CITIZEN_ROUTES.FEEDBACK}
                element={
                    <RequireAuth>
                        <RequireRole allow={['CITIZEN']}>
                            <RootLayout>
                                <FeedbackPage />
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
                path={COORDINATOR_ROUTES.TASK_MONITOR}
                element={
                    <RequireAuth>
                        <RequireRole allow={['COORDINATOR']}>
                            <RootLayout>
                                <RescueRequestHandle />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={COORDINATOR_ROUTES.MERGE_REQUESTS}
                element={
                    <RequireAuth>
                        <RequireRole allow={['COORDINATOR']}>
                            <RootLayout>
                                <RescueRequestMerge />
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
                path={MANAGER_ROUTES.ITEM_CATEGORIES}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <RootLayout>
                                <ItemCategoriesPage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.CREATE_RECEIPT}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <RootLayout>
                                <ReceiptCreatePage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.RELIEF_REQUEST_CREATE}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <RootLayout>
                                <ReliefRequestCreatePage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.RELIEF_REQUEST_DASHBOARD}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <RootLayout>
                                <ReliefRequestDashboardPage />
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
            <Route
                path={MANAGER_ROUTES.CREATE_ASSET}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <RootLayout>
                                <AssetCreatePage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.ASSIGN_ASSET_TO_TASK}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <AssetsAssignToTask />
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
                                <UserManagementPage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={ADMIN_ROUTES.ROLES_PERMISSIONS}
                element={
                    <RequireAuth>
                        <RequireRole allow={['ADMIN']}>
                            <RootLayout>
                                <RolesPermissionsPage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={ADMIN_ROUTES.SYSTEM_CATALOG}
                element={
                    <RequireAuth>
                        <RequireRole allow={['ADMIN']}>
                            <RootLayout>
                                <SystemCatalogPage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={ADMIN_ROUTES.NOTIFICATION_TEMPLATES}
                element={
                    <RequireAuth>
                        <RequireRole allow={['ADMIN']}>
                            <RootLayout>
                                <NotificationTemplatesPage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={ADMIN_ROUTES.SYSTEM_SETTINGS}
                element={
                    <RequireAuth>
                        <RequireRole allow={['ADMIN']}>
                            <RootLayout>
                                <SystemSettingsPage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={ADMIN_ROUTES.AUDIT_LOGS}
                element={
                    <RequireAuth>
                        <RequireRole allow={['ADMIN']}>
                            <RootLayout>
                                <AuditLogsPage />
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
