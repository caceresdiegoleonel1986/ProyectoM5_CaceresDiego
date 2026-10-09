import { createContext } from "react";
import type { OrderContextType } from "./OrderContext.types";

export const OrderContext = createContext<OrderContextType | undefined>(undefined);