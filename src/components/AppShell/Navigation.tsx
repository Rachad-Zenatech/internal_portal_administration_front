import {
  LayoutDashboard,
  Upload,
  ShieldCheck,
  FileClock,
  GitMerge,
  BellRing,
  ShoppingCart,
  ReceiptText,
} from "lucide-react";

export const navigation = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    section: "MAIN",
    navigationCode: "DASHBOARD",
  },
  {
    label: "Upload Files",
    path: "/upload-files",
    icon: Upload,
    section: "MAIN",
    navigationCode: "UPLOAD_FILES",
  },
  {
    label: "Workflows",
    path: "/workflows",
    icon: GitMerge,
    section: "ORDER SYSTEM",
    navigationCode: "WORKFLOWS_MANAGE",
  },
  {
    label: "Notification Plans",
    path: "/notifications",
    icon: BellRing,
    section: "ORDER SYSTEM",
    navigationCode: "NOTIFICATIONS_MANAGE",
  },
  {
    label: "Purchase Requests",
    path: "/purchasing/requests",
    icon: ShoppingCart,
    section: "PURCHASING & AP",
    // No navigationCode: this is a new prototype feature not yet backed by
    // RBAC seed data, so it stays visible to any authenticated user for testing.
  },
  {
    label: "Accounts Payable",
    path: "/purchasing/invoices",
    icon: ReceiptText,
    section: "PURCHASING & AP",
  },

  {
    label: "System & Security",
    icon: ShieldCheck,
    section: "ADMINISTRATION",
    subItems: [
      { label: "Users", path: "/configurations/users", navigationCode: "CONFIG_USERS" },
      { label: "Roles", path: "/configurations/roles", navigationCode: "CONFIG_ROLES" },
      { label: "Role Assignments", path: "/configurations/user-role-assignment", navigationCode: "CONFIG_USER_ROLE_ASSIGNMENT" },
      { label: "Role Permissions", path: "/configurations/role-group-permissions", navigationCode: "CONFIG_ROLE_API_PERMISSIONS" },
      { label: "MCP Tool Permissions", path: "/configurations/role-mcp-tool-permissions", navigationCode: "CONFIG_ROLE_MCP_TOOL_PERMISSIONS" },
      { label: "Workflow Assignments", path: "/configurations/workflow-assignments", navigationCode: "CONFIG_USER_ROLE_ASSIGNMENT" },

    ]
  },
  {
    label: "Audit Log",
    path: "/log/system-logs",
    icon: FileClock,
    section: "ADMINISTRATION",
    navigationCode: "AUDIT_LOG",
  },
]
