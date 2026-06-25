"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { VolumeNotice } from "@icon-park/react";

import LoginScreen from "./components/LoginScreen";
import KelasScreen from "./components/KelasScreen";
import DashboardHeader from "./components/dashboard/DashboardHeader";
import TabDatang from "./components/dashboard/TabDatang";
import TabKegiatan from "./components/dashboard/TabKegiatan";
import TabPulang from "./components/dashboard/TabPulang";
import TabKeuangan from "./components/dashboard/TabKeuangan";
import TabLaporan from "./components/dashboard/TabLaporan";
import BottomNav from "./components/BottomNav";
import SearchBar from "./components/SearchBar";
import ChatModal from "./components/modals/ChatModal";
import BroadcastModal from "./components/modals/BroadcastModal";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TEMPLATE_PESAN = {
  umum:
    "Halo Bunda/Ayah yang luar biasa! 🌸\n\n" +
    "Ada info penting dari TK Tadika Mesra untuk hari ini:\n\n" +
    "[TULIS PESAN DI SINI]\n\n" +
    "Terima kasih banyak atas perhatian dan dukungannya ya! Semoga harinya menyenangkan. ✨",
  spp:
    "Halo Bunda/Ayah hebat! 💐\n\n" +
    "Semoga keluarga sehat dan bahagia selalu. Ini pesan pengingat dari kami di administrasi TK Tadika Mesra, bahwa pembayaran SPP bulan ini mungkin terlewat.\n\n" +
    "Tapi tidak perlu khawatir ya — kalau sudah selesai, abaikan saja pesan ini. Terima kasih banyak atas dukungannya yang luar biasa demi kelancaran belajar ananda. 🙏😊",
  bekal:
    "Halo Bunda/Ayah tercinta! 🎒\n\n" +
    "Agar ananda makin semangat dan nyaman beraktivitas di sekolah hari ini, mohon dibekali ya dengan:\n\n" +
    "- Botol minum pribadi\n" +
    "- [TAMBAHKAN KEBUTUHAN LAIN]\n\n" +
    "Kerja sama Bunda/Ayah sangat berarti. Semoga harinya ceria! 🌈",
};

const getTanggalLokal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

