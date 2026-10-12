export interface FavoriteItem {
  id: string;
  name: string;
  image: string;
  price: number;
}

export type FavoritesState = {
  favorites: string[];
};

export type FavoritesAction =
  | { type: "ADD_FAVORITE"; payload: string }
  | { type: "REMOVE_FAVORITE"; payload: string }
  | { type: "CLEAR_FAVORITES" };