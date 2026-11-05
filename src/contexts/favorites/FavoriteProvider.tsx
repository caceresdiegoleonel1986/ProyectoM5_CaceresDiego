import { useCallback, useEffect, useReducer } from "react";
import { FavoriteContext } from "./FavoriteContext";
import { favoriteReducer } from "./FavoriteReducer";
import type { FavoritesState } from "./FavoriteContext.types";
import { useAccountSync } from "../../hooks/useAccountSync";
import { loadFavorites, saveFavorites } from "../../services/userDataService";

function loadGuestFavorites(): FavoritesState {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem("favorites") ?? "null");
    if (!Array.isArray(parsed)) return { favorites: [] };
    return { favorites: [...new Set(parsed.filter((id): id is string => typeof id === "string"))] };
  } catch {
    return { favorites: [] };
  }
}

async function loadAccountFavorites(userId: string) {
  const productIds = await loadFavorites(userId);
  return { data: productIds, saved: productIds };
}

export function FavoriteProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(favoriteReducer, undefined, loadGuestFavorites);
  const onLoaded = useCallback((productIds: string[]) => dispatch({ type: "MERGE_FAVORITES", payload: productIds }), []);
  const onLogout = useCallback(() => dispatch({ type: "CLEAR_FAVORITES" }), []);
  const { syncing, persistLocally } = useAccountSync({
    value: state.favorites,
    guestKey: "favorites",
    load: loadAccountFavorites,
    save: saveFavorites,
    onLoaded,
    onLogout,
  });

  useEffect(() => {
    if (persistLocally) localStorage.setItem("favorites", JSON.stringify(state.favorites));
  }, [state.favorites, persistLocally]);

  const addFavorite = (id: string) => dispatch({ type: "ADD_FAVORITE", payload: id });
  const removeFavorite = (id: string) => dispatch({ type: "REMOVE_FAVORITE", payload: id });
  const clearFavorites = () => dispatch({ type: "CLEAR_FAVORITES" });

  return (
    <FavoriteContext.Provider
      value={{
        favorites: state.favorites,
        totalFavorites: state.favorites.length,
        syncing,
        addFavorite,
        removeFavorite,
        clearFavorites,
      }}
    >
      {children}
    </FavoriteContext.Provider>
  );
}
