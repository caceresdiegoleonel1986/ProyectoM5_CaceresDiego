import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/auth/useAuth";
import { addReview, getProductReviews } from "../../services/reviewService";
import type { Product } from "../../types/product.types";
import type { Review } from "../../types/review.types";

export default function ProductReviews({ product }: { product: Product }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!expanded) return;
    let active = true;
    void getProductReviews(product.id)
      .then((result) => {
        if (active) setReviews(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "No se pudieron cargar las reseñas.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [expanded, product.id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      const review = await addReview({
        productId: product.id,
        userId: user.id,
        userName: user.displayName || user.email,
        rating,
        comment: comment.trim(),
      });
      setReviews((current) => [review, ...current]);
      setComment("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo publicar la reseña.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-4 border-t border-[var(--border)] pt-3">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => {
          setError(null);
          if (!expanded) setLoading(true);
          setExpanded((current) => !current);
        }}
      >
        {expanded ? "Ocultar reseñas" : `Reseñas (${product.ratingCount ?? reviews.length})`}
      </button>
      {expanded && (
        <div className="mt-3 grid gap-4">
          {user ? (
            <form className="grid gap-2" onSubmit={(event) => void handleSubmit(event)}>
              <label className="grid gap-1">
                Tu calificación
                <select value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                  {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} de 5 estrellas</option>)}
                </select>
              </label>
              <label className="grid gap-1">
                Reseña
                <textarea required maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} />
              </label>
              <button type="submit" disabled={submitting || comment.trim().length === 0}>
                {submitting ? "Publicando..." : "Publicar reseña"}
              </button>
            </form>
          ) : (
            <p><Link to="/ingresar">Inicia sesión</Link> para dejar una reseña.</p>
          )}
          {error && <p role="alert" className="text-red-700">{error}</p>}
          {loading ? <p>Cargando reseñas...</p> : reviews.length === 0 ? <p>Aún no hay reseñas.</p> : (
            <ul className="grid gap-3">
              {reviews.map((review) => (
                <li key={review.id}>
                  <p><strong>{review.userName}</strong> · {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                  <p>{review.comment}</p>
                  <time dateTime={review.createdAt.toISOString()}>
                    {review.createdAt.toLocaleDateString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}