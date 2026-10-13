import { useState, type ReactNode } from "react";
import { useAuth } from "../../contexts/auth/useAuth";
import Modal from "../ui/Modal";
import Spinner from "../ui/Spinner";

type LogoutConfirmButtonProps = {
  className?: string;
  children?: ReactNode;
};

export default function LogoutConfirmButton({ className, children = "Cerrar sesión" }: LogoutConfirmButtonProps) {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmLogout = async () => {
    setIsSigningOut(true);
    setError(null);
    try {
      await logout();
      setIsOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cerrar la sesión.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <button type="button" className={className} onClick={() => setIsOpen(true)}>
        {children}
      </button>
      <Modal
        isOpen={isOpen}
        title="¿Quieres cerrar sesión?"
        onClose={() => !isSigningOut && setIsOpen(false)}
        closeOnBackdrop={!isSigningOut}
        closeOnEscape={!isSigningOut}
        footer={(
          <>
            <button type="button" className="button button--quiet" disabled={isSigningOut} onClick={() => setIsOpen(false)}>
              Cancelar
            </button>
            <button type="button" className="button button--primary" disabled={isSigningOut} onClick={() => void confirmLogout()}>
              {isSigningOut ? <><Spinner size="sm" /> Cerrando…</> : "Sí, cerrar sesión"}
            </button>
          </>
        )}
      >
        <p>Tu carrito de este navegador se conservará. Tendrás que volver a identificarte para acceder a tu cuenta.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
      </Modal>
    </>
  );
}