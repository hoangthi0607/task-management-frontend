import { useDrag, useDrop } from "react-dnd";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Calendar, User } from "lucide-react";

export interface Task {
  id: number;
  title: string;
  description: string;
  project: number | null;
  assignee: number | null;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate: string;
}

interface KanbanCardProps {
  task: Task;
  onMove: (taskId: number, newStatus: Task["status"]) => void;
  onClick: (task: Task) => void;
}

function KanbanCard({ task, onMove, onClick }: KanbanCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: "task",
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const dragRef = (instance: HTMLDivElement | null) => {
    drag(instance as any);
  };

  const priorityColors = {
    low: "bg-blue-100 text-blue-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };

  return (
    <div
      ref={dragRef}
      onClick={() => onClick(task)}
      className={`cursor-pointer ${isDragging ? "opacity-50" : ""}`}
    >
      <Card className="p-4 mb-3 hover:shadow-md transition-shadow">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-gray-900">{task.title}</h4>
            <Badge className={priorityColors[task.priority]}>
              {task.priority}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {/* Display assignee id for now; map to name in parent if needed */}
              <span>{task.assignee ?? ""}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{task.dueDate}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface KanbanColumnProps {
  title: string;
  status: Task["status"];
  tasks: Task[];
  onMove: (taskId: number, newStatus: Task["status"]) => void;
  onTaskClick: (task: Task) => void;
}

function KanbanColumn({ title, status, tasks, onMove, onTaskClick }: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop({
    accept: "task",
    drop: (item: { id: number; status: Task["status"] }) => {
      if (item.status !== status) {
        onMove(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const dropRef = (instance: HTMLDivElement | null) => {
    drop(instance as any);
  };

  return (
    <div className="flex-1 min-w-[300px]">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>
        <div
          ref={dropRef}
          className={`min-h-[500px] transition-colors ${
            isOver ? "bg-blue-50" : ""
          }`}
        >
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onMove={onMove}
              onClick={onTaskClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  tasks: Task[];
  onMove: (taskId: number, newStatus: Task["status"]) => void;
  onTaskClick: (task: Task) => void;
}

export function KanbanBoard({ tasks, onMove, onTaskClick }: KanbanBoardProps) {
  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      <KanbanColumn
        title="To Do"
        status="todo"
        tasks={todoTasks}
        onMove={onMove}
        onTaskClick={onTaskClick}
      />
      <KanbanColumn
        title="In Progress"
        status="in-progress"
        tasks={inProgressTasks}
        onMove={onMove}
        onTaskClick={onTaskClick}
      />
      <KanbanColumn
        title="Done"
        status="done"
        tasks={doneTasks}
        onMove={onMove}
        onTaskClick={onTaskClick}
      />
    </div>
  );
}
