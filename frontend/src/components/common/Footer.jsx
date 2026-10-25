import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-accent-100 dark:border-accent-900/60 mt-auto">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
      <p>© {new Date().getFullYear()} nanoURL · Shorten. Share. Track.</p>
      <nav className="flex items-center gap-4">
        <Link to="/" className="hover:text-accent-600 dark:hover:text-accent-300 transition-colors">Home</Link>
        <Link to="/register" className="hover:text-accent-600 dark:hover:text-accent-300 transition-colors">Create account</Link>
        <Link to="/login" className="hover:text-accent-600 dark:hover:text-accent-300 transition-colors">Sign in</Link>
      </nav>
    </div>
  </footer>
);

export default Footer;
