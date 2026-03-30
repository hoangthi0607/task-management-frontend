import { createBrowserRouter, Navigate } from "react-router";
import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { Dashboard } from "@/pages/Dashboard";
import { NotificationsPage } from "@/app/pages/NotificationsPage";
import { ProjectsPage } from "@/app/pages/ProjectsPage";
import { TasksPage } from "@/app/pages/TasksPage";
import { ReportsPage } from "@/app/pages/ReportsPage";
import { UsersPage } from "@/app/pages/UsersPage";
import { RolesPage } from "@/app/pages/RolesPage";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "", element: <Navigate to="/login" replace /> },
    ],
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "roles", element: <RolesPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);