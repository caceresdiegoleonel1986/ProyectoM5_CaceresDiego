import type { Order } from "../../types/order.types";

export type RevenuePoint = { date: string; revenue: number };
export type TopProduct = { name: string; quantity: number };

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Agrega ingresos diarios y productos más vendidos; las órdenes canceladas no cuentan. */
export function buildSalesCharts(orders: Order[], topLimit = 5): {
  revenueByDay: RevenuePoint[];
  topProducts: TopProduct[];
} {
  const revenue = new Map<string, number>();
  const quantities = new Map<string, number>();

  for (const order of orders) {
    if (order.status === "cancelled") continue;
    const key = dayKey(order.createdAt);
    revenue.set(key, (revenue.get(key) ?? 0) + order.total);
    for (const item of order.items) {
      quantities.set(item.name, (quantities.get(item.name) ?? 0) + item.quantity);
    }
  }

  return {
    revenueByDay: [...revenue.entries()]
      .map(([date, total]) => ({ date, revenue: Math.round(total * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    topProducts: [...quantities.entries()]
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name))
      .slice(0, topLimit),
  };
}
