import { useState } from "react";
import toast from "react-hot-toast";
import { forgotPassword, resetPassword } from "../../services/auth.service";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    setLoading(true);
    try {
      const res = await forgotPassword({ email });
      toast.success(res.data.message || "OTP sent if email is registered.");
      setStep(2);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    setLoading(true);
    try {
      const res = await resetPassword({ email, otp: form.otp, newPassword: form.newPassword });
      toast.success(res.data.message || "Password reset successfully!");
      navigate("/login");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-14">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 mb-6 transition-colors">
            ← Back to login
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            {step === 1 ? "Forgot Password" : "Reset Password"}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {step === 1 ? "Enter your email to receive a reset code" : "Enter the code and your new password"}
          </p>
        </div>
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                required
                disabled={loading}
                value={email}
                className="input"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="btn-primary btn w-full"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send reset code"}
            </button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Reset Code (OTP)
              </label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                required
                disabled={loading}
                maxLength={6}
                value={form.otp}
                className="input tracking-widest text-center"
                inputMode="numeric"
                autoComplete="one-time-code"
                onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create new password"
                  required
                  disabled={loading}
                  minLength={5}
                  value={form.newPassword}
                  className="input pr-16"
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  required
                  disabled={loading}
                  minLength={5}
                  value={form.confirmPassword}
                  className="input pr-16"
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="btn-primary btn w-full mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
            </button>
            
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={loading}
              className="w-full flex justify-center mt-4 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
