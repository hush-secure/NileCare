import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { RegisterData, User } from "../types";
import { fetchMe, login as apiLogin, logout as apiLogout, register as apiRegister } from "../api/services";

interface AuthState {
  user: User | null;
  checking: boolean; 
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider(props: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  async function login(email: string, password: string) {
    const u = await apiLogin(email, password);
    setUser(u);
    return u;
  }

  async function register(data: RegisterData) {
    const u = await apiRegister(data);
    setUser(u);
    return u;
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  async function refreshUser() {
    try {
      setUser(await fetchMe());
    } catch {
      setUser(null);
    }
  }

  const value: AuthState = { user, checking, login, register, logout, refreshUser };
  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
