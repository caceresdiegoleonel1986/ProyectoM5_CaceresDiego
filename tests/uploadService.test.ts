import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ getIdToken: vi.fn() }));

vi.mock("../src/services/firebase", () => ({ auth: { currentUser: session } }));

import { uploadFileSecurely } from "../src/services/uploadService";

const signed = {
  uploadUrl: "https://s3.example.test/upload",
  fileKey: "products/abc.png",
  publicUrl: "https://cdn.example.test/products/abc.png",
  expiresInSeconds: 300,
  fields: { key: "products/abc.png", "Content-Type": "image/png", policy: "signed" },
};

describe("uploadFileSecurely (S3 presigned POST)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    session.getIdToken.mockResolvedValue("id-token");
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => signed })
      .mockResolvedValueOnce({ ok: true, statusText: "No Content" });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("rechaza tipos no permitidos sin pedir firma", async () => {
    const file = new File(["x"], "payload.txt", { type: "text/plain" });

    await expect(uploadFileSecurely(file)).rejects.toThrow("Tipo de archivo no permitido");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("aplica el límite de 5 MB antes de la red", async () => {
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" });

    await expect(uploadFileSecurely(file)).rejects.toThrow("supera el tamaño máximo");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("pide la firma con el ID token y sube el archivo como último campo", async () => {
    const file = new File(["bytes"], "product.png", { type: "image/png" });

    await expect(uploadFileSecurely(file)).resolves.toBe(signed.publicUrl);

    const [signerUrl, signerInit] = fetchMock.mock.calls[0];
    expect(signerUrl).toBe("/api/presign-upload");
    expect(signerInit.headers.Authorization).toBe("Bearer id-token");
    expect(JSON.parse(signerInit.body)).toEqual({ contentType: "image/png", folder: "products" });

    const [s3Url, s3Init] = fetchMock.mock.calls[1];
    expect(s3Url).toBe(signed.uploadUrl);
    const keys = [...(s3Init.body as FormData).keys()];
    expect(keys[keys.length - 1]).toBe("file");
    expect((s3Init.body as FormData).get("policy")).toBe("signed");
  });

  it("falla con un mensaje claro si el firmador rechaza al usuario", async () => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });
    const file = new File(["bytes"], "product.png", { type: "image/png" });

    await expect(uploadFileSecurely(file)).rejects.toThrow("No se pudo autorizar la subida (403)");
  });

  it("exige sesión iniciada", async () => {
    session.getIdToken.mockResolvedValue(undefined);
    const file = new File(["bytes"], "product.png", { type: "image/png" });

    await expect(uploadFileSecurely(file)).rejects.toThrow("Inicia sesión");
  });
});
