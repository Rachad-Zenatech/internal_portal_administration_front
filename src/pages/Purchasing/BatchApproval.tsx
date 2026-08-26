import { TimezoneAutocomplete } from "./TimezoneAutocomplete";
import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/services/apiClient";
import { useWorkflowAssignments } from "@/hooks/usePurchasing";
import type { PurchaseRequest, RequestDetail, BatchNotificationSettings } from "@/types/purchasing";
import {
  formatDate,
  formatMoney,
  PRIORITY_BADGE,
} from "./purchasingMeta";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  Settings,
  ShieldCheck,
  Search,
  DollarSign,
  Layers,
  BellRing,
} from "lucide-react";
import { toast } from "sonner";


function RoleAutocomplete({
  value,
  onChange,
  assignments = [],
}: {
  value: string;
  onChange: (val: string) => void;
  assignments?: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Distinct roles configured in Workflow / Role Assignments
  const uniqueRoles = useMemo(() => {
    const rolesMap = new Map<string, any>();
    // Default system workflow roles
    const defaults = ["MANAGER", "DIRECTOR", "VP", "AP", "TREASURY", "PURCHASING", "RECEIVING"];
    defaults.forEach((r) => {
      rolesMap.set(r, { role: r, request_type: "ALL", active: true });
    });

    assignments.forEach((a) => {
      if (a.role) {
        rolesMap.set(a.role.toUpperCase(), a);
      }
    });

    return Array.from(rolesMap.values());
  }, [assignments]);

  const filteredRoles = useMemo(() => {
    const q = (searchTerm || "").toLowerCase().trim();
    if (!q) return uniqueRoles;
    return uniqueRoles.filter((r) => {
      const roleStr = (r.role || "").toLowerCase();
      const typeStr = (r.request_type || "").toLowerCase();
      return roleStr.includes(q) || typeStr.includes(q);
    });
  }, [uniqueRoles, searchTerm]);

  return (
    <div className="relative" ref={wrapperRef}>
      <Input
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="e.g. MANAGER, DIRECTOR, VP, AP"
        className="text-sm font-mono"
      />
      {isOpen && filteredRoles.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto p-1 text-sm">
          {filteredRoles.map((item: any) => {
            const roleName = item.role.toUpperCase();
            return (
              <button
                key={roleName}
                type="button"
                className="w-full text-left px-2.5 py-2 rounded hover:bg-accent hover:text-accent-foreground text-xs flex items-center justify-between transition-colors cursor-pointer"
                onClick={() => {
                  onChange(roleName);
                  setSearchTerm(roleName);
                  setIsOpen(false);
                }}
              >
                <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">{roleName}</span>
                <span className="text-[11px] text-muted-foreground bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  {item.request_type ? `Type: ${item.request_type}` : "Workflow Assignment"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function BatchApproval() {
  const { data: assignments = [] } = useWorkflowAssignments();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [actionComment, setActionComment] = useState("");

  // Fetch all requests in WAITING_APPROVAL
  const { data: requests = [], isLoading } = useQuery<PurchaseRequest[]>({
    queryKey: ["batch-waiting-approvals"],
    queryFn: async () => {
      return await apiClient.get<PurchaseRequest[]>(
        "/api/purchasing/requests?status=WAITING_APPROVAL"
      );
    },
  });

  // Fetch batch notification settings
  const { data: notifSettings, refetch: refetchSettings } = useQuery<BatchNotificationSettings>({
    queryKey: ["batch-notification-settings"],
    queryFn: async () => {
      return await apiClient.get<BatchNotificationSettings>(
        "/api/purchasing/batch-notification-settings"
      );
    },
  });

  const [settingsForm, setSettingsForm] = useState<BatchNotificationSettings>({
    enabled: true,
    midday_time: "12:00",
    end_of_day_time: "17:00",
    timezone: "America/New_York",
    recipient_role: "MANAGER",
    custom_emails: [],
  });

  // Batch approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ request_ids, comment }: { request_ids: number[]; comment?: string }) => {
      return await apiClient.post<RequestDetail[]>("/api/purchasing/batch-approve", {
        request_ids,
        comment,
      });
    },
    onSuccess: (res) => {
      toast.success(`Successfully approved ${res.length} request(s)`);
      setSelectedIds([]);
      setIsApproveOpen(false);
      setActionComment("");
      queryClient.invalidateQueries({ queryKey: ["batch-waiting-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing-summary"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Batch approval failed");
    },
  });

  // Batch reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ request_ids, comment }: { request_ids: number[]; comment?: string }) => {
      return await apiClient.post<RequestDetail[]>("/api/purchasing/batch-reject", {
        request_ids,
        comment,
      });
    },
    onSuccess: (res) => {
      toast.success(`Successfully rejected ${res.length} request(s)`);
      setSelectedIds([]);
      setIsRejectOpen(false);
      setActionComment("");
      queryClient.invalidateQueries({ queryKey: ["batch-waiting-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing-summary"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Batch rejection failed");
    },
  });

  // Trigger manual notification mutation
  const notifyMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.post<any>("/api/purchasing/batch-notify", {});
    },
    onSuccess: (res) => {
      if (res.sent) {
        toast.success(`Batch approval notification sent to managers (${res.recipients?.join(", ") || "Configured recipients"})`);
      } else {
        toast.info(res.message || "Notification completed");
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to trigger notification");
    },
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (payload: BatchNotificationSettings) => {
      return await apiClient.put<BatchNotificationSettings>(
        "/api/purchasing/batch-notification-settings",
        payload
      );
    },
    onSuccess: () => {
      toast.success("Batch notification settings saved successfully");
      setIsSettingsOpen(false);
      refetchSettings();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save settings");
    },
  });

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (
        searchTerm &&
        !r.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !r.requester.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !r.department.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !r.id.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [requests, searchTerm]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredRequests.map((r) => parseInt(r.id)));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const selectedTotalAmount = useMemo(() => {
    return requests
      .filter((r) => selectedIds.includes(parseInt(r.id)))
      .reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [requests, selectedIds]);

  const allSelected =
    filteredRequests.length > 0 &&
    filteredRequests.every((r) => selectedIds.includes(parseInt(r.id)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Batch Approval
            </h1>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Manager & Executive
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Review and take batch action on all pending purchase requests. Automated email summaries are dispatched twice daily (midday & end of day).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs font-medium"
            onClick={() => {
              if (notifSettings) setSettingsForm(notifSettings);
              setIsSettingsOpen(true);
            }}
          >
            <Settings size={15} />
            Schedule Settings
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs font-medium text-amber-700 border-amber-300 hover:bg-amber-50"
            disabled={notifyMutation.isPending || requests.length === 0}
            onClick={() => notifyMutation.mutate()}
          >
            <BellRing size={15} />
            {notifyMutation.isPending ? "Sending..." : "Notify Managers Now"}
          </Button>
        </div>
      </div>

      {/* Stats and Action Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-200/80 dark:border-zinc-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Awaiting Approval
              </p>
              <h3 className="text-2xl font-bold text-yellow-600 mt-1">
                {requests.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-yellow-50 dark:bg-yellow-950 flex items-center justify-center text-yellow-600">
              <Layers size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 dark:border-zinc-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Selected Requests
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
                {selectedIds.length} <span className="text-xs text-muted-foreground font-normal">of {requests.length}</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
              <ShieldCheck size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 dark:border-zinc-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Selected Total Value
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {formatMoney(selectedTotalAmount)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <DollarSign size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/80 dark:bg-zinc-900/50 p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search pending requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs bg-white dark:bg-zinc-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="default"
            size="sm"
            disabled={selectedIds.length === 0}
            className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setIsApproveOpen(true)}
          >
            <CheckCircle2 size={15} />
            Batch Approve ({selectedIds.length})
          </Button>

          <Button
            variant="destructive"
            size="sm"
            disabled={selectedIds.length === 0}
            className="h-8 gap-1.5 text-xs"
            onClick={() => setIsRejectOpen(true)}
          >
            <XCircle size={15} />
            Batch Reject ({selectedIds.length})
          </Button>
        </div>
      </div>

      {/* Table of Waiting Approvals */}
      <Card className="border border-slate-200 dark:border-zinc-800">
        <Table className="w-full min-w-full" containerClassName="flex-1 w-full min-w-full overflow-x-auto">
          <TableHeader >
            <TableRow className="bg-slate-50/50 dark:bg-zinc-900/50">
              <TableHead className="w-[48px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Title / Item</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Requested Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  Loading requests awaiting approval...
                </TableCell>
              </TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2 opacity-80" />
                    <p className="font-semibold text-slate-700 dark:text-zinc-200">
                      All caught up!
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      There are currently no purchase requests awaiting approval.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((req) => {
                const isSelected = selectedIds.includes(parseInt(req.id));
                return (
                  <TableRow
                    key={req.id}
                    onClick={() => navigate(`/purchasing/requests/${req.id}`)}
                    className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors ${
                      isSelected ? "bg-blue-50/40 dark:bg-blue-950/30" : ""
                    }`}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelectRow(parseInt(req.id), !!checked)
                        }
                        aria-label={`Select request ${req.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      #{req.id}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900 dark:text-zinc-100 text-sm group-hover:text-primary transition-colors">
                        {req.title}
                      </div>
                      {req.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {req.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{req.requester}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {req.department}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={PRIORITY_BADGE[req.priority]}>
                        {req.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {formatMoney(req.amount)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground text-right">
                      {formatDate(req.request_date)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Batch Approve Modal */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={20} />
              Confirm Batch Approval
            </DialogTitle>
            <DialogDescription>
              You are about to approve <strong>{selectedIds.length}</strong> purchase request(s) totaling <strong>{formatMoney(selectedTotalAmount)}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">Approval Comment (Optional)</label>
            <textarea
              className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 min-h-[80px]"
              placeholder="e.g. Approved per quarterly budget review."
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApproveOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={approveMutation.isPending}
              onClick={() =>
                approveMutation.mutate({
                  request_ids: selectedIds,
                  comment: actionComment,
                })
              }
            >
              {approveMutation.isPending ? "Approving..." : `Approve ${selectedIds.length} Requests`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Reject Modal */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle size={20} />
              Confirm Batch Rejection
            </DialogTitle>
            <DialogDescription>
              You are about to reject <strong>{selectedIds.length}</strong> purchase request(s).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 min-h-[80px]"
              placeholder="Reason for rejecting these requests..."
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={rejectMutation.isPending || !actionComment.trim()}
              onClick={() =>
                rejectMutation.mutate({
                  request_ids: selectedIds,
                  comment: actionComment,
                })
              }
            >
              {rejectMutation.isPending ? "Rejecting..." : `Reject ${selectedIds.length} Requests`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Schedule Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings size={18} />
              Batch Approval Notification Settings
            </DialogTitle>
            <DialogDescription>
              Configure the automated twice-daily manager notification schedule dispatched via Microsoft Graph API / SMTP.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-semibold text-slate-900 dark:text-zinc-100">
                  Enable Scheduled Email Notifications
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sends scheduled email digests of all pending approvals.
                </p>
              </div>
              <Checkbox
                checked={settingsForm.enabled}
                onCheckedChange={(checked) =>
                  setSettingsForm({ ...settingsForm, enabled: !!checked })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Midday Time (HH:MM)
                </label>
                <Input
                  type="time"
                  value={settingsForm.midday_time}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      midday_time: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  End of Day Time (HH:MM)
                </label>
                <Input
                  type="time"
                  value={settingsForm.end_of_day_time}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      end_of_day_time: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Timezone
              </label>
              <TimezoneAutocomplete
                value={settingsForm.timezone}
                onChange={(tz) =>
                  setSettingsForm({ ...settingsForm, timezone: tz })
                }
                placeholder="Select timezone (e.g. America/New_York)..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Recipient Role
              </label>
              <RoleAutocomplete
                value={settingsForm.recipient_role}
                onChange={(val) =>
                  setSettingsForm({
                    ...settingsForm,
                    recipient_role: val,
                  })
                }
                assignments={assignments}
              />
              <p className="text-[11px] text-muted-foreground">
                Emails all users assigned to this role in Workflow Assignments.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSettingsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={saveSettingsMutation.isPending}
              onClick={() => saveSettingsMutation.mutate(settingsForm)}
            >
              {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
