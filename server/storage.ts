import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { randomUUID } from "node:crypto";

function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary não configurado: defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.");
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return cloudinary;
}

function normalizeKey(relKey: string) {
  return relKey.replace(/^\/+/, "").replace(/\.[a-z0-9]+$/i, "");
}

function uploadBuffer(buffer: Buffer, publicId: string, contentType: string) {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const upload = getCloudinary().uploader.upload_stream(
      { public_id: publicId, resource_type: "image", overwrite: false, format: contentType.split("/")[1] || undefined },
      (error, result) => (error || !result ? reject(error ?? new Error("Cloudinary não retornou o arquivo.")) : resolve(result)),
    );
    upload.end(buffer);
  });
}

export async function storagePut(relKey: string, data: Buffer | Uint8Array | string, contentType = "application/octet-stream") {
  const baseKey = normalizeKey(relKey);
  const key = `${baseKey}_${randomUUID().replace(/-/g, "").slice(0, 8)}`;
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const uploaded = await uploadBuffer(buffer, key, contentType);
  return { key: uploaded.public_id, url: uploaded.secure_url };
}

export async function storageGet(relKey: string) {
  const key = normalizeKey(relKey);
  return { key, url: getCloudinary().url(key, { secure: true, resource_type: "image" }) };
}

export async function storageGetSignedUrl(relKey: string) {
  return (await storageGet(relKey)).url;
}

export async function storageDelete(key: string) {
  await getCloudinary().uploader.destroy(normalizeKey(key), { resource_type: "image" });
}
