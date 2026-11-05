import { createContext } from "react";

interface FavoriteContextType {
  favorites: string[];
  totalFavorites: number;
  /** Se están cargando los favoritos de la cuenta. */
  syncing: boolean;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
}

export const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);
