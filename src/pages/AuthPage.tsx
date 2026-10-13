import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth/useAuth";
import Spinner from "../components/ui/Spinner";

type RedirectState = { from?: string };

export default function AuthPage() {
  const { authState, login, loginGoogle, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isRegistering = location.pathname === "/registrarse";
  const redirectPath = (location.state as RedirectState | null)?.from ?? "/";
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const completeSignIn = async (action: () => Promise<unknown>) => {
    setSubmitting(true);
    setError(null);
    try {
      await action();
      navigate(redirectPath, { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo completar la autenticación.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void completeSignIn(() => isRegistering
      ? register(email, password, displayName.trim())
      : login(email, password));
  };

  if (authState.status === "authenticated") {
    return <p role="status">Ya has iniciado sesión. <Link to="/">Volver a la tienda</Link></p>;
  }

  return (
    <section className="auth-page">
      <h1>{isRegistering ? "Crea tu cuenta" : "Qué bueno verte de nuevo"}</h1>
      <p className="auth-page__intro">{isRegistering ? "Únete a KairoShop para guardar tus pedidos y favoritos." : "Ingresa para continuar con tus pedidos y favoritos."}</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        {isRegistering && (
          <label className="grid gap-1">
            Nombre
            <input autoComplete="name" required value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </label>
        )}
        <label className="grid gap-1">
          Email
          <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="grid gap-1">
          Contraseña
          <input
            type="password"
            autoComplete={isRegistering ? "new-password" : "current-password"}
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <p role="alert" className="form-error">{error}</p>}
        <button className="button button--primary" type="submit" disabled={submitting}>
          {submitting ? <><Spinner size="sm" /> Procesando…</> : isRegistering ? "Crear cuenta" : "Iniciar sesión"}
        </button>
      </form>
      <div className="auth-page__divider">o continuar con</div>
      <button className="auth-page__google" type="button" disabled={submitting} onClick={() => void completeSignIn(loginGoogle)}>
        {submitting ? <Spinner size="sm" /> : "G"} Google
      </button>
      <p className="auth-page__switch">
        {isRegistering ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
        <Link to={isRegistering ? "/ingresar" : "/registrarse"}>
          {isRegistering ? "Inicia sesión" : "Regístrate"}
        </Link>
      </p>
    </section>
  );
}