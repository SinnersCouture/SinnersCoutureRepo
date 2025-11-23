import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = "sinners-auth";

const readStoredSession = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.token && parsed.user) {
      return parsed;
    }
  } catch {
    // ignore invalid storage
  }

  return null;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => readStoredSession());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!session) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  const login = useCallback((nextSession) => {
    if (!nextSession || !nextSession.token || !nextSession.user) {
      throw new Error("Invalid session payload");
    }
    setSession(nextSession);
  }, []);

  const logout = useCallback(() => {
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      user: session ? session.user : null,
      token: session ? session.token : null,
      login,
      logout,
    }),
    [session, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

