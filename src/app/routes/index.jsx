import React, { Suspense, lazy } from 'react';
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
import RootLayout from '../../layouts/RootLayout.jsx';
import AuthLayout from '../../layouts/AuthLayout.jsx';
import PublicLayout from '../../layouts/PublicLayout.jsx';
import RequireAuth from '../../shared/guards/RequireAuth.jsx';
import RequireRole from '../../shared/guards/RequireRole.jsx';
import PageLoader from '../../shared/ui/PageLoader.jsx';

// Public
import HomePage from '../../pages/public/HomePage.jsx';
import EmergencyGuidePage from '../../pages/public/EmergencyGuidePage.jsx';
import NotFoundPage from '../../pages/public/NotFoundPage.jsx';
import StaticContentPage from '../../pages/public/StaticContentPage.jsx';
import SupportContactPage from '../../pages/public/SupportContactPage.jsx';

// Auth
import LoginPage from '../../pages/auth/LoginPage.jsx';
import RegisterPage from '../../pages/auth/RegisterPage.jsx';

// Citizen (lazy-loaded)
const CitizenDashboard = lazy(() => import('../../pages/citizen/CItizenDashboard.jsx'));
const RescueRequestCreatePage = lazy(() => import('../../pages/citizen/RescueRequestCreatePage.jsx'));
const RescueRequestStatusPage = lazy(() => import('../../pages/citizen/RescueRequestStatusPage.jsx'));
const MyRescueRequestsPage = lazy(() => import('../../pages/citizen/MyRescueRequestsPage.jsx'));
const RescueRequestUpdatePage = lazy(() => import('../../pages/citizen/RescueRequestUpdatePage.jsx'));
const ReliefRequestUpdatePage = lazy(() => import('../../pages/citizen/ReliefRequestUpdatePage.jsx'));
const CitizenReliefRequestCreatePage = lazy(() => import('../../pages/citizen/ReliefRequestCreatePage.jsx'));
const FeedbackPage = lazy(() => import('../../pages/citizen/FeedbackPage.jsx'));
const MyReliefRequestsPage = lazy(() => import('../../pages/citizen/MyReliefRequestsPage.jsx'));
const ReliefRequestStatusPage = lazy(() => import('../../pages/citizen/ReliefRequestStatusPage.jsx'));

// Coordinator (lazy-loaded)
const CoordinatorDashboard = lazy(() => import('../../pages/coordinator/CoordinatorDashboardPage.jsx'));
const RescueVerifyPage = lazy(() => import('../../pages/coordinator/RescueVerifyPage.jsx'));
const RescueAssignPage = lazy(() => import('../../pages/coordinator/RescueAssignPage.jsx'));
const RescueRequestHandle = lazy(() => import('../../pages/coordinator/RescueRequestHandle.jsx'));
const RescueHistoryPage = lazy(() => import('../../pages/coordinator/RescueHistoryPage.jsx'));
const TeamWorkloadPage = lazy(() => import('../../pages/coordinator/TeamWorkloadPage.jsx'));
const GroupRequestsByAreaPage = lazy(() => import('../../pages/coordinator/GroupRequestsByAreaPage.jsx'));
const RescuePrioritizePage = lazy(() => import('../../pages/coordinator/RescuePrioritizePage.jsx'));
const DuplicateManagementPage = lazy(() => import('../../pages/coordinator/DuplicateManagementPage.jsx'));
const BlockedCitizensPage = lazy(() => import('../../pages/coordinator/BlockedCitizensPage.jsx'));

// Rescuer (lazy-loaded)
const RescuerDashboard = lazy(() => import('../../pages/rescuer/RescuerDashboard.jsx'));
const MyAssignmentsPage = lazy(() => import('../../pages/rescuer/MyAssignmentsPage.jsx'));
const AssignmentDetailPage = lazy(() => import('../../pages/rescuer/AssignmentDetailPage.jsx'));
const MissionMapTrackingPage = lazy(() => import('../../pages/rescuer/MissionMapTrackingPage.jsx'));
const FieldUpdatePage = lazy(() => import('../../pages/rescuer/FieldUpdatePage.jsx'));
const RescueUpdateStatusPage = lazy(() => import('../../pages/rescuer/RescueUpdateStatusPage.jsx'));
const ReliefPrioritizeDetailPage = lazy(() => import('../../pages/rescuer/ReliefPrioritizeDetailPage.jsx'));

