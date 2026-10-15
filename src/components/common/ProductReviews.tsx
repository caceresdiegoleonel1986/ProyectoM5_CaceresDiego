import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/auth/useAuth";
import { getProductReviews, getReviewablePurchase, saveReview } from "../../services/reviewService";
import type { Product } from "../../types/product.types";
import type { Review, ReviewPurchase } from "../../types/review.types";

export default function ProductReviews({ product }: { product: Product }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [purchase, setPurchase] = useState<ReviewPurchase | null>(null);
  const [editing, setEditing] = useState(false);
  const [loadedKey, setLoadedKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = user?.id;
  const requestKey = JSON.stringify([product.id, userId ?? ""]);
  const loading = expanded && loadedKey !== requestKey;
  const ownReview = reviews.find((review) => review.userId === userId);

  useEffect(() => {
    if (!expanded) return;
    let active = true;
    void Promise.all([
      getProductReviews(product.id),
      userId ? getReviewablePurchase(product.id, userId) : Promise.resolve(null),
    ])
      .then(([result, eligiblePurchase]) => {
        if (active) {
          setReviews(result);
          setPurchase(eligiblePurchase);
          const currentReview = result.find((review) => review.userId === userId);
          setRating(currentReview?.rating ?? 5);
          setComment(currentReview?.comment ?? "");
          setEditing(false);
          setLoadedKey(requestKey);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "No se pudieron cargar las reseñas.");
          setLoadedKey(requestKey);
        }
      })
      ;
    return () => {
      active = false;
    };
  }, [expanded, product.id, requestKey, userId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !purchase) return;
    setSubmitting(true);
    setError(null);
    try {
      const review = await saveReview({
        productId: product.id,
        userId: user.id,
        userName: user.displayName || user.email,
        rating,
        comment: comment.trim(),
        ...purchase,
      }, ownReview?.id);
      setReviews((current) => {
        const existingIndex = current.findIndex((entry) => entry.userId === review.userId);
        if (existingIndex < 0) return [review, ...current];
        return current.map((entry, index) => index === existingIndex ? review : entry);
      });
      setEditing(false);
      setRating(review.rating);
      setComment(review.comment);
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
          if (!expanded) setLoadedKey("");
          setExpanded((current) => !current);
        }}
      >
        {expanded ? "Ocultar reseñas" : `Reseñas (${product.ratingCount ?? reviews.length})`}
      </button>
      {expanded && (
        <div className="mt-3 grid gap-4">
          {loading ? <p>Cargando reseñas...</p> : user ? !purchase ? (
            <p>Solo puedes reseñar este producto después de comprarlo en una orden no cancelada.</p>
          ) : ownReview && !editing ? (
            <div>
              <p>Ya publicaste una reseña para este producto.</p>
              <button type="button" onClick={() => {
                setRating(ownReview.rating);
                setComment(ownReview.comment);
                setEditing(true);
              }}>
                Editar mi reseña
              </button>
            </div>
          ) : (
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
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={submitting || comment.trim().length === 0}>
                  {submitting ? "Guardando..." : ownReview ? "Guardar cambios" : "Publicar reseña"}
                </button>
                {editing && <button type="button" onClick={() => setEditing(false)}>Cancelar</button>}
              </div>
            </form>
          ) : (
            <p><Link to="/ingresar">Inicia sesión</Link> para dejar una reseña.</p>
          )}
          {error && <p role="alert" className="text-red-700">{error}</p>}
          {!loading && reviews.length === 0 ? <p>Aún no hay reseñas.</p> : !loading && (
            <ul className="grid gap-3">
              {reviews.map((review) => (
                <li key={review.id}>
                  <p><strong>{review.userName}</strong> · {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                  <p>{review.comment}</p>
                  <time dateTime={review.createdAt.toISOString()}>
                    {review.updatedAt ? "Editada " : ""}{(review.updatedAt ?? review.createdAt).toLocaleDateString()}
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