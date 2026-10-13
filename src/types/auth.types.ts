export type UserRole = "customer" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt?: Date;
}

export type AuthState =
  | { status: "loading"; user?: null }
  | { status: "anonymous"; user?: null }
  | {
      status: "authenticated";
      user: UserProfile;
    };