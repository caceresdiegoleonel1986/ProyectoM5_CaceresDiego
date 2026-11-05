import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminDashboard from "../src/pages/AdminDashboard";

const admin = vi.hoisted(() => ({
  fetchProducts: vi.fn(),
  fetchOrders: vi.fn(),
  fetchAnalytics: vi.fn(),
  updateOrderStatus: vi.fn(),
}));

const order = {
  id: "o1",
  customerName: "Ana",
  userEmail: "ana@test.com",
  total: 100,
  status: "pending",
};

vi.mock("../src/contexts/admin/useAdminProducts", () => ({
  useAdminProducts: () => ({
    products: [],
    lastDoc: null,
    hasMore: false,
    fetchProducts: admin.fetchProducts,
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  }),
}));
vi.mock("../src/contexts/admin/useAdminOrders", () => ({
  useAdminOrders: () => ({
    orders: [order],
    analytics: {
      productCount: 0,
      orderCount: 1,
      completedOrderCount: 0,
      completedRevenue: 0,
      revenueByDay: [],
      topProducts: [],
    },
    fetchOrders: admin.fetchOrders,
    fetchAnalytics: admin.fetchAnalytics,
    updateOrderStatus: admin.updateOrderStatus,
  }),
}));
vi.mock("../src/services/uploadService", () => ({ uploadFileSecurely: vi.fn() }));
vi.mock("../src/components/admin/AnalyticsCharts", () => ({ default: () => null }));

async function changeStatus(buttonName: string, confirmName: string) {
  render(<AdminDashboard />);
  await waitFor(() => expect(admin.fetchAnalytics).toHaveBeenCalledTimes(1));

  fireEvent.click(screen.getByRole("button", { name: buttonName }));
  fireEvent.click(screen.getByRole("button", { name: confirmName }));
}

describe("AdminDashboard: cambio de estado de una orden", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    admin.fetchProducts.mockResolvedValue(undefined);
    admin.fetchOrders.mockResolvedValue(undefined);
    admin.fetchAnalytics.mockResolvedValue(undefined);
    admin.updateOrderStatus.mockResolvedValue(undefined);
  });

  afterEach(() => cleanup());

  it("recarga las métricas después de cambiar el estado", async () => {
    await changeStatus("En proceso", "Pasar a en proceso");

    await waitFor(() => expect(admin.fetchAnalytics).toHaveBeenCalledTimes(2));
    expect(admin.updateOrderStatus).toHaveBeenCalledWith("o1", "processing");
    expect(admin.fetchProducts).toHaveBeenCalledTimes(1);
  });

  it("al cancelar recarga las métricas y los productos", async () => {
    await changeStatus("Cancelar", "Cancelar orden");

    await waitFor(() => expect(admin.fetchAnalytics).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(admin.fetchProducts).toHaveBeenCalledTimes(2));
  });

  it("no recarga las métricas si el cambio falla", async () => {
    admin.updateOrderStatus.mockRejectedValue(new Error("La orden ya está cancelada."));

    await changeStatus("En proceso", "Pasar a en proceso");

    expect((await screen.findByRole("alert")).textContent).toBe("La orden ya está cancelada.");
    expect(admin.fetchAnalytics).toHaveBeenCalledTimes(1);
  });

  it("avisa si no se pueden recargar las métricas", async () => {
    admin.fetchAnalytics.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("Sin conexión"));

    await changeStatus("En proceso", "Pasar a en proceso");

    expect((await screen.findByRole("alert")).textContent).toBe("Sin conexión");
    expect(admin.updateOrderStatus).toHaveBeenCalledTimes(1);
  });
});
