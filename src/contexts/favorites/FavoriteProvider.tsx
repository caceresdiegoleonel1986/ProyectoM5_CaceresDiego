import { useReducer, useEffect } from "react";
import { FavoriteContext } from "./FavoriteContext";
import { favoriteReducer } from "./FavoriteReducer";
import type { FavoritesState } from "./FavoriteContext.types";

export function FavoriteProvider({ children }: { children: React.ReactNode }) {
  const initialState: FavoritesState = { favorites: [] };
  const [state, dispatch] = useReducer(favoriteReducer, initialState);

  // Cargar favoritos desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem("favorites");
    if (stored) {
      const parsed: string[] = JSON.parse(stored);
      parsed.forEach((id) => dispatch({ type: "ADD_FAVORITE", payload: id }));
    }
  }, []);

  // Guardar favoritos en localStorage
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(state.favorites));
  }, [state.favorites]);

  const addFavorite = (id: string) => dispatch({ type: "ADD_FAVORITE", payload: id });
  const removeFavorite = (id: string) => dispatch({ type: "REMOVE_FAVORITE", payload: id });
  const clearFavorites = () => dispatch({ type: "CLEAR_FAVORITES" });

  return (
    <FavoriteContext.Provider
      value={{
        favorites: state.favorites,
        totalFavorites: state.favorites.length,
        addFavorite,
        removeFavorite,
        clearFavorites,
      }}
    >
      {children}
    </FavoriteContext.Provider>
  );
}