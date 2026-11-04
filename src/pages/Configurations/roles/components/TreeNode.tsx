import React, { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, FolderOpen, Folder } from "lucide-react";
import type { Role } from "@/lib/AuthContext";

// Recursive component for Tree Node
export const TreeNode = ({ 
  role, 
  level, 
  selectedRole, 
  onSelect, 
  expandedNodes, 
  toggleNode,
  onMoveRole,
  setDraggingId
}: { 
  role: Role; 
  level: number; 
  selectedRole: Role | null; 
  onSelect: (role: Role) => void;
  expandedNodes: Set<string>;
  toggleNode: (id: string, e: React.MouseEvent) => void;
  onMoveRole: (draggedId: string, targetId: string) => void;
  setDraggingId: (id: string | null) => void;
}) => {
  const isExpanded = expandedNodes.has(role.id);
  const isSelected = selectedRole?.id === role.id;
  const hasChildren = role.children && role.children.length > 0;
  
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", role.id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(role.id);
  };
  
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (dragCounter.current === 1) {
      setIsDragOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDragEnd = () => {
    dragCounter.current = 0;
    setIsDragOver(false);
    setDraggingId(null);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragOver(false);
    setDraggingId(null);
    const draggedId = e.dataTransfer.getData("text/plain");
    if (draggedId && draggedId !== role.id) {
      onMoveRole(draggedId, role.id);
    }
  };

  return (
    <div className="w-full">
      <div 
        draggable={true}
        onDragStart={handleDragStart}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnd={handleDragEnd}
        onDrop={handleDrop}
        className={`relative flex items-center py-2 px-2 rounded-md cursor-pointer group transition-colors ${
          isDragOver
            ? 'bg-blue-100/50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200' 
            : isSelected 
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
            : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-700 dark:text-zinc-300'
        }`}
        style={{ paddingLeft: `${(level * 16) + 8}px` }}
        onClick={() => onSelect(role)}
      >
        {isDragOver && (
          <div 
            className="absolute right-0 bottom-0 border-b-2 border-blue-500 z-10 pointer-events-none rounded-b-sm shadow-[0_1px_2px_rgba(59,130,246,0.3)]"
            style={{ left: `${(level * 16) + 8 + 24}px` }}
          ></div>
        )}

        <div 
          className={`w-6 h-6 flex items-center justify-center mr-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 ${hasChildren ? 'cursor-pointer' : 'opacity-0'}`}
          onClick={(e) => {
            if (hasChildren) toggleNode(role.id, e);
          }}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4 pointer-events-none" /> : <ChevronRight className="w-4 h-4 pointer-events-none" />}
        </div>
        
        {isExpanded ? (
          <FolderOpen className="w-4 h-4 mr-2 text-blue-500 pointer-events-none" />
        ) : (
          <Folder className="w-4 h-4 mr-2 text-blue-500 pointer-events-none" />
        )}
        
        <span className="text-sm font-medium truncate flex-1 pointer-events-none">{role.name}</span>
        
        {!role.is_active && (
          <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 h-4 bg-slate-100 text-slate-500 pointer-events-none">Inactive</Badge>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div className="flex flex-col w-full">
          {role.children!.map(child => (
            <TreeNode 
              key={child.id} 
              role={child} 
              level={level + 1} 
              selectedRole={selectedRole} 
              onSelect={onSelect} 
              expandedNodes={expandedNodes} 
              toggleNode={toggleNode} 
              onMoveRole={onMoveRole}
              setDraggingId={setDraggingId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
