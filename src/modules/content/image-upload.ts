export const IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;

export function imageSizeError(size: number) {
  return `This image is ${(size / 1024 / 1024).toFixed(1)} MB. The maximum for this section is 8 MB. Choose a smaller image or compress it and try again.`;
}

/** Hero originals have no file-size cutoff; only the web-ready copy is uploaded. */
export async function prepareWebsiteImage(file: File, hero: boolean): Promise<File> {
  if (!file.size) throw new Error("This image is empty. Choose another image.");
  if (!hero && file.size > IMAGE_UPLOAD_BYTES) throw new Error(imageSizeError(file.size));
  if (file.size <= IMAGE_UPLOAD_BYTES) return file;
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error("This image could not be opened. Export it as JPEG, PNG, WebP or AVIF and try again."); }
  try {
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 3840 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this image. Try another browser.");
    for (let attempt = 0; attempt < 8; attempt++) {
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", 0.9));
      if (!blob) throw new Error("Your browser could not prepare this image. Try another image.");
      if (blob.size <= IMAGE_UPLOAD_BYTES) return new File([blob], "hero.webp", { type: blob.type });
      canvas.width = Math.max(1, Math.round(canvas.width * 0.75));
      canvas.height = Math.max(1, Math.round(canvas.height * 0.75));
    }
    throw new Error("This image could not be optimized. Export a web-ready copy and try again.");
  } finally { bitmap.close(); }
}