// Manager (lazy-loaded)
const ManagerDashboard = lazy(() => import('../../pages/manager/ManagerDashboard.jsx'));
const ManagerLayout = lazy(() => import('../../layouts/ManagerLayout.jsx'));
const InventoryOverviewPage = lazy(() => import('../../pages/manager/kho/InventoryOverviewPage.jsx'));
const DistributionPlanPage = lazy(() => import('../../pages/manager/hang-cuu-tro/DistributionPlanPage.jsx'));
const DistributionVoucherPage = lazy(() => import('../../pages/manager/hang-cuu-tro/DistributionVoucherPage.jsx'));
const AssetsManagementPage = lazy(() => import('../../pages/manager/phuong-tien/AssetsManagementPage.jsx'));
const AssetCreatePage = lazy(() => import('../../pages/manager/phuong-tien/AssetCreatePage.jsx'));
const AssetsAssignToTask = lazy(() => import('../../features/assets/components/AssetsAssignToTask.jsx'));
const ReceiptCreatePage = lazy(() => import('../../pages/manager/kho/ReceiptCreatePage.jsx'));
const ReceiptApprovalPage = lazy(() => import('../../pages/manager/kho/ReceiptApprovalPage.jsx'));
const IssueCreatePage = lazy(() => import('../../pages/manager/kho/IssueCreatePage.jsx'));
const ItemCategoriesPage = lazy(() => import('../../pages/manager/kho/ItemCategoriesPage.jsx'));
const ItemClassificationsPage = lazy(() => import('../../pages/manager/ItemClassificationsPage.jsx'));
const ItemUnitsPage = lazy(() => import('../../pages/manager/ItemUnitsPage.jsx'));
const ReliefRequestDashboardPage = lazy(() => import('../../pages/manager/hang-cuu-tro/ReliefRequestDashboardPage.jsx'));
const ReliefRequestCreatePage = lazy(() => import('../../pages/manager/hang-cuu-tro/ReliefRequestCreatePage.jsx'));
const ReliefRequestVerifyPage = lazy(() => import('../../pages/manager/hang-cuu-tro/ReliefRequestVerifyPage.jsx'));
const ReliefRequestsPage = lazy(() => import('../../pages/manager/ReliefRequestsPage.jsx'));
const ReliefTeamManagementPage = lazy(() => import('../../pages/manager/ReliefTeamManagementPage.jsx'));
const ApprovedReliefIssueRequestsPage = lazy(() => import('../../pages/manager/ApprovedReliefIssueRequestsPage.jsx'));
const ReliefPrioritizePageManager = lazy(() => import('../../pages/manager/ReliefPrioritizePage.jsx'));
const ReportsPage = lazy(() => import('../../pages/manager/ReportsPage.jsx'));