const getWeekRange = (offset: number = 0) => {
  const now = new Date();
  const day = now.getDay();
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
  // ---------- STATE ----------
  const [tampilan, setTampilan] = useState("login");
  const [namaGuru, setNamaGuru] = useState("");
  const [pinLogin, setPinLogin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isCheckingPin, setIsCheckingPin] = useState(false);
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

  const [labelAktivitas, setLabelAktivitas] = useState("");

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

  const [showUploadObj, setShowUploadObj] = useState<Record<string, boolean>>(
    {},
  );
  const [strukFileObj, setStrukFileObj] = useState<Record<string, File | null>>(
    {},
  );
  const [isUploadingStrukObj, setIsUploadingStrukObj] = useState<
    Record<string, boolean>
  >({});

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

  // ---------- DRAFT & FETCHING ----------
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

  // ---------- DERIVED DATA ----------
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

  const handleLogin = async () => {
    if (!pinLogin.trim()) {
      setLoginError("Masukkan PIN terlebih dahulu.");
      return;
    }
    setIsCheckingPin(true);
    setLoginError("");
    try {
      const { data, error } = await supabase
        .from("guru")
        .select("nama")
        .eq("pin_login", pinLogin.trim())
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        setLoginError("PIN tidak dikenali. Coba lagi.");
        setIsCheckingPin(false);
        return;
      }
      setNamaGuru(data.nama);
      setTampilan("kelas");
    } catch (err) {
      setLoginError("Gagal memeriksa PIN. Periksa koneksi.");
    } finally {
      setIsCheckingPin(false);
    }
  };

  // ---------- FUNGSI BISNIS ----------
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
    if (
      !confirm(
        "PENTING!\nTindakan ini akan mengubah status SPP semua murid di kelas ini menjadi MENUNGGAK, lalu otomatis mengirim pesan WA tagihan kepada mereka.\n\nLanjutkan?",
      )
    )
      return;
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
        await kirimWA(
          anak.nomor_hp_ortu,
          `📢 *INFO ADMINISTRASI KELAS*\n\n${TEMPLATE_PESAN.spp}`,
        );
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
    setTeksChatPersonal(
      `Halo Bunda/Ayah Ananda ${anak.nama} yang hebat! 🌼\n\n`,
    );
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
      const pesanDatang =
        `🌸 Halo Bunda/Ayah! 🌸\n\n` +
        `Kabar gembira! Ananda *${anak.nama}* sudah sampai di sekolah dengan selamat pada pukul *${timeDatang}*.\n\n` +
        `Semoga hari ini penuh tawa, belajar seru, dan bermain asyik ya! Sampai jumpa nanti. 🥰✨`;
      await kirimWA(anak.nomor_hp_ortu, pesanDatang);
    } catch (err) {
      alert("Gagal menyimpan data kehadiran.");
    }
  };

  const handlePilihLabel = (label: string) => {
    setLabelAktivitas(label);
    const templates: Record<string, string> = {
      motorik: "🏃 Melatih motorik melalui: ",
      kognitif: "🧠 Mengasah kognitif dengan: ",
      sosial: "💬 Belajar sosial-emosional lewat: ",
    };
    if (label && templates[label]) {
      setJenisKegiatan(templates[label]);
    } else {
      setJenisKegiatan("");
    }
  };

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
    )
      return alert("Isi catatan kegiatan, foto, atau daily sheet!");
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
        if (data.imageUrl) uploadedImageUrl = data.imageUrl;
        else {
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
    setLabelAktivitas("");
    setIsSaving(false);
    alert("Jurnal & Foto berhasil disimpan! (akan dirangkum saat pulang)");
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
      if (
        dailyMeta &&
        (dailyMeta.makan ||
          dailyMeta.tidur ||
          dailyMeta.mood ||
          dailyMeta.foto_url)
      ) {
        ringkasanDaily =
          `\n\n📊 *Daily Sheet Ananda:*\n` +
          (dailyMeta.makan ? `🍱 Porsi Makan: *${dailyMeta.makan}*\n` : "") +
          (dailyMeta.tidur ? `💤 Tidur Siang: *${dailyMeta.tidur}*\n` : "") +
          (dailyMeta.mood ? `😊 Mood Dominan: *${dailyMeta.mood}*\n` : "") +
          (dailyMeta.foto_url
            ? `📸 Foto kegiatan: ${dailyMeta.foto_url}\n`
            : "");
      }

      const logHariIni = logKegiatan[anak.id] || [];
      const rangkumanText = logHariIni
        .filter((l) => l.kategori !== "Kehadiran")
        .map((l) => `- [${l.waktu}] ${l.teks}`)
        .join("\n");

      const pesanFinal =
        `🌟 *Buku Penghubung Digital TK Tadika Mesra* 🌟\n\n` +
        `Halo Bunda/Ayah tersayang!\n\n` +
        `Hari ini ananda *${anak.nama}* sudah menyelesaikan kegiatan di sekolah dengan penuh semangat. 🎉\n\n` +
        `📝 *Aktivitas Hari Ini:*\n${rangkumanText || "- Berkegiatan rutin di kelas"}` +
        ringkasanDaily +
        `\n\n🚗 *Informasi Kepulangan:*\nAnanda telah dijemput oleh: *${siapaJemput}*\n${detailJemput ? `Keterangan: ${detailJemput}\n` : ""}` +
        `\nTerima kasih sudah mempercayakan ananda kepada kami. Sampai jumpa besok dengan cerita baru! 😊🌈`;
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
        if (dailyMap[h.tanggal]) dailyMap[h.tanggal].hadir = h;
      });
      logData?.forEach((l: any) => {
        const dateStr = l.created_at.split("T")[0];
        if (dailyMap[dateStr]) dailyMap[dateStr].kegiatan.push(l);
      });
      setWeeklyData({ anak, dailyMap, start, end });
    } catch (err) {
      alert("Gagal memuat laporan mingguan.");
    } finally {
      setIsLoadingWeekly(false);
    }
  };

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

  // ---------- UI ----------
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); body { font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif; background: #F8FAFC; } .hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .glass-panel { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); } .fade-in { animation: fadeIn 0.5s ease-out forwards; } .slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; } .scale-in { animation: scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; } @keyframes slideUp { 0% { opacity: 0; transform: translateY(40px); } 100% { opacity: 1; transform: translateY(0); } } @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } } @keyframes scaleIn { 0% { opacity: 0; transform: scale(0.92); } 100% { opacity: 1; transform: scale(1); } } .btn-premium { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 12px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.02); } .btn-premium:active { transform: scale(0.96); box-shadow: 0 2px 6px rgba(0,0,0,0.08); } .btn-premium:hover { box-shadow: 0 12px 24px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.04); transform: translateY(-1px); }`,
        }}
      />
      <div
        className="fixed inset-0 w-full min-h-[100dvh] flex items-center justify-center font-sans"
        style={{
          backgroundImage: "url('/bg.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/30 to-slate-900/50 backdrop-blur-[8px]"></div>
        <div className="relative w-full max-w-md h-[100dvh] md:h-[90vh] bg-white/90 backdrop-blur-xl shadow-[0_30px_70px_rgba(0,0,0,0.25)] md:rounded-[3rem] flex flex-col overflow-hidden border border-white/60">
          {tampilan === "login" && (
            <LoginScreen
              isLoading={isLoading}
              pinLogin={pinLogin}
              loginError={loginError}
              isCheckingPin={isCheckingPin}
              onPinChange={setPinLogin}
              onLogin={handleLogin}
            />
          )}
          {tampilan === "kelas" && (
            <KelasScreen
              namaGuru={namaGuru}
              jumlahMawar={
                dataSemuaMurid.filter((m) => m.kelas === "mawar").length
              }
              jumlahMelati={
                dataSemuaMurid.filter((m) => m.kelas === "melati").length
              }
              onPilihKelas={(k) => {
                setKelasAktif(k);
                setTampilan("dashboard");
                setTabAktif("datang");
                setCariMurid("");
              }}
              onLogout={() => {
                getaranHalus();
                setTampilan("login");
              }}
            />
          )}

          {tampilan === "dashboard" && (
            <div className="flex flex-col h-full relative fade-in">
              <DashboardHeader
                kelasAktif={kelasAktif}
                muridHadir={muridHadir.length}
                onKembali={() => {
                  getaranHalus();
                  setTampilan("kelas");
                }}
              />
              <div className="flex-1 overflow-y-auto px-6 pt-6 pb-[180px] hide-scrollbar relative">
                {tabAktif !== "laporan" && (
                  <SearchBar
                    cariMurid={cariMurid}
                    onCariChange={setCariMurid}
                    onClear={() => {
                      getaranHalus();
                      setCariMurid("");
                    }}
                  />
                )}
                {tabAktif === "datang" && (
                  <TabDatang
                    muridBelumHadirFilter={muridBelumHadirFilter}
                    onChat={bukaChatPersonal}
                    onDatang={handleDatang}
                    renderFoto={renderFotoMurid}
                  />
                )}
                {tabAktif === "kegiatan" && (
                  <TabKegiatan
                    muridHadirFilter={muridHadirFilter}
                    statusDailySheetHarian={statusDailySheetHarian}
                    pilihanAnak={pilihanAnak}
                    onPilihAnak={setPilihanAnak}
                    labelAktivitas={labelAktivitas}
                    onPilihLabel={handlePilihLabel}
                    jenisKegiatan={jenisKegiatan}
                    onJenisChange={setJenisKegiatan}
                    onFotoChange={setFotoAktivitas}
                    dailyMakan={dailyMakan}
                    onMakanChange={setDailyMakan}
                    dailyTidurMulai={dailyTidurMulai}
                    onTidurMulaiChange={setDailyTidurMulai}
                    dailyTidurSelesai={dailyTidurSelesai}
                    onTidurSelesaiChange={setDailyTidurSelesai}
                    dailyMood={dailyMood}
                    onMoodChange={setDailyMood}
                    isSaving={isSaving}
                    onSimpan={simpanKegiatanMassal}
                    onGetaran={getaranHalus}
                    renderFoto={renderFotoMurid}
                  />
                )}
                {tabAktif === "pulang" && (
                  <TabPulang
                    muridHadirFilter={muridHadirFilter}
                    penjemput={penjemput}
                    penjemputCustom={penjemputCustom}
                    ketPenjemput={ketPenjemput}
                    onChat={bukaChatPersonal}
                    onPulang={handlePulang}
                    onPenjemputChange={(id, val) =>
                      setPenjemput((prev) => ({ ...prev, [id]: val }))
                    }
                    onPenjemputCustomChange={(id, val) =>
                      setPenjemputCustom((prev) => ({ ...prev, [id]: val }))
                    }
                    onKetChange={(id, val) =>
                      setKetPenjemput((prev) => ({ ...prev, [id]: val }))
                    }
                    renderFoto={renderFotoMurid}
                  />
                )}
                {tabAktif === "keuangan" && (
                  <TabKeuangan
                    muridSemuaFilter={muridSemuaFilter}
                    dapatkanStatusSpp={dapatkanStatusSpp}
                    handleResetDanTagihSppMassal={handleResetDanTagihSppMassal}
                    isResettingSpp={isResettingSpp}
                    showUploadObj={showUploadObj}
                    strukFileObj={strukFileObj}
                    isUploadingStrukObj={isUploadingStrukObj}
                    setShowUploadObj={setShowUploadObj}
                    setStrukFileObj={setStrukFileObj}
                    setIsUploadingStrukObj={setIsUploadingStrukObj}
                    bukaChatPersonal={bukaChatPersonal}
                    renderFoto={renderFotoMurid}
                    supabase={supabase}
                    setStatusSppDinamis={setStatusSppDinamis}
                  />
                )}
                {tabAktif === "laporan" && (
                  <TabLaporan
                    subTabLaporan={subTabLaporan}
                    onSubTabChange={setSubTabLaporan}
                    muridSemuaFilter={muridSemuaFilter}
                    selectedStudentReport={selectedStudentReport}
                    onSelectStudent={(anak) =>
                      setSelectedStudentReport(
                        selectedStudentReport?.id === anak.id ? null : anak,
                      )
                    }
                    statusAnak={statusAnak}
                    logKegiatan={logKegiatan}
                    statusDailySheetHarian={statusDailySheetHarian}
                    weeklyOffset={weeklyOffset}
                    onWeeklyOffsetChange={setWeeklyOffset}
                    fetchWeeklyReportForChild={fetchWeeklyReportForChild}
                    weeklyData={weeklyData}
                    isLoadingWeekly={isLoadingWeekly}
                    renderFoto={renderFotoMurid}
                    getWeekRange={getWeekRange}
                  />
                )}
              </div>
              <BottomNav
                tabAktif={tabAktif}
                onTabChange={(tab) => {
                  getaranHalus();
                  setTabAktif(tab);
                  setCariMurid("");
                }}
              />
            </div>
          )}

          <ChatModal
            chatPersonalAktif={chatPersonalAktif}
            teksChatPersonal={teksChatPersonal}
            isMengirimChat={isMengirimChat}
            onTutup={() => setChatPersonalAktif(null)}
            onKirim={handleKirimChatPersonal}
            onUbahTeks={setTeksChatPersonal}
          />
          <BroadcastModal
            bukaSiaran={bukaSiaran}
            tipeSiaran={tipeSiaran}
            teksSiaran={teksSiaran}
            isBroadcasting={isBroadcasting}
            onTutup={() => {
              getaranHalus();
              setBukaSiaran(false);
            }}
            onUbahTeks={setTeksSiaran}
            onPilihTipe={(tipe, template) => {
              getaranHalus();
              setTipeSiaran(tipe);
              setTeksSiaran(template);
            }}
            onKirim={handleKirimSiaran}
            templateUmum={TEMPLATE_PESAN.umum}
            templateSpp={TEMPLATE_PESAN.spp}
          />

          <button
            onClick={() => {
              getaranHalus();
              setBukaSiaran(true);
            }}
            className="absolute bottom-[120px] right-6 bg-orange-400 text-white w-16 h-16 rounded-full shadow-[0_15px_35px_rgba(251,146,60,0.4)] hover:bg-orange-500 active:scale-90 z-30 transition-all flex items-center justify-center btn-premium"
          >
            <VolumeNotice
              theme="outline"
              size={30}
              strokeWidth={3}
              fill="#fff"
            />
          </button>
        </div>
      </div>
    </>
  );
}
