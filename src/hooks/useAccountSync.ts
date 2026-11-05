import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/auth/useAuth";

type AccountSyncOptions<TValue, TLoaded> = {
  /** Lo que se guarda en la cuenta; se compara por contenido para no escribir de más. */
  value: TValue;
  /** Clave de localStorage con los datos de invitado, que se descartan al fusionarse con la cuenta. */
  guestKey: string;
  load: (userId: string) => Promise<{ data: TLoaded; saved: TValue }>;
  save: (userId: string, value: TValue) => Promise<void>;
  onLoaded: (data: TLoaded) => void;
  onLogout: () => void;
};

/**
 * Sincroniza un dato del usuario con su cuenta. Al iniciar sesión carga lo guardado y lo fusiona;
 * al cerrarla limpia el dispositivo. Si la carga falla no escribe nada, para no pisar lo guardado,
 * y el dato sigue en localStorage.
 * Debe recibir `load`, `save`, `onLoaded` y `onLogout` estables.
 */
export function useAccountSync<TValue, TLoaded>({
  value,
  guestKey,
  load,
  save,
  onLoaded,
  onLogout,
}: AccountSyncOptions<TValue, TLoaded>) {
  const { authState, user } = useAuth();
  const userId = user?.id ?? null;
  const authLoading = authState.status === "loading";
  const [readyFor, setReadyFor] = useState<string | null>(null);
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const owner = useRef<string | null>(null);
  const lastSaved = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      if (owner.current) {
        owner.current = null;
        lastSaved.current = null;
        setReadyFor(null);
        setFailedFor(null);
        onLogout();
      }
      return;
    }

    owner.current = userId;
    let active = true;
    void load(userId)
      .then(({ data, saved }) => {
        if (!active) return;
        lastSaved.current = JSON.stringify(saved);
        onLoaded(data);
        localStorage.removeItem(guestKey);
        setReadyFor(userId);
      })
      .catch((cause: unknown) => {
        console.error(`No se pudo cargar ${guestKey} de la cuenta:`, cause);
        if (active) setFailedFor(userId);
      });
    return () => {
      active = false;
    };
  }, [authLoading, userId, guestKey, load, onLoaded, onLogout]);

  useEffect(() => {
    if (!userId || readyFor !== userId) return;
    const next = JSON.stringify(value);
    if (next === lastSaved.current) return;
    lastSaved.current = next;
    void save(userId, value).catch((cause: unknown) => {
      console.error(`No se pudo guardar ${guestKey} en la cuenta:`, cause);
    });
  }, [value, userId, readyFor, guestKey, save]);

  const synced = userId !== null && readyFor === userId;
  return {
    syncing: authLoading || (userId !== null && !synced && failedFor !== userId),
    persistLocally: !synced,
  };
}
