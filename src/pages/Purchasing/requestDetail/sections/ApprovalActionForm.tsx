import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

interface Props {
  v: RequestDetailViewState;
}

export function ApprovalActionForm({ v }: Props) {
  const { activeForm, user, approval, setApproval, data } = v;
  if (activeForm?.kind !== "approval") return null;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {activeForm.action === "REJECT" ? "Reviewer / Approver" : "Approver"}
        </label>
        <Select value={user?.id || approval.approver || "_current_user"} disabled>
          <SelectTrigger className="w-full bg-muted/50 cursor-not-allowed opacity-80">
            <SelectValue>{user?.full_name || user?.email || "Logged in User"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={user?.id || "_current_user"}>
              {user?.full_name || user?.email || "Logged in User"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {activeForm.action === "APPROVE" && (data?.request?.current_approval_level || 1) === 1 && (Boolean(data?.request?.requires_second_level) || Number(data?.request?.amount || data?.purchase_order?.amount || data?.invoice?.amount || 0) >= 10000) && (
        <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 rounded-xl space-y-1.5">
          <div className="flex items-center space-x-2.5">
            <Checkbox
              id="pass_to_level_2"
              checked={approval.pass_to_level_2 ?? true}
              onCheckedChange={(checked) => setApproval({ ...approval, pass_to_level_2: !!checked })}
            />
            <label htmlFor="pass_to_level_2" className="text-xs font-semibold text-purple-950 dark:text-purple-200 cursor-pointer flex items-center gap-1.5">
              <span>Pass to Level 2 Approver (Company Approver)</span>
              <Badge variant="outline" className="text-[10px] bg-purple-100/80 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border-purple-300">
                ≥ $10,000 incl. tax
              </Badge>
            </label>
          </div>
          <p className="text-[11px] text-purple-700 dark:text-purple-300 pl-6 leading-relaxed">
            {approval.pass_to_level_2
              ? "This approval will pass to the assigned Company Level 2 Approver(s) for final Level 2 approval. The request will stay in Waiting Approval state until approved or rejected by a Level 2 approver."
              : "Level 2 executive approval bypassed. This request will move directly to payment processing upon approval."}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">
          {activeForm.action === "REJECT" ? "Rejection Reason / Comments" : "Comment"}
        </label>
        <Textarea
          placeholder={activeForm.action === "REJECT" ? "Please provide a reason for rejecting this request..." : "Add an optional comment..."}
          value={approval.comment ?? ""}
          onChange={(e) => setApproval({ ...approval, comment: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}
