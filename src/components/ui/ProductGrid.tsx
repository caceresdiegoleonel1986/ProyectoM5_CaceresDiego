import type { Product } from "../../types/product.types";
import ProductCard from "../common/ProductCard";
import ProductReviews from "../common/ProductReviews";

type ProductGridProps = {
  products: Product[];
  favorites: string[];
  onAddToCart: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
};

export function ProductGrid({ products, favorites, onAddToCart, onToggleFavorite }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <article className="rounded-md border border-[var(--border)] bg-[var(--card)] p-4" key={p.id}>
          <ProductCard layout="grid" product={p} showPrice onAddToCart={onAddToCart} />
          <button
            type="button"
            aria-pressed={favorites.includes(p.id)}
            onClick={() => onToggleFavorite(p.id)}
          >
            {favorites.includes(p.id) ? "Quitar de favoritos" : "Añadir a favoritos"}
          </button>
          <ProductReviews product={p} />
        </article>
      ))}
    </div>
  );
}

export default ProductGrid;