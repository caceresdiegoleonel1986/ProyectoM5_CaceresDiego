import type { AuthState, UserProfile, UserRole } from "../../types/auth.types";

export type AuthContextType = {
  authState: AuthState;
  user: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<UserProfile>;
  loginGoogle: () => Promise<UserProfile>;
  register: (email: string, pass: string, displayName?: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
};