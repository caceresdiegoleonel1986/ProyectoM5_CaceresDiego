import { createContext } from "react";
import type{ CartContextType } from "./CartContext.types";

export const CartContext = createContext<CartContextType | undefined>(undefined,
);