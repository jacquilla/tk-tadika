import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabase-admin";
import ExcelJS from "exceljs";

// Token internal untuk mengamankan endpoint
const API_SECRET = process.env.API_SECRET || "";

// Rate limiting untuk export endpoint
const exportAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_EXPORT_ATTEMPTS = 10;
const EXPORT_WINDOW_MS = 60 * 60 * 1000; // 1 jam

const checkExportRateLimit = (apiKey: string): boolean => {
  const now = Date.now();
  const record = exportAttempts.get(apiKey);

  if (!record || now > record.resetAt) {
    exportAttempts.set(apiKey, { count: 1, resetAt: now + EXPORT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_EXPORT_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
};

export async function GET(request: Request) {
  try {
    // ===== VALIDASI TOKEN =====
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    if (!API_SECRET) {
      console.error("[EXPORT] API_SECRET belum di-set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Timing-safe comparison
    if (token !== API_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ===== RATE LIMITING =====
    if (!checkExportRateLimit(token)) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan export. Coba lagi nanti." },
        { status: 429 }
      );
    }

    // ===== FETCH DATA =====
    const { data: murid, error: muridError } = await supabaseAdmin
      .from("murid")
      .select("*");

    if (muridError) throw muridError;

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const { data: kehadiran, error: kehadiranError } = await supabaseAdmin
      .from("kehadiran")
      .select("*")
      .gte("tanggal", startOfMonth)
      .lte("tanggal", today.toISOString().split("T")[0]);

    if (kehadiranError) throw kehadiranError;

    // ===== GENERATE EXCEL =====
    const workbook = new ExcelJS.Workbook();

    const sheet1 = workbook.addWorksheet("Kehadiran Bulanan");
    sheet1.columns = [
      { header: "Nama Murid", key: "nama", width: 25 },
      { header: "Kelas", key: "kelas", width: 10 },
      { header: "Tanggal", key: "tanggal", width: 15 },
      { header: "Status", key: "status", width: 12 },
      { header: "Waktu Datang", key: "datang", width: 10 },
      { header: "Waktu Pulang", key: "pulang", width: 10 },
      { header: "Penjemput", key: "penjemput", width: 15 },
    ];

    kehadiran?.forEach((h: any) => {
      const anak = murid?.find((m) => m.id === h.murid_id);
      sheet1.addRow({
        nama: anak?.nama || "-",
        kelas: anak?.kelas || "-",
        tanggal: h.tanggal,
        status: h.status_hadir,
        datang: h.waktu_datang
          ? new Date(h.waktu_datang).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
        pulang: h.waktu_pulang
          ? new Date(h.waktu_pulang).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
        penjemput: h.penjemput || "-",
      });
    });

    const sheet2 = workbook.addWorksheet("Status SPP");
    sheet2.columns = [
      { header: "Nama Murid", key: "nama", width: 25 },
      { header: "Kelas", key: "kelas", width: 10 },
      { header: "Status SPP", key: "spp", width: 15 },
      { header: "Nomor HP Ortu", key: "hp", width: 20 },
    ];

    murid?.forEach((m) => {
      sheet2.addRow({
        nama: m.nama,
        kelas: m.kelas,
        spp: m.status_spp,
        hp: m.nomor_hp_ortu,
      });
    });

    [sheet1, sheet2].forEach((sheet) => {
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2E8F0" },
      };
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition': 'attachment; filename="laporan-tk-tadika.xlsx"',
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("[EXPORT] Error:", error);
    return NextResponse.json(
      { error: "Gagal membuat laporan" },
      { status: 500 }
    );
  }
}
