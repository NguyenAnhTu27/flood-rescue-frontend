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
import CoordinatorDashboard from '../../pages/coordinator/CoordinatorDashboardPage.jsx';
import RescueQueuePage from '../../pages/coordinator/RescueQueuePage.jsx';
import RescueVerifyPage from '../../pages/coordinator/RescueVerifyPage.jsx';
import RescueAssignPage from '../../pages/coordinator/RescueAssignPage.jsx';
import RescueRequestHandle from '../../pages/coordinator/RescueRequestHandle.jsx';
import RescueRequestMerge from '../../pages/coordinator/RescueRequestMerge.jsx';
import TeamWorkloadPage from '../../pages/coordinator/TeamWorkloadPage.jsx';

// Rescuer
import RescuerDashboard from '../../pages/rescuer/RescuerDashboard.jsx';
import MyAssignmentsPage from '../../pages/rescuer/MyAssignmentsPage.jsx';
import AssignmentDetailPage from '../../pages/rescuer/AssignmentDetailPage.jsx';
import RescueUpdateStatusPage from '../../pages/rescuer/RescueUpdateStatusPage.jsx';
import DeliveryConfirmPage from '../../pages/rescuer/DeliveryConfirmPage.jsx';

// Manager
import ManagerDashboard from '../../pages/manager/ManagerDashboard.jsx';
import InventoryOverviewPage from '../../pages/manager/InventoryOverviewPage.jsx';
import DistributionPlanPage from '../../pages/manager/DistributionPlanPage.jsx';
import AssetsManagementPage from '../../pages/manager/AssetsManagementPage.jsx';

// Admin
import AdminDashboard from '../../pages/admin/AdminDashboard.jsx';
import UserManagementPage from '../../pages/admin/UserManagementPage.jsx';

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
            <Route
                path={RESCUER_ROUTES.ASSIGNMENT_DETAIL}
                element={
                    <RequireAuth>
                        <RequireRole allow={['RESCUER']}>
                            <RootLayout>
                                <AssignmentDetailPage />
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={RESCUER_ROUTES.UPDATE_RESCUE_STATUS}
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
            <Route
                path={RESCUER_ROUTES.DELIVERY_CONFIRM}
                element={
                    <RequireAuth>
                        <RequireRole allow={['RESCUER']}>
                            <RootLayout>
                                <DeliveryConfirmPage />
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
                                <UserManagementPage />
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