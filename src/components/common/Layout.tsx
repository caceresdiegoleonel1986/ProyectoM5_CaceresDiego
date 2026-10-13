import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  // El panel admin trae su propio layout.
  if (pathname.startsWith("/admin")) return <>{children}</>;

  return (
    <div className="app-layout">
      <Header />
      <main className="app-main">{children}</main>
      <Footer />
    </div>
  );
}

export default Layout;