import { useEffect, useState } from "react";
import { useProducts } from "../contexts/products/useProduct";
import { useDebounce } from "../hooks/useDebounce";
import { ProductGrid } from "../components/ui/ProductGrid";
import { LoadingState, EmptyState, ErrorState } from "../components/states/index";

const CATEGORIES = [
  { id: "", label: "Todas" },
  { id: "shoes", label: "Zapatillas" },
  { id: "clothing", label: "Ropa" },
];

export function ProductsPage() {
  const { products, loading, error, hasMore, loadingMore, loadFirstPage, loadMore } = useProducts();
  const [searchText, setSearchText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const debouncedSearch = useDebounce(searchText, 400);
  const searchPrefix = debouncedSearch.trim().toLowerCase();

  useEffect(() => {
    loadFirstPage({
      categoryId: categoryId || null,
      searchPrefix: searchPrefix.length >= 2 ? searchPrefix : undefined,
    });
  }, [categoryId, searchPrefix, loadFirstPage]);

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
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      {loading && <LoadingState />}

      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={() => loadFirstPage({
            categoryId: categoryId || null,
            searchPrefix: searchPrefix.length >= 2 ? searchPrefix : undefined,
          })}
        />
      )}

      {!loading && !error && products.length === 0 && (
        <EmptyState variant={hasFilters ? "no-results" : "no-products"} />
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <ProductGrid products={products} />
          <button onClick={loadMore} disabled={loadingMore || !hasMore}>
            {loadingMore ? "Cargando…" : hasMore ? "Cargar más" : "No hay más productos"}
          </button>
        </>
      )}
    </div>
  );
}

export default ProductsPage;