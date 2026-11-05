import { defineConfig } from "vitest/config";

// Tests de firestore.rules: necesitan el emulador, por eso no forman parte de `npm test`.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests-rules/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
