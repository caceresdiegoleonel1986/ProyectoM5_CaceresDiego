import type { FavoritesState, FavoritesAction } from "./FavoriteContext.types";

export function favoriteReducer(state: FavoritesState, action: FavoritesAction): FavoritesState {
  switch (action.type) {
    case "ADD_FAVORITE":
      if (state.favorites.includes(action.payload)) return state;
      return { favorites: [...state.favorites, action.payload] };

    case "REMOVE_FAVORITE":
      return { favorites: state.favorites.filter((id) => id !== action.payload) };

    case "CLEAR_FAVORITES":
      return { favorites: [] };

    default:
      return state;
  }
}