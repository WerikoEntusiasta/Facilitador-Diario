// Client-side Image Compression Helper
// Compresses uploaded images/photos before saving or sending to server.

export async function compressImageFile(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<{ file: File; base64: string }> {
  return new Promise((resolve, reject) => {
    // If not an image, return directly
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve({ file, base64: reader.result as string });
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ file, base64: e.target?.result as string });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP if supported, or JPEG
        const mimeType = canvas.toDataURL('image/webp').startsWith('data:image/webp')
          ? 'image/webp'
          : 'image/jpeg';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ file, base64: e.target?.result as string });
              return;
            }
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '') + (mimeType === 'image/webp' ? '.webp' : '.jpg'),
              { type: mimeType, lastModified: Date.now() }
            );

            const base64 = canvas.toDataURL(mimeType, quality);
            resolve({ file: compressedFile, base64 });
          },
          mimeType,
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
