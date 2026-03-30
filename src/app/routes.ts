import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { TasksPage } from "./pages/TasksPage";
import { ReportsPage } from "./pages/ReportsPage";
import { UsersPage } from "./pages/UsersPage";
import { RolesPage } from "./pages/RolesPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "dashboard", Component: DashboardPage },
      { path: "notifications", Component: NotificationsPage },
      { path: "projects", Component: ProjectsPage },
      { path: "tasks", Component: TasksPage },
      { path: "reports", Component: ReportsPage },
      { path: "users", Component: UsersPage },
      { path: "roles", Component: RolesPage },
    ],
  },
]);
