const priceFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatea un importe con separador de miles y siempre dos decimales: 13589.4 → $13.589,40. */
export function formatPrice(amount: number): string {
  return `$${priceFormatter.format(amount)}`;
}
