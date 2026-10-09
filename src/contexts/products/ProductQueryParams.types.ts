import type { DocumentSnapshot } from "firebase/firestore";

export type ProductQueryParams = {
  categoryId?: string | null;
  searchPrefix?: string;
  pageSize?: number;
  cursor?: DocumentSnapshot | null;
};