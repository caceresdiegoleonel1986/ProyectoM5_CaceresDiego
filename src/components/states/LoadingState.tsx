type LoadingStateProps = {
  message?: string;
  skeleton?: React.ReactNode;
};

export function LoadingState({ message = "Cargando...", skeleton }: LoadingStateProps) {
  return (
    <div className="state-container">
      {skeleton ?? <span className="spinner" />}
      <p>{message}</p>
    </div>
  );
}