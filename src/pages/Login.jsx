import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success("Login successful");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = error?.response?.data?.message || "Invalid email or password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
    Email
  </label>
  <input
    id="email"
    name="email"
    type="email"
    required
    autoComplete="username" // Thêm để trình duyệt tự điền tài khoản chuẩn hóa
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    // Thay đổi: text-base (chống zoom iOS), h-10 (độ cao chuẩn), px-3 (khoảng cách chữ với viền)
    className="mt-1 block w-full h-10 px-3 text-base rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
  />
</div>


      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full h-10 px-3 text-base rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-sm text-center text-gray-500">
        Don’t have an account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
      </p>
    </form>
  );
}
