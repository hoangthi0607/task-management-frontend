import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { DataTable, Column } from "../components/DataTable";
import { ConfirmDialog } from "../components/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";
import { roleService } from "@/services/roleService";

interface Role {
  id: number;
  name: string;
  permissions: string[];
  userCount: number;
}

type ApiRole = {
  role_id: number;
  role_name: string;
  permissions?: string[];
  userCount?: number;
};

const mapRoleFromApi = (apiRole: ApiRole): Role => ({
  id: apiRole.role_id,
  name: apiRole.role_name,
  permissions: apiRole.permissions ?? [],
  userCount: apiRole.userCount ?? 0,
});

const availablePermissions = [
  { value: "create", label: "Create" },
  { value: "read", label: "Read" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "manage_users", label: "Manage Users" },
  { value: "manage_roles", label: "Manage Roles" },
  { value: "manage_projects", label: "Manage Projects" },
  { value: "view_reports", label: "View Reports" },
];

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    permissions: [] as string[],
  });

  useEffect(() => {
    roleService
      .getAll()
      .then((response: { data: { data: ApiRole[] } }) => {
        const apiRoles = response.data.data || [];
        const uiRoles = apiRoles.map((apiRole) => ({
          ...mapRoleFromApi(apiRole),
          userCount: Array.isArray((apiRole as any).User)
            ? (apiRole as any).User.length
            : 0,
        }));
        setRoles(uiRoles);
      })
      .catch((error: any) => {
        console.error("Failed to fetch roles", error);
        toast.error("Failed to load roles");
      });
  }, []);

  const handleCreate = () => {
    setFormData({ name: "", permissions: [] });
    setEditingRole(null);
    setIsCreateOpen(true);
  };

  const handleEdit = (role: Role) => {
    setFormData({
      name: role.name,
      permissions: [...(role.permissions ?? [])],
    });
    setEditingRole(role);
    setIsCreateOpen(true);
  };

  const togglePermission = (permission: string) => {
    setFormData({
      ...formData,
      permissions: formData.permissions.includes(permission)
        ? formData.permissions.filter((p) => p !== permission)
        : [...formData.permissions, permission],
    });
  };

  const handleSubmit = () => {
    if (editingRole) {
      roleService
        .update(editingRole.id, { role_name: formData.name })
        .then((response: { data: { data: ApiRole } }) => {
          const updatedRole = mapRoleFromApi(response.data.data);
          const updated = roles.map((r) =>
            r.id === editingRole.id
              ? {
                  ...updatedRole,
                  permissions: formData.permissions,
                  userCount: r.userCount,
                }
              : r,
          );
          setRoles(updated);
          toast.success("Role updated successfully");
          setIsCreateOpen(false);
        })
        .catch((error: any) => {
          console.error("Failed to update role", error);
          toast.error("Failed to update role");
        });
    } else {
      roleService
        .create({ role_name: formData.name })
        .then((response: { data: { data: ApiRole } }) => {
          const newRole = mapRoleFromApi(response.data.data);
          setRoles([
            ...roles,
            { ...newRole, permissions: formData.permissions, userCount: 0 },
          ]);
          toast.success("Role created successfully");
          setIsCreateOpen(false);
        })
        .catch((error: any) => {
          console.error("Failed to create role", error);
          toast.error("Failed to create role");
        });
    }
  };

  const handleDelete = (role: Role) => {
    setDeleteId(role.id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      roleService
        .delete(deleteId)
        .then(() => {
          setRoles(roles.filter((r) => r.id !== deleteId));
          toast.success("Role deleted successfully");
          setDeleteId(null);
        })
        .catch((error: any) => {
          console.error("Failed to delete role", error);
          toast.error("Failed to delete role");
        });
    }
  };

  const columns: Column<Role>[] = [
    { key: "id", label: "ID" },
    { key: "name", label: "Role Name" },
    {
      key: "permissions",
      label: "Permissions",
      render: (item) => {
      const permissions = item.permissions ?? [];

      return (
        <div className="flex flex-wrap gap-1">
          {permissions.slice(0, 3).map((perm) => (
            <span
              key={perm}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700"
            >
              {perm}
            </span>
          ))}
          {permissions.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
              +{permissions.length - 3} more
            </span>
          )}
        </div>
      );
    },
    },
    { key: "userCount", label: "Users" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Roles</h1>
          <p className="text-gray-600 mt-1">Manage roles and permissions</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={roles}
        onEdit={handleEdit}
        onDelete={handleDelete}
        getRowId={(item) => item.id}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create Role"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter role name"
              />
            </div>
            <div>
              <Label className="mb-3 block">Permissions</Label>
              <div className="grid grid-cols-2 gap-4">
                {availablePermissions.map((permission) => (
                  <div
                    key={permission.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={permission.value}
                      checked={formData.permissions.includes(permission.value)}
                      onCheckedChange={() => togglePermission(permission.value)}
                    />
                    <label
                      htmlFor={permission.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {permission.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingRole ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Role"
        description="Are you sure you want to delete this role? This action cannot be undone and may affect users with this role."
      />
    </div>
  );
}
