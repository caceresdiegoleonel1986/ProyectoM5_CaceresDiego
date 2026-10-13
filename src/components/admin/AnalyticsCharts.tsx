import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RevenuePoint, TopProduct } from "../../contexts/admin/analytics";

type Props = { revenueByDay: RevenuePoint[]; topProducts: TopProduct[] };

export default function AnalyticsCharts({ revenueByDay, topProducts }: Props) {
  if (revenueByDay.length === 0) {
    return <p role="status">Aún no hay ventas para graficar.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <figure aria-label="Ingresos por día">
        <figcaption className="mb-2 font-semibold">Ingresos por día</figcaption>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={revenueByDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" name="Ingresos" stroke="var(--primary, #b91c1c)" />
          </LineChart>
        </ResponsiveContainer>
      </figure>
      <figure aria-label="Productos más vendidos">
        <figcaption className="mb-2 font-semibold">Productos más vendidos</figcaption>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={topProducts} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={120} />
            <Tooltip />
            <Bar dataKey="quantity" name="Unidades" fill="var(--primary, #b91c1c)" />
          </BarChart>
        </ResponsiveContainer>
      </figure>
    </div>
  );
}
