import { storageDelete, storagePut } from "../server/storage";

const pixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL9yQAAAABJRU5ErkJggg==",
  "base64",
);

let uploaded: { key: string; url: string } | undefined;

try {
  uploaded = await storagePut("verification/cloudinary-smoke-test.png", pixelPng, "image/png");
  const response = await fetch(uploaded.url, { method: "HEAD" });
  if (!response.ok) throw new Error("A URL segura retornada pelo Cloudinary não está acessível.");
  console.info("Upload e leitura HTTPS do Cloudinary verificados com sucesso.");
} finally {
  if (uploaded) await storageDelete(uploaded.key);
}
