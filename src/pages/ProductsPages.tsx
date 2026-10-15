import { useState } from "react";
import { useProductsRealtime } from "../contexts/products/useProductsRealtime";
import { useDebounce } from "../hooks/useDebounce";
import { ProductGrid } from "../components/ui/ProductGrid";
import { LoadingState, EmptyState, ErrorState } from "../components/states";
import { useCart } from "../contexts/cart/useCart";
import { useFavorite } from "../contexts/favorites/useFavorite";

const CATEGORIES = [
  { id: "", label: "Todas" },
  { id: "zapatillas", label: "Zapatillas" },
  { id: "mochilas", label: "Mochilas" },
  { id: "auriculares", label: "Auriculares" },
  { id: "smartwatches", label: "Smartwatches" },
  { id: "camperas", label: "Camperas" },
];

export function ProductsPage() {
  const { addToCart } = useCart();
  const { favorites, addFavorite, removeFavorite } = useFavorite();
  const [searchText, setSearchText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const debouncedSearch = useDebounce(searchText, 400);
  const searchPrefix = debouncedSearch.trim().toLowerCase();
  const firstSearchWord = searchPrefix.split(/\s+/)[0];
  const searchedCategory = firstSearchWord.length >= 2
    ? CATEGORIES.find((category) => category.id && category.label.toLowerCase().startsWith(firstSearchWord))
    : undefined;
  const activeCategoryId = searchedCategory?.id || categoryId;
  const {
    products,
    loading,
    error,
    hasMore,
    loadingMore,
    loadMore,
    retry,
  } = useProductsRealtime(
    activeCategoryId || undefined,
    searchPrefix.length >= 2 && !searchedCategory ? searchPrefix : undefined,
  );

  const handleAddToCart = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (product && product.stock > 0) addToCart(product);
  };

  const handleToggleFavorite = (productId: string) => {
    if (favorites.includes(productId)) removeFavorite(productId);
    else addFavorite(productId);
  };

  const hasFilters = Boolean(searchPrefix || categoryId);

  return (
    <div className="catalogPage">
      <div className="filters">
        <input
          aria-label="Buscar productos"
          placeholder="Buscar (mín. 2 letras)"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <select
          aria-label="Categoría"
          value={activeCategoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            if (searchedCategory) setSearchText("");
          }}
        >
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      {loading && <LoadingState />}

      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={retry}
        />
      )}

      {!loading && !error && products.length === 0 && (
        <EmptyState
          variant={hasFilters ? "no-results" : "no-products"}
          title={hasFilters ? "No encontramos productos" : "Todavía no hay productos"}
        />
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <ProductGrid
            products={products}
            favorites={favorites}
            onAddToCart={handleAddToCart}
            onToggleFavorite={handleToggleFavorite}
          />
          <button onClick={() => void loadMore()} disabled={loadingMore || !hasMore}>
            {loadingMore ? "Cargando…" : hasMore ? "Cargar más" : "No hay más productos"}
          </button>
        </>
      )}
    </div>
  );
}

export default ProductsPage;