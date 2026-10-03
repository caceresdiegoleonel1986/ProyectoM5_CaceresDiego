import { useState, useEffect } from "react";

export interface Product {
  id: string;
  name: string;
  image: string;
  description: string;
  price: number;
  stock: number;
}

const products: Product[] = [
  {
    id: "p1",
    name: "Zapatillas Runner Pro",
    image: "https://via.placeholder.com/200x150?text=Runner+Pro",
    description: "Zapatillas deportivas con suela ergonómica y diseño moderno.",
    price: 12000,
    stock: 15,
  },
  {
    id: "p2",
    name: "Mochila Ergonómica",
    image: "https://via.placeholder.com/200x150?text=Mochila",
    description: "Mochila resistente al agua con compartimentos múltiples.",
    price: 8500,
    stock: 30,
  },
  {
    id: "p3",
    name: "Auriculares ANC",
    image: "https://via.placeholder.com/200x150?text=Auriculares+ANC",
    description: "Auriculares con cancelación activa de ruido y sonido premium.",
    price: 15000,
    stock: 20,
  },
  {
    id: "p4",
    name: "Smartwatch Fit",
    image: "https://via.placeholder.com/200x150?text=Smartwatch",
    description: "Reloj inteligente con monitoreo de salud y notificaciones.",
    price: 18000,
    stock: 10,
  },
  {
    id: "p5",
    name: "Campera Kairo",
    image: "https://via.placeholder.com/200x150?text=Campera+Kairo",
    description: "Campera liviana, ideal para climas fríos y estilo urbano.",
    price: 22000,
    stock: 8,
  },
];

export default function ProductList() {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Al montar el componente, cargamos favoritos desde localStorage
  useEffect(() => {
    // Usamos una función para evitar el warning
    const loadFavorites = () => {
      const storedFavorites = localStorage.getItem("favorites");
      if (storedFavorites) {
        try {
          setFavorites(JSON.parse(storedFavorites));
        } catch (error) {
          console.error("Error parseando favoritos:", error);
        }
      }
    };

    loadFavorites();
  }, []);

  // Cada vez que cambie favorites, lo guardamos en localStorage
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

    const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🛍️ Productos Kairo</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => {
          const isFavorite = favorites.includes(product.id);

          return (
            <div
              key={product.id}
              className="border rounded-lg shadow-md p-4 flex flex-col items-center bg-white dark:bg-gray-800"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-40 object-cover rounded-md mb-4"
              />
              <h2 className="text-lg font-semibold">{product.name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {product.description}
              </p>
              <p className="text-red-600 font-bold mb-1">
                ${product.price.toLocaleString("es-AR")}
              </p>
              <p className="text-sm text-gray-500">
                Stock disponible: {product.stock}
              </p>

              {/* Botones de acción */}
              <div className="mt-3 flex gap-2">
                <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary transition-colors">
                  Añadir al carrito
                </button>
                <button
                  onClick={() => toggleFavorite(product.id)}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    isFavorite
                      ? "bg-yellow-600 text-white"
                      : "bg-yellow-500 text-white hover:bg-yellow-600"
                  }`}
                >
                  {isFavorite ? "⭐ En favoritos" : "☆ Favorito"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}