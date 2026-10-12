export type UserRole = "user" | "admin";

export type AuthState =
  | { status: "anonymous" }
  | {
      status: "authenticated";
      user: {
        id: string;
        email: string;
        role: UserRole;
      };
    };