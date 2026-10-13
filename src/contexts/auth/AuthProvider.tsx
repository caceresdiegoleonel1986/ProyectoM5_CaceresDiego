import { useState, useEffect, useCallback, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import type { AuthState, UserProfile, UserRole } from "../../types/auth.types";
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  subscribeToAuthState,
  ensureUserProfile,
} from "../../services/authService";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    let revision = 0;
    const unsubscribe = subscribeToAuthState((fbUser) => {
      const currentRevision = ++revision;
      if (!fbUser) {
        setAuthState({ status: "anonymous" });
        return;
      }

      void ensureUserProfile(fbUser, fbUser.displayName ?? undefined)
        .then((profile) => {
          if (active && currentRevision === revision) {
            setAuthState({
              status: "authenticated",
              user: profile,
            });
          }
        })
        .catch((err: unknown) => {
          console.error("Error al sincronizar perfil de usuario:", err);
          if (active && currentRevision === revision) setAuthState({ status: "anonymous" });
        });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<UserProfile> => {
    setAuthState({ status: "loading" });
    try {
      const profile = await loginWithEmail(email, pass);
      setAuthState({
        status: "authenticated",
        user: profile,
      });
      return profile;
    } catch (err) {
      setAuthState({ status: "anonymous" });
      throw err;
    }
  }, []);

  const loginGoogle = useCallback(async (): Promise<UserProfile> => {
    setAuthState({ status: "loading" });
    try {
      const profile = await loginWithGoogle();
      setAuthState({
        status: "authenticated",
        user: profile,
      });
      return profile;
    } catch (err) {
      setAuthState({ status: "anonymous" });
      throw err;
    }
  }, []);

  const register = useCallback(
    async (
      email: string,
      pass: string,
      displayName?: string
    ): Promise<UserProfile> => {
      setAuthState({ status: "loading" });
      try {
        const profile = await registerWithEmail(email, pass, displayName);
        setAuthState({
          status: "authenticated",
          user: profile,
        });
        return profile;
      } catch (err) {
        setAuthState({ status: "anonymous" });
        throw err;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await logoutUser();
    setAuthState({ status: "anonymous" });
  }, []);

  const user = authState.status === "authenticated" ? authState.user : null;
  const role: UserRole = user?.role || "customer";
  const isAdmin = role === "admin";

  return (
    <AuthContext.Provider
      value={{
        authState,
        user,
        role,
        isAdmin,
        login,
        loginGoogle,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;