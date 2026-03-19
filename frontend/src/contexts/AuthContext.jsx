import { useMemo, useState } from "react";
import { AuthContext } from "./authContextObject";
const STORAGE_KEY = "vacation_app_user";

function getInitialUser() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);

  const value = useMemo(
    () => ({
      user,
      login: (selectedUser) => {
        setUser(selectedUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedUser));
      },
      logout: () => {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
