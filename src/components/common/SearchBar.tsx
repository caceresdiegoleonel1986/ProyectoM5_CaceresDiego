import { useState, useEffect } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import { categories } from "../../../scripts/seedData";

interface SearchBarProps {
  onSearch: (term: string, category: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");

  const debouncedSearch = useDebounce(searchTerm, 400);

  useEffect(() => {
    onSearch(debouncedSearch, category);
  }, [debouncedSearch, category, onSearch]);

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <input
        type="text"
        placeholder="Buscar productos..."
        aria-label="Buscar productos"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border px-4 py-2 rounded-md flex-1"
      />
      <select
        aria-label="Filtrar por categoría"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="border px-4 py-2 rounded-md"
      >
        <option value="">Todas las categorías</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}