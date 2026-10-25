import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Sun, Moon, Monitor, UserRound, KeyRound, Palette } from "lucide-react";
import { changePassword } from "../services/auth.service";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import PasswordStrength from "../components/common/PasswordStrength";
import { errorMessage } from "../utils/format";

const THEMES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="px-5 py-4 border-b border-accent-100 dark:border-accent-900/60 flex items-center gap-3">
    <span className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/40 text-accent-600 dark:text-accent-300 flex items-center justify-center">
      <Icon className="w-4 h-4" />
    </span>
    <div>
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
    </div>
  </div>
);

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fullName = [user?.firstname, user?.lastname].filter(Boolean).join(" ");
  const initials = ((user?.firstname?.[0] ?? "") + (user?.lastname?.[0] ?? "")).toUpperCase() || "?";
  const mismatch = form.confirmPassword && form.newPassword !== form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    if (form.newPassword === form.oldPassword) {
      return toast.error("New password must be different from the current one");
    }
    setLoading(true);
    try {
      const res = await changePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword });
      toast.success(res.data.message || "Password updated");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-14">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Settings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Manage your account and preferences</p>
        </div>

        <div className="card">
          <SectionHeader icon={UserRound} title="Profile" />
          <div className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-600 to-accent-400 text-white text-lg font-bold flex items-center justify-center shadow-md shadow-accent-500/25 shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              {user?.email ? (
                <>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">{fullName || "Your account"}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                </>
              ) : (
                <>
                  <div className="skeleton h-4 w-32 mb-2" />
                  <div className="skeleton h-3.5 w-44" />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <SectionHeader icon={Palette} title="Appearance" subtitle="Choose how nanoURL looks on this device" />
          <div className="p-5 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
            {THEMES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={theme === id}
                onClick={() => setTheme(id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-all ${
                  theme === id
                    ? "border-accent-400 bg-accent-50 dark:bg-accent-900/40 text-accent-700 dark:text-accent-200 ring-2 ring-accent-400/30"
                    : "border-accent-100 dark:border-accent-900/60 text-zinc-600 dark:text-zinc-300 hover:border-accent-300"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionHeader icon={KeyRound} title="Change password" />

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="old-pw" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Current password</label>
              <div className="relative">
                <input
                  id="old-pw"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  value={form.oldPassword}
                  className="input pr-16"
                  onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-accent-100 dark:border-accent-900/60 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="new-pw" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">New password</label>
                <input
                  id="new-pw"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  minLength={5}
                  value={form.newPassword}
                  className="input"
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                />
                <PasswordStrength password={form.newPassword} />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm-pw" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Confirm new password</label>
                <input
                  id="confirm-pw"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  minLength={5}
                  value={form.confirmPassword}
                  className={`input ${mismatch ? "!border-red-400" : ""}`}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
                {mismatch && <p className="text-xs text-red-500">Passwords don't match</p>}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                disabled={loading || !form.oldPassword || !form.newPassword || !form.confirmPassword || mismatch}
                type="submit"
                className="btn-primary btn text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
