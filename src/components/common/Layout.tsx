import Header from "./Header";
import Footer from "./Footer";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header fijo arriba */}
      <Header />

      {/* Contenido dinámico */}
      <main className="flex-1 px-6 py-4">
        {children}
      </main>

      {/* Footer adaptativo */}
      <Footer />
    </div>
  );
}

export default Layout;