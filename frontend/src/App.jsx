import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./components/common/Navbar";
import AppRoutes from "./routes/AppRoutes";

const App = () => {
  const { pathname } = useLocation();

  // Start every page at the top when navigating
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="min-h-screen transition-colors">
      <Navbar />
      <main>
        <AppRoutes />
      </main>
    </div>
  );
};

export default App;
