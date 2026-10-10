type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  cta?: React.ReactNode;
  onAction?: () => void;
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <div>
    <h2>{title}</h2>
    {description && <p>{description}</p>}
    {actionLabel && onAction && (
      <button onClick={onAction}>{actionLabel}</button>
    )}
  </div>
);