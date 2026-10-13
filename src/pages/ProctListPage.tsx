import { useProducts } from "../contexts/products/useProductsRealtime";
import { LoadingState, ErrorState, EmptyState } from "../components/states";
import { ProductCard } from "../components/common/ProductCard";
import type { Product } from "../types/product.types";

export function ProductListPage() {
  const { products, loading, error, fetchProducts } = useProducts();

  const handleAdd = (id: string) => {
    console.log("Add product to cart:", id);
  };

  if (loading) return <LoadingState message="Cargando productos..." />;
  if (error) return <ErrorState message="No se pudieron cargar los productos." onRetry={() => fetchProducts({})} />;
  if (products.length === 0) return <EmptyState title="No hay productos aún" description="Probá con otra categoría." />;

  return (
    <ul>
      {products.map((product: Product) => (
        <ProductCard
          key={product.id}
          layout="grid"
          product={product}
          onAddToCart={handleAdd}
          showPrice={true}
        />
      ))}
    </ul>
  );
}

export default ProductListPage;