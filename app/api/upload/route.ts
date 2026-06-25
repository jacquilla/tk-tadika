import { NextResponse } from "next/server";
import { google } from "googleapis";
import sharp from "sharp";

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

export async function POST(request: Request) {
  try {
    // Pastikan refresh token tersedia
    if (!process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
      return NextResponse.json(
        { error: "Refresh token tidak ditemukan di environment variables." },
        { status: 500 },
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      "http://localhost", // redirect URI tidak penting untuk refresh token
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
    });

    // Paksa refresh access token (memastikan valid)
    await oauth2Client.getAccessToken();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Tidak ada file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const compressed = await sharp(buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const drive = google.drive({ version: "v3", auth: oauth2Client });

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
    });

    const fileId = createdFile.data.id!;

    // Set file ke publik
    await drive.permissions.create({
      fileId: fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    const imageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
    return NextResponse.json({ success: true, imageUrl });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
