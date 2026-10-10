import type { Product } from "../../types/product.types";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 16,
      }}
    >
      {products.map((p) => (
        <article key={p.id}>
          {p.imageUrl && <img src={p.imageUrl} alt={p.name} />}
          <h3>{p.name}</h3>
          <p>${p.price}</p>
        </article>
      ))}
    </div>
  );
}

export default ProductGrid;