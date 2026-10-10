type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "no-products" | "no-results";
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  variant,
}) => (
  <div className="state-container" role="status" aria-live="polite">
    <h2>{title}</h2>
    {description && <p>{description}</p>}
    {variant === "no-results" && (
      <p>No hay resultados para tu búsqueda. Probá con otro término o cambiá la categoría.</p>
    )}
    {variant === "no-products" && (
      <p>Todavía no hay productos en el catálogo.</p>
    )}
    {actionLabel && onAction && (
      <button onClick={onAction}>{actionLabel}</button>
    )}
  </div>
);