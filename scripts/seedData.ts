import type { CategoryId } from "../src/types/product.types.ts";

export const categories: { id: CategoryId; name: string }[] = [
  { id: "zapatillas", name: "Zapatillas" },
  { id: "mochilas", name: "Mochilas" },
  { id: "auriculares", name: "Auriculares" },
  { id: "smartwatches", name: "Smartwatches" },
  { id: "camperas", name: "Camperas" },
];

export const CATALOG: Record<CategoryId, string[]> = {
  zapatillas: [
    "Nike Air Max", "Nike Pegasus", "Nike Revolution", "Nike Free Run",
    "Nike ZoomX", "Adidas Ultraboost", "Adidas Stan Smith", "Adidas NMD",
    "Puma RS-X", "Puma Suede", "Converse Chuck Taylor", "Converse Run Star",
    "Vans Old Skool", "Vans Sk8-Hi", "New Balance 990", "New Balance 327",
    "Reebok Classic", "Reebok Nano", "Asics Gel-Kayano", "Saucony Endorphin"
  ],
  mochilas: [
    "Mochila Nike", "Mochila Adidas", "Mochila Puma", "Mochila Reebok",
    "Mochila Vans", "Mochila Herschel", "Mochila Fjallraven", "Mochila JanSport",
    "Mochila Patagonia", "Mochila North Face", "Mochila Columbia", "Mochila Carhartt",
    "Mochila Uniqlo", "Mochila Champion", "Mochila Lululemon", "Mochila Tommy Hilfiger",
    "Mochila Ralph Lauren", "Mochila Calvin Klein", "Mochila Levi's", "Mochila Under Armour"
  ],
  auriculares: [
    "Sony WH-1000XM4", "Sony WF-1000XM5", "Bose QC35 II", "Bose 700",
    "JBL Tune 510BT", "JBL Live Pro", "Apple AirPods Pro", "Apple AirPods Max",
    "Samsung Galaxy Buds2", "Samsung Galaxy Buds Pro", "Beats Studio3", "Beats Fit Pro",
    "Sennheiser HD 450BT", "Sennheiser Momentum 4", "Skullcandy Crusher Evo", "Skullcandy Indy Evo",
    "Logitech G Pro X", "HyperX Cloud II", "Razer Kraken", "SteelSeries Arctis 7"
  ],
  smartwatches: [
    "Apple Watch Series 8", "Apple Watch SE", "Samsung Galaxy Watch 6", "Samsung Galaxy Watch Active2",
    "Garmin Forerunner 255", "Garmin Fenix 7", "Fitbit Versa 4", "Fitbit Sense 2",
    "Huawei Watch GT3", "Huawei Watch Fit", "Xiaomi Mi Watch", "Xiaomi Redmi Watch",
    "Amazfit GTR 4", "Amazfit Bip U Pro", "Polar Vantage M2", "Polar Ignite 3",
    "Suunto 9 Peak", "Suunto 5 Peak", "Mobvoi TicWatch Pro 3", "Fossil Gen 6"
  ],
  camperas: [
    "Campera North Face Denali", "Campera North Face Nuptse", "Campera Patagonia Better Sweater", "Campera Patagonia Nano Puff",
    "Campera Columbia Fleece", "Campera Columbia Powder Lite", "Campera Carhartt WIP", "Campera Carhartt Detroit",
    "Campera Uniqlo Heattech", "Campera Uniqlo Ultra Light Down", "Campera Levi's Trucker", "Campera Levi's Sherpa",
    "Campera Champion Hoodie", "Campera Champion Reverse Weave", "Campera Tommy Hilfiger Polo", "Campera Ralph Lauren Polo",
    "Campera Calvin Klein Jeans", "Campera Lululemon ABC", "Campera Under Armour Storm", "Campera Adidas Tiro"
  ],
};