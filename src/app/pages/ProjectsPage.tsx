import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { DataTable, Column } from "../components/DataTable";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { projectService } from "@/services/projectService";
import { userService } from "@/services/userService";

interface Project {
  id: number;
  name: string;
  description?: string;
  managerId: number | null;
  manager: string;
  status: "active" | "on-hold" | "completed";
  startDate: string;
  endDate: string;
}

type ApiProject = {
  project_id: number;
  name: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
  manager_id?: number | null;
  status?: "active" | "on-hold" | "completed";
  User?: {
    user_id: number;
    name?: string;
    email: string;
  };
};

const mapProjectFromApi = (
  apiProject: ApiProject,
  managersLookup: Record<number, string> = {},
): Project => {
  const managerName =
    apiProject.User?.name ||
    apiProject.User?.email ||
    (apiProject.manager_id && managersLookup[apiProject.manager_id]
      ? managersLookup[apiProject.manager_id]
      : apiProject.manager_id
        ? `User ${apiProject.manager_id}`
        : "");

  return {
    id: apiProject.project_id,
    name: apiProject.name,
    managerId: apiProject.manager_id || null,
    manager: managerName,
    status: apiProject.status || "active",
    startDate: apiProject.start_date ? apiProject.start_date.split("T")[0] : "",
    endDate: apiProject.end_date ? apiProject.end_date.split("T")[0] : "",
  };
};

