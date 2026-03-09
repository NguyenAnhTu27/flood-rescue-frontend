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
import FeedbackPage from '../../pages/citizen/FeedbackPage.jsx';
import RescueDetailRequestPage from '../../pages/citizen/RescueDetailRequestPage.jsx';
import RescueRequestCreatePage from '../../pages/citizen/RescueRequestCreatePage.jsx';
import RescueRequestStatusPage from '../../pages/citizen/RescueRequestStatusPage.jsx';
import MyRescueRequestsPage from '../../pages/citizen/MyRescueRequestsPage.jsx';
import RescueRequestUpdatePage from '../../pages/citizen/RescueRequestUpdatePage.jsx';

// Coordinator
import CoordinatorDashboard from '../../pages/coordinator/CoordinatorDashboardPage.jsx';
import RescueQueuePage from '../../pages/coordinator/RescueQueuePage.jsx';
import RescueVerifyPage from '../../pages/coordinator/RescueVerifyPage.jsx';
import RescuePrioritizePage from '../../pages/coordinator/RescuePrioritizePage.jsx';
import RescueAssignPage from '../../pages/coordinator/RescueAssignPage.jsx';
import TeamWorkloadPage from '../../pages/coordinator/TeamWorkloadPage.jsx';

// Rescuer
import RescuerDashboard from '../../pages/rescuer/RescuerDashboard.jsx';
import MyAssignmentsPage from '../../pages/rescuer/MyAssignmentsPage.jsx';
import RescueUpdateStatusPage from '../../pages/rescuer/RescueUpdateStatusPage.jsx';

// Manager
import ManagerDashboard from '../../pages/manager/ManagerDashboard.jsx';
import ManagerLayout from '../../layouts/ManagerLayout.jsx';
import InventoryOverviewPage from '../../pages/manager/kho/InventoryOverviewPage.jsx';
import DistributionPlanPage from '../../pages/manager/hang-cuu-tro/DistributionPlanPage.jsx';
import DistributionVoucherPage from '../../pages/manager/hang-cuu-tro/DistributionVoucherPage.jsx';
import AssetsManagementPage from '../../pages/manager/phuong-tien/AssetsManagementPage.jsx';
import AssetCreatePage from '../../pages/manager/phuong-tien/AssetCreatePage.jsx';
import AssetsAssignToTask from '../../features/assets/components/AssetsAssignToTask.jsx';
import ReceiptCreatePage from '../../pages/manager/kho/ReceiptCreatePage.jsx';
import ReceiptApprovalPage from '../../pages/manager/kho/ReceiptApprovalPage.jsx';
import IssueCreatePage from '../../pages/manager/kho/IssueCreatePage.jsx';
import ItemCategoriesPage from '../../pages/manager/kho/ItemCategoriesPage.jsx';
import ReliefRequestDashboardPage from '../../pages/manager/hang-cuu-tro/ReliefRequestDashboardPage.jsx';
import ReliefRequestCreatePage from '../../pages/manager/hang-cuu-tro/ReliefRequestCreatePage.jsx';
import ReliefRequestVerifyPage from '../../pages/manager/hang-cuu-tro/ReliefRequestVerifyPage.jsx';

// Admin
import AdminDashboard from '../../pages/admin/AdminDashboard.jsx';
import AdminTeamAssetPage from '../../pages/admin/AdminTeamAssetPage.jsx';
import AuditLogsPage from '../../pages/admin/AuditLogsPage.jsx';
import NotificationTemplatesPage from '../../pages/admin/NotificationTemplatesPage.jsx';
import RolesPermissionsPage from '../../pages/admin/RolesPermissionsPage.jsx';
import SystemSettingsPage from '../../pages/admin/SystemSettingsPage.jsx';
import UserManagementPage from '../../pages/admin/UserManagementPage.jsx';
import TeamsManagementPage from '../../pages/admin/TeamsManagementPage.jsx';
import TeamCreatePage from '../../pages/admin/TeamCreatePage.jsx';

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
                    <HomePage />}
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
                path={CITIZEN_ROUTES.RESCUE_DETAIL}
                element={
                    <RequireAuth>
                        <RequireRole allow={['CITIZEN']}>
                            <RootLayout>
                                <RescueDetailRequestPage />
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
                path={CITIZEN_ROUTES.MY_RESCUE_REQUESTS}
                element={
                    <RequireAuth>
                        <RequireRole allow={['CITIZEN']}>
                            <RootLayout>
                                <MyRescueRequestsPage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={CITIZEN_ROUTES.UPDATE_RESCUE_REQUEST}
                element={
                    <RequireAuth>
                        <RequireRole allow={['CITIZEN']}>
                            <RootLayout>
                                <RescueRequestUpdatePage />
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
                path={COORDINATOR_ROUTES.PRIORITIZE_REQUEST}
                element={
                    <RequireAuth>
                        <RequireRole allow={['COORDINATOR']}>
                            <RootLayout>
                                <RescuePrioritizePage />
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
            <Route
                path={RESCUER_ROUTES.UPDATE_STATUS}
                element={
                    <RequireAuth>
                        <RequireRole allow={['RESCUER']}>
                            <RootLayout>
                                <RescueUpdateStatusPage />
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
                            <ManagerLayout>
                                <ManagerDashboard />
                            </ManagerLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.INVENTORY_OVERVIEW}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <ManagerLayout>
                                <InventoryOverviewPage />
                            </ManagerLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.ITEM_CATEGORIES}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <ManagerLayout>
                                <ItemCategoriesPage />
                            </ManagerLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.CREATE_RECEIPT}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <ManagerLayout>
                                <ReceiptCreatePage />
                            </ManagerLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.RECEIPT_APPROVAL}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <ManagerLayout>
                                <ReceiptApprovalPage />
                            </ManagerLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.CREATE_ISSUE}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <ManagerLayout>
                                <IssueCreatePage />
                            </ManagerLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.RELIEF_REQUEST_CREATE}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <ManagerLayout>
                                <ReliefRequestCreatePage />
                            </ManagerLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.RELIEF_REQUEST_DASHBOARD}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <ManagerLayout>
                                <ReliefRequestDashboardPage />
                            </ManagerLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.RELIEF_APPROVE}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <ManagerLayout>
                                <ReliefRequestVerifyPage />
                            </ManagerLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.DISTRIBUTION_PLAN}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <ManagerLayout>
                                <DistributionPlanPage />
                            </ManagerLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.DISTRIBUTION_VOUCHER}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <ManagerLayout>
                                <DistributionVoucherPage />
                            </ManagerLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.ASSETS_MANAGEMENT}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <ManagerLayout>
                                <AssetsManagementPage />
                            </ManagerLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.CREATE_ASSET}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <ManagerLayout>
                                <AssetCreatePage />
                            </ManagerLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.ASSIGN_ASSET_TO_TASK}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <ManagerLayout>
                                <AssetsAssignToTask />
                            </ManagerLayout>
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
                path={ADMIN_ROUTES.TEAMS_MANAGEMENT}
                element={
                    <RequireAuth>
                        <RequireRole allow={['ADMIN']}>
                            <RootLayout>
                                <TeamsManagementPage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={ADMIN_ROUTES.CREATE_TEAM}
                element={
                    <RequireAuth>
                        <RequireRole allow={['ADMIN']}>
                            <RootLayout>
                                <TeamCreatePage />
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
            <Route
                path={ADMIN_ROUTES.TEAMS_ASSETS}
                element={
                    <RequireAuth>
                        <RequireRole allow={['ADMIN']}>
                            <RootLayout>
                                <AdminTeamAssetPage />
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



