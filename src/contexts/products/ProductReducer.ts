import type { ProductState, ProductAction } from "./ProductContext.types";

export function productReducer(state: ProductState, action: ProductAction): ProductState {
  switch (action.type) {
    case "SET_PRODUCTS":
      return { ...state, products: action.payload, loading: false, error: null };

    case "ADD_PRODUCT":
      return { ...state, products: [...state.products, action.payload] };

    case "REMOVE_PRODUCT":
      return { ...state, products: state.products.filter(p => p.id !== action.payload) };

    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.id ? action.payload : p
        ),
      };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "SET_LAST_DOC":
      return { ...state, lastDoc: action.payload };

    case "SET_HAS_MORE":
      return { ...state, hasMore: action.payload };

    case "SET_LOADING_MORE":
      return { ...state, loadingMore: action.payload };

    default:
      return state;
  }
}