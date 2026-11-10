import { GitFork, Plus, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkflowAutoCanvas } from "./hooks/useWorkflowAutoCanvas";
import { StageCardNode } from "./components/StageCardNode";
import { PipelineStepperCard } from "./components/PipelineStepperCard";
import { SimulatorPanel } from "./components/SimulatorPanel";
import { MoveStageModal } from "./dialogs/MoveStageModal";
import { MoveActionModal } from "./dialogs/MoveActionModal";
import { ChangeOwnerModal } from "./dialogs/ChangeOwnerModal";
import { EditStageModal } from "./dialogs/EditStageModal";
import { EditActionModal } from "./dialogs/EditActionModal";
import { MoveFieldModal } from "./dialogs/MoveFieldModal";

import type { WorkflowDomain } from "@/services/experimentalWorkflowService";

interface WorkflowAutoCanvasProps {
  domain: WorkflowDomain;
  title: string;
  subtitle: string;
}

export function WorkflowAutoCanvas({ domain, title, subtitle }: WorkflowAutoCanvasProps) {
  const {
    nodes,
    usersList,
    rolesList,
    resetMutation,
    saveAsDefaultMutation,
    // Simulator
    activeStepId: _activeStepId,
    setActiveStepId,
    testExecutionLog,
    setTestExecutionLog,
    testFieldValues,
    setTestFieldValues,
    currentSimulatedIndex,
    currentSimulatedNode,
    handleSimulateAction,
    // Stage crud & reorder
    handleInsertStep,
    handleDeleteStep,
    handleMoveStep,
    handleTransferToOtherDomain,
    // Stage edit dialog
    editingNode,
    setEditingNode,
    nodeTitle,
    setNodeTitle,
    nodeDesc,
    setNodeDesc,
    nodeBadge,
    setNodeBadge,
    nodeAssignedRole,
    setNodeAssignedRole,
    nodeReviewControlEnabled,
    setNodeReviewControlEnabled,
    nodeReviewControlRole,
    setNodeReviewControlRole,
    nodeReviewControlUser,
    setNodeReviewControlUser,
    nodeReviewControlVariable,
    setNodeReviewControlVariable,
    nodeReviewControlText,
    setNodeReviewControlText,
    handleOpenEditStep,
    handleSaveStep,
    // Owner modal
    editingOwnerNode,
    setEditingOwnerNode,
    ownerSearch,
    setOwnerSearch,
    customRoleInput,
    setCustomRoleInput,
    handleOpenOwnerModal,
    handleSelectOwnerUser,
    handleSaveCustomOwnerRole,
    // Move stage modal
    movingNodeIndex,
    setMovingNodeIndex,
    // Move action modal
    movingActionInfo,
    setMovingActionInfo,
    handleMoveActionToStage,
    handleTransferActionToOtherDomain,
    // Move field modal
    movingFieldInfo,
    setMovingFieldInfo,
    handleMoveField,
    handleTransferFieldToOtherDomain,
    // Action edit dialog
    editingAction,
    setEditingAction,
    actionLabel,
    setActionLabel,
    actionDesc,
    setActionDesc,
    actionVariant,
    setActionVariant,
    actionType,
    setActionType,
    actionTarget,
    setActionTarget,
    actionFields,
    setActionFields,
    handleAddActionButton,
    handleOpenEditAction,
    handleSaveAction,
    handleDeleteAction,
    // Drag-and-drop
    draggedNodeIndex,
    setDraggedNodeIndex,
    dragOverNodeIndex,
    setDragOverNodeIndex,
    dropSide,
    setDropSide,
  } = useWorkflowAutoCanvas({ domain });

  return (
    <div className="w-full flex flex-col gap-5 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                {title}
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                  Experimental Auto
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (window.confirm("Reset workflow back to the standard Purchase Request production flow?")) {
                resetMutation.mutate();
              }
            }}
            disabled={resetMutation.isPending}
            className="text-xs h-8 gap-1.5"
            title="Load the default flow (undo with Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Standard Flow
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (window.confirm("Save the current workflow as the default? \"Reset to Standard Flow\" will restore this version from now on.")) {
                saveAsDefaultMutation.mutate();
              }
            }}
            disabled={saveAsDefaultMutation.isPending}
            className="text-xs h-8 gap-1.5"
            title="Store this workflow in the database as the default"
          >
            <Save className="w-3.5 h-3.5" />
            Save as Default
          </Button>
          <Button
            size="sm"
            onClick={() => handleInsertStep(nodes.length)}
            className="text-xs h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Stage at End
          </Button>
        </div>
      </div>

      {/* Horizontal Visual Canvas */}
      <div className="w-full overflow-x-auto pb-4 pt-1">
        <div className="inline-flex items-start gap-3 min-w-full">
          {/* Add node at very beginning (left-most) */}
          <div className="self-center flex flex-col items-center">
            <Button
              size="icon"
              variant="outline"
              onClick={() => handleInsertStep(0)}
              title="Add stage before first step"
              className="h-8 w-8 rounded-full border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-500 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <span className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">Add Left</span>
          </div>

          {nodes.map((node, idx) => {
            const isSimulated = currentSimulatedNode?.id === node.id;
            const isDragged = draggedNodeIndex === idx;
            const isDragOver = dragOverNodeIndex === idx;

            return (
              <StageCardNode
                key={node.id}
                node={node}
                idx={idx}
                isSimulated={isSimulated}
                isDragged={isDragged}
                isDragOver={isDragOver}
                dropSide={isDragOver ? dropSide : null}
                testFieldValues={testFieldValues}
                setTestFieldValues={setTestFieldValues}
                onDragOverNode={(targetIdx, e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const midX = rect.left + rect.width / 2;
                  const side = e.clientX < midX ? "left" : "right";
                  if (dragOverNodeIndex !== targetIdx || dropSide !== side) {
                    setDragOverNodeIndex(targetIdx);
                    setDropSide(side);
                  }
                }}
                onDragLeaveNode={() => {
                  if (dragOverNodeIndex === idx) {
                    setDragOverNodeIndex(null);
                    setDropSide(null);
                  }
                }}
                onDropNode={(targetIdx) => {
                  if (draggedNodeIndex !== null) {
                    handleMoveStep(draggedNodeIndex, targetIdx, dropSide || "right");
                  }
                  setDraggedNodeIndex(null);
                  setDragOverNodeIndex(null);
                  setDropSide(null);
                }}
                onDragStartNode={(sourceIdx, e) => {
                  setDraggedNodeIndex(sourceIdx);
                  e.dataTransfer.setData("text/plain", String(sourceIdx));
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEndNode={() => {
                  setDraggedNodeIndex(null);
                  setDragOverNodeIndex(null);
                  setDropSide(null);
                }}
                onOpenMoveModal={(stageIdx) => setMovingNodeIndex(stageIdx)}
                onOpenEditStep={handleOpenEditStep}
                onDeleteStep={handleDeleteStep}
                onOpenOwnerModal={handleOpenOwnerModal}
                onAddActionButton={handleAddActionButton}
                onSimulateAction={handleSimulateAction}
                onStartMoveAction={(sourceStepId, actionIndex, action) =>
                  setMovingActionInfo({ sourceStepId, actionIndex, action })
                }
                onStartMoveField={(sourceStepId, sourceActionId, fieldIndex, field) =>
                  setMovingFieldInfo({ sourceStepId, sourceActionId, fieldIndex, field })
                }
                onOpenEditAction={handleOpenEditAction}
                onDeleteAction={handleDeleteAction}
                onInsertStepAfter={handleInsertStep}
                onMoveActionToStage={handleMoveActionToStage}
                onMoveField={handleMoveField}
              />
            );
          })}
        </div>
      </div>

      {/* Dynamic Workflow Pipeline Stepper View */}
      <PipelineStepperCard
        nodes={nodes}
        currentSimulatedNode={currentSimulatedNode}
        currentSimulatedIndex={currentSimulatedIndex}
        onSelectStep={setActiveStepId}
      />

      {/* Simulator & Live Test Panel */}
      <SimulatorPanel
        currentSimulatedNode={currentSimulatedNode}
        testExecutionLog={testExecutionLog}
        onClearLog={() => setTestExecutionLog([])}
        onSimulateAction={handleSimulateAction}
      />

      {/* Move / Reorder / Transfer Stage Modal */}
      <MoveStageModal
        movingNodeIndex={movingNodeIndex}
        nodes={nodes}
        domain={domain}
        onClose={() => setMovingNodeIndex(null)}
        onMoveStep={handleMoveStep}
        onTransferToOtherDomain={handleTransferToOtherDomain}
      />

      {/* Move Action Button to Another Stage Modal */}
      <MoveActionModal
        movingActionInfo={movingActionInfo}
        nodes={nodes}
        domain={domain}
        onClose={() => setMovingActionInfo(null)}
        onMoveActionToStage={handleMoveActionToStage}
        onTransferActionToOtherDomain={handleTransferActionToOtherDomain}
      />

      {/* Move Form Field Modal */}
      <MoveFieldModal
        movingFieldInfo={movingFieldInfo}
        nodes={nodes}
        domain={domain}
        onClose={() => setMovingFieldInfo(null)}
        onMoveField={handleMoveField}
        onTransferFieldToOtherDomain={handleTransferFieldToOtherDomain}
      />

      {/* Quick Change Owner & Role Modal */}
      <ChangeOwnerModal
        editingOwnerNode={editingOwnerNode}
        usersList={usersList}
        rolesList={rolesList}
        ownerSearch={ownerSearch}
        setOwnerSearch={setOwnerSearch}
        customRoleInput={customRoleInput}
        setCustomRoleInput={setCustomRoleInput}
        onClose={() => setEditingOwnerNode(null)}
        onSelectOwnerUser={handleSelectOwnerUser}
        onSaveCustomOwnerRole={handleSaveCustomOwnerRole}
      />

      {/* Edit Stage Node Modal */}
      <EditStageModal
        editingNode={editingNode}
        nodeTitle={nodeTitle}
        setNodeTitle={setNodeTitle}
        nodeDesc={nodeDesc}
        setNodeDesc={setNodeDesc}
        nodeAssignedRole={nodeAssignedRole}
        setNodeAssignedRole={setNodeAssignedRole}
        nodeBadge={nodeBadge}
        setNodeBadge={setNodeBadge}
        nodeReviewControlEnabled={nodeReviewControlEnabled}
        setNodeReviewControlEnabled={setNodeReviewControlEnabled}
        nodeReviewControlRole={nodeReviewControlRole}
        setNodeReviewControlRole={setNodeReviewControlRole}
        nodeReviewControlUser={nodeReviewControlUser}
        setNodeReviewControlUser={setNodeReviewControlUser}
        nodeReviewControlVariable={nodeReviewControlVariable}
        setNodeReviewControlVariable={setNodeReviewControlVariable}
        nodeReviewControlText={nodeReviewControlText}
        setNodeReviewControlText={setNodeReviewControlText}
        usersList={usersList}
        rolesList={rolesList}
        onClose={() => setEditingNode(null)}
        onSave={handleSaveStep}
      />

      {/* Edit Action Button Modal */}
      <EditActionModal
        editingAction={editingAction}
        nodes={nodes}
        actionLabel={actionLabel}
        setActionLabel={setActionLabel}
        actionDesc={actionDesc}
        setActionDesc={setActionDesc}
        actionVariant={actionVariant}
        setActionVariant={setActionVariant}
        actionType={actionType}
        setActionType={setActionType}
        actionTarget={actionTarget}
        setActionTarget={setActionTarget}
        actionFields={actionFields}
        setActionFields={setActionFields}
        onClose={() => setEditingAction(null)}
        onSave={handleSaveAction}
      />
    </div>
  );
}
