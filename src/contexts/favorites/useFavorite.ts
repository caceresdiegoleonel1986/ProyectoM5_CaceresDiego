import { useContext } from "react";
import { FavoriteContext } from "./FavoriteContext";

export function useFavorite() {
  const ctx = useContext(FavoriteContext);
  if (!ctx) throw new Error("useFavorite debe usarse dentro de FavoriteProvider");
  return ctx;
}