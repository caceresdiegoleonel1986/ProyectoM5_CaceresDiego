import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RevenuePoint, TopProduct } from "../../contexts/admin/analytics";

type Props = { revenueByDay: RevenuePoint[]; topProducts: TopProduct[] };

export default function AnalyticsCharts({ revenueByDay, topProducts }: Props) {
  if (revenueByDay.length === 0) {
    return <p role="status" className="admin-card">Aún no hay ventas para graficar.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <figure aria-label="Ingresos por día" className="admin-card admin-chart">
        <figcaption>Ingresos por día</figcaption>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={revenueByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" name="Ingresos" stroke="var(--primary)" strokeWidth={2.5} />
          </LineChart>
        </ResponsiveContainer>
      </figure>
      <figure aria-label="Productos más vendidos" className="admin-card admin-chart">
        <figcaption>Productos más vendidos</figcaption>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={topProducts} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={120} />
            <Tooltip />
            <Bar dataKey="quantity" name="Unidades" fill="var(--primary)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </figure>
    </div>
  );
}
