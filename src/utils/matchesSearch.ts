function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ']/g, "");
}

/** Indica si el nombre contiene todas las palabras buscadas, en cualquier orden y sin distinguir acentos. */
export function matchesSearch(name: string, search: string): boolean {
  const normalizedName = normalize(name);
  return normalize(search)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => normalizedName.includes(word));
}
