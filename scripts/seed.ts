import "dotenv/config";
import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { categories, CATALOG } from "./seedData.ts";
import type { Product, CategoryId } from "../src/types/product.types.ts";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function randomPrice(): number {
  return Number((5000 + Math.random() * 20000).toFixed(2));
}

function randomStock(): number {
  return Math.floor(Math.random() * 46) + 5;
}

function createDescription(name: string, category: CategoryId): string {
  return `${name} pertenece a la categoría "${category}". Diseñado con materiales de calidad para ofrecer comodidad, durabilidad y estilo.`;
}

async function seed() {
  // Categorías
  console.log("🌱 Sembrando categorías...");
  for (const category of categories) {
    await setDoc(doc(db, "categories", category.id), {
      ...category,
      createdAt: serverTimestamp(),
    });
    console.log(`✔ Categoría: ${category.name}`);
  }

  // Productos
  const products: Omit<Product, "id">[] = (
    Object.entries(CATALOG) as [CategoryId, string[]][]
  ).flatMap(([categoryId, names]) =>
    names.map((name: string) => ({
      name,
      nameLower: name.toLowerCase(),
      price: randomPrice(),
      stock: randomStock(),
      description: createDescription(name, categoryId),
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(name)}/300/300`,
      categoryId,
      createdAt: new Date(),
    }))
  );

  console.log(`\n🌱 Sembrando ${products.length} productos...\n`);

  for (const product of products) {
    const ref = doc(collection(db, "products"));
    await setDoc(ref, {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`✔ ${product.name}`);
  }

  console.log(`\n✅ Seed completado: ${products.length} productos y ${categories.length} categorías.`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Error al ejecutar el seeder:");
  console.error(error);
  process.exit(1);
});