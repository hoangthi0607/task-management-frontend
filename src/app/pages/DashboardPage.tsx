import { FolderKanban, CheckSquare, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const stats = [
  {
    title: "Total Projects",
    value: "24",
    change: "+12% from last month",
    icon: FolderKanban,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    title: "Active Tasks",
    value: "156",
    change: "+8% from last month",
    icon: CheckSquare,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    title: "Team Members",
    value: "42",
    change: "+3 new this month",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    title: "Completion Rate",
    value: "87%",
    change: "+5% from last month",
    icon: TrendingUp,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
];

const recentActivities = [
  {
    id: 1,
    user: "Sarah Johnson",
    action: "completed task",
    target: "Update API Documentation",
    time: "2 hours ago",
  },
  {
    id: 2,
    user: "Mike Chen",
    action: "created project",
    target: "Mobile App Redesign",
    time: "5 hours ago",
  },
  {
    id: 3,
    user: "Emily Davis",
    action: "commented on",
    target: "Homepage Refresh",
    time: "1 day ago",
  },
  {
    id: 4,
    user: "Alex Thompson",
    action: "assigned task to",
    target: "John Doe",
    time: "2 days ago",
  },
  {
    id: 5,
    user: "Rachel Green",
    action: "updated project status",
    target: "E-commerce Platform",
    time: "3 days ago",
  },
];

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-gray-900">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user}</span>{" "}
                    <span className="text-gray-600">{activity.action}</span>{" "}
                    <span className="font-medium">{activity.target}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
