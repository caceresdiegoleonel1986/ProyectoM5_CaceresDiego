import { useState, type ReactNode } from "react";
import Modal from "../ui/Modal";
import Spinner from "../ui/Spinner";

type ConfirmActionButtonProps = {
  children: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  className?: string;
  confirmClassName?: string;
  onConfirm: () => void | Promise<void>;
};

export default function ConfirmActionButton({
  children,
  title,
  description,
  confirmLabel,
  className,
  confirmClassName = "button--danger",
  onConfirm,
}: ConfirmActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setIsPending(true);
    setError(null);
    try {
      await onConfirm();
      setIsOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo completar la acción.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <button type="button" className={className} onClick={() => setIsOpen(true)}>
        {children}
      </button>
      <Modal
        isOpen={isOpen}
        title={title}
        onClose={() => !isPending && setIsOpen(false)}
        closeOnBackdrop={!isPending}
        closeOnEscape={!isPending}
        footer={(
          <>
            <button type="button" className="button button--quiet" disabled={isPending} onClick={() => setIsOpen(false)}>
              Volver
            </button>
            <button type="button" className={`button ${confirmClassName}`} disabled={isPending} onClick={() => void confirm()}>
              {isPending ? <><Spinner size="sm" /> Procesando…</> : confirmLabel}
            </button>
          </>
        )}
      >
        <p>{description}</p>
        {error && <p className="form-error" role="alert">{error}</p>}
      </Modal>
    </>
  );
}