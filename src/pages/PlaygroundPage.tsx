import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/product/ProductCard';
import { LoadingState, EmptyState, ErrorState } from '../components/states';
import { Modal } from '../components/ui/Modal';
import type { Product } from '../types/product.types';

const mockProduct: Product = {
  id: 'p1',
  name: 'Zapatillas Runner Pro',
  nameLower: 'zapatillas runner pro',
  price: 120,
  stock: 15,
  categoryId: 'zapatillas',
  description: 'Zapatillas ergonómicas para correr',
  imageUrl: '/runner.jpg',
  createdAt: new Date(),
};

export const PlaygroundPage = () => {
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('success');
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <h1>Playground</h1>

      <section>
        <h2>Buttons</h2>
        <Button variant="solid" onClick={() => console.log('Comprar')} loading>
          Comprar
        </Button>
        <Button variant="link" href="/" target="_self">
          Ver más
        </Button>
      </section>

      <section>
        <h2>ProductCard</h2>
        <button onClick={() => setLayout(layout === 'grid' ? 'list' : 'grid')}>
          Toggle Layout
        </button>
        <ProductCard
          layout={layout}
          product={mockProduct}
          onAddToCart={(id) => console.log('add', id)}
          showPrice={layout === 'grid'}
          showDescription={layout === 'list'}
        />
      </section>

      <section>
        <h2>States</h2>
        {status === 'loading' && <LoadingState />}
        {status === 'error' && <ErrorState message="Falló la carga" onRetry={() => setStatus('success')} />}
        {status === 'success' && (
          <EmptyState
            title="No hay productos"
            description="Agregá tu primer producto"
            actionLabel="Agregar"
            onAction={() => console.log('CTA')}
          />
        )}
      </section>

      <section>
        <h2>Modal</h2>
        <Button variant="solid" onClick={() => setModalOpen(true)}>
          Abrir modal
        </Button>
        <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Demo Modal">
          <p>Contenido dentro del modal</p>
        </Modal>
      </section>
    </div>
  );
};

export default PlaygroundPage;