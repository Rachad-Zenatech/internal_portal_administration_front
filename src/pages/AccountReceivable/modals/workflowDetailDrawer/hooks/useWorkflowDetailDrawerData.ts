import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { arService } from "../../../../../services/arService";
import type { ARWorkflowState } from "../../../../../types/ar";
import type { WorkflowDetailDrawerProps } from "../types";

export function useWorkflowDetailDrawerData(props: WorkflowDetailDrawerProps) {
  const { workflowId, open, onOpenChange } = props;
  const queryClient = useQueryClient();
  const [transitionNote, setTransitionNote] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "metadata" | "actions">("timeline");
  const deleteMutation = useMutation({
    mutationFn: () => arService.deleteWorkflow(workflowId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-workflows"] });
      queryClient.invalidateQueries({ queryKey: ["ar-metrics"] });
      setShowDeletePrompt(false);
      onOpenChange(false);
    },
  });
  const {
    data: workflow,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["ar-workflow", workflowId],
    queryFn: () => arService.getWorkflowById(workflowId!),
    enabled: Boolean(workflowId && open),
    refetchInterval: 15000,
  });
  const transitionMutation = useMutation({
    mutationFn: ({
      targetState,
      note,
      payload,
    }: {
      targetState: ARWorkflowState;
      note?: string;
      payload?: Record<string, any>;
    }) =>
      arService.transitionWorkflow(workflowId!, {
        target_state: targetState,
        trigger_type: "MANUAL",
        note,
        payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-workflow", workflowId] });
      queryClient.invalidateQueries({ queryKey: ["ar-workflows"] });
      queryClient.invalidateQueries({ queryKey: ["ar-metrics"] });
      setTransitionNote("");
      setShowCancelPrompt(false);
      refetch();
    },
  });
  const timerMutation = useMutation({
    mutationFn: (timerType: string) =>
      arService.triggerWorkflowTimer(workflowId!, timerType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-workflow", workflowId] });
      queryClient.invalidateQueries({ queryKey: ["ar-workflows"] });
      queryClient.invalidateQueries({ queryKey: ["ar-metrics"] });
      refetch();
    },
  });
  return { transitionNote, setTransitionNote, cancellationReason, setCancellationReason, showCancelPrompt, setShowCancelPrompt, showDeletePrompt, setShowDeletePrompt, activeTab, setActiveTab, deleteMutation, workflow, isLoading, transitionMutation, timerMutation };
}
