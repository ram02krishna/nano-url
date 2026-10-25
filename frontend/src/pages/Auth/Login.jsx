import { useState } from "react";
import toast from "react-hot-toast";
import { loginUser } from "../../services/auth.service";
import { setToken } from "../../utils/token";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Login = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser(form);
      const token = res.data?.token || res.data?.data?.token || res.data?.accessToken;
      if (!token) throw new Error("Invalid login response");
      setToken(token);
      setUser({ loggedIn: true });
      toast.success("Welcome back!");
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Invalid email or password";
      toast.error(typeof msg === "string" ? msg : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-14">
      <div className="w-full max-w-sm animate-slide-up">

        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 mb-6 transition-colors">
            ← Back to home
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Sign in</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Don't have an account?{" "}
            <Link to="/register" className="text-accent-600 hover:underline font-medium">
              Create one for free
            </Link>
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              required
              disabled={loading}
              className="input"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-accent-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                required
                disabled={loading}
                className="input pr-16"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary btn w-full"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
