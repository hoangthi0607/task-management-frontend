import { Link, Outlet } from "react-router";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Task Management</h1>
          <p className="text-sm text-gray-500 mt-2">Secure access to your dashboard</p>
        </div>

        <Outlet />

        <div className="text-center mt-5 text-sm text-gray-500">
          <p>
            New here? <Link to="/register" className="text-blue-600 hover:underline">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
