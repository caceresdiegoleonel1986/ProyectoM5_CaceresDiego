import type { SimulatedPayment } from "../types/order.types";

export type CardDetails = { number: string; expiry: string; cvc: string };

const DECLINED_TEST_CARD = "4000000000000002";

/** Simula un cobro: valida el formato y rechaza la tarjeta de prueba 4000 0000 0000 0002. */
export async function simulatePayment(card: CardDetails, delayMs = 700): Promise<SimulatedPayment> {
  const digits = card.number.replace(/\s+/g, "");
  if (!/^\d{16}$/.test(digits)) throw new Error("El número de tarjeta debe tener 16 dígitos.");
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) throw new Error("La fecha de vencimiento debe tener formato MM/AA.");
  if (!/^\d{3,4}$/.test(card.cvc)) throw new Error("El código de seguridad no es válido.");

  await new Promise((resolve) => setTimeout(resolve, delayMs));
  if (digits === DECLINED_TEST_CARD) throw new Error("Pago rechazado por el emisor (simulación).");

  return { method: "simulated-card", cardLast4: digits.slice(-4) };
}
