import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

export interface User {
  username: string;
  role: "admin" | "store_manager" | "engineer" | "accounts";
  displayName: string;
}

export interface AppUser {
  username: string;
  displayName: string;
  role: "admin" | "store_manager" | "engineer" | "accounts";
}

export interface NewUser extends AppUser {
  password: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  users: AppUser[];
  addUser: (u: NewUser) => { success: boolean; error?: string };
  updateUser: (
    username: string,
    updates: Partial<NewUser>,
  ) => { success: boolean; error?: string };
  deleteUser: (username: string) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => false,
  logout: () => {},
  users: [],
  addUser: () => ({ success: false }),
  updateUser: () => ({ success: false }),
  deleteUser: () => ({ success: false }),
});

const DEFAULT_ADMIN: AppUser = {
  username: "admin",
  role: "admin",
  displayName: "Administrator",
};

const BUILT_IN_USERS = [
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

const MAX_USERS = 50;

function getCustomUsers(): AppUser[] {
  try {
    const stored = localStorage.getItem("ewz_custom_users");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setCustomUsers(users: AppUser[]) {
  localStorage.setItem("ewz_custom_users", JSON.stringify(users));
}

function getPasswords(): Record<string, string> {
  try {
    const stored = localStorage.getItem("ewz_user_passwords");
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setPasswords(passwords: Record<string, string>) {
  localStorage.setItem("ewz_user_passwords", JSON.stringify(passwords));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("ewz_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [customUsers, setCustomUsersState] =
    useState<AppUser[]>(getCustomUsers);

  const allUsers: AppUser[] = [
    DEFAULT_ADMIN,
    ...BUILT_IN_USERS.filter((u) => u.username !== "admin").map(
      ({ username, role, displayName }) => ({ username, role, displayName }),
    ),
    ...customUsers,
  ];

  const login = (username: string, password: string): boolean => {
    // Check built-in users
    const builtin = BUILT_IN_USERS.find(
      (u) => u.username === username && u.password === password,
    );
    if (builtin) {
      const u: User = {
        username: builtin.username,
        role: builtin.role,
        displayName: builtin.displayName,
      };
      setUser(u);
      localStorage.setItem("ewz_user", JSON.stringify(u));
      return true;
    }
    // Check custom users
    const passwords = getPasswords();
    const customUser = customUsers.find((u) => u.username === username);
    if (customUser && passwords[username] === password) {
      const u: User = {
        username: customUser.username,
        role: customUser.role,
        displayName: customUser.displayName,
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

  const addUser = (newUser: NewUser): { success: boolean; error?: string } => {
    if (allUsers.length >= MAX_USERS) {
      return { success: false, error: `Maximum ${MAX_USERS} users reached.` };
    }
    const exists =
      allUsers.find((u) => u.username === newUser.username) ||
      BUILT_IN_USERS.find((u) => u.username === newUser.username);
    if (exists) {
      return { success: false, error: "Username already exists." };
    }
    const updated = [
      ...customUsers,
      {
        username: newUser.username,
        displayName: newUser.displayName,
        role: newUser.role,
      },
    ];
    setCustomUsers(updated);
    setCustomUsersState(updated);
    const passwords = getPasswords();
    passwords[newUser.username] = newUser.password;
    setPasswords(passwords);
    return { success: true };
  };

  const updateUser = (
    username: string,
    updates: Partial<NewUser>,
  ): { success: boolean; error?: string } => {
    // Allow updating built-in users (display name / password) but not their username/role for admin
    const isBuiltin = BUILT_IN_USERS.find((u) => u.username === username);
    if (isBuiltin) {
      // Update password if provided
      if (updates.password) {
        if (username === "admin") {
          // Store admin password override
          const passwords = getPasswords();
          passwords[username] = updates.password;
          setPasswords(passwords);
        } else {
          const passwords = getPasswords();
          passwords[username] = updates.password;
          setPasswords(passwords);
        }
      }
      return { success: true };
    }
    const idx = customUsers.findIndex((u) => u.username === username);
    if (idx === -1) return { success: false, error: "User not found." };
    const updated = [...customUsers];
    updated[idx] = {
      ...updated[idx],
      ...(updates.displayName ? { displayName: updates.displayName } : {}),
      ...(updates.role ? { role: updates.role } : {}),
    };
    setCustomUsers(updated);
    setCustomUsersState(updated);
    if (updates.password) {
      const passwords = getPasswords();
      passwords[username] = updates.password;
      setPasswords(passwords);
    }
    return { success: true };
  };

  const deleteUser = (
    username: string,
  ): { success: boolean; error?: string } => {
    if (username === "admin") {
      return { success: false, error: "Cannot delete the default admin user." };
    }
    const isBuiltin = BUILT_IN_USERS.find((u) => u.username === username);
    if (isBuiltin) {
      return { success: false, error: "Cannot delete built-in users." };
    }
    const updated = customUsers.filter((u) => u.username !== username);
    setCustomUsers(updated);
    setCustomUsersState(updated);
    const passwords = getPasswords();
    delete passwords[username];
    setPasswords(passwords);
    return { success: true };
  };

  useEffect(() => {
    setCustomUsersState(getCustomUsers());
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        users: allUsers,
        addUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
