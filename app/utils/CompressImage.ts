import imageCompression from "browser-image-compression";

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.3, // maksimal 300 KB
    maxWidthOrHeight: 1200, // resize ke 1200px
    useWebWorker: true, // pakai background thread
    initialQuality: 0.8, // kualitas awal 80%
  };

  try {
    const compressed = await imageCompression(file, options);
    return compressed;
  } catch (error) {
    console.warn("Kompresi gagal, lanjutkan dengan file asli", error);
    return file; // fallback ke file asli
  }
}
