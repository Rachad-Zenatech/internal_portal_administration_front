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
    subItems: [
      { label: "All Requests", path: "/purchasing/requests" },
      { label: "Draft", path: "/purchasing/requests?status=INITIAL" },
      { label: "New Request", path: "/purchasing/requests?status=NEW" },
      { label: "Under Review", path: "/purchasing/requests?status=UNDER_REVIEW" },
      { label: "Waiting Approval", path: "/purchasing/requests?status=WAITING_APPROVAL" },
      { label: "Waiting Payment", path: "/purchasing/requests?status=WAITING_PAYMENT" },
      { label: "Ordered / Purchased", path: "/purchasing/requests?status=PURCHASED" },
      { label: "Shipped", path: "/purchasing/requests?status=SHIPPED" },
      { label: "Goods Received", path: "/purchasing/requests?status=GOODS_RECEIVED" },
      { label: "Invoice Received", path: "/purchasing/requests?status=INVOICE_RECEIVED" },
      { label: "Completed", path: "/purchasing/requests?status=COMPLETED" },
      { label: "Rejected", path: "/purchasing/requests?status=REJECTED" },
      { label: "On Hold", path: "/purchasing/requests?status=ON_HOLD" },
    ],
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
      { label: "Chart of Accounts", path: "/configurations/chart-of-accounts", navigationCode: "CONFIG_CHART_OF_ACCOUNTS" },

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
