const INVALID_CREDENTIALS = "Email o contraseña incorrectos.";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": INVALID_CREDENTIALS,
  "auth/invalid-login-credentials": INVALID_CREDENTIALS,
  "auth/wrong-password": INVALID_CREDENTIALS,
  "auth/user-not-found": INVALID_CREDENTIALS,
  "auth/invalid-email": "El email no es válido.",
  "auth/email-already-in-use": "Ya existe una cuenta con este email. Inicia sesión o usa otro.",
  "auth/weak-password": "La contraseña es muy débil. Usa al menos 8 caracteres.",
  "auth/user-disabled": "Esta cuenta está deshabilitada.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  "auth/network-request-failed": "No hay conexión. Revisa tu internet e inténtalo de nuevo.",
  "auth/popup-closed-by-user": "Cerraste la ventana de Google antes de terminar.",
  "auth/cancelled-popup-request": "Cerraste la ventana de Google antes de terminar.",
  "auth/popup-blocked": "El navegador bloqueó la ventana de Google. Permítela e inténtalo de nuevo.",
};

/** Traduce un error de Firebase Auth a un mensaje para el usuario, sin exponer el texto técnico. */
export function getAuthErrorMessage(cause: unknown): string {
  const code = typeof cause === "object" && cause !== null && "code" in cause ? cause.code : undefined;
  return typeof code === "string" && Object.hasOwn(AUTH_ERROR_MESSAGES, code)
    ? AUTH_ERROR_MESSAGES[code]
    : "No se pudo completar la autenticación. Inténtalo de nuevo.";
}
