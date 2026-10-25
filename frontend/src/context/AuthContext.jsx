import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getToken, removeToken } from "../utils/token";
import { getMe } from "../services/auth.service";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(() => (getToken() ? { loggedIn: true } : null));

  // Merge-friendly setter so Login/Register can keep calling setUser({ loggedIn: true })
  const setUser = useCallback((value) => setUserState(value), []);

  const logout = useCallback(() => {
    removeToken();
    setUserState(null);
  }, []);

  // Load profile (name / email) once we have a token
  const loggedIn = !!user?.loggedIn;
  const hasProfile = !!user?.email;
  useEffect(() => {
    if (!loggedIn || hasProfile) return;
    let cancelled = false;
    getMe()
      .then((res) => {
        if (!cancelled) setUserState({ loggedIn: true, ...res.data });
      })
      .catch(() => { /* 401s are handled by the auth:expired listener */ });
    return () => { cancelled = true; };
  }, [loggedIn, hasProfile]);

  // Session expired / token rejected by the API
  useEffect(() => {
    const onExpired = () => {
      if (!getToken()) return;
      logout();
      toast.error("Your session expired. Please sign in again.");
    };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, [logout]);

  const value = useMemo(() => ({ user, setUser, loading: false, logout }), [user, setUser, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
