import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("gosocial_token");
    const stored = localStorage.getItem("gosocial_user");
    if (token && stored) {
      setUser(JSON.parse(stored));
      api.get("/auth/me").then(res => {
        setUser(res.data.user);
        localStorage.setItem("gosocial_user", JSON.stringify(res.data.user));
      }).catch(() => {
        localStorage.removeItem("gosocial_token");
        localStorage.removeItem("gosocial_user");
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("gosocial_token", res.data.token);
    localStorage.setItem("gosocial_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  }, []);

  const register = useCallback(async (name, email, password, company) => {
    const res = await api.post("/auth/register", { name, email, password, company });
    localStorage.setItem("gosocial_token", res.data.token);
    localStorage.setItem("gosocial_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("gosocial_token");
    localStorage.removeItem("gosocial_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
