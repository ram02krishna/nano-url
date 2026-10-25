import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { registerUser, verifyEmail, resendOtp } from "../../services/auth.service";
import PasswordStrength from "../../components/common/PasswordStrength";
import { setToken } from "../../utils/token";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [form, setForm] = useState({ firstname: "", lastname: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Countdown for the "resend code" button
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendOtp({ email: form.email });
      toast.success("A new code is on its way");
      setCooldown(60);
    } catch (err) {
      const retry = err?.response?.data?.retryAfter;
      if (retry) setCooldown(retry);
      toast.error(err?.response?.data?.error || "Couldn't resend the code");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await registerUser(form);
      toast.success(res.data?.message || "Check your email for the verification code");
      setCooldown(60);
      setStep(2);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const verifySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await verifyEmail({ email: form.email, otp });
      const token = res.data?.token;
      if (token) {
        setToken(token);
        setUser({ loggedIn: true });
        toast.success("Email verified! Welcome to nanoURL!");
        navigate("/dashboard");
      } else {
        toast.success("Email verified! Please sign in.");
        navigate("/login");
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-14">
      <div className="w-full max-w-sm animate-slide-up">
        {step === 1 ? (
          <>
            <div className="mb-6">
              <Link to="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 mb-6 transition-colors">
                ← Back to home
              </Link>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Create an account</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Already have one?{" "}
                <Link to="/login" className="text-accent-600 hover:underline font-medium">Sign in</Link>
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">First name</label>
                  <input
                    placeholder="John"
                    required
                    disabled={loading}
                    className="input"
                    value={form.firstname}
                    onChange={e => setForm({ ...form, firstname: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Last name</label>
                  <input
                    placeholder="Doe"
                    required
                    disabled={loading}
                    className="input"
                    value={form.lastname}
                    onChange={e => setForm({ ...form, lastname: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email address</label>
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
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 5 characters"
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
                <PasswordStrength password={form.password} />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Confirm password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  required
                  disabled={loading}
                  className="input"
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary btn w-full mt-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
              </button>

              <p className="text-xs text-center text-zinc-400">
                By signing up you agree to our terms of service.
              </p>
            </form>
          </>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Check your email</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                We sent a 6-digit code to <span className="font-medium text-zinc-700 dark:text-zinc-300">{form.email}</span>
              </p>
            </div>

            <form onSubmit={verifySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Verification code</label>
                <input
                  type="text"
                  placeholder="123456"
                  required
                  maxLength={6}
                  disabled={loading}
                  className="input text-center tracking-widest text-xl font-mono"
                  value={otp}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoFocus
                />
              </div>

              <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary btn w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify email"}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={loading || cooldown > 0}
                className="btn-secondary btn w-full text-sm"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setOtp(""); }}
                className="btn-ghost btn w-full text-sm"
              >
                ← Back
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
