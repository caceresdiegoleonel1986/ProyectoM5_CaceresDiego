import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { useAdminProducts } from "../contexts/admin/useAdminProducts";
import { useAdminOrders } from "../contexts/admin/useAdminOrders";
import { uploadFileSecurely } from "../services/uploadService";
import type { CategoryId, Product } from "../types/product.types";
import type { OrderStatus } from "../types/order.types";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "../types/order.types";
import Spinner from "../components/ui/Spinner";
import ConfirmActionButton from "../components/common/ConfirmActionButton";

const AnalyticsCharts = lazy(() => import("../components/admin/AnalyticsCharts"));

const categories: { id: CategoryId; label: string }[] = [
  { id: "zapatillas", label: "Zapatillas" },
  { id: "mochilas", label: "Mochilas" },
  { id: "auriculares", label: "Auriculares" },
  { id: "smartwatches", label: "Smartwatches" },
  { id: "camperas", label: "Camperas" },
];

type ProductForm = {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryId: CategoryId;
};

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
  categoryId: "zapatillas",
};

export default function AdminDashboard() {
  const { products, lastDoc, hasMore, fetchProducts, createProduct, updateProduct, deleteProduct } = useAdminProducts();
  const { orders, analytics, fetchOrders, fetchAnalytics, updateOrderStatus } = useAdminOrders();
  const productFormRef = useRef<HTMLElement>(null);
  const productNameInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [productCategoryFilter, setProductCategoryFilter] = useState<CategoryId | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchProducts(productCategoryFilter ? { categoryId: productCategoryFilter } : {})
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "No se pudieron cargar los productos."));
  }, [fetchProducts, productCategoryFilter]);

  useEffect(() => {
    void fetchOrders(statusFilter || undefined)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "No se pudieron cargar las órdenes."));
  }, [fetchOrders, statusFilter]);

  useEffect(() => {
    void fetchAnalytics()
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "No se pudieron cargar las métricas."));
  }, [fetchAnalytics]);
  const visibleOrders = orders;

  const handleDeleteProduct = async (productId: string) => {
    setError(null);
    try {
      await deleteProduct(productId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo eliminar el producto.");
    }
  };

  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      categoryId: product.categoryId,
    });
    setImage(null);
    productFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    productNameInputRef.current?.focus({ preventScroll: true });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setImage(null);
  };

  const handleProductSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) {
      setError("El precio debe ser mayor a cero y el stock un entero no negativo.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const imageUrl = image ? await uploadFileSecurely(image) : undefined;
      const data: Omit<Product, "id"> = {
        name: form.name.trim(),
        nameLower: form.name.trim().toLowerCase(),
        description: form.description.trim(),
        price,
        stock,
        categoryId: form.categoryId,
        createdAt: new Date(),
        ...(imageUrl ? { imageUrl } : {}),
      };

      if (editingId) {
        await updateProduct(editingId, {
          name: data.name,
          nameLower: data.nameLower,
          description: data.description,
          price: data.price,
          stock: data.stock,
          categoryId: data.categoryId,
          ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}),
        });
      } else {
        await createProduct(data);
      }
      resetForm();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el producto.");
    } finally {
      setBusy(false);
    }
  };

  const changeOrderStatus = async (orderId: string, status: OrderStatus) => {
    setError(null);
    try {
      await updateOrderStatus(orderId, status);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar la orden.");
    }
  };

  return (
    <div className="admin-page">
      <h1>Administración</h1>
      {error && <p className="admin-alert" role="alert">{error}</p>}

      <section id="analiticas" aria-label="Analíticas" className="admin-stats">
        <p className="admin-stat">Productos <strong>{analytics.productCount}</strong></p>
        <p className="admin-stat">Órdenes <strong>{analytics.orderCount}</strong></p>
        <p className="admin-stat">Órdenes completadas <strong>{analytics.completedOrderCount}</strong></p>
        <p className="admin-stat admin-stat--accent">Ingresos completados <strong>${analytics.completedRevenue.toFixed(2)}</strong></p>
      </section>

      <section aria-label="Gráficos de ventas">
        <Suspense fallback={<Spinner size="sm" />}>
          <AnalyticsCharts revenueByDay={analytics.revenueByDay} topProducts={analytics.topProducts} />
        </Suspense>
      </section>

      <section ref={productFormRef} className="admin-card admin-product-form">
        <h2>{editingId ? "Editar producto" : "Nuevo producto"}</h2>
        <form className="admin-form" onSubmit={(event) => void handleProductSubmit(event)}>
          <label>Nombre
            <input ref={productNameInputRef} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>Categoría
            <select value={form.categoryId} onChange={(event) => {
              const selected = categories.find((category) => category.id === event.target.value);
              if (selected) setForm({ ...form, categoryId: selected.id });
            }}>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
            </select>
          </label>
          <label>Descripción
            <input required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <label>Imagen
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setImage(event.target.files?.[0] ?? null)} />
          </label>
          <label>Precio
            <input type="number" min="0.01" step="0.01" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
          </label>
          <label>Stock
            <input type="number" min="0" step="1" required value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} />
          </label>
          <div className="admin-form__actions">
            <button className="button button--primary" type="submit" disabled={busy}>
              {busy ? <><Spinner size="sm" /> Guardando…</> : editingId ? "Guardar cambios" : "Crear producto"}
            </button>
            {editingId && <button type="button" className="button button--quiet" onClick={resetForm}>Cancelar edición</button>}
          </div>
        </form>
      </section>

      <section id="productos" className="admin-card">
        <div className="admin-card__head">
          <h2>Productos</h2>
          <label className="admin-filter">Filtrar por categoría
            <select value={productCategoryFilter} onChange={(event) => {
              const selected = categories.find((category) => category.id === event.target.value);
              setProductCategoryFilter(selected?.id ?? "");
            }}>
              <option value="">Todas</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
            </select>
          </label>
        </div>
        <ul className="admin-list">
          {products.map((product) => (
            <li className="admin-list__item" key={product.id}>
              <span>{product.name} · ${product.price} · Stock {product.stock}</span>
              <span className="admin-list__actions">
                <button type="button" className="button button--quiet button--compact" onClick={() => startEditing(product)}>Editar</button>
                <ConfirmActionButton
                  className="button button--danger button--compact"
                  title={`¿Eliminar ${product.name}?`}
                  description="El producto dejará de aparecer en el catálogo. Esta acción no se puede deshacer desde el panel."
                  confirmLabel="Eliminar producto"
                  onConfirm={() => handleDeleteProduct(product.id)}
                >
                  Eliminar
                </ConfirmActionButton>
              </span>
            </li>
          ))}
        </ul>
        {hasMore && (
          <button
            type="button"
            className="button button--quiet"
            onClick={() => void fetchProducts({
              categoryId: productCategoryFilter || undefined,
              cursor: lastDoc,
            }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "No se pudo cargar más productos."))}
          >
            Cargar más productos
          </button>
        )}
      </section>

      <section id="ordenes" className="admin-card">
        <div className="admin-card__head">
          <h2>Últimas 100 órdenes</h2>
          <label className="admin-filter">Estado
            <select value={statusFilter} onChange={(event) => {
              const selected = ORDER_STATUSES.find((status) => status === event.target.value);
              setStatusFilter(selected ?? "");
            }}>
              <option value="">Todos</option>
              {ORDER_STATUSES.map((status) => <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>)}
            </select>
          </label>
        </div>
        <ul className="admin-list">
          {visibleOrders.map((order) => (
            <li className="admin-list__item" key={order.id}>
              <span>{order.customerName || order.userEmail} · ${order.total.toFixed(2)} · <span className={`status-badge status-badge--${order.status}`}>{ORDER_STATUS_LABELS[order.status]}</span></span>
              <span className="admin-list__actions">
                {order.status === "pending" && (
                  <ConfirmActionButton
                    className="button button--primary button--compact"
                    title="¿Pasar esta orden a en proceso?"
                    description="Indica que la orden está siendo preparada."
                    confirmLabel="Pasar a en proceso"
                    confirmClassName="button--primary"
                    onConfirm={() => changeOrderStatus(order.id, "processing")}
                  >
                    En proceso
                  </ConfirmActionButton>
                )}
                {order.status === "processing" && (
                  <ConfirmActionButton
                    className="button button--primary button--compact"
                    title="¿Marcar esta orden como completada?"
                    description="Indica que la orden fue entregada."
                    confirmLabel="Marcar completada"
                    confirmClassName="button--primary"
                    onConfirm={() => changeOrderStatus(order.id, "completed")}
                  >
                    Completar
                  </ConfirmActionButton>
                )}
                {order.status !== "cancelled" && order.status !== "completed" && (
                  <ConfirmActionButton
                    className="button button--danger button--compact"
                    title="¿Cancelar esta orden?"
                    description="La orden pasará a cancelada. El inventario descontado al crearla no se restaura automáticamente."
                    confirmLabel="Cancelar orden"
                    onConfirm={() => changeOrderStatus(order.id, "cancelled")}
                  >
                    Cancelar
                  </ConfirmActionButton>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}