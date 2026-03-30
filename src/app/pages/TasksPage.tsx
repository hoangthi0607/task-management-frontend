import { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Plus, LayoutGrid, List } from "lucide-react";
import { Button } from "../components/ui/button";
import { DataTable, Column } from "../components/DataTable";
import { KanbanBoard, Task } from "../components/KanbanBoard";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { taskService } from "@/services/taskService";
import { userService } from "@/services/userService";
import { projectService } from "@/services/projectService";

type ApiTask = {
  task_id: number;
  name: string;
  description?: string;
  deadline?: string;
  status?: "todo" | "in_progress" | "done";
  project_id?: number;
  assigned_user_id?: number;
};

const mapTaskFromApi = (apiTask: ApiTask): Task => ({
  id: apiTask.task_id,
  title: apiTask.name,
  description: apiTask.description || "",
  project: typeof apiTask.project_id === "number" ? apiTask.project_id : null,
  assignee: typeof apiTask.assigned_user_id === "number" ? apiTask.assigned_user_id : null,
  status: apiTask.status === "in_progress" ? "in-progress" : (apiTask.status || "todo") as Task["status"],
  priority: "medium",
  dueDate: apiTask.deadline ? new Date(apiTask.deadline).toISOString().split("T")[0] : "",
});

const mapTaskToApi = (task: Partial<Task>) => ({
  name: task.title || "",
  description: task.description || "",
  deadline: task.dueDate ? `${task.dueDate}T00:00:00.000Z` : undefined,
  status: task.status === "in-progress" ? "in_progress" : task.status || "todo",
  project_id: typeof task.project === "number" ? task.project : undefined,
  assigned_user_id: typeof task.assignee === "number" ? task.assignee : undefined,
});

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredData, setFilteredData] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [users, setUsers] = useState<{ user_id: number; name: string }[]>([]);
  const [projects, setProjects] = useState<{ project_id: number; name: string }[]>([]);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    project: number | null;
    assignee: number | null;
    status: Task["status"];
    priority: Task["priority"];
    dueDate: string;
  }>({
    title: "",
    description: "",
    project: null,
    assignee: null,
    status: "todo",
    priority: "medium",
    dueDate: "",
  });

  useEffect(() => {
    taskService
      .getAll()
      .then((response) => {
        const apiTasks = response.data?.data || [];
        const uiTasks = apiTasks.map(mapTaskFromApi);
        setTasks(uiTasks);
        setFilteredData(uiTasks);
      })
      .catch((error) => {
        console.error("Failed to fetch tasks", error);
        toast.error("Failed to load tasks from server");
      });
  }, []);

  useEffect(() => {
    userService.getAll().then((response) => {
      const apiUsers = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setUsers(apiUsers.map((u: any) => ({ user_id: u.user_id, name: u.name || u.email })));
    }).catch(() => toast.error("Failed to load users"));
    projectService.getAll().then((response) => {
      const apiProjects = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setProjects(apiProjects.map((p: any) => ({ project_id: p.project_id, name: p.name })));
    }).catch(() => toast.error("Failed to load projects"));
  }, []);

  const applyFilters = (
    sourceTasks: Task[],
    project: string,
    status: string,
    user: string
  ) => {
    let filtered = [...sourceTasks];

    if (project !== "all") {
      const projectId = parseInt(project, 10);
      filtered = filtered.filter((t) => t.project === projectId);
    }

    if (status !== "all") {
      filtered = filtered.filter((t) => t.status === status);
    }

    if (user !== "all") {
      const userId = parseInt(user, 10);
      filtered = filtered.filter((t) => t.assignee === userId);
    }

    setFilteredData(filtered);
  };

  useEffect(() => {
    applyFilters(tasks, filterProject, filterStatus, filterUser);
  }, [tasks, filterProject, filterStatus, filterUser]);

  const handleFilterProject = (value: string) => {
    setFilterProject(value);
  };

  const handleFilterStatus = (value: string) => {
    setFilterStatus(value);
  };

  const handleFilterUser = (value: string) => {
    setFilterUser(value);
  };

  const handleMove = (taskId: number, newStatus: Task["status"]) => {
    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove || taskToMove.status === newStatus) return;

    const previousStatus = taskToMove.status;
    const updatedTask: Task = { ...taskToMove, status: newStatus };
    const optimisticTasks = tasks.map((t) =>
      t.id === taskId ? updatedTask : t
    );

    setTasks(optimisticTasks);

    taskService
      .update(taskId, mapTaskToApi(updatedTask))
      .then((response) => {
        const apiTask = mapTaskFromApi(response.data.data);
        const persistedTasks = optimisticTasks.map((t) =>
          t.id === taskId ? apiTask : t
        );
        setTasks(persistedTasks);
        toast.success("Task status updated");
      })
      .catch((error) => {
        console.error("Failed to update task status", error);
        const rollbackTasks = tasks.map((t) =>
          t.id === taskId ? { ...t, status: previousStatus } : t
        );
        setTasks(rollbackTasks);
        toast.error("Failed to update task status on server");
      });
  };

  const handleCreate = () => {
    setFormData({
      title: "",
      description: "",
      project: projects[0]?.project_id ?? null,
      assignee: users[0]?.user_id ?? null,
      status: "todo",
      priority: "medium",
      dueDate: "",
    });
    setEditingTask(null);
    setIsCreateOpen(true);
  };

  const handleEdit = (task: Task) => {
    setFormData({
      title: task.title,
      description: task.description,
      project: typeof task.project === "number" ? task.project : null,
      assignee: typeof task.assignee === "number" ? task.assignee : null,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    });
    setEditingTask(task);
    setIsCreateOpen(true);
  };

  const handleSubmit = () => {
    const payload = mapTaskToApi(formData);

    if (editingTask) {
      taskService
        .update(editingTask.id, payload)
        .then((response) => {
          const updatedTask = mapTaskFromApi(response.data.data);
          const updated = tasks.map((t) => (t.id === editingTask.id ? updatedTask : t));
          setTasks(updated);
          setFilteredData(updated);
          toast.success("Task updated successfully");
          setIsCreateOpen(false);
        })
        .catch((error) => {
          console.error("Update task failed", error);
          toast.error("Failed to update task");
        });
    } else {
      taskService
        .create(payload)
        .then((response) => {
          const created = mapTaskFromApi(response.data.data);
          const updated = [...tasks, created];
          setTasks(updated);
          setFilteredData(updated);
          toast.success("Task created successfully");
          setIsCreateOpen(false);
        })
        .catch((error) => {
          console.error("Create task failed", error);
          toast.error("Failed to create task");
        });
    }
  };

  const handleDelete = (task: Task) => {
    setDeleteId(task.id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      taskService
        .delete(deleteId)
        .then(() => {
          const updated = tasks.filter((t) => t.id !== deleteId);
          setTasks(updated);
          setFilteredData(updated);
          toast.success("Task deleted successfully");
          setDeleteId(null);
        })
        .catch((error) => {
          console.error("Delete task failed", error);
          toast.error("Failed to delete task");
        });
    }
  };


  const uniqueProjects = Array.from(new Set(tasks.map((t) => t.project))).filter((p) => p !== null);
  const uniqueUsers = Array.from(new Set(tasks.map((t) => t.assignee))).filter((u) => u !== null);

  const columns: Column<Task>[] = [
    { key: "id", label: "ID" },
    { key: "title", label: "Title" },
    {
      key: "project",
      label: "Project",
      render: (item) => {
        const project = projects.find((p) => p.project_id === item.project);
        return project ? project.name : "";
      },
    },
    {
      key: "assignee",
      label: "Assignee",
      render: (item) => {
        const user = users.find((u) => u.user_id === item.assignee);
        return user ? user.name : "";
      },
    },
    {
      key: "status",
      label: "Status",
      render: (item) => (
        <Badge
          variant={
            item.status === "done"
              ? "secondary"
              : item.status === "in-progress"
              ? "default"
              : "outline"
          }
        >
          {item.status}
        </Badge>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (item) => {
        const colors = {
          low: "bg-blue-100 text-blue-700",
          medium: "bg-yellow-100 text-yellow-700",
          high: "bg-red-100 text-red-700",
        };
        return (
          <Badge className={colors[item.priority]}>
            {item.priority}
          </Badge>
        );
      },
    },
    { key: "dueDate", label: "Due Date" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage and track all tasks</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "kanban" | "list")}>
            <TabsList>
              <TabsTrigger value="kanban" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1">
          <Label>Filter by Project</Label>
          <Select value={filterProject} onValueChange={handleFilterProject}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {uniqueProjects.map((project) => (
                <SelectItem key={String(project)} value={String(project)}>
                  {(() => {
                    const proj = projects.find((p) => p.project_id === project);
                    return proj ? proj.name : project;
                  })()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label>Filter by Status</Label>
          <Select value={filterStatus} onValueChange={handleFilterStatus}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label>Filter by User</Label>
          <Select value={filterUser} onValueChange={handleFilterUser}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {uniqueUsers.map((user) => (
                <SelectItem key={String(user)} value={String(user)}>
                  {(() => {
                    const u = users.find((usr) => usr.user_id === user);
                    return u ? u.name : user;
                  })()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {viewMode === "kanban" ? (
        <DndProvider backend={HTML5Backend}>
          <KanbanBoard
            tasks={filteredData}
            onMove={handleMove}
            onTaskClick={handleEdit}
          />
        </DndProvider>
      ) : (
        <DataTable
          columns={columns}
          data={filteredData}
          onEdit={handleEdit}
          onDelete={handleDelete}
          getRowId={(item) => item.id}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit Task" : "Create Task"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project">Project</Label>
                <Select
                  value={formData.project !== null ? String(formData.project) : ""}
                  onValueChange={(value) => setFormData({ ...formData, project: Number(value) })}
                  disabled={projects.length === 0}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={projects.length === 0 ? "No projects available" : "Select project"} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.project_id} value={String(project.project_id)}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as Task["status"] })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value as Task["priority"] })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dueDate">Deadline</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            {/* Đã có khối status/priority/dueDate hợp lệ phía trên, xóa khối lặp này */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingTask ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
      />
    </div>
  );
}
