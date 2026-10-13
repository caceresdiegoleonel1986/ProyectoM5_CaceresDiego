import { useEffect, useState } from "react";
import { ProductCard } from "../components/common/ProductCard";
import { EmptyState, ErrorState, LoadingState } from "../components/states";
import { useCart } from "../contexts/cart/useCart";
import { useFavorite } from "../contexts/favorites/useFavorite";
import { getProductsByIds } from "../services/productService";
import type { Product } from "../types/product.types";

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorite();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (favorites.length === 0) return;
    void getProductsByIds(favorites)
      .then((result) => {
        if (active) setProducts(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "No se pudieron cargar los favoritos.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [favorites]);

  if (favorites.length === 0) {
    return <EmptyState title="No tienes favoritos guardados" description="Los productos que marques como favoritos aparecerán aquí." />;
  }
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (products.length === 0) {
    return <EmptyState title="Tus favoritos ya no están disponibles" description="El catálogo puede haber cambiado desde que los guardaste." />;
  }

  return (
    <section className="py-6">
      <h1 className="mb-5 text-2xl font-semibold">Tus favoritos</h1>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article className="rounded-md border border-[var(--border)] bg-[var(--card)] p-4" key={product.id}>
            <ProductCard
              layout="grid"
              product={product}
              showPrice
              onAddToCart={(id) => {
                if (product.stock > 0) addToCart(product);
                else removeFavorite(id);
              }}
            />
            <button type="button" onClick={() => removeFavorite(product.id)}>Quitar de favoritos</button>
          </article>
        ))}
      </div>
    </section>
  );
}