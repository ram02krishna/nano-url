import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Settings, LogOut, Moon, Sun, Monitor, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth(); 
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = user
    ? [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/settings", icon: Settings, label: "Settings" },
      ]
    : [];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 border-b transition-colors duration-200 ${
        scrolled
          ? "bg-[#f0f5ff]/95 dark:bg-[#070e2b]/95 backdrop-blur-md border-accent-200 dark:border-accent-900/60"
          : "bg-[#f0f5ff] dark:bg-[#070e2b] border-transparent"
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">

          <div className="h-9 w-9 overflow-hidden flex-shrink-0">
            <img
              src="/nanoURL_logo.png"
              alt="nanoURL logo"
              className="w-[140%] max-w-none -translate-x-[14%] -translate-y-[2%] scale-[1.15]"
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold text-[#0d1f7c] dark:text-white tracking-tight">nanoURL</span>
            <span className="text-[10px] font-medium text-[#0066bb] dark:text-accent-400 tracking-wide">Shorten. Share. Track.</span>
          </div>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {navLinks.map((link) => {
            const { to, icon: Icon, label } = link;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === to
                    ? "bg-accent-100 dark:bg-accent-900/40 text-accent-900 dark:text-accent-200"
                    : "text-accent-700 dark:text-accent-300 hover:bg-accent-100 dark:hover:bg-accent-900/30 hover:text-accent-900 dark:hover:text-accent-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={cycleTheme}
            className="btn-icon btn-ghost"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            <ThemeIcon className="w-4 h-4" />
          </button>

          {!user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-ghost btn text-sm">Sign in</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary btn text-sm">Get started</Link>
            </div>
          ) : (
            <>
              <Link
                to="/settings"
                className="hidden sm:flex w-8 h-8 rounded-full bg-gradient-to-br from-accent-600 to-accent-400 text-white text-[11px] font-bold items-center justify-center shadow-sm hover:opacity-90 transition-opacity"
                title={user?.email ?? "Account settings"}
                aria-label="Account settings"
              >
                {((user?.firstname?.[0] ?? "") + (user?.lastname?.[0] ?? "")).toUpperCase() || "•"}
              </Link>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="hidden sm:flex btn-ghost btn text-sm text-zinc-600 dark:text-zinc-400"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
            </>
          )}

          <button
            className="sm:hidden btn-icon btn-ghost"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="sm:hidden border-t border-accent-200 dark:border-accent-900/50 bg-[#f0f5ff] dark:bg-[#070e2b]">
          <div className="px-4 py-3 space-y-1 animate-fade-in">
          {navLinks.map((link) => {
            const { to, icon: Icon, label } = link;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-accent-700 dark:text-accent-300 hover:bg-accent-100 dark:hover:bg-accent-900/30"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
          {!user ? (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-accent-700 dark:text-accent-300 hover:bg-accent-100 dark:hover:bg-accent-900/30">Sign in</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90" style={{background:'linear-gradient(135deg,#0066bb,#00aaff)'}}>Get started</Link>
            </>
          ) : (
            <button
              onClick={() => { logout(); setMobileOpen(false); navigate("/login"); }}
              className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-accent-700 dark:text-accent-300 hover:bg-accent-100 dark:hover:bg-accent-900/30"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
