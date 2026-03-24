import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

export interface User {
  username: string;
  role: "admin" | "store_manager" | "engineer" | "accounts";
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => false,
  logout: () => {},
});

const DEFAULT_USERS = [
  {
    username: "admin",
    password: "admin123",
    role: "admin" as const,
    displayName: "Administrator",
  },
  {
    username: "store",
    password: "store123",
    role: "store_manager" as const,
    displayName: "Store Manager",
  },
  {
    username: "engineer",
    password: "eng123",
    role: "engineer" as const,
    displayName: "Site Engineer",
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("ewz_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (username: string, password: string): boolean => {
    const found = DEFAULT_USERS.find(
      (u) => u.username === username && u.password === password,
    );
    if (found) {
      const u: User = {
        username: found.username,
        role: found.role,
        displayName: found.displayName,
      };
      setUser(u);
      localStorage.setItem("ewz_user", JSON.stringify(u));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ewz_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
