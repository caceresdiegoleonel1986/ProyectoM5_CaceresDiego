import { createContext } from "react";

interface FavoriteContextType {
  favorites: string[];
  totalFavorites: number;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
}

export const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);
