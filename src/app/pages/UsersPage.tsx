import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { DataTable, Column } from "../components/DataTable";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { userService } from "@/services/userService";

interface User {
  id: number;
  name: string;
  email: string;
  role_id: number | null;
  status: "active" | "inactive";
  createdAt: string;
}

type ApiUser = {
  user_id: number;
  name?: string;
  email: string;
  role_id?: number;
  is_active?: boolean;
  created_at?: string;
};

type ApiUserRequest = {
  name: string;
  email: string;
  password: string;
  role_id: number;
};

const mapUserFromApi = (apiUser: Partial<ApiUser>): User => ({
  id: typeof apiUser.user_id === "number" ? apiUser.user_id : 0,
  name: apiUser.name ? apiUser.name : apiUser.email ? apiUser.email.split("@")[0] : "",
  email: apiUser.email || "",
  role_id: typeof apiUser.role_id === "number" ? apiUser.role_id : null,
  status: apiUser.is_active ? "active" : "inactive",
  createdAt: apiUser.created_at ? apiUser.created_at.split("T")[0] : "",
});

const mapUserToApi = (user: Pick<User, "name" | "email" | "role_id"> & { password?: string }): ApiUserRequest => ({
  name: user.name,
  email: user.email,
  password: user.password || "123456",
  role_id: user.role_id || 2,
});


import { roleService } from "@/services/roleService";

type ApiRole = {
  role_id: number;
  role_name: string;
};

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [roles, setRoles] = useState<ApiRole[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role_id: null as number | null,
    status: "active" as User["status"],
  });

  useEffect(() => {
    userService
      .getAll()
      .then((response: { data: ApiUser[] | { total: number; data: ApiUser[] } }) => {
        const apiUsers = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        const uiUsers = apiUsers.map(mapUserFromApi);
        setUsers(uiUsers);
      })
      .catch((error: any) => {
        console.error("Failed to fetch users", error);
        toast.error("Failed to load users from server");
      });
    // Fetch roles from API
    roleService
      .getAll()
      .then((response: { data: ApiRole[] | { total: number; data: ApiRole[] } }) => {
        const apiRoles = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setRoles(apiRoles);
        // Set default role for form if not set
        setFormData((prev) => ({ ...prev, role_id: apiRoles[0]?.role_id || null }));
      })
      .catch((error: any) => {
        console.error("Failed to fetch roles", error);
        toast.error("Failed to load roles from server");
      });
  }, []);


  const handleCreate = () => {
    setFormData({
      name: "",
      email: "",
      role_id: roles[0]?.role_id || null,
      status: "active",
    });
    setEditingUser(null);
    setIsCreateOpen(true);
  };


  const handleEdit = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      role_id: user.role_id,
      status: user.status,
    });
    setEditingUser(user);
    setIsCreateOpen(true);
  };

  const handleSubmit = () => {
    const apiBody = mapUserToApi(formData);

    if (editingUser) {
      userService
        .update(editingUser.id, apiBody)
        .then((response: any) => {
          // Support both {data: user} and {data: {data: user}}
          const userObj = response?.data?.data || response?.data || {};
          const updated = users.map((u) =>
            u.id === editingUser.id ? mapUserFromApi(userObj) : u
          );
          setUsers(updated);
          toast.success("User updated successfully");
          setIsCreateOpen(false);
        })
        .catch((error: any) => {
          console.error("Failed to update user", error);
          toast.error("Failed to update user");
        });
    } else {
      userService
        .create(apiBody)
        .then((response: any) => {
          const userObj = response?.data?.data || response?.data || {};
          setUsers([...users, mapUserFromApi(userObj)]);
          toast.success("User created successfully");
          setIsCreateOpen(false);
        })
        .catch((error: any) => {
          console.error("Failed to create user", error);
          toast.error("Failed to create user");
        });
    }
  };

  const handleDelete = (user: User) => {
    setDeleteId(user.id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      userService
        .delete(deleteId)
        .then(() => {
          setUsers(users.filter((u) => u.id !== deleteId));
          toast.success("User deleted successfully");
          setDeleteId(null);
        })
        .catch((error: any) => {
          console.error("Failed to delete user", error);
          toast.error("Failed to delete user");
        });
    }
  };

  const columns: Column<User>[] = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "role_id",
      label: "Role",
      render: (item) => {
        const role = roles.find((r) => r.role_id === item.role_id);
        return role ? role.role_name : "";
      },
    },
    {
      key: "status",
      label: "Status",
      render: (item) => (
        <Badge variant={item.status === "active" ? "default" : "secondary"}>
          {item.status}
        </Badge>
      ),
    },
    { key: "createdAt", label: "Created At" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage team members and permissions</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={users}
        onEdit={handleEdit}
        onDelete={handleDelete}
        getRowId={(item) => item.id}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Create User"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role_id ? String(formData.role_id) : ""}
                onValueChange={(value) => setFormData({ ...formData, role_id: Number(value) })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.role_id} value={String(role.role_id)}>
                      {role.role_name}
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
                  setFormData({ ...formData, status: value as User["status"] })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingUser ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
      />
    </div>
  );
}
