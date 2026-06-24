"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

import {
  Login,
  Logout,
  Home,
  ChartLine,
  Peoples,
  CheckOne,
  Message,
  Camera,
  Save,
  Loading,
  Left,
  VolumeNotice,
  Close,
  BankCard,
  User,
  Send,
  Attention,
  Info,
  Box,
  ColorCard,
  MagicWand,
  Time,
  EmotionHappy,
  Bowl,
  SleepOne,
  Notes,
  Calendar,
  MailOpen,
  Search,
  ArrowLeft,
  ArrowRight,
} from "@icon-park/react";
import "@icon-park/react/styles/index.css";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase credentials tidak ditemukan!");
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TEMPLATE_PESAN = {
  umum: "Syalom Bunda/Ayah,\n\nIni adalah informasi resmi dari TK Tadika Mesra.\n\n[KETIK INFO DI SINI]\n\nKurré sumanga' atas perhatiannya. Tuhan memberkati.",
  spp: "Syalom Bunda/Ayah,\n\nSemoga keluarga dalam keadaan sehat selalu. Tabe', dengan penuh kerendahan hati kami dari administrasi TK Tadika Mesra ingin mengingatkan mengenai administrasi SPP bulan ini yang mungkin terlewat.\n\nJika sudah menyelesaikan administrasi, mohon abaikan pesan ini. Kurré sumanga' atas dukungan Bunda/Ayah yang luar biasa bagi kelancaran operasional sekolah kita. Tuhan memberkati. 🙏",
  bekal:
    "Syalom Bunda,\n\nTabe', demi kenyamanan dan kesehatan ananda selama berkegiatan di sekolah hari ini, mohon kesediaannya untuk membekali ananda dengan:\n\n- Botol minum pribadi\n- [TAMBAHKAN KEBUTUHAN LAIN]\n\nKurré sumanga' atas kerja samanya Bunda! 🎒✨",
};

// Helper: Mengambil tanggal lokal (Indonesia)
const getTanggalLokal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

// Helper: Mendapatkan tanggal Senin dan Minggu dari minggu yang diinginkan
const getWeekRange = (offset: number = 0) => {
  const now = new Date();
  const day = now.getDay(); // 0 = Minggu, 1 = Senin, ...
  const diffToMonday = (day === 0 ? -6 : 1 - day) + offset * 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
    mondayDate: monday,
    sundayDate: sunday,
  };
};

