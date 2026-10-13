import { useState, useRef, useEffect, useCallback } from "react";
import SearchBar from "./SearchBar";
import { useProducts } from "../../contexts/products/useProduct";
import { useFavorite } from "../../contexts/favorites/useFavorite"; // hook de favoritos

export default function ProductList() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const { products, loading, error, lastDoc, hasMore, fetchProducts } = useProducts();
  const { favorites, addFavorite, removeFavorite } = useFavorite();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // carga inicial
  useEffect(() => {
    fetchProducts({ pageSize: 20 });
  }, [fetchProducts]);

  // búsqueda y filtros
  useEffect(() => {
    fetchProducts({ searchPrefix: search || undefined, categoryId: category || undefined, pageSize: 20 });
  }, [search, category, fetchProducts]);

  // scroll infinito
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loading) {
        fetchProducts({ searchPrefix: search || undefined, categoryId: category || undefined, cursor: lastDoc, pageSize: 20 });
      }
    },
    [hasMore, loading, lastDoc, search, category, fetchProducts]
  );

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "200px",
      threshold: 0.1,
    });

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [handleObserver]);

  if (loading && products.length === 0) return <p>Cargando productos...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🛍️ Productos Kairo</h1>

      <SearchBar onSearch={(term, cat) => { setSearch(term); setCategory(cat); }} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => {
          const isFavorite = favorites.includes(product.id);

          return (
            <div key={product.id} className="border rounded-lg shadow-md p-4 flex flex-col items-center bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold">{product.name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{product.description}</p>
              <p className="text-red-600 font-bold mb-1">${product.price}</p>
              <p className="text-sm text-gray-500">Stock disponible: {product.stock}</p>

              {/* Botones de acción */}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => (isFavorite ? removeFavorite(product.id) : addFavorite(product.id))}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    isFavorite ? "bg-yellow-600 text-white" : "bg-yellow-500 text-white hover:bg-yellow-600"
                  }`}
                >
                  {isFavorite ? "⭐ En favoritos" : "☆ Favorito"}
                </button>
                <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary transition-colors">
                  🛒 Añadir al carrito
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div ref={sentinelRef} className="h-10"></div>

      {loading && <p className="text-center mt-4 text-gray-600">Cargando más productos...</p>}
    </div>
  );
}