// Admin (lazy-loaded)
const AdminDashboard = lazy(() => import('../../pages/admin/AdminDashboard.jsx'));
const UserManagementPage = lazy(() => import('../../pages/admin/UserManagementPage.jsx'));
const SystemSettingsPage = lazy(() => import('../../pages/admin/SystemSettingsPage.jsx'));
const AuditLogsPage = lazy(() => import('../../pages/admin/AuditLogsPage.jsx'));
const TeamsManagementPage = lazy(() => import('../../pages/admin/TeamsManagementPage.jsx'));
const TeamCreatePage = lazy(() => import('../../pages/admin/TeamCreatePage.jsx'));
const SystemFeedbacksPage = lazy(() => import('../../pages/admin/SystemFeedbacksPage.jsx'));
const ContentPagesSettingsPage = lazy(() => import('../../pages/admin/ContentPagesSettingsPage.jsx'));


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
                    <PublicLayout>
                        <HomePage />
                    </PublicLayout>
                }
            />
            <Route
                path={PUBLIC_ROUTES.EMERGENCY_GUIDE}
                element={
                    <PublicLayout>
                        <EmergencyGuidePage />
                    </PublicLayout>
                }
            />
            <Route
                path={PUBLIC_ROUTES.TERMS_OF_USE}
                element={
                    <PublicLayout>
                        <StaticContentPage />
                    </PublicLayout>
                }
            />
            <Route path="/dieu-khoan-su-dung" element={<Navigate replace to={PUBLIC_ROUTES.TERMS_OF_USE} />} />
            <Route
                path={PUBLIC_ROUTES.PRIVACY_POLICY}
                element={
                    <PublicLayout>
                        <StaticContentPage />
                    </PublicLayout>
                }
            />
            <Route
                path={PUBLIC_ROUTES.SUPPORT_CONTACT}
                element={
                    <PublicLayout>
                        <SupportContactPage />
                    </PublicLayout>
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
                                <Suspense fallback={<PageLoader />}>
                                    <CitizenDashboard />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <RescueRequestCreatePage />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <RescueRequestStatusPage />
                                </Suspense>
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={CITIZEN_ROUTES.CREATE_RELIEF_REQUEST}
                element={
                    <RequireAuth>
                        <RequireRole allow={['CITIZEN']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <CitizenReliefRequestCreatePage />
                                </Suspense>
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={CITIZEN_ROUTES.MY_RELIEF_REQUESTS}
                element={
                    <RequireAuth>
                        <RequireRole allow={['CITIZEN']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <MyReliefRequestsPage />
                                </Suspense>
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={CITIZEN_ROUTES.RELIEF_REQUEST_STATUS}
                element={
                    <RequireAuth>
                        <RequireRole allow={['CITIZEN']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <ReliefRequestStatusPage />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <MyRescueRequestsPage />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <RescueRequestUpdatePage />
                                </Suspense>
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={CITIZEN_ROUTES.UPDATE_RELIEF_REQUEST}
                element={
                    <RequireAuth>
                        <RequireRole allow={['CITIZEN']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <ReliefRequestUpdatePage />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <FeedbackPage />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <CoordinatorDashboard />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <RescueVerifyPage />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <RescueAssignPage />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <RescueRequestHandle />
                                </Suspense>
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={COORDINATOR_ROUTES.TASK_HISTORY}
                element={
                    <RequireAuth>
                        <RequireRole allow={['COORDINATOR']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <RescueHistoryPage />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <TeamWorkloadPage />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <RescuePrioritizePage />
                                </Suspense>
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={COORDINATOR_ROUTES.DUPLICATE_MANAGEMENT}
                element={
                    <RequireAuth>
                        <RequireRole allow={['COORDINATOR']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <DuplicateManagementPage />
                                </Suspense>
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={COORDINATOR_ROUTES.BLOCKED_CITIZENS}
                element={
                    <RequireAuth>
                        <RequireRole allow={['COORDINATOR']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <BlockedCitizensPage />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <RescuerDashboard />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <MyAssignmentsPage />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <AssignmentDetailPage />
                                </Suspense>
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={RESCUER_ROUTES.MISSION_MAP}
                element={
                    <RequireAuth>
                        <RequireRole allow={['RESCUER']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <MissionMapTrackingPage />
                                </Suspense>
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={RESCUER_ROUTES.FIELD_UPDATE}
                element={
                    <RequireAuth>
                        <RequireRole allow={['RESCUER']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <FieldUpdatePage />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <RescueUpdateStatusPage />
                                </Suspense>
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={RESCUER_ROUTES.SAFETY_GUIDE}
                element={
                    <RequireAuth>
                        <RequireRole allow={['RESCUER']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <MyAssignmentsPage />
                                </Suspense>
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path="/doi-cuu-ho/huong-dan-an-toan"
                element={
                    <RequireAuth>
                        <RequireRole allow={['RESCUER']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <MyAssignmentsPage />
                                </Suspense>
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={RESCUER_ROUTES.RELIEF_PRIORITIZE}
                element={
                    <RequireAuth>
                        <RequireRole allow={['RESCUER']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <ReliefPrioritizePageManager />
                                </Suspense>
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={RESCUER_ROUTES.RELIEF_PRIORITIZE_DETAIL}
                element={
                    <RequireAuth>
                        <RequireRole allow={['RESCUER']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <ReliefPrioritizeDetailPage />
                                </Suspense>
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
                            <Suspense fallback={<PageLoader />}>
                                <ManagerLayout>
                                    <ManagerDashboard />
                                </ManagerLayout>
                            </Suspense>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.RELIEF_REQUESTS}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <ReliefRequestsPage />
                                </Suspense>
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
                            <Suspense fallback={<PageLoader />}>
                                <ManagerLayout>
                                    <InventoryOverviewPage />
                                </ManagerLayout>
                            </Suspense>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.ITEM_CATEGORIES}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <Suspense fallback={<PageLoader />}>
                                <ManagerLayout>
                                    <ItemCategoriesPage />
                                </ManagerLayout>
                            </Suspense>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.ITEM_CLASSIFICATIONS}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <Suspense fallback={<PageLoader />}>
                                <ManagerLayout>
                                    <ItemClassificationsPage />
                                </ManagerLayout>
                            </Suspense>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.ITEM_UNITS}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <Suspense fallback={<PageLoader />}>
                                <ManagerLayout>
                                    <ItemUnitsPage />
                                </ManagerLayout>
                            </Suspense>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.CREATE_RECEIPT}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <Suspense fallback={<PageLoader />}>
                                <ManagerLayout>
                                    <ReceiptCreatePage />
                                </ManagerLayout>
                            </Suspense>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.CREATE_ISSUE}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <Suspense fallback={<PageLoader />}>
                                <ManagerLayout>
                                    <IssueCreatePage />
                                </ManagerLayout>
                            </Suspense>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.RELIEF_TEAM_MANAGEMENT}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <ReliefTeamManagementPage />
                                </Suspense>
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.RELIEF_APPROVED_ISSUES}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <ApprovedReliefIssueRequestsPage />
                                </Suspense>
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
                            <Suspense fallback={<PageLoader />}>
                                <ManagerLayout>
                                    <ReliefRequestCreatePage />
                                </ManagerLayout>
                            </Suspense>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.RELIEF_REQUEST_DASHBOARD}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <Suspense fallback={<PageLoader />}>
                                <ManagerLayout>
                                    <ReliefRequestDashboardPage />
                                </ManagerLayout>
                            </Suspense>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.RELIEF_APPROVE}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <Suspense fallback={<PageLoader />}>
                                <ManagerLayout>
                                    <ReliefRequestVerifyPage />
                                </ManagerLayout>
                            </Suspense>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.DISTRIBUTION_PLAN}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <Suspense fallback={<PageLoader />}>
                                <ManagerLayout>
                                    <DistributionPlanPage />
                                </ManagerLayout>
                            </Suspense>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.DISTRIBUTION_VOUCHER}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <Suspense fallback={<PageLoader />}>
                                <ManagerLayout>
                                    <DistributionVoucherPage />
                                </ManagerLayout>
                            </Suspense>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.ASSETS_MANAGEMENT}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <Suspense fallback={<PageLoader />}>
                                <ManagerLayout>
                                    <AssetsManagementPage />
                                </ManagerLayout>
                            </Suspense>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.CREATE_ASSET}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <Suspense fallback={<PageLoader />}>
                                <ManagerLayout>
                                    <AssetCreatePage />
                                </ManagerLayout>
                            </Suspense>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.ASSIGN_ASSET_TO_TASK}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <Suspense fallback={<PageLoader />}>
                                <ManagerLayout>
                                    <AssetsAssignToTask />
                                </ManagerLayout>
                            </Suspense>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={MANAGER_ROUTES.REPORTS}
                element={
                    <RequireAuth>
                        <RequireRole allow={['MANAGER']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <ReportsPage />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <AdminDashboard />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <UserManagementPage />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <TeamsManagementPage />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <TeamCreatePage />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <SystemSettingsPage />
                                </Suspense>
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
                                <Suspense fallback={<PageLoader />}>
                                    <AuditLogsPage />
                                </Suspense>
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={ADMIN_ROUTES.SYSTEM_FEEDBACKS}
                element={
                    <RequireAuth>
                        <RequireRole allow={['ADMIN']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <SystemFeedbacksPage />
                                </Suspense>
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={ADMIN_ROUTES.ASSETS_MANAGEMENT}
                element={
                    <RequireAuth>
                        <RequireRole allow={['ADMIN']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <AssetsManagementPage />
                                </Suspense>
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={ADMIN_ROUTES.CREATE_ASSET}
                element={
                    <RequireAuth>
                        <RequireRole allow={['ADMIN']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <AssetCreatePage />
                                </Suspense>
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />
            <Route
                path={ADMIN_ROUTES.CONTENT_PAGES}
                element={
                    <RequireAuth>
                        <RequireRole allow={['ADMIN']}>
                            <RootLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <ContentPagesSettingsPage />
                                </Suspense>
                            </RootLayout>
                        </RequireRole>
                    </RequireAuth>
                }
            />

            {/* -------- NOT FOUND -------- */}
            <Route
                path={PUBLIC_ROUTES.NOT_FOUND}
                element={
                    <PublicLayout>
                        <NotFoundPage />
                    </PublicLayout>
                }
            />
        </Routes>
    );
}
