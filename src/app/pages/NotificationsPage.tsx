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
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { notificationService } from "@/services/notificationService";

interface Notification {
  id: number;
  title: string;
  message: string;
  user: string;
  task: string;
  status: "unread" | "read";
  createdAt: string;
}

type ApiNotification = {
  notification_id: number;
  message?: string;
  user_id?: number;
  task_id?: number;
  created_at?: string;
};

const mapNotificationFromApi = (
  apiNotification: ApiNotification,
): Notification => ({
  id: apiNotification.notification_id,
  title: apiNotification.message || "Notification",
  message: apiNotification.message || "",
  user: apiNotification.user_id ? `User ${apiNotification.user_id}` : "",
  task: apiNotification.task_id ? `Task ${apiNotification.task_id}` : "",
  status: "unread",
  createdAt: apiNotification.created_at
    ? apiNotification.created_at.split("T")[0]
    : "",
});

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredData, setFilteredData] = useState<Notification[]>([]);
  const [filterUser, setFilterUser] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingNotification, setEditingNotification] =
    useState<Notification | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    user: "",
    task: "",
  });

  useEffect(() => {
    notificationService
      .getAll()
      .then(
        (response: { data: { total?: number; data: ApiNotification[] } }) => {
          const apiNotifications = response.data?.data || [];
          const uiNotifications = apiNotifications.map(mapNotificationFromApi);
          setNotifications(uiNotifications);
          setFilteredData(uiNotifications);
        },
      )
      .catch((error: any) => {
        console.error("Failed to fetch notifications", error);
        toast.error("Failed to load notifications");
      });
  }, []);

  // Apply filters
  const applyFilters = (user: string, status: string) => {
    let filtered = [...notifications];

    if (user !== "all") {
      filtered = filtered.filter((n) => n.user === user);
    }

    if (status !== "all") {
      filtered = filtered.filter((n) => n.status === status);
    }

    setFilteredData(filtered);
  };

  const handleFilterUser = (value: string) => {
    setFilterUser(value);
    applyFilters(value, filterStatus);
  };

  const handleFilterStatus = (value: string) => {
    setFilterStatus(value);
    applyFilters(filterUser, value);
  };

  const handleCreate = () => {
    setFormData({ title: "", message: "", user: "", task: "" });
    setEditingNotification(null);
    setIsCreateOpen(true);
  };

  const handleEdit = (notification: Notification) => {
    setFormData({
      title: notification.title,
      message: notification.message,
      user: notification.user,
      task: notification.task,
    });
    setEditingNotification(notification);
    setIsCreateOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      message: formData.message,
      user_id: Number(formData.user.replace(/[^0-9]/g, "")) || undefined,
      task_id: Number(formData.task.replace(/[^0-9]/g, "")) || undefined,
    };

    if (editingNotification) {
      notificationService
        .update(editingNotification.id, payload)
        .then((response: { data: { data: ApiNotification } }) => {
          const updatedNotification = mapNotificationFromApi(
            response.data.data,
          );
          const updated = notifications.map((n) =>
            n.id === editingNotification.id
              ? {
                  ...updatedNotification,
                  title: formData.title || updatedNotification.title,
                  status: n.status,
                }
              : n,
          );
          setNotifications(updated);
          setFilteredData(updated);
          toast.success("Notification updated successfully");
          setIsCreateOpen(false);
        })
        .catch((error: any) => {
          console.error("Failed to update notification", error);
          toast.error("Failed to update notification");
        });
    } else {
      notificationService
        .create(payload)
        .then((response: { data: { data: ApiNotification } }) => {
          const created = mapNotificationFromApi(response.data.data);
          setNotifications([...notifications, created]);
          setFilteredData([...notifications, created]);
          toast.success("Notification created successfully");
          setIsCreateOpen(false);
        })
        .catch((error: any) => {
          console.error("Failed to create notification", error);
          toast.error("Failed to create notification");
        });
    }
  };

  const handleDelete = (notification: Notification) => {
    setDeleteId(notification.id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      notificationService
        .delete(deleteId)
        .then(() => {
          const updated = notifications.filter((n) => n.id !== deleteId);
          setNotifications(updated);
          setFilteredData(updated);
          toast.success("Notification deleted successfully");
          setDeleteId(null);
        })
        .catch((error: any) => {
          console.error("Failed to delete notification", error);
          toast.error("Failed to delete notification");
        });
    }
  };

  const uniqueUsers = Array.from(new Set(notifications.map((n) => n.user)));

  const columns: Column<Notification>[] = [
    { key: "id", label: "ID" },
    { key: "title", label: "Title" },
    { key: "user", label: "User" },
    { key: "task", label: "Task" },
    {
      key: "status",
      label: "Status",
      render: (item) => (
        <Badge variant={item.status === "unread" ? "default" : "secondary"}>
          {item.status}
        </Badge>
      ),
    },
    { key: "createdAt", label: "Date" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Notifications
          </h1>
          <p className="text-gray-600 mt-1">Manage all system notifications</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Notification
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1">
          <Label>Filter by User</Label>
          <Select value={filterUser} onValueChange={handleFilterUser}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {uniqueUsers.map((user) => (
                <SelectItem key={user} value={user}>
                  {user}
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
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
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
              {editingNotification
                ? "Edit Notification"
                : "Create Notification"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter notification title"
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Enter notification message"
              />
            </div>
            <div>
              <Label htmlFor="user">User</Label>
              <Input
                id="user"
                value={formData.user}
                onChange={(e) =>
                  setFormData({ ...formData, user: e.target.value })
                }
                placeholder="Enter user name"
              />
            </div>
            <div>
              <Label htmlFor="task">Task</Label>
              <Input
                id="task"
                value={formData.task}
                onChange={(e) =>
                  setFormData({ ...formData, task: e.target.value })
                }
                placeholder="Enter task name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingNotification ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Notification"
        description="Are you sure you want to delete this notification? This action cannot be undone."
      />
    </div>
  );
}
