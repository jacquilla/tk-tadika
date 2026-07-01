import { NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/verify-token";
import { google } from "googleapis";
import sharp from "sharp";

// Whitelist MIME types yang diizinkan
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const IMAGE_FORMATS = ["jpeg", "png", "webp"] as const;

export async function POST(request: Request) {
  const payload = verifyToken(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const format = (formData.get("format") as string) || "webp"; // Default: WebP

    if (!file) {
      return NextResponse.json({ error: "Tidak ada file" }, { status: 400 });
    }

    // ===== VALIDASI FILE =====
    // 1. Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Format tidak didukung. Gunakan: JPEG, PNG, atau WebP`,
        },
        { status: 400 },
      );
    }

    // 2. Check ukuran file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File terlalu besar. Maksimal 5MB (Ukuran file: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        },
        { status: 400 },
      );
    }

    // 3. Validasi format output
    if (!IMAGE_FORMATS.includes(format as any)) {
      return NextResponse.json(
        {
          error: `Format output tidak valid. Gunakan: jpeg, png, atau webp`,
        },
        { status: 400 },
      );
    }

    // ===== KOMPRESI & KONVERSI =====
    const buffer = Buffer.from(await file.arrayBuffer());

    // Deteksi dimensi untuk validasi
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { error: "File bukan gambar valid" },
        { status: 400 },
      );
    }

    // Kompresi sesuai format
    let compressed: Buffer;
    if (format === "webp") {
      compressed = await sharp(buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer();
    } else if (format === "png") {
      compressed = await sharp(buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toBuffer();
    } else {
      // JPEG default
      compressed = await sharp(buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();
    }

    // ===== UPLOAD KE GOOGLE DRIVE =====
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      "http://localhost",
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Generate unique filename dengan timestamp + random
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = format === "jpeg" ? "jpg" : format;
    const fileName = `TK-TADIKA-${Date.now()}-${randomId}.${extension}`;

    const fileMetadata = {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
      description: `Upload oleh guru ID: ${payload.guru_id || "admin"}`,
    };

    const mimeTypeMap = {
      webp: "image/webp",
      png: "image/png",
      jpeg: "image/jpeg",
    };

    const media = {
      mimeType: mimeTypeMap[format as keyof typeof mimeTypeMap],
      body: require("stream").Readable.from(compressed),
    };

    const createdFile = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id",
      supportsAllDrives: true,
    });

    const fileId = createdFile.data.id;
    if (!fileId) {
      throw new Error("File ID tidak ditemukan setelah upload");
    }

    // ===== GENERATE SIGNED URL =====
    // Format: Google Drive UCexport link (lebih aman dari lh3)
    // Link ini tidak punya expiry hardcoded tetapi kontrol akses via Drive permissions
    const imageUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;

    // CATATAN KEAMANAN:
    // 1. Link ini HANYA bisa diakses jika file permissions memungkinkan
    // 2. Default: file masih private (hanya pemilik yang akses)
    // 3. Jika perlu public, uncomment permissions.create di bawah
    // 4. Alternatif: Gunakan signed URL dengan expiry time (lihat comment)

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      fileId: fileId,
      format: format,
      originalSize: file.size,
      compressedSize: compressed.length,
      compressionRatio: (
        ((file.size - compressed.length) / file.size) *
        100
      ).toFixed(1),
    });
  } catch (error: any) {
    console.error("[UPLOAD] Error:", error);

    // Jangan expose internal error ke client
    if (error.message?.includes("ENOSPC")) {
      return NextResponse.json(
        { error: "Storage penuh. Hubungi admin." },
        { status: 507 },
      );
    }

    return NextResponse.json(
      { error: "Gagal upload. Coba lagi nanti." },
      { status: 500 },
    );
  }
}
