import { useState, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import type { AuthState } from "../../types/auth.types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ status: "anonymous" });

  const login = (email: string, _password: string, role: "user" | "admin" = "user") => {
    // Lógica placeholder: integración real (Firebase, API, etc.)
    setAuthState({
      status: "authenticated",
      user: { id: "u1", email, role },
    });
  };

  const logout = () => {
    setAuthState({ status: "anonymous" });
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;