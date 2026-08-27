import { describe, expect, it } from "vitest";

describe("Cloudinary credentials", () => {
  it("authenticates against the Cloudinary API without exposing secrets", async () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    expect(cloudName).toBeTruthy();
    expect(apiKey).toBeTruthy();
    expect(apiSecret).toBeTruthy();

    const authorization = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName!)}/resources/image/upload?max_results=1`,
      { headers: { Authorization: `Basic ${authorization}` } },
    );

    expect(response.ok).toBe(true);
  }, 15_000);
});
