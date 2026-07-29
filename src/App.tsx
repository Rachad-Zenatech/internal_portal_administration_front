import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./lib/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";

const AppShell = lazy(() => import("./components/AppShell/AppShell"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const UploadFile = lazy(() => import("./pages/UploadFiles"));
const Users = lazy(() => import("./pages/Configurations/Users"));
const Roles = lazy(() => import("./pages/Configurations/Roles"));
const UserRoleAssignment = lazy(() => import("./pages/Configurations/UserRoleAssignment"));
const RoleGroupPermissions = lazy(() => import("./pages/Configurations/RoleGroupPermissions"));
const RoleApiPermissions = lazy(() => import("./pages/Configurations/RoleApiPermissions"));
const RoleMcpToolPermissions = lazy(() => import("./pages/Configurations/RoleMcpToolPermissions"));
const AuditLog = lazy(() => import("./pages/Log/AuditLog"));
const PurchaseRequests = lazy(() => import("./pages/Purchasing/PurchaseRequests"));
const RequestDetail = lazy(() => import("./pages/Purchasing/RequestDetail"));
const Invoices = lazy(() => import("./pages/Purchasing/Invoices"));
const Login = lazy(() => import("./pages/Login"));
const PendingAccess = lazy(() => import("./pages/PendingAccess"));

function App() {
  return (
    <AuthProvider>
        <BrowserRouter>
        <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/pending-access" element={<PendingAccess />} />

          {/* Main app layout routes */}
          <Route element={<ProtectedRoute><AppShell><Outlet /></AppShell></ProtectedRoute>}>
            <Route path="/" element={<ProtectedRoute navigationCode="DASHBOARD"><Dashboard /></ProtectedRoute>} />
            <Route path="/upload-files" element={<ProtectedRoute navigationCode="UPLOAD_FILES"><UploadFile /></ProtectedRoute>} />

            {/* Purchasing + Accounts Payable workflow (Tasks 1-3).
                Protected by auth only (no navigationCode) so the prototype flow
                is testable before RBAC permissions are seeded. */}
            <Route path="/purchasing" element={<Navigate to="/purchasing/requests" replace />} />
            <Route path="/purchasing/requests" element={<ProtectedRoute><PurchaseRequests /></ProtectedRoute>} />
            <Route path="/purchasing/requests/:id" element={<ProtectedRoute><RequestDetail /></ProtectedRoute>} />
            <Route path="/purchasing/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />

            <Route path="/configurations" element={<Navigate to="/configurations/users" replace />} />

            {/* We use a parent route wrapper or just protect individual config routes */}


            <Route path="/configurations/users" element={<ProtectedRoute navigationCode="CONFIG_USERS"><Users /></ProtectedRoute>} />
            <Route path="/configurations/roles" element={<ProtectedRoute navigationCode="CONFIG_ROLES"><Roles /></ProtectedRoute>} />
            <Route path="/configurations/user-role-assignment" element={<ProtectedRoute navigationCode="CONFIG_USER_ROLE_ASSIGNMENT"><UserRoleAssignment /></ProtectedRoute>} />
            <Route path="/configurations/role-group-permissions" element={<ProtectedRoute navigationCode="CONFIG_ROLES"><RoleGroupPermissions /></ProtectedRoute>} />
            <Route path="/configurations/role-api-permissions" element={<ProtectedRoute navigationCode="CONFIG_ROLE_API_PERMISSIONS"><RoleApiPermissions /></ProtectedRoute>} />
            <Route path="/configurations/role-mcp-tool-permissions" element={<ProtectedRoute navigationCode="CONFIG_ROLE_MCP_TOOL_PERMISSIONS"><RoleMcpToolPermissions /></ProtectedRoute>} />


            {/* Logs */}
            <Route path="/log" element={<Navigate to="/log/audit-log" replace />} />
            <Route path="/log/audit-log" element={<ProtectedRoute navigationCode="AUDIT_LOG"><AuditLog /></ProtectedRoute>} />


          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
