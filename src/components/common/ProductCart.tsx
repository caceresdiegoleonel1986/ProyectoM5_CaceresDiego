import type React from "react";
import type { Product } from "../../types/product.types";
import { Button } from "../ui/Button";

// 🔑 Definición de props con discriminated union
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

  if (props.layout === "grid") {
    return (
      <div className="border rounded-lg shadow-md p-4 flex flex-col items-center bg-white dark:bg-gray-800">
        {product.imageUrl && (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-40 object-cover rounded-md mb-4"
          />
        )}
        <h3 className="text-lg font-semibold">{product.name}</h3>
        {props.showPrice && (
          <p className="text-red-600 font-bold mb-2">${product.price}</p>
        )}
        <Button variant="solid" onClick={() => onAddToCart(product.id)}>
          Agregar
        </Button>
      </div>
    );
  }

  if (props.layout === "list") {
    return (
      <div className="flex items-center justify-between border-b py-2">
        <div>
          <h3 className="text-lg font-semibold">{product.name}</h3>
          {props.showDescription && (
            <p className="text-sm text-gray-600">{product.description}</p>
          )}
        </div>
        <Button variant="solid" onClick={() => onAddToCart(product.id)}>
          Agregar
        </Button>
      </div>
    );
  }

  return null;
};

export default ProductCard;