/**
 * Utility function to process images client-side before previewing and uploading.
 * Converts HEIC/HEIF images (unsupported by standard web browsers) into JPEGs dynamically.
 */
export async function ensureClientImageCompatible(file: File): Promise<File> {
  if (typeof window === 'undefined') return file;

  const isHEIC = 
    file.type === 'image/heic' || 
    file.type === 'image/heif' || 
    /\.(heic|heif)$/i.test(file.name);

  if (!isHEIC) {
    return file;
  }

  try {
    // Dynamic import to prevent bundling overhead on initial page load
    const heic2any = (await import('heic2any')).default;
    
    // Convert HEIC blob/file to JPEG blob
    const resultBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.85
    });

    const singleBlob = Array.isArray(resultBlob) ? resultBlob[0] : resultBlob;
    
    // Create a new File object with a .jpg extension
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'image_converted';
    const convertedFile = new File([singleBlob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now()
    });

    return convertedFile;
  } catch {
    return file;
  }
}
