import { useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  loginWithCorporateEmail as loginWithCorporateEmailRequest,
} from "../api/client";
import { AUTH_STORAGE_KEY } from "../constants/auth";
import { AuthContext } from "./authContextObject";

function getInitialAuth() {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) {
    return { token: null, user: null };
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      token: parsed?.token || null,
      user: parsed?.user || null,
    };
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getInitialAuth);

  useEffect(() => {
    async function bootstrapUser() {
      if (!auth.token || auth.user) {
        return;
      }

      try {
        const user = await getCurrentUser();
        const nextAuth = { token: auth.token, user };
        setAuth(nextAuth);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
      } catch {
        setAuth({ token: null, user: null });
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }

    bootstrapUser();
  }, [auth.token, auth.user]);

  const value = useMemo(
    () => ({
      user: auth.user,
      token: auth.token,
      loginWithCorporateEmail: async (email) => {
        const session = await loginWithCorporateEmailRequest(email);
        const nextAuth = {
          token: session.token,
          user: session.user,
        };
        setAuth(nextAuth);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
        return session.user;
      },
      refreshUser: async () => {
        const user = await getCurrentUser();
        const nextAuth = {
          token: auth.token,
          user,
        };
        setAuth(nextAuth);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
        return user;
      },
      logout: () => {
        setAuth({ token: null, user: null });
        localStorage.removeItem(AUTH_STORAGE_KEY);
      },
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
