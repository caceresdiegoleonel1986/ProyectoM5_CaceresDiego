import type React from "react";
import type { Product } from "../../types/product.types";
import { Button } from "../ui/Button";

type GridProps = {
  layout: "grid";
  product: Product;
  onAddToCart: (productId: string) => void;
  showPrice?: boolean;
};

type ListProps = {
  layout: "list";
  product: Product;
  onAddToCart: (productId: string) => void;
  showDescription?: boolean;
};

type ProductCardProps = GridProps | ListProps;

export const ProductCard: React.FC<ProductCardProps> = (props) => {
  const { product, onAddToCart } = props;

  return (
    <div className={`card-${props.layout}`}>
      {product.imageUrl && <img src={product.imageUrl} alt={product.name} />}
      <h3>{product.name}</h3>

      {props.layout === "grid" && props.showPrice && <p className="card-price">${product.price}</p>}

      {product.ratingCount !== undefined && product.ratingCount > 0 ? (
        <p aria-label={`Calificación ${product.rating ?? 0} de 5, ${product.ratingCount} reseñas`}>
          ★ {product.rating?.toFixed(1) ?? "0.0"} ({product.ratingCount})
        </p>
      ) : (
        props.layout === "grid" && <p aria-hidden="true">&nbsp;</p>
      )}

      {props.layout === "list" && props.showDescription && <p>{product.description}</p>}

      <Button
        variant="solid"
        disabled={product.stock <= 0}
        onClick={() => onAddToCart(product.id)}
      >
        {product.stock > 0 ? "Agregar al carrito" : "Agotado"}
      </Button>
    </div>
  );
};

export default ProductCard;