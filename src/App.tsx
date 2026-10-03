import type { JSX } from "react";
import Header from "./components/common/Header";
import ProductList from "./components/common/ProductList";

function App(): JSX.Element {
  return (
    <div style={{ padding: "2rem" }}>
      <Header />
      <ProductList />
      </div>
  );
}

  export default App;