import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Search, Check, UserCheck, RefreshCw } from "lucide-react";

/** Multi-User Approver Selection Popover */
export function MultiUserApproverPopover({
  title,
  subTitle,
  users,
  selectedUserIds,
  onSave,
  isSaving,
  triggerButton,
}: {
  title: string;
  subTitle?: string;
  users: any[];
  selectedUserIds: string[];
  onSave: (userIds: string[]) => Promise<void>;
  isSaving: boolean;
  triggerButton: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [draftIds, setDraftIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setDraftIds(selectedUserIds || []);
      setSearch("");
    }
  }, [open, selectedUserIds]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const active = users.filter((u) => u.is_active !== false);
    if (!q) return active;
    return active.filter(
      (u) =>
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        (u.job_title && u.job_title.toLowerCase().includes(q))
    );
  }, [users, search]);

  const toggleUser = (userId: string) => {
    setDraftIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async () => {
    await onSave(draftIds);
    setOpen(false);
  };

  const handleClear = async () => {
    setDraftIds([]);
    await onSave([]);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent className="w-[380px] sm:w-[420px] p-0 shadow-xl" align="end">
        <div className="p-3 border-b bg-slate-50/80 dark:bg-zinc-900/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              {title}
            </span>
            <span className="text-[10px] text-muted-foreground">Multi-Approver Selection</span>
          </div>
          {subTitle && <p className="text-[11px] text-muted-foreground mb-2">{subTitle}</p>}

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search users by name, email, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-white dark:bg-zinc-950"
            />
          </div>

          {/* Selected user chips preview */}
          {draftIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 max-h-20 overflow-y-auto">
              {draftIds.map((uid) => {
                const u = users.find((x) => x.id === uid);
                return (
                  <Badge
                    key={uid}
                    variant="secondary"
                    className="text-[11px] font-normal pl-2 pr-1 py-0.5 gap-1 bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                  >
                    <span>{u ? u.full_name || u.email : uid}</span>
                    <button
                      type="button"
                      onClick={() => toggleUser(uid)}
                      className="hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full p-0.5 text-emerald-700 dark:text-emerald-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
              <button
                type="button"
                onClick={() => setDraftIds([])}
                className="text-[10px] text-muted-foreground hover:text-red-500 underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* User list with checkboxes */}
        <div
          className="max-h-[260px] overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-slate-800/60"
          onWheelCapture={(e) => e.stopPropagation()}
        >
          {filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No active users found matching "{search}"
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = draftIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleUser(u.id)}
                  className={`p-2 rounded cursor-pointer text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200"
                      : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleUser(u.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0"
                    />
                    <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-slate-200 flex items-center justify-center text-xs font-semibold shrink-0">
                      {u.full_name
                        ?.split(" ")
                        .map((p: string) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() || "U"}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold truncate">{u.full_name || u.email}</span>
                        {u.department && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {u.department}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                        <span>{u.email}</span>
                        {u.job_title && (
                          <>
                            <span>&middot;</span>
                            <span className="truncate">{u.job_title}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="p-2.5 border-t bg-slate-50/90 dark:bg-zinc-900/90 flex items-center justify-between gap-2">
          {selectedUserIds && selectedUserIds.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={isSaving}
              onClick={handleClear}
              className="h-8 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              Unassign All
            </Button>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              {draftIds.length} approver{draftIds.length === 1 ? "" : "s"} selected
            </span>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSaving}
              onClick={handleSave}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
            >
              {isSaving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {isSaving ? "Saving..." : `Apply (${draftIds.length})`}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
