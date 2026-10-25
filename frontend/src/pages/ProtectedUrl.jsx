import { useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { verifyPassword } from "../services/url.service";
import { errorMessage } from "../utils/format";

const ProtectedUrl = () => {
  const { shortCode } = useParams();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) { setError("Please enter a password"); return; }
    setLoading(true);
    setError("");
    try {
      const { data } = await verifyPassword(shortCode, { password });
      // Defence in depth: only ever navigate to http(s) targets
      if (!/^https?:\/\//i.test(data.targetURL)) throw new Error("Unsafe redirect blocked");
      window.location.href = data.targetURL;
    } catch (err) {
      const reason = err?.response?.data?.reason;
      if (reason) {
        window.location.replace(`/status/${reason}`);
        return;
      }
      const msg = errorMessage(err, "Incorrect password");
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-14">
      <div className="w-full max-w-sm animate-slide-up card p-6 sm:p-8 shadow-xl shadow-accent-600/10">
        <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-accent-600 to-accent-400 rounded-2xl mb-5 mx-auto shadow-lg shadow-accent-500/30">
          <Lock className="w-6 h-6 text-white" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Password required</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
            This link is protected. Enter the password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
            <div className="relative">
              <input
                id="password"
                type={show ? "text" : "password"}
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                className={`input pr-10 ${error ? "!border-red-400 focus:!border-red-500" : ""}`}
                placeholder="Enter password"
                autoFocus
                disabled={loading}
                aria-invalid={!!error}
                aria-describedby={error ? "pw-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-icon btn-ghost !p-1.5"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p id="pw-error" role="alert" className="text-xs text-red-500">{error}</p>}
          </div>

          <button type="submit" disabled={loading || !password} className="btn-primary btn w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
          </button>
        </form>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5" /> Protected by nanoURL
        </p>
      </div>
    </div>
  );
};

export default ProtectedUrl;
