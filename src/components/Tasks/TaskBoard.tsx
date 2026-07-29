import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { apiClient as api } from "@/services/apiClient";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

const COLUMNS = ["New", "Approved", "On hold", "Paid", "Rejected"];

interface TaskBoardProps {
  tasks: any[];
  onTaskClick: (id: number) => void;
  onTaskMoved: (taskId: number, newStatus: string) => void;
}

export default function TaskBoard({ tasks, onTaskClick, onTaskMoved }: TaskBoardProps) {
  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    const taskId = parseInt(draggableId, 10);
    
    // Call the parent handler for optimistic update
    onTaskMoved(taskId, newStatus);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((t) => t.status === status);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div key={col} className="w-80 flex-shrink-0 flex flex-col bg-muted/50 rounded-lg p-3">
            <h3 className="font-semibold mb-3 px-1">{col} <span className="text-muted-foreground text-sm font-normal ml-1">({getTasksByStatus(col).length})</span></h3>
            
            <Droppable droppableId={col}>
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  className={`flex-1 overflow-y-auto p-1 transition-colors ${snapshot.isDraggingOver ? 'border-2 border-dashed border-primary/50 bg-primary/5 rounded-md' : 'border-2 border-transparent'}`}
                  style={{ minHeight: '150px' }}
                >
                  {getTasksByStatus(col).map((task, index) => (
                    <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mb-3"
                          onClick={() => onTaskClick(task.id)}
                        >
                          <Card className={`cursor-pointer hover:shadow-md transition-all ${snapshot.isDragging ? 'shadow-xl border-primary/50 z-50' : ''}`}>
                            <CardContent className="p-4 flex flex-col gap-3">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">#{task.id}</span>
                                  <h4 className="font-semibold text-sm leading-tight">{task.product_name}</h4>
                                </div>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-medium whitespace-nowrap bg-muted/50">{task.status}</Badge>
                              </div>
                              
                              <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                              
                              <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center gap-1.5">
                                  {task.assignee_name ? (
                                    <>
                                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-sm">
                                        {task.assignee_name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                                      </div>
                                      <span className="text-xs font-medium text-foreground">{task.assignee_name}</span>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-6 h-6 rounded-full bg-muted border border-dashed border-muted-foreground/30 flex items-center justify-center text-[10px] text-muted-foreground font-bold">
                                        ?
                                      </div>
                                      <span className="text-xs text-muted-foreground italic">Unassigned</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center pt-3 border-t border-muted/50">
                                <span className="font-semibold text-sm tracking-tight">${task.amount}</span>
                                <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'default' : 'outline'} className="text-[10px] h-5">
                                  {task.priority}
                                </Badge>
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
