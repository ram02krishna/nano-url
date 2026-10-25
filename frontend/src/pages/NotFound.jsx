import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center px-4 pt-14">
    <div className="text-center space-y-5 animate-slide-up">
      <p className="text-8xl font-extrabold text-gradient">404</p>
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Page not found</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
          This page doesn't exist or was moved.
        </p>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Link to="/" className="btn-primary btn text-sm">Go home</Link>
        <button onClick={() => window.history.back()} className="btn-secondary btn text-sm">Go back</button>
      </div>
    </div>
  </div>
);

export default NotFound;
