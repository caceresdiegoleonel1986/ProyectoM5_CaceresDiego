import { createContext } from "react";
import type { ProductContextType } from "./ProductContext.types";

export const ProductContext = createContext<ProductContextType | undefined>(undefined);