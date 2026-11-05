import { describe, expect, it } from "vitest";
import { formatPrice } from "../src/utils/formatPrice";
import { matchesSearch } from "../src/utils/matchesSearch";

describe("formatPrice", () => {
  it.each([
    [13589.44, "$13.589,44"],
    [20354.5, "$20.354,50"],
    [52113, "$52.113,00"],
    [50, "$50,00"],
    [0, "$0,00"],
    [1234567.891, "$1.234.567,89"],
  ])("%d se muestra como %s", (amount, expected) => {
    expect(formatPrice(amount)).toBe(expected);
  });
});

describe("matchesSearch", () => {
  it.each([
    ["Adidas Stan Smith", "stan"],
    ["Adidas Stan Smith", "adidas st"],
    ["Adidas Stan Smith", "smith adidas"],
    ["Adidas Stan Smith", "STAN"],
    ["Mochila Levi's", "levis"],
    ["Campera Térmica", "termica"],
    ["Campera Termica", "térmica"],
  ])("%s coincide con %s", (name, search) => {
    expect(matchesSearch(name, search)).toBe(true);
  });

  it.each([
    ["Adidas Stan Smith", "nike"],
    ["Adidas Stan Smith", "stan nike"],
  ])("%s no coincide con %s", (name, search) => {
    expect(matchesSearch(name, search)).toBe(false);
  });
});
