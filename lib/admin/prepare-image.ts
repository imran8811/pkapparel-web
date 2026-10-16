/*
 * Shrinks large photos in the browser before uploading (phone photos are often 5–12 MB),
 * so uploads are quick on slow connections. The API still checks and re-encodes every image.
 */

const MAX_SIDE = 2400;
const SMALL_ENOUGH = 1.5 * 1024 * 1024;

export async function prepareImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // let the server report the problem
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= SMALL_ENOUGH) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }

  // PNGs may be logos with transparency; everything else becomes a JPEG photo.
  const keepPng = file.type === "image/png";
  if (!keepPng) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const type = keepPng ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));
  if (!blob || blob.size >= file.size) return file;

  const name = `${file.name.replace(/\.[^.]+$/, "") || "image"}.${keepPng ? "png" : "jpg"}`;
  return new File([blob], name, { type });
}

/** "IMG_2041 (1).jpg" → "IMG 2041 (1)", a starting point for the image description. */
export function nameToAlt(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
}
