// Client-side image prep for vision chat: validate, downscale, and return a
// data URL small enough to send inline (avoids file storage; backend accepts a
// 10MB JSON body). Large photos are scaled down and re-encoded as JPEG.

const MAX_DIMENSION = 1536;
const MAX_INLINE_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export const ACCEPT_ATTR = ACCEPTED.join(",");

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode the image."));
    img.src = src;
  });
}

export async function fileToInlineImage(file: File): Promise<string> {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error("Unsupported image type. Use PNG, JPEG, WebP, or GIF.");
  }

  const original = await readAsDataUrl(file);

  // Animated GIFs lose animation on canvas; pass small ones through untouched.
  if (file.type === "image/gif") {
    if (file.size > MAX_INLINE_BYTES) {
      throw new Error("GIF is too large. Keep it under 5MB.");
    }
    return original;
  }

  const img = await loadImage(original);
  const largestSide = Math.max(img.width, img.height);
  const scale = Math.min(1, MAX_DIMENSION / largestSide);

  if (scale === 1 && file.size <= MAX_INLINE_BYTES) {
    return original;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) return original;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}