const mapProjectToApi = (
  project: Partial<Project>
) => ({
  name: project.name,
  description: project.description,
  start_date: project.startDate ? new Date(project.startDate).toISOString() : undefined,
  end_date: project.endDate ? new Date(project.endDate).toISOString() : undefined,
  manager_id: project.managerId,
});

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredData, setFilteredData] = useState<Project[]>([]);
  const [managers, setManagers] = useState<{ id: number; name: string }[]>([]);
  const [filterManager, setFilterManager] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    managerId: number | null;
    status: Project["status"];
    startDate: string;
    endDate: string;
  }>({
    name: "",
    description: "",
    managerId: null,
    status: "active",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    const fetchManagers = userService.getAll();
    const fetchProjects = projectService.getAll();

    Promise.allSettled([fetchManagers, fetchProjects]).then(
      (results: PromiseSettledResult<any>[]) => {
        const managersFromApi: { id: number; name: string }[] = [];
        if (results[0].status === "fulfilled") {
          const managerResp = results[0].value;
          const userList: any[] = Array.isArray(managerResp.data)
            ? managerResp.data
            : managerResp.data?.data || [];

          const filteredManagers = userList
            .filter((u: any) => u.role_id === 2 || u.role_id === "2")
            .map((u: any) => ({
              id: u.user_id,
              name: u.name || u.email || `User ${u.user_id}`,
            }));

          managersFromApi.push(...filteredManagers);
          setManagers(filteredManagers);
        } else {
          const err = results[0].reason;
          if (err?.response?.status === 401 || err?.response?.status === 403) {
            toast.error(
              "Không có quyền lấy danh sách manager. Chỉ admin mới nhìn thấy.",
            );
          } else {
            toast.error("Không thể tải nhân viên quản lý.");
          }
        }

        if (results[1].status === "fulfilled") {
          const projectResp = results[1].value;
          const apiProjects = Array.isArray(projectResp.data?.data)
            ? projectResp.data.data
            : Array.isArray(projectResp.data)
              ? projectResp.data
              : [];

          const managerMap = managersFromApi.reduce(
            (acc, item) => {
              acc[item.id] = item.name;
              return acc;
            },
            {} as Record<number, string>,
          );

          const uiProjects = apiProjects.map((project: ApiProject) =>
            mapProjectFromApi(project, managerMap),
          );

          setProjects(uiProjects);
          setFilteredData(uiProjects);
        } else {
          const err: unknown = results[1].reason;
          console.error("Failed to fetch projects", err);
          toast.error("Failed to load project list");
        }
      },
    );
  }, []);

  const applyFilters = (manager: string, status: string) => {
    let filtered = [...projects];

    if (manager !== "all") {
      filtered = filtered.filter((p) => p.manager === manager);
    }

    if (status !== "all") {
      filtered = filtered.filter((p) => p.status === status);
    }

    setFilteredData(filtered);
  };

  const handleFilterManager = (value: string) => {
    setFilterManager(value);
    applyFilters(value, filterStatus);
  };

  const handleFilterStatus = (value: string) => {
    setFilterStatus(value);
    applyFilters(filterManager, value);
  };

  const handleCreate = () => {
    setFormData({
      name: "",
      description: "",
      managerId: null,
      status: "active",
      startDate: "",
      endDate: "",
    });
    setEditingProject(null);
    setIsCreateOpen(true);
  };

  const handleEdit = (project: Project) => {
    setFormData({
      name: project.name,
      description: project.description || "",
      managerId: project.managerId || null,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
    });
    setEditingProject(project);
    setIsCreateOpen(true);
  };

  const handleSubmit = () => {
    const body = mapProjectToApi(formData);

    if (editingProject) {
      projectService
        .update(editingProject.id, body)
        .then((response: { data: { data: ApiProject } }) => {
          const updatedProject = mapProjectFromApi(
            response.data.data,
            managers.reduce(
              (acc, cur) => ({ ...acc, [cur.id]: cur.name }),
              {} as Record<number, string>,
            ),
          );
          const updated = projects.map((p) =>
            p.id === editingProject.id ? updatedProject : p,
          );
          setProjects(updated);
          setFilteredData(updated);
          toast.success("Project updated successfully");
          setIsCreateOpen(false);
        })
        .catch((error: unknown) => {
          console.error("Update project failed", error);
          toast.error("Failed to update project");
        });
    } else {
      projectService
        .create(body)
        .then((response: { data: { data: ApiProject } }) => {
          const newProject = mapProjectFromApi(
            response.data.data,
            managers.reduce(
              (acc, cur) => ({ ...acc, [cur.id]: cur.name }),
              {} as Record<number, string>,
            ),
          );
          const updated = [...projects, newProject];
          setProjects(updated);
          setFilteredData(updated);
          toast.success("Project created successfully");
          setIsCreateOpen(false);
        })
        .catch((error: unknown) => {
          console.error("Create project failed", error);
          toast.error("Failed to create project");
        });
    }
  };

  const handleDelete = (project: Project) => {
    setDeleteId(project.id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      projectService
        .delete(deleteId)
        .then(() => {
          const updated = projects.filter((p) => p.id !== deleteId);
          setProjects(updated);
          setFilteredData(updated);
          toast.success("Project deleted successfully");
          setDeleteId(null);
        })
        .catch((error: unknown) => {
          console.error("Delete project failed", error);
          toast.error("Failed to delete project");
        });
    }
  };

  const uniqueManagers = Array.from(new Set(projects.map((p) => p.manager)));

  const columns: Column<Project>[] = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "manager", label: "Manager" },
    {
      key: "status",
      label: "Status",
      render: (item) => (
        <Badge
          variant={
            item.status === "active"
              ? "default"
              : item.status === "completed"
                ? "secondary"
                : "outline"
          }
        >
          {item.status}
        </Badge>
      ),
    },
    { key: "startDate", label: "Start Date" },
    { key: "endDate", label: "End Date" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage all your projects</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1">
          <Label>Filter by Manager</Label>
          <Select value={filterManager} onValueChange={handleFilterManager}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Managers</SelectItem>
              {uniqueManagers.map((manager) => (
                <SelectItem key={manager} value={manager}>
                  {manager}
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        getRowId={(item) => item.id}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Project" : "Create Project"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter project name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter project description"
              />
            </div>
            <div>
              <Label htmlFor="manager">Manager</Label>
              <Select
                value={
                  formData.managerId !== null
                    ? formData.managerId.toString()
                    : "none"
                }
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    managerId:
                      value === "none" || value === "" ? null : Number(value),
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No manager</SelectItem>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.name}
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
                  setFormData({
                    ...formData,
                    status: value as Project["status"],
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingProject ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
      />
    </div>
  );
}
