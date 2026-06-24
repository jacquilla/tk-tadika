import { NextResponse } from "next/server";
import { google } from "googleapis";
import sharp from "sharp";

// 1. Scope diubah agar bisa mengakses folder yang sudah ada
const SCOPES = ["https://www.googleapis.com/auth/drive"];
function getAuthClient() {
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file)
      return NextResponse.json({ error: "Tidak ada file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const compressed = await sharp(buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const auth = getAuthClient();
    const drive = google.drive({ version: "v3", auth });

    const fileMetadata = {
      name: `TK-${Date.now()}.jpg`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
    };

    const media = {
      mimeType: "image/jpeg",
      body: require("stream").Readable.from(compressed),
    };

    const createdFile = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id",
      supportsAllDrives: true,
    });

    const fileId = createdFile.data.id!;

    await drive.permissions.create({
      fileId: fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    // 2. Link yang stabil untuk Google Drive
    const imageUrl = `https://lh3.googleusercontent.com/d/${fileId}=w800`;

    return NextResponse.json({ success: true, imageUrl });
  } catch (error: any) {
    console.error("Upload error details:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
