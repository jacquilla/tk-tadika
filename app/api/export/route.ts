import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabase-admin";
import ExcelJS from "exceljs";

// Token internal untuk mengamankan endpoint
const API_SECRET = process.env.API_SECRET || "";

export async function GET(request: Request) {
  // Validasi token
  const authHeader = request.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${API_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: murid } = await supabaseAdmin.from("murid").select("*");

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const { data: kehadiran } = await supabaseAdmin
      .from("kehadiran")
      .select("*")
      .gte("tanggal", startOfMonth)
      .lte("tanggal", today.toISOString().split("T")[0]);

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
        "Content-Disposition": 'attachment; filename="laporan-tk.xlsx"',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal membuat laporan" },
      { status: 500 },
    );
  }
}
