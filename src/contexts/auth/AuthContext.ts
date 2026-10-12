import { createContext } from "react";
import type { AuthState } from "../../types/auth.types";

export type AuthContextType = {
  authState: AuthState;
  login: (email: string, password: string, role?: "user" | "admin") => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);