export default function AppTK() {
  const [tampilan, setTampilan] = useState("login");
  const [namaGuru, setNamaGuru] = useState("");
  const [kelasAktif, setKelasAktif] = useState("");
  const [tabAktif, setTabAktif] = useState("datang");
  const [subTabLaporan, setSubTabLaporan] = useState<"harian" | "mingguan">(
    "harian",
  );

  const [dataSemuaMurid, setDataSemuaMurid] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [statusSppDinamis, setStatusSppDinamis] = useState<
    Record<string, string>
  >({});
  const [isResettingSpp, setIsResettingSpp] = useState(false);
  const [statusAnak, setStatusAnak] = useState<Record<string, string>>({});

  const [statusDailySheetHarian, setStatusDailySheetHarian] = useState<
    Record<string, any>
  >({});

  const [logKegiatan, setLogKegiatan] = useState<Record<string, any[]>>({});
  const [pilihanAnak, setPilihanAnak] = useState<string[]>([]);
  const [jenisKegiatan, setJenisKegiatan] = useState("");

  const [dailyMakan, setDailyMakan] = useState("");
  const [dailyTidurMulai, setDailyTidurMulai] = useState("");
  const [dailyTidurSelesai, setDailyTidurSelesai] = useState("");
  const [dailyMood, setDailyMood] = useState("");

  const [fotoAktivitas, setFotoAktivitas] = useState<File | null>(null);

  const [penjemput, setPenjemput] = useState<Record<string, string>>({});
  const [penjemputCustom, setPenjemputCustom] = useState<
    Record<string, string>
  >({});
  const [ketPenjemput, setKetPenjemput] = useState<Record<string, string>>({});

  const [bukaSiaran, setBukaSiaran] = useState(false);
  const [tipeSiaran, setTipeSiaran] = useState("umum");
  const [teksSiaran, setTeksSiaran] = useState(TEMPLATE_PESAN.umum);

  const [chatPersonalAktif, setChatPersonalAktif] = useState<any>(null);
  const [teksChatPersonal, setTeksChatPersonal] = useState("");
  const [isMengirimChat, setIsMengirimChat] = useState(false);

  const [dataLaporan, setDataLaporan] = useState<Record<string, any[]>>({});
  const [isLoadingLaporan, setIsLoadingLaporan] = useState(false);

  const [cariMurid, setCariMurid] = useState("");

  const [selectedStudentReport, setSelectedStudentReport] = useState<any>(null);
  const [weeklyOffset, setWeeklyOffset] = useState(0);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);

  // MUAT DRAFT AUTO-SAVE DARI DATABASE/LOCALSTORAGE
  useEffect(() => {
    if (tampilan === "dashboard" && kelasAktif) {
      const savedDraft = localStorage.getItem(`draft_jurnal_${kelasAktif}`);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setJenisKegiatan(parsed.jenisKegiatan || "");
          setDailyMakan(parsed.dailyMakan || "");
          setDailyTidurMulai(parsed.dailyTidurMulai || "");
          setDailyTidurSelesai(parsed.dailyTidurSelesai || "");
          setDailyMood(parsed.dailyMood || "");
          setPilihanAnak(parsed.pilihanAnak || []);
        } catch (e) {
          console.error("Gagal memuat draf", e);
        }
      }
    }
  }, [tampilan, kelasAktif]);

  // SIMPAN DRAFT AUTO-SAVE SAAT ADA PERUBAHAN
  useEffect(() => {
    if (tampilan === "dashboard" && kelasAktif) {
      const draft = {
        jenisKegiatan,
        dailyMakan,
        dailyTidurMulai,
        dailyTidurSelesai,
        dailyMood,
        pilihanAnak,
      };
      localStorage.setItem(`draft_jurnal_${kelasAktif}`, JSON.stringify(draft));
    }
  }, [
    jenisKegiatan,
    dailyMakan,
    dailyTidurMulai,
    dailyTidurSelesai,
    dailyMood,
    pilihanAnak,
    tampilan,
    kelasAktif,
  ]);

  // FETCHING AWAL
  useEffect(() => {
    const tarikDataAwal = async () => {
      try {
        const { data: muridData, error } = await supabase
          .from("murid")
          .select("*")
          .order("nama");
        if (error) throw error;
        if (muridData) setDataSemuaMurid(muridData);

        const hariIni = getTanggalLokal();

        const { data: hadirData, error: hadirError } = await supabase
          .from("kehadiran")
          .select("*")
          .eq("tanggal", hariIni);
        if (hadirError) throw hadirError;
        if (hadirData) {
          const statusMap: Record<string, string> = {};
          hadirData.forEach((h) => {
            statusMap[h.murid_id] = h.status_hadir;
          });
          setStatusAnak(statusMap);
        }

        const { data: logData, error: logError } = await supabase
          .from("log_aktivitas")
          .select("murid_id, metadata")
          .eq("kategori", "DailySheet")
          .gte("created_at", hariIni);

        if (!logError && logData) {
          const sheetMap: Record<string, any> = {};
          logData.forEach((l) => {
            sheetMap[l.murid_id] = {
              ...sheetMap[l.murid_id],
              ...(l.metadata || {}),
            };
          });
          setStatusDailySheetHarian(sheetMap);
        }
      } catch (err) {
        console.error("Gagal mengambil data awal:", err);
      } finally {
        setIsLoading(false);
      }
    };
    tarikDataAwal();

    const realtimeChannel = supabase
      .channel("public:kehadiran")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kehadiran" },
        (payload) => {
          const record = payload.new as any;
          if (record && record.murid_id && record.status_hadir) {
            setStatusAnak((prev) => ({
              ...prev,
              [record.murid_id]: record.status_hadir,
            }));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  const muridSemua = dataSemuaMurid.filter(
    (m) => m.kelas.toLowerCase() === kelasAktif.toLowerCase(),
  );
  const muridBelumHadir = muridSemua.filter(
    (a) => !statusAnak[a.id] || statusAnak[a.id] === "belum",
  );
  const muridHadir = muridSemua.filter((a) => statusAnak[a.id] === "hadir");

  const filterNama = (list: any[]) => {
    if (!cariMurid.trim()) return list;
    return list.filter((m) =>
      m.nama.toLowerCase().includes(cariMurid.toLowerCase().trim()),
    );
  };

  const muridBelumHadirFilter = filterNama(muridBelumHadir);
  const muridHadirFilter = filterNama(muridHadir);
  const muridSemuaFilter = filterNama(muridSemua);

  const getaranHalus = () => {
    if (typeof window !== "undefined" && navigator.vibrate)
      navigator.vibrate(50);
  };
  const dapatkanStatusSpp = (anak: any) =>
    statusSppDinamis[anak.id] || anak.status_spp || "LUNAS";

  const toggleSpp = async (idAnak: string, statusSaatIni: string) => {
    getaranHalus();
    const statusBaru = statusSaatIni === "LUNAS" ? "MENUNGGAK" : "LUNAS";
    setStatusSppDinamis((prev) => ({ ...prev, [idAnak]: statusBaru }));
    try {
      await supabase
        .from("murid")
        .update({ status_spp: statusBaru })
        .eq("id", idAnak);
    } catch (err) {
      alert("Gagal mengubah status SPP.");
    }
  };

  const handleResetDanTagihSppMassal = async () => {
    getaranHalus();
    const konfirmasi = confirm(
      "PENTING!\nTindakan ini akan mengubah status SPP semua murid di kelas ini menjadi MENUNGGAK, lalu otomatis mengirim pesan WA tagihan kepada mereka.\n\nLanjutkan?",
    );
    if (!konfirmasi) return;
    setIsResettingSpp(true);
    try {
      const muridIds = muridSemua.map((m) => m.id);
      const { error } = await supabase
        .from("murid")
        .update({ status_spp: "MENUNGGAK" })
        .in("id", muridIds);
      if (error) throw error;

      const newStatus = { ...statusSppDinamis };
      muridIds.forEach((id) => (newStatus[id] = "MENUNGGAK"));
      setStatusSppDinamis(newStatus);

      let countTerkirim = 0;
      for (const anak of muridSemua) {
        const pesanTagihan = `📢 *INFO ADMINISTRASI KELAS*\n\n${TEMPLATE_PESAN.spp}`;
        await kirimWA(anak.nomor_hp_ortu, pesanTagihan);
        countTerkirim++;
        await new Promise((res) => setTimeout(res, 500));
      }
      alert(
        `Berhasil mereset tagihan dan mengirim ${countTerkirim} pesan SPP!`,
      );
    } catch (error) {
      alert("Terjadi kesalahan saat memproses tagihan massal.");
    } finally {
      setIsResettingSpp(false);
    }
  };

  const catatKegiatan = async (
    idAnak: string,
    teksKegiatan: string,
    kategori = "Umum",
    metadata = {},
  ) => {
    const waktu = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setLogKegiatan((prev) => ({
      ...prev,
      [idAnak]: [
        ...(prev[idAnak] || []),
        { waktu, teks: teksKegiatan, metadata, kategori },
      ],
    }));
    try {
      await supabase.from("log_aktivitas").insert({
        murid_id: idAnak,
        deskripsi: teksKegiatan,
        kategori,
        metadata,
      });
    } catch (err) {
      console.error("Gagal mencatat aktivitas:", err);
    }
  };

  const kirimWA = async (nomorHp: string, pesan: string) => {
    if (!nomorHp) return;
    try {
      const res = await fetch("/api/wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetHp: nomorHp, pesanCustom: pesan }),
      });
      if (!res.ok) throw new Error("Respon API tidak ok");
    } catch (e) {
      alert("Gagal mengirim pesan WhatsApp. Periksa koneksi atau nomor HP.");
    }
  };

  const bukaChatPersonal = (anak: any) => {
    getaranHalus();
    setChatPersonalAktif(anak);
    setTeksChatPersonal(`Syalom Bunda/Ayah Ananda ${anak.nama},\n\n`);
  };

  const handleKirimChatPersonal = async () => {
    if (!teksChatPersonal.trim()) return alert("Pesan tidak boleh kosong!");
    setIsMengirimChat(true);
    await kirimWA(chatPersonalAktif.nomor_hp_ortu, teksChatPersonal);
    setIsMengirimChat(false);
    setChatPersonalAktif(null);
    alert(`Pesan berhasil terkirim ke orang tua ${chatPersonalAktif.nama}!`);
  };

  const handleDatang = async (anak: any) => {
    getaranHalus();
    const today = getTanggalLokal();
    const nowObj = new Date();
    const nowStr = nowObj.toISOString();
    const timeDatang = nowObj.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    try {
      const { data: existing, error } = await supabase
        .from("kehadiran")
        .select("id")
        .eq("murid_id", anak.id)
        .eq("tanggal", today)
        .maybeSingle();
      if (error) throw error;

      if (existing) {
        await supabase
          .from("kehadiran")
          .update({ status_hadir: "hadir", waktu_datang: nowStr })
          .eq("id", existing.id);
      } else {
        await supabase.from("kehadiran").insert({
          murid_id: anak.id,
          status_hadir: "hadir",
          waktu_datang: nowStr,
          tanggal: today,
        });
      }

      setStatusAnak((prev) => ({ ...prev, [anak.id]: "hadir" }));
      catatKegiatan(
        anak.id,
        "Tiba di sekolah dengan ceria (Check-In)",
        "Kehadiran",
      );

      const pesanDatang = `📖 *Informasi TK Tadika Mesra*\n\nSyalom Bunda/Ayah,\nAnanda *${anak.nama}* telah tiba di sekolah dengan selamat pada pukul *${timeDatang}*.\n\nSemoga hari ini ananda belajar dan bermain dengan penuh sukacita. Kurré sumanga' dan Tuhan memberkati. 🙏✨`;
      await kirimWA(anak.nomor_hp_ortu, pesanDatang);
    } catch (err) {
      alert("Gagal menyimpan data kehadiran.");
    }
  };

  // ✅ Fungsi simpanKegiatanMassal yang sudah bersih (tidak ada duplikasi)
  const simpanKegiatanMassal = async () => {
    getaranHalus();
    if (pilihanAnak.length === 0) return alert("Pilih minimal 1 anak!");
    if (
      !jenisKegiatan &&
      !dailyMakan &&
      !dailyMood &&
      !dailyTidurMulai &&
      !dailyTidurSelesai &&
      !fotoAktivitas
    ) {
      return alert("Isi catatan kegiatan, foto, atau daily sheet!");
    }

    setIsSaving(true);

    let uploadedImageUrl = "";
    if (fotoAktivitas) {
      try {
        const formData = new FormData();
        formData.append("file", fotoAktivitas);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.imageUrl) {
          uploadedImageUrl = data.imageUrl;
        } else {
          alert("Gagal upload ke Drive: " + data.error);
          setIsSaving(false);
          return;
        }
      } catch (error) {
        alert("Kesalahan jaringan saat upload.");
        setIsSaving(false);
        return;
      }
    }

    const metadataSheet = {
      makan: dailyMakan || null,
      tidur:
        dailyTidurMulai && dailyTidurSelesai
          ? `${dailyTidurMulai} - ${dailyTidurSelesai}`
          : null,
      mood: dailyMood || null,
      foto_url: uploadedImageUrl || null,
    };

    for (const id of pilihanAnak) {
      await catatKegiatan(
        id,
        jenisKegiatan || "Mengikuti rutinitas kelas harian.",
        "DailySheet",
        metadataSheet,
      );
    }

    setStatusDailySheetHarian((prev) => {
      const newState = { ...prev };
      pilihanAnak.forEach((id) => {
        newState[id] = { ...(newState[id] || {}), ...metadataSheet };
      });
      return newState;
    });

    localStorage.removeItem(`draft_jurnal_${kelasAktif}`);

    setPilihanAnak([]);
    setJenisKegiatan("");
    setDailyMakan("");
    setDailyTidurMulai("");
    setDailyTidurSelesai("");
    setDailyMood("");
    setFotoAktivitas(null);
    setIsSaving(false);

    alert("Jurnal & Foto berhasil disimpan!");
  };

  const handlePulang = async (anak: any) => {
    getaranHalus();
    const dropdownValue = penjemput[anak.id] || "Orang Tua";
    const siapaJemput =
      dropdownValue === "Lainnya"
        ? penjemputCustom[anak.id] || "Lainnya"
        : dropdownValue;
    const detailJemput = ketPenjemput[anak.id] || "";
    const today = getTanggalLokal();

    setStatusAnak((prev) => ({ ...prev, [anak.id]: "pulang" }));
    try {
      await supabase
        .from("kehadiran")
        .update({
          status_hadir: "pulang",
          waktu_pulang: new Date().toISOString(),
          penjemput: siapaJemput,
          keterangan_jemput: detailJemput,
        })
        .eq("murid_id", anak.id)
        .eq("tanggal", today);
      catatKegiatan(
        anak.id,
        `Pulang (Dijemput: ${siapaJemput}${detailJemput ? ` - ${detailJemput}` : ""})`,
        "Kehadiran",
      );

      const dailyMeta = statusDailySheetHarian[anak.id];
      let ringkasanDaily = "";
      if (dailyMeta && (dailyMeta.makan || dailyMeta.tidur || dailyMeta.mood)) {
        ringkasanDaily =
          `\n\n📊 *Daily Sheet Ananda:*\n` +
          (dailyMeta.makan ? `🍱 Porsi Makan: *${dailyMeta.makan}*\n` : "") +
          (dailyMeta.tidur ? `💤 Tidur Siang: *${dailyMeta.tidur}*\n` : "") +
          (dailyMeta.mood ? `😊 Mood Dominan: *${dailyMeta.mood}*\n` : "");
      }

      const logHariIni = logKegiatan[anak.id] || [];
      const rangkumanText = logHariIni
        .filter((l) => l.kategori !== "Kehadiran")
        .map((l) => `- [${l.waktu}] ${l.teks}`)
        .join("\n");

      const pesanFinal = `📖 *Buku Penghubung Digital TK Tadika Mesra*\n\nSyalom Bunda/Ayah,\nHari ini ananda *${anak.nama}* telah mengikuti kegiatan di sekolah dengan baik! ✨\n\n📝 *Aktivitas Hari Ini:*\n${rangkumanText || "- Berkegiatan rutin di kelas"}${ringkasanDaily}\n\n🚗 *Informasi Kepulangan:*\nAnanda telah dijemput oleh: *${siapaJemput}*\n${detailJemput ? `Keterangan: ${detailJemput}` : ""}\n\nTerima kasih atas kepercayaannya Bunda/Ayah. Kurré sumanga'. 🙏`;
      await kirimWA(anak.nomor_hp_ortu, pesanFinal);
    } catch (err) {
      alert("Gagal menyimpan data kepulangan.");
    }
  };

  const handleKirimSiaran = async () => {
    getaranHalus();
    if (!teksSiaran.trim()) return alert("Pesan tidak boleh kosong!");
    setIsBroadcasting(true);
    try {
      let targetPenerima = muridSemua;
      if (tipeSiaran === "spp") {
        targetPenerima = muridSemua.filter(
          (anak) => dapatkanStatusSpp(anak) === "MENUNGGAK",
        );
        if (targetPenerima.length === 0) {
          alert("Semua orang tua di kelas ini sudah lunas SPP.");
          setIsBroadcasting(false);
          setBukaSiaran(false);
          return;
        }
      }
      for (const anak of targetPenerima) {
        await kirimWA(
          anak.nomor_hp_ortu,
          `📢 *PENGUMUMAN KELAS*\n\n${teksSiaran}`,
        );
      }
      alert("Siaran berhasil terkirim!");
    } catch (err) {
      alert("Terjadi kesalahan saat mengirim siaran.");
    } finally {
      setIsBroadcasting(false);
      setBukaSiaran(false);
    }
  };

  const fetchWeeklyReportForChild = async (anak: any) => {
    setIsLoadingWeekly(true);
    setSelectedStudentReport(anak);
    const { start, end } = getWeekRange(weeklyOffset);
    try {
      const { data: hadirData, error: hadirError } = await supabase
        .from("kehadiran")
        .select("*")
        .eq("murid_id", anak.id)
        .gte("tanggal", start)
        .lte("tanggal", end)
        .order("tanggal");
      if (hadirError) throw hadirError;

      const { data: logData, error: logError } = await supabase
        .from("log_aktivitas")
        .select("*")
        .eq("murid_id", anak.id)
        .gte("created_at", `${start}T00:00:00`)
        .lte("created_at", `${end}T23:59:59`);
      if (logError) throw logError;

      const dailyMap: Record<string, any> = {};
      for (
        let d = new Date(start);
        d <= new Date(end);
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toISOString().split("T")[0];
        dailyMap[dateStr] = { hadir: null, kegiatan: [] };
      }
      hadirData?.forEach((h: any) => {
        if (dailyMap[h.tanggal]) {
          dailyMap[h.tanggal].hadir = h;
        }
      });
      logData?.forEach((l: any) => {
        const dateStr = l.created_at.split("T")[0];
        if (dailyMap[dateStr]) {
          dailyMap[dateStr].kegiatan.push(l);
        }
      });

      setWeeklyData({ anak, dailyMap, start, end });
    } catch (err) {
      alert("Gagal memuat laporan mingguan.");
    } finally {
      setIsLoadingWeekly(false);
    }
  };

  const SearchBar = () => (
    <div className="relative mb-4 slide-up z-10">
      <Search
        theme="outline"
        size={18}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
      />
      <input
        type="text"
        placeholder="Cari nama murid..."
        value={cariMurid}
        onChange={(e) => setCariMurid(e.target.value)}
        className="w-full pl-10 pr-10 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400 focus:shadow-[0_0_0_4px_rgba(79,70,229,0.1)] transition-all placeholder:text-slate-500 text-slate-800"
      />
      {cariMurid && (
        <button
          onClick={() => {
            getaranHalus();
            setCariMurid("");
          }}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-800 p-1 active:scale-90 transition-all"
        >
          <Close theme="outline" size={16} strokeWidth={4} />
        </button>
      )}
    </div>
  );

  const renderFotoMurid = (anak: any, className: string) => {
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(anak.nama)}&background=EEF2FF&color=4F46E5&rounded=false&size=64`;
    return (
      <img
        src={anak.foto_url || fallbackUrl}
        onError={(e) => {
          e.currentTarget.src = fallbackUrl;
        }}
        className={className}
        alt={anak.nama}
      />
    );
  };

  // ========== RENDER ==========
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Nunito:wght@700;800;900&display=swap');

          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background: #F1F5F9;
          }
          h1, h2, h3, .font-extrabold {
            font-family: 'Nunito', 'Inter', system-ui, sans-serif;
          }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .glass-panel { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
          .fade-in { animation: fadeIn 0.4s ease-out forwards; }
          .slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
          .scale-in { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
          @keyframes slideUp { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
          @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
          @keyframes scaleIn { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
          .touch-target {
            min-height: 48px;
            min-width: 48px;
          }
          .btn-premium {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
          }
          .btn-premium:active {
            transform: scale(0.96);
            box-shadow: 0 2px 4px -1px rgba(0,0,0,0.1);
          }
          .btn-premium:hover {
            box-shadow: 0 8px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
          }
        `,
        }}
      />

      <div
        className="fixed inset-0 w-full min-h-[100dvh] flex items-center justify-center font-sans bg-slate-100"
        style={{
          backgroundImage: "url('/bg.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[6px]"></div>

        <div className="relative w-full max-w-md h-[100dvh] md:h-[90vh] bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] md:rounded-[2.5rem] flex flex-col overflow-hidden border-0 md:border border-white/80">
          {/* HALAMAN LOGIN */}
          {tampilan === "login" && (
            <div className="flex-1 flex flex-col p-6 bg-white fade-in relative">
              <div className="w-full pt-10 pb-6 flex justify-center">
                <div className="w-12 h-12 relative">
                  <Image
                    src="/piasmart.png"
                    alt="PiaSmart"
                    fill
                    priority
                    className="object-contain opacity-95 drop-shadow-sm"
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center w-full">
                <div className="w-full text-center">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-indigo-200 blur-2xl rounded-full opacity-40"></div>
                    <img
                      src="logo-tk.jpeg"
                      alt="Logo TK"
                      className="relative w-32 h-32 mx-auto shadow-xl rounded-[2rem] border-4 border-white object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://ui-avatars.com/api/?name=TK&background=EEF2FF&color=4F46E5&rounded=false&size=128";
                      }}
                    />
                  </div>
                  <h1 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">
                    TK Tadika Mesra
                  </h1>
                  <p className="text-slate-600 font-bold mb-10 text-[9px] tracking-widest uppercase">
                    Portal Guru Digital
                  </p>

                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center text-indigo-500 space-y-4 mb-8">
                      <Loading
                        theme="outline"
                        size={36}
                        strokeWidth={4}
                        fill="currentColor"
                        className="animate-spin"
                      />
                      <span className="text-sm font-semibold text-slate-600">
                        Menghubungkan ke server...
                      </span>
                    </div>
                  ) : (
                    <div className="relative mb-8 w-full max-w-[300px] mx-auto">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-600">
                        <User
                          theme="outline"
                          size={24}
                          strokeWidth={3}
                          fill="currentColor"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Masukkan nama Anda"
                        className="w-full pl-14 pr-5 py-5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-400 outline-none text-slate-800 font-bold text-base transition-all placeholder:text-slate-500"
                        value={namaGuru}
                        onChange={(e) => setNamaGuru(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="w-full max-w-[300px] mx-auto">
                    <button
                      disabled={isLoading}
                      onClick={() => {
                        getaranHalus();
                        namaGuru
                          ? setTampilan("kelas")
                          : alert("Isi nama dulu!");
                      }}
                      className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-extrabold py-5 rounded-2xl text-base hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.97] transition-all disabled:opacity-50 shadow-xl shadow-indigo-200 btn-premium flex justify-center items-center gap-3"
                    >
                      Masuk Sistem
                      <Login
                        theme="outline"
                        size={24}
                        strokeWidth={4}
                        fill="currentColor"
                      />
                    </button>
                  </div>
                </div>
              </div>
              <div className="w-full pb-4 flex flex-col items-center justify-center opacity-80">
                <span className="text-[8px] text-slate-600 font-bold tracking-widest mb-2 uppercase">
                  Powered By
                </span>
                <div className="w-12 aspect-[5/7] relative">
                  <Image
                    src="/logo-digi.png"
                    alt="Digi.ID"
                    fill
                    className="object-contain grayscale opacity-70"
                  />
                </div>
              </div>
            </div>
          )}

          {/* HALAMAN KELAS */}
          {tampilan === "kelas" && (
            <div className="flex-1 p-6 bg-slate-50 overflow-y-auto hide-scrollbar fade-in">
              <div className="flex justify-between items-center mb-10 mt-4">
                <div>
                  <p className="text-slate-600 font-bold text-xs uppercase tracking-wider mb-1">
                    Selamat Bertugas,
                  </p>
                  <h2 className="text-2xl font-black text-slate-800">
                    Guru {namaGuru}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    getaranHalus();
                    setTampilan("login");
                  }}
                  className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-100 active:scale-95 transition-all touch-target"
                >
                  <Logout
                    theme="outline"
                    size={24}
                    strokeWidth={4}
                    fill="currentColor"
                  />
                </button>
              </div>
              <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-6">
                Pilih Kelas Hari Ini
              </p>
              <div className="space-y-5">
                <button
                  onClick={() => {
                    setKelasAktif("mawar");
                    setTampilan("dashboard");
                    setTabAktif("datang");
                    setCariMurid("");
                  }}
                  className="w-full bg-white border-2 border-indigo-100 p-6 rounded-[2rem] hover:border-indigo-300 active:scale-[0.98] transition-all flex items-center gap-5 text-left group shadow-sm hover:shadow-md"
                >
                  <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <Peoples
                      theme="outline"
                      size={36}
                      strokeWidth={3}
                      fill="currentColor"
                    />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-800">
                      Kelas Mawar
                    </h4>
                    <p className="text-indigo-600 font-bold text-xs mt-2 bg-indigo-50 px-4 py-1.5 rounded-xl inline-block">
                      {dataSemuaMurid.filter((m) => m.kelas === "mawar").length}{" "}
                      Murid
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setKelasAktif("melati");
                    setTampilan("dashboard");
                    setTabAktif("datang");
                    setCariMurid("");
                  }}
                  className="w-full bg-white border-2 border-teal-100 p-6 rounded-[2rem] hover:border-teal-300 active:scale-[0.98] transition-all flex items-center gap-5 text-left group shadow-sm hover:shadow-md"
                >
                  <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-500 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                    <Peoples
                      theme="outline"
                      size={36}
                      strokeWidth={3}
                      fill="currentColor"
                    />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-800">
                      Kelas Melati
                    </h4>
                    <p className="text-teal-600 font-bold text-xs mt-2 bg-teal-50 px-4 py-1.5 rounded-xl inline-block">
                      {
                        dataSemuaMurid.filter((m) => m.kelas === "melati")
                          .length
                      }{" "}
                      Murid
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* HALAMAN DASHBOARD */}
          {tampilan === "dashboard" && (
            <div className="flex flex-col h-full relative fade-in">
              <div className="glass-panel z-40 sticky top-0 px-6 pt-12 pb-4 border-b border-slate-200/50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                        kelasAktif === "mawar" ? "bg-indigo-500" : "bg-teal-500"
                      }`}
                    >
                      <Peoples
                        theme="outline"
                        size={28}
                        strokeWidth={3}
                        fill="currentColor"
                      />
                    </div>
                    <div>
                      <h1 className="text-xl font-black text-slate-800 leading-tight">
                        Kelas {kelasAktif === "mawar" ? "Mawar" : "Melati"}
                      </h1>
                      <div className="mt-1 inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        <User theme="filled" size={12} /> 1 Guru :{" "}
                        {muridHadir.length} Hadir
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      getaranHalus();
                      setTampilan("kelas");
                    }}
                    className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 active:scale-95 transition-all touch-target"
                  >
                    <Left
                      theme="outline"
                      size={24}
                      strokeWidth={4}
                      fill="currentColor"
                    />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pt-6 pb-[180px] hide-scrollbar relative">
                {tabAktif !== "laporan" && <SearchBar />}

                {/* TAB: DATANG */}
                {tabAktif === "datang" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end mb-6">
                      <h2 className="font-black text-slate-800 text-xl tracking-tight">
                        Check‑In Pagi
                      </h2>
                      <span className="bg-indigo-50 text-indigo-600 text-xs font-extrabold px-4 py-2 rounded-xl border border-indigo-100">
                        Belum Hadir: {muridBelumHadirFilter.length}
                      </span>
                    </div>
                    {muridBelumHadirFilter.map((anak, i) => (
                      <div
                        key={anak.id}
                        className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between slide-up"
                        style={{ animationDelay: `${i * 0.06}s` }}
                      >
                        <div className="flex items-center gap-4">
                          {renderFotoMurid(
                            anak,
                            "w-16 h-16 rounded-2xl object-cover border-2 border-slate-50 shadow-sm",
                          )}
                          <span className="font-bold text-slate-800 text-base">
                            {anak.nama}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => bukaChatPersonal(anak)}
                            className="bg-indigo-50 text-indigo-600 p-1.5 rounded-2xl hover:bg-indigo-100 transition-all active:scale-95"
                          >
                            <Message
                              theme="outline"
                              size={16}
                              strokeWidth={4}
                            />
                          </button>
                          <button
                            onClick={() => handleDatang(anak)}
                            className="bg-orange-500 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-lg shadow-orange-200 active:scale-95 transition-all btn-premium text-sm"
                          >
                            Hadir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB: KEGIATAN */}
                {tabAktif === "kegiatan" && (
                  <div className="space-y-6">
                    <h2 className="font-black text-slate-800 text-xl tracking-tight mb-2">
                      Aktivitas & Daily Sheet
                    </h2>
                    {muridHadirFilter.length === 0 ? (
                      <div className="text-center py-16 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                        <Attention
                          theme="filled"
                          size={48}
                          fill="#94A3B8"
                          className="mx-auto mb-3"
                        />
                        <h3 className="font-black text-slate-700 text-base">
                          Kelas Kosong / Tak Ditemukan
                        </h3>
                      </div>
                    ) : (
                      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 slide-up">
                        <div className="flex justify-between items-center mb-4">
                          <label className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
                            <CheckOne size={18} /> 1. Peserta
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                getaranHalus();
                                setPilihanAnak(
                                  muridHadirFilter
                                    .filter((m) => {
                                      const d = statusDailySheetHarian[m.id];
                                      return (
                                        !d || (!d.makan && !d.tidur && !d.mood)
                                      );
                                    })
                                    .map((m) => m.id),
                                );
                              }}
                              className="text-[10px] font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl active:scale-95 hover:bg-rose-100 transition-colors"
                            >
                              Pilih Belum
                            </button>
                            <button
                              onClick={() => {
                                getaranHalus();
                                setPilihanAnak(
                                  pilihanAnak.length === muridHadirFilter.length
                                    ? []
                                    : muridHadirFilter.map((m) => m.id),
                                );
                              }}
                              className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl active:scale-95 hover:bg-indigo-100 transition-colors"
                            >
                              {pilihanAnak.length === muridHadirFilter.length
                                ? "Batal"
                                : "Semua"}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 mb-6 max-h-56 overflow-y-auto hide-scrollbar bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          {muridHadirFilter.map((anak) => {
                            const isSelected = pilihanAnak.includes(anak.id);
                            const dailyData = statusDailySheetHarian[anak.id];
                            const hasDailyData =
                              !!dailyData &&
                              (dailyData.makan ||
                                dailyData.tidur ||
                                dailyData.mood);

                            return (
                              <button
                                key={anak.id}
                                onClick={() => {
                                  getaranHalus();
                                  setPilihanAnak((prev) =>
                                    prev.includes(anak.id)
                                      ? prev.filter((id) => id !== anak.id)
                                      : [...prev, anak.id],
                                  );
                                }}
                                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-left transition-all active:scale-95 border-2 ${
                                  isSelected
                                    ? "bg-indigo-50 border-indigo-400 shadow-sm"
                                    : "bg-white border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                {renderFotoMurid(
                                  anak,
                                  "w-10 h-10 rounded-xl object-cover border border-slate-100",
                                )}
                                <span
                                  className={`text-xs font-bold ${
                                    isSelected
                                      ? "text-indigo-700"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {anak.nama}
                                </span>
                                {hasDailyData && (
                                  <div className="flex items-center gap-1 ml-1">
                                    {dailyData.makan && (
                                      <Bowl
                                        theme="filled"
                                        size={16}
                                        className="text-green-500"
                                      />
                                    )}
                                    {dailyData.tidur && (
                                      <SleepOne
                                        theme="filled"
                                        size={16}
                                        className="text-violet-500"
                                      />
                                    )}
                                    {dailyData.mood && (
                                      <EmotionHappy
                                        theme="filled"
                                        size={16}
                                        className={
                                          dailyData.mood === "Senang"
                                            ? "text-yellow-500"
                                            : dailyData.mood === "Biasa"
                                              ? "text-gray-500"
                                              : "text-red-500"
                                        }
                                      />
                                    )}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <MagicWand size={16} /> 2. Jurnal & Foto
                        </label>
                        <textarea
                          placeholder="Ketik aktivitas anak di sini..."
                          className="w-full min-h-[100px] p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl mb-4 outline-none focus:border-indigo-400 text-slate-800 text-sm font-semibold resize-y placeholder:text-slate-500"
                          value={jenisKegiatan}
                          onChange={(e) => setJenisKegiatan(e.target.value)}
                        />
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setFotoAktivitas(e.target.files[0]);
                            }
                          }}
                          className="block w-full text-[10px] text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-bold file:bg-indigo-50 file:text-indigo-600 mb-6"
                        />
                        <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Bowl size={16} /> 3. Daily Sheet Cepat
                        </label>
                        <div className="space-y-5 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                          <div>
                            <p className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2">
                              <Bowl theme="outline" size={18} /> Makan Siang
                            </p>
                            <div className="flex gap-3">
                              {["Habis", "Setengah", "Tidak Mau"].map(
                                (opsi) => (
                                  <button
                                    key={opsi}
                                    onClick={() =>
                                      setDailyMakan(
                                        dailyMakan === opsi ? "" : opsi,
                                      )
                                    }
                                    className={`flex-1 py-3 text-xs font-bold rounded-xl border active:scale-95 transition-all ${
                                      dailyMakan === opsi
                                        ? "bg-amber-100 border-amber-400 text-amber-800 shadow-sm"
                                        : "bg-white border-slate-200 text-slate-700"
                                    }`}
                                  >
                                    {opsi}
                                  </button>
                                ),
                              )}
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
                                <SleepOne theme="outline" size={18} /> Tidur
                                Mulai
                              </p>
                              <input
                                type="time"
                                value={dailyTidurMulai}
                                onChange={(e) =>
                                  setDailyTidurMulai(e.target.value)
                                }
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-700 mb-2">
                                Selesai
                              </p>
                              <input
                                type="time"
                                value={dailyTidurSelesai}
                                onChange={(e) =>
                                  setDailyTidurSelesai(e.target.value)
                                }
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2">
                              <EmotionHappy theme="outline" size={18} /> Mood
                              Anak
                            </p>
                            <div className="flex gap-3">
                              {[
                                {
                                  label: "Senang",
                                  icon: "😊",
                                  activeClass:
                                    "bg-emerald-100 border-emerald-400 text-emerald-800 font-extrabold",
                                },
                                {
                                  label: "Biasa",
                                  icon: "😐",
                                  activeClass:
                                    "bg-indigo-100 border-indigo-400 text-indigo-800 font-extrabold",
                                },
                                {
                                  label: "Rewel",
                                  icon: "😭",
                                  activeClass:
                                    "bg-rose-100 border-rose-400 text-rose-800 font-extrabold",
                                },
                              ].map((m) => {
                                const isActive = dailyMood === m.label;
                                return (
                                  <button
                                    key={m.label}
                                    onClick={() =>
                                      setDailyMood(isActive ? "" : m.label)
                                    }
                                    className={`flex-1 py-3 text-sm rounded-xl border flex justify-center items-center gap-2 active:scale-95 transition-all ${
                                      isActive
                                        ? m.activeClass
                                        : "bg-white border-slate-200 text-slate-600 grayscale opacity-70"
                                    }`}
                                  >
                                    <span className="text-lg">{m.icon}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">
                                      {m.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={simpanKegiatanMassal}
                          disabled={isSaving}
                          className="w-full bg-indigo-600 text-white font-extrabold py-5 rounded-2xl active:scale-[0.97] transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 btn-premium text-base"
                        >
                          {isSaving ? (
                            <Loading
                              theme="outline"
                              size={24}
                              strokeWidth={4}
                              className="animate-spin"
                            />
                          ) : (
                            <Save
                              theme="outline"
                              size={24}
                              strokeWidth={4}
                              fill="currentColor"
                            />
                          )}
                          <span>Kirim Jurnal & Sheet</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: PULANG */}
                {tabAktif === "pulang" && (
                  <div className="space-y-6">
                    <h2 className="font-black text-slate-800 text-xl tracking-tight mb-4">
                      Check‑Out
                    </h2>
                    {muridHadirFilter.map((anak, i) => (
                      <div
                        key={anak.id}
                        className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 slide-up"
                        style={{ animationDelay: `${i * 0.06}s` }}
                      >
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                          <div className="flex items-center gap-4">
                            {renderFotoMurid(
                              anak,
                              "w-16 h-16 rounded-2xl object-cover border-2 border-slate-50 shadow-sm",
                            )}
                            <span className="font-bold text-slate-800 text-lg">
                              {anak.nama}
                            </span>
                          </div>
                          <button
                            onClick={() => bukaChatPersonal(anak)}
                            className="bg-indigo-50 text-indigo-600 p-1.5 rounded-2xl hover:bg-indigo-100 transition-all active:scale-95"
                          >
                            <Message
                              theme="outline"
                              size={16}
                              strokeWidth={4}
                            />
                          </button>
                        </div>
                        <div className="space-y-5">
                          <select
                            className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-800 text-sm font-bold outline-none focus:border-indigo-400 transition-all"
                            value={penjemput[anak.id] || "Orang Tua"}
                            onChange={(e) =>
                              setPenjemput((prev) => ({
                                ...prev,
                                [anak.id]: e.target.value,
                              }))
                            }
                          >
                            <option value="Orang Tua">Orang Tua Kandung</option>
                            <option value="Kakek/Nenek">Kakek / Nenek</option>
                            <option value="Driver">Driver Jemputan</option>
                            <option value="Lainnya">Lainnya...</option>
                          </select>
                          {(penjemput[anak.id] === "Lainnya" ||
                            !penjemput[anak.id]) && (
                            <input
                              type="text"
                              placeholder="Tuliskan nama penjemput"
                              className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-indigo-400 text-slate-800 text-sm font-semibold transition-all placeholder:text-slate-500"
                              value={penjemputCustom[anak.id] || ""}
                              onChange={(e) =>
                                setPenjemputCustom((prev) => ({
                                  ...prev,
                                  [anak.id]: e.target.value,
                                }))
                              }
                            />
                          )}
                          <input
                            type="text"
                            placeholder="Catatan Baju / Plat Nomor..."
                            className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-indigo-400 text-slate-800 text-sm font-semibold transition-all placeholder:text-slate-500"
                            value={ketPenjemput[anak.id] || ""}
                            onChange={(e) =>
                              setKetPenjemput((prev) => ({
                                ...prev,
                                [anak.id]: e.target.value,
                              }))
                            }
                          />
                          <button
                            onClick={() => handlePulang(anak)}
                            className="w-full mt-4 bg-orange-500 text-white font-extrabold py-5 rounded-2xl hover:bg-orange-400 active:scale-[0.97] transition-all text-base flex items-center justify-center gap-3 shadow-xl shadow-orange-200 btn-premium"
                          >
                            <Home
                              theme="outline"
                              size={24}
                              strokeWidth={4}
                              fill="currentColor"
                            />
                            <span>Pulangkan & Kirim Notif</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB: KEUANGAN SPP */}
                {tabAktif === "keuangan" && (
                  <div className="space-y-5">
                    <h2 className="font-black text-slate-800 text-xl tracking-tight mb-4">
                      Status SPP
                    </h2>
                    <div className="mb-6 slide-up">
                      <button
                        onClick={handleResetDanTagihSppMassal}
                        disabled={isResettingSpp}
                        className="w-full bg-slate-900 text-white p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:bg-slate-800 active:scale-95 transition-all shadow-2xl shadow-slate-300 disabled:opacity-50 btn-premium"
                      >
                        {isResettingSpp ? (
                          <Loading
                            theme="outline"
                            size={32}
                            className="animate-spin text-indigo-300"
                          />
                        ) : (
                          <Calendar
                            theme="outline"
                            size={32}
                            className="text-indigo-300"
                          />
                        )}
                        <span className="font-black text-base tracking-wide">
                          Mulai Penagihan Bulan Baru
                        </span>
                        <span className="text-xs text-slate-300 text-center font-medium leading-relaxed">
                          Set semua murid menjadi menunggak & Kirim WA tagihan
                          massal secara otomatis
                        </span>
                      </button>
                    </div>
                    <div className="space-y-4">
                      {muridSemuaFilter.map((anak, i) => {
                        const statusSpp = dapatkanStatusSpp(anak);
                        return (
                          <div
                            key={anak.id}
                            className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between slide-up"
                            style={{ animationDelay: `${i * 0.05}s` }}
                          >
                            <div className="flex items-center gap-4">
                              {renderFotoMurid(
                                anak,
                                "w-14 h-14 rounded-2xl border-2 border-slate-50 object-cover shadow-sm",
                              )}
                              <span className="font-bold text-slate-800 text-base">
                                {anak.nama}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => bukaChatPersonal(anak)}
                                className="bg-indigo-50 text-indigo-600 p-1.5 rounded-2xl hover:bg-indigo-100 transition-all active:scale-95"
                              >
                                <Message
                                  theme="outline"
                                  size={16}
                                  strokeWidth={4}
                                />
                              </button>
                              <button
                                onClick={() => toggleSpp(anak.id, statusSpp)}
                                className={`px-6 py-3 rounded-2xl font-black text-xs transition-all active:scale-95 border-2 ${
                                  statusSpp === "LUNAS"
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                    : "bg-rose-50 text-rose-600 border-rose-100"
                                }`}
                              >
                                {statusSpp === "LUNAS" ? "LUNAS" : "MENUNGGAK"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB: LAPORAN (dengan sub-tab Harian & Mingguan) */}
                {tabAktif === "laporan" && (
                  <div className="space-y-6">
                    <h2 className="font-black text-slate-800 text-xl tracking-tight mb-2">
                      Laporan
                    </h2>

                    {/* Sub-navigation Harian / Mingguan */}
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl mb-4">
                      <button
                        onClick={() => {
                          setSubTabLaporan("harian");
                          setSelectedStudentReport(null);
                        }}
                        className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all ${
                          subTabLaporan === "harian"
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-slate-600"
                        }`}
                      >
                        Harian
                      </button>
                      <button
                        onClick={() => {
                          setSubTabLaporan("mingguan");
                          setSelectedStudentReport(null);
                          setWeeklyData(null);
                        }}
                        className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all ${
                          subTabLaporan === "mingguan"
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-slate-600"
                        }`}
                      >
                        Mingguan
                      </button>
                    </div>

                    {/* Konten sub-tab */}
                    {subTabLaporan === "harian" && (
                      <>
                        <p className="text-xs font-bold text-slate-600">
                          Klik anak untuk melihat laporan hari ini
                        </p>
                        <div className="space-y-3">
                          {muridSemuaFilter.map((anak) => (
                            <button
                              key={anak.id}
                              onClick={() => {
                                getaranHalus();
                                setSelectedStudentReport(
                                  selectedStudentReport?.id === anak.id
                                    ? null
                                    : anak,
                                );
                              }}
                              className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between active:scale-[0.98] transition-all"
                            >
                              <div className="flex items-center gap-4">
                                {renderFotoMurid(
                                  anak,
                                  "w-12 h-12 rounded-xl object-cover border border-slate-100",
                                )}
                                <span className="font-bold text-slate-800 text-sm">
                                  {anak.nama}
                                </span>
                              </div>
                              <ArrowRight
                                theme="outline"
                                size={20}
                                className="text-slate-600"
                              />
                            </button>
                          ))}
                        </div>

                        {/* Detail laporan harian */}
                        {selectedStudentReport && (
                          <div className="mt-4 p-5 bg-white rounded-[2rem] shadow-sm border border-slate-100 slide-up">
                            <h3 className="font-black text-indigo-700 text-base mb-3">
                              Laporan Hari Ini: {selectedStudentReport.nama}
                            </h3>
                            <div className="space-y-2 text-xs text-slate-800">
                              <p>
                                <span className="font-bold">Status:</span>{" "}
                                {statusAnak[selectedStudentReport.id] ===
                                "hadir"
                                  ? "Hadir"
                                  : statusAnak[selectedStudentReport.id] ===
                                      "pulang"
                                    ? "Sudah Pulang"
                                    : "Belum Hadir"}
                              </p>
                              {statusAnak[selectedStudentReport.id] && (
                                <>
                                  <p>
                                    <span className="font-bold">Datang:</span>{" "}
                                    {statusAnak[selectedStudentReport.id] !==
                                    "belum"
                                      ? new Date().toLocaleTimeString("id-ID", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "-"}
                                  </p>
                                  <p>
                                    <span className="font-bold">Pulang:</span>{" "}
                                    {statusAnak[selectedStudentReport.id] ===
                                    "pulang"
                                      ? new Date().toLocaleTimeString("id-ID", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "-"}
                                  </p>
                                </>
                              )}
                              {logKegiatan[selectedStudentReport.id] && (
                                <div>
                                  <span className="font-bold">Aktivitas:</span>
                                  <ul className="list-disc pl-5 mt-1">
                                    {logKegiatan[selectedStudentReport.id].map(
                                      (log: any, idx: number) => (
                                        <li key={idx}>
                                          [{log.waktu}] {log.teks}
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              )}
                              {statusDailySheetHarian[
                                selectedStudentReport.id
                              ] && (
                                <div>
                                  <span className="font-bold">
                                    Daily Sheet:
                                  </span>
                                  <div className="flex gap-3 mt-1">
                                    {statusDailySheetHarian[
                                      selectedStudentReport.id
                                    ].makan && (
                                      <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-lg text-[10px] font-bold">
                                        🍱{" "}
                                        {
                                          statusDailySheetHarian[
                                            selectedStudentReport.id
                                          ].makan
                                        }
                                      </span>
                                    )}
                                    {statusDailySheetHarian[
                                      selectedStudentReport.id
                                    ].tidur && (
                                      <span className="bg-violet-100 text-violet-800 px-2 py-1 rounded-lg text-[10px] font-bold">
                                        💤{" "}
                                        {
                                          statusDailySheetHarian[
                                            selectedStudentReport.id
                                          ].tidur
                                        }
                                      </span>
                                    )}
                                    {statusDailySheetHarian[
                                      selectedStudentReport.id
                                    ].mood && (
                                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-[10px] font-bold">
                                        😊{" "}
                                        {
                                          statusDailySheetHarian[
                                            selectedStudentReport.id
                                          ].mood
                                        }
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {subTabLaporan === "mingguan" && (
                      <>
                        {/* Navigasi minggu */}
                        <div className="flex items-center justify-between mb-4">
                          <button
                            onClick={() => setWeeklyOffset(weeklyOffset - 1)}
                            className="p-3 bg-white border border-slate-200 rounded-xl active:scale-95 touch-target"
                          >
                            <ArrowLeft
                              theme="outline"
                              size={20}
                              className="text-slate-700"
                            />
                          </button>
                          <span className="font-black text-xs bg-indigo-50 px-4 py-2 rounded-xl text-indigo-700">
                            {getWeekRange(
                              weeklyOffset,
                            ).mondayDate.toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            -{" "}
                            {getWeekRange(
                              weeklyOffset,
                            ).sundayDate.toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                          <button
                            onClick={() => setWeeklyOffset(weeklyOffset + 1)}
                            className="p-3 bg-white border border-slate-200 rounded-xl active:scale-95 touch-target"
                          >
                            <ArrowRight
                              theme="outline"
                              size={20}
                              className="text-slate-700"
                            />
                          </button>
                        </div>

                        <p className="text-xs font-bold text-slate-600 mb-2">
                          Klik anak untuk melihat laporan mingguan
                        </p>
                        <div className="space-y-3">
                          {muridSemuaFilter.map((anak) => (
                            <button
                              key={anak.id}
                              onClick={() => fetchWeeklyReportForChild(anak)}
                              className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between active:scale-[0.98] transition-all"
                            >
                              <div className="flex items-center gap-4">
                                {renderFotoMurid(
                                  anak,
                                  "w-12 h-12 rounded-xl object-cover border border-slate-100",
                                )}
                                <span className="font-bold text-slate-800 text-sm">
                                  {anak.nama}
                                </span>
                              </div>
                              <ArrowRight
                                theme="outline"
                                size={20}
                                className="text-slate-600"
                              />
                            </button>
                          ))}
                        </div>

                        {/* Detail laporan mingguan */}
                        {isLoadingWeekly && (
                          <div className="flex justify-center py-8">
                            <Loading
                              className="animate-spin text-indigo-500"
                              size={32}
                            />
                          </div>
                        )}
                        {weeklyData && !isLoadingWeekly && (
                          <div className="mt-4 p-5 bg-white rounded-[2rem] shadow-sm border border-slate-100 slide-up">
                            <h3 className="font-black text-indigo-700 text-base mb-4">
                              Laporan Mingguan: {weeklyData.anak.nama}
                            </h3>
                            <div className="space-y-4">
                              {Object.entries(weeklyData.dailyMap).map(
                                ([date, data]: [string, any]) => {
                                  const hari = new Date(
                                    date,
                                  ).toLocaleDateString("id-ID", {
                                    weekday: "short",
                                    day: "numeric",
                                  });
                                  return (
                                    <div
                                      key={date}
                                      className="p-3 bg-slate-50 rounded-xl"
                                    >
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="font-extrabold text-slate-700 text-xs">
                                          {hari}
                                        </span>
                                        <span
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                                            data.hadir
                                              ? data.hadir.status_hadir ===
                                                  "hadir" ||
                                                data.hadir.status_hadir ===
                                                  "pulang"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-rose-100 text-rose-700"
                                              : "bg-slate-200 text-slate-600"
                                          }`}
                                        >
                                          {data.hadir
                                            ? data.hadir.status_hadir ===
                                              "pulang"
                                              ? "Pulang"
                                              : data.hadir.status_hadir
                                            : "Tanpa Data"}
                                        </span>
                                      </div>
                                      {data.kegiatan.length > 0 && (
                                        <ul className="text-[10px] text-slate-600 list-disc pl-4">
                                          {data.kegiatan.map(
                                            (k: any, i: number) => (
                                              <li key={i}>{k.deskripsi}</li>
                                            ),
                                          )}
                                        </ul>
                                      )}
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* MODAL CHAT PERSONAL 1:1 */}
              {chatPersonalAktif && (
                <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-[6px] flex items-end justify-center sm:items-center sm:p-4 fade-in">
                  <div className="bg-white w-full rounded-t-[3rem] sm:rounded-3xl shadow-2xl flex flex-col h-[80vh] sm:h-auto sm:max-h-[85vh] slide-up">
                    <div className="w-full flex justify-center pt-4 pb-2 sm:hidden">
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full"></div>
                    </div>
                    <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100">
                      <h2 className="text-lg font-black text-slate-800 flex items-center gap-3 truncate">
                        <Message
                          theme="outline"
                          size={28}
                          strokeWidth={4}
                          fill="currentColor"
                          className="text-indigo-500"
                        />
                        Chat: {chatPersonalAktif.nama}
                      </h2>
                      <button
                        onClick={() => setChatPersonalAktif(null)}
                        className="p-3 text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors active:scale-90 touch-target"
                      >
                        <Close
                          theme="outline"
                          size={24}
                          strokeWidth={4}
                          fill="currentColor"
                        />
                      </button>
                    </div>
                    <div className="p-6 overflow-y-auto flex-1 hide-scrollbar flex flex-col">
                      <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-4">
                        Tulis Pesan
                      </label>
                      <textarea
                        className="w-full flex-1 min-h-[220px] p-5 bg-slate-50 border-2 border-slate-200 rounded-3xl outline-none focus:border-indigo-400 text-slate-800 font-semibold text-sm resize-none mb-6 transition-all leading-relaxed placeholder:text-slate-500"
                        value={teksChatPersonal}
                        onChange={(e) => setTeksChatPersonal(e.target.value)}
                      />
                      <button
                        disabled={isMengirimChat}
                        onClick={handleKirimChatPersonal}
                        className="w-full bg-indigo-600 text-white font-extrabold py-5 rounded-2xl active:scale-[0.97] transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 btn-premium text-base disabled:opacity-70"
                      >
                        {isMengirimChat ? (
                          <Loading
                            theme="outline"
                            size={24}
                            strokeWidth={4}
                            className="animate-spin"
                          />
                        ) : (
                          <Send
                            theme="outline"
                            size={24}
                            strokeWidth={4}
                            fill="currentColor"
                          />
                        )}
                        <span>Kirim via WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* FAB BROADCAST */}
              <button
                onClick={() => {
                  getaranHalus();
                  setBukaSiaran(true);
                }}
                className="absolute bottom-[120px] right-6 bg-orange-500 text-white w-16 h-16 rounded-full shadow-[0_15px_35px_rgba(249,115,22,0.4)] hover:bg-orange-600 active:scale-90 z-30 transition-all flex items-center justify-center btn-premium"
              >
                <VolumeNotice
                  theme="outline"
                  size={30}
                  strokeWidth={3}
                  fill="#fff"
                />
              </button>

              {/* MODAL SIARAN WA */}
              {bukaSiaran && (
                <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-[6px] flex items-end justify-center sm:items-center sm:p-4 fade-in">
                  <div className="bg-white w-full rounded-t-[3rem] sm:rounded-3xl shadow-2xl flex flex-col h-[85vh] sm:h-auto sm:max-h-[85vh] slide-up">
                    <div className="w-full flex justify-center pt-4 pb-2 sm:hidden">
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full"></div>
                    </div>
                    <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100">
                      <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <VolumeNotice
                          theme="outline"
                          size={28}
                          strokeWidth={4}
                          fill="currentColor"
                          className="text-orange-500"
                        />
                        Pusat Siaran
                      </h2>
                      <button
                        onClick={() => {
                          getaranHalus();
                          setBukaSiaran(false);
                        }}
                        className="p-3 text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors active:scale-90 touch-target"
                      >
                        <Close
                          theme="outline"
                          size={24}
                          strokeWidth={4}
                          fill="currentColor"
                        />
                      </button>
                    </div>
                    <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
                      <div className="flex gap-3 overflow-x-auto pb-5 mb-5 hide-scrollbar">
                        <button
                          onClick={() => {
                            getaranHalus();
                            setTipeSiaran("umum");
                            setTeksSiaran(TEMPLATE_PESAN.umum);
                          }}
                          className={`px-6 py-4 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border-2 ${
                            tipeSiaran === "umum"
                              ? "bg-indigo-50 border-indigo-400 text-indigo-700"
                              : "bg-white border-slate-200 text-slate-700"
                          }`}
                        >
                          Info Umum
                        </button>
                        <button
                          onClick={() => {
                            getaranHalus();
                            setTipeSiaran("spp");
                            setTeksSiaran(TEMPLATE_PESAN.spp);
                          }}
                          className={`px-6 py-4 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border-2 ${
                            tipeSiaran === "spp"
                              ? "bg-indigo-50 border-indigo-400 text-indigo-700"
                              : "bg-white border-slate-200 text-slate-700"
                          }`}
                        >
                          Tagihan SPP
                        </button>
                      </div>
                      <textarea
                        className="w-full flex-1 min-h-[240px] p-5 bg-slate-50 border-2 border-slate-200 rounded-3xl outline-none focus:border-indigo-400 text-slate-800 font-semibold text-sm resize-none mb-6 transition-all placeholder:text-slate-500"
                        value={teksSiaran}
                        onChange={(e) => setTeksSiaran(e.target.value)}
                      />
                      <button
                        disabled={isBroadcasting}
                        onClick={handleKirimSiaran}
                        className="w-full bg-slate-900 text-white font-extrabold py-5 rounded-2xl active:scale-[0.97] transition-all flex justify-center gap-3 shadow-xl shadow-slate-300 btn-premium text-base"
                      >
                        {isBroadcasting ? (
                          <Loading
                            theme="outline"
                            size={24}
                            className="animate-spin"
                          />
                        ) : (
                          <Send theme="outline" size={24} fill="currentColor" />
                        )}
                        <span>Kirim Broadcast</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* BOTTOM NAVIGATION BARS */}
              <div className="absolute bottom-5 left-4 right-4 z-40 bg-white/95 backdrop-blur-xl border border-slate-200/80 p-2 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] flex justify-between gap-1 overflow-x-auto hide-scrollbar">
                <button
                  onClick={() => {
                    getaranHalus();
                    setTabAktif("datang");
                    setCariMurid("");
                  }}
                  className={`flex-1 min-w-[64px] py-3 rounded-2xl flex flex-col items-center transition-all ${
                    tabAktif === "datang"
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <Login size={26} className="mb-1" strokeWidth={3} />
                  <span className="text-[9px] font-black uppercase">Tiba</span>
                </button>
                <button
                  onClick={() => {
                    getaranHalus();
                    setTabAktif("kegiatan");
                    setCariMurid("");
                  }}
                  className={`flex-1 min-w-[64px] py-3 rounded-2xl flex flex-col items-center transition-all ${
                    tabAktif === "kegiatan"
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <Box size={26} className="mb-1" strokeWidth={3} />
                  <span className="text-[9px] font-black uppercase">
                    Aktivitas
                  </span>
                </button>
                <button
                  onClick={() => {
                    getaranHalus();
                    setTabAktif("pulang");
                    setCariMurid("");
                  }}
                  className={`flex-1 min-w-[64px] py-3 rounded-2xl flex flex-col items-center transition-all ${
                    tabAktif === "pulang"
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <Logout size={26} className="mb-1" strokeWidth={3} />
                  <span className="text-[9px] font-black uppercase">
                    Pulang
                  </span>
                </button>
                <button
                  onClick={() => {
                    getaranHalus();
                    setTabAktif("keuangan");
                    setCariMurid("");
                  }}
                  className={`flex-1 min-w-[64px] py-3 rounded-2xl flex flex-col items-center transition-all ${
                    tabAktif === "keuangan"
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <BankCard size={26} className="mb-1" strokeWidth={3} />
                  <span className="text-[9px] font-black uppercase">SPP</span>
                </button>
                <button
                  onClick={() => {
                    getaranHalus();
                    setTabAktif("laporan");
                    setCariMurid("");
                  }}
                  className={`flex-1 min-w-[64px] py-3 rounded-2xl flex flex-col items-center transition-all ${
                    tabAktif === "laporan"
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <Notes size={26} className="mb-1" strokeWidth={3} />
                  <span className="text-[9px] font-black uppercase">
                    Laporan
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
