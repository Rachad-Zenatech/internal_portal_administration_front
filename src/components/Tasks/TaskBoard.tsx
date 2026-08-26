import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Bookmark, ChevronsUp, ChevronUp, ChevronDown } from "lucide-react";
import { RequestStatus } from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";
import { STATUS_LABEL, STATUS_FILTER_OPTIONS, formatRequestType } from "@/pages/Purchasing/purchasingMeta";

// One column per filterable state, labelled from the shared map so the board and
// the rest of Purchasing cannot drift apart.
const BOARD_COLUMNS: ReadonlyArray<{ key: RequestStatus; label: string }> =
  STATUS_FILTER_OPTIONS.map((key) => ({ key, label: STATUS_LABEL[key] }));

const getCategoryColor = (category: string) => {
  const cat = (category || "GENERAL").toUpperCase();
  if (cat.includes("HARDWARE")) return "bg-blue-600 hover:bg-blue-700";
  if (cat.includes("SOFTWARE")) return "bg-green-600 hover:bg-green-700";
  if (cat.includes("SERVICE")) return "bg-purple-600 hover:bg-purple-700";
  if (cat.includes("MARKETING")) return "bg-orange-500 hover:bg-orange-600";
  if (cat.includes("OFFICE")) return "bg-pink-600 hover:bg-pink-700";
  return "bg-slate-600 hover:bg-slate-700";
};

interface TaskBoardProps {
  tasks: any[];
  onTaskClick: (id: number) => void;
  onTaskMoved?: (taskId: number, newStatus: string) => void;
  readOnly?: boolean;
}

export default function TaskBoard({ tasks, onTaskClick, onTaskMoved, readOnly = false }: TaskBoardProps) {
  const onDragEnd = async (result: any) => {
    if (readOnly || !onTaskMoved) return;
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    const taskId = parseInt(draggableId, 10);
    
    // Call the parent handler for optimistic update
    onTaskMoved(taskId, newStatus);
  };

  // All spelling variants collapse in parseRequestStatus, so a column matches when
  // the task's parsed state equals it. A task with no status sits in the first column.
  const getTasksByStatus = (columnKey: RequestStatus) =>
    tasks.filter((t) => (parseRequestStatus(t.status) ?? RequestStatus.New) === columnKey);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-1 min-h-0 h-full gap-3 overflow-x-auto pb-4">
        {BOARD_COLUMNS.map((col) => (
          <div key={col.key} className="w-[290px] flex-shrink-0 flex flex-col h-full min-h-[620px] bg-[#F4F5F7] dark:bg-slate-900 rounded-sm p-2">
            <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-2 mt-1">
              {col.label} <span className="font-normal ml-1">{getTasksByStatus(col.key).length}</span>
            </h3>
            
            <Droppable droppableId={col.key}>
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  className={`flex-1 min-h-0 overflow-y-auto px-1 pb-1 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50 dark:bg-blue-900/10 rounded-md' : ''}`}
                >
                  {getTasksByStatus(col.key).map((task, index) => (
                    <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index} isDragDisabled={readOnly}>
                      {(provided, snapshot) => (
                         <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mb-2"
                          onClick={() => onTaskClick(task.id)}
                        >
                          <Card className={`cursor-pointer bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border-0 shadow-[0_1px_2px_rgba(9,30,66,0.25)] dark:shadow-none dark:ring-1 dark:ring-slate-800 rounded-sm ${snapshot.isDragging ? 'shadow-lg rotate-2 z-50' : ''}`}>
                            <CardContent className="px-3 py-2 flex flex-col gap-1.5">
                              {/* Category Badge */}
                              <div>
                                <Badge className={`${getCategoryColor(task.category)} text-white border-0 text-[10px] uppercase font-bold tracking-wider rounded-[3px] px-1.5 py-0.5 shadow-none`}>
                                  {formatRequestType(task.category || task.request_type || "GENERAL")}
                                </Badge>
                              </div>

                              {/* Title */}
                              <h4 className="font-semibold text-[15px] text-slate-900 dark:text-slate-100 leading-snug mt-0.5">{task.product_name || task.title}</h4>
                              
                              {/* Description */}
                              {task.description && (
                                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mt-0.5">
                                  {task.description}
                                </p>
                              )}
                              
                              {/* Footer Row */}
                              <div className="flex justify-between items-end mt-0.5">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                  <div className="flex items-center hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                                    <Bookmark className="w-[14px] h-[14px] text-green-600 fill-green-600 mr-1" />
                                    <span className="text-[11px] font-medium tracking-tight">#{task.id}</span>
                                  </div>
                                  
                                  {/* Priority Icon */}
                                  <div title={`Priority: ${task.priority}`}>
                                    {task.priority === 'High' ? (
                                      <ChevronsUp className="w-4 h-4 text-red-500" />
                                    ) : task.priority === 'Medium' ? (
                                      <ChevronUp className="w-4 h-4 text-orange-500" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-blue-500" />
                                    )}
                                  </div>
                                </div>
                                
                                {/* Assignee Avatar */}
                                {task.assignee_name ? (
                                  <div title={task.assignee_name} className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                                    {task.assignee_name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                                  </div>
                                ) : (
                                  <div title="Unassigned" className="w-6 h-6 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                                    ?
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
