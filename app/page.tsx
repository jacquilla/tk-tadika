"use client";
import { useState, useEffect } from "react";
import {
  CheckOne,
  Box,
  Logout,
  BankCard,
  ChartLine,
  Home,
  Message,
  Save,
  Loading,
  Left,
  VolumeNotice,
  Close,
  User,
  Send,
  Attention,
  MagicWand,
  EmotionHappy,
  Bowl,
  SleepOne,
  Calendar,
  Search,
  ArrowLeft,
  ArrowRight,
  Login,
  Peoples,
  BookOne,
  Sport,
} from "@icon-park/react";

import LoginScreen from "./components/LoginScreen";
import KelasScreen from "./components/KelasScreen";
import DashboardHeader from "./components/dashboard/DashboardHeader";
import TabDatang from "./components/dashboard/TabDatang";
import TabKegiatan from "./components/dashboard/TabKegiatan";
import TabPulang from "./components/dashboard/TabPulang";
import TabLaporan from "./components/dashboard/TabLaporan";
import BottomNav from "./components/BottomNav";
import SearchBar from "./components/SearchBar";
import ChatModal from "./components/modals/ChatModal";
import BroadcastModal from "./components/modals/BroadcastModal";
import EditLogModal from "./components/modals/EditLogModal";

import { supabase } from "./lib/supabase";
import type {
  Murid,
  Kehadiran,
  LogAktivitas,
  DailySheetMeta,
} from "./types/database";
import { getAuthHeaders } from "./lib/api-helpers";

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

// Session timeout: 1 jam (match JWT expiry)
const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

const getTanggalLokal = () => {
  const d = new Date();
  const tahun = d.getFullYear();
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const tanggal = String(d.getDate()).padStart(2, "0");
  return `${tahun}-${bulan}-${tanggal}`;
};

const getRangeHariWITA = (): { start: string; end: string } => {
  const tanggalLokal = getTanggalLokal(); // "YYYY-MM-DD" sesuai WITA
  const start = new Date(`${tanggalLokal}T00:00:00+08:00`).toISOString();
  const end = new Date(`${tanggalLokal}T23:59:59+08:00`).toISOString();
  return { start, end };
};

const getMulaiHariIniUTC = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
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

/**
 * Helper untuk logout dengan cleanup
 */
const performLogout = (setTampilan: any, setNamaGuru: any) => {
  localStorage.removeItem("tk-token");
  localStorage.removeItem("tk-guru-id");
  setNamaGuru("");
  setTampilan("login");
};

export default function AppTK() {
  const [tampilan, setTampilan] = useState("login");
  const [namaGuru, setNamaGuru] = useState("");
  const [guruHadir, setGuruHadir] = useState(false);
  const [pinLogin, setPinLogin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isCheckingPin, setIsCheckingPin] = useState(false);
  const [kelasAktif, setKelasAktif] = useState("");
  const [tabAktif, setTabAktif] = useState("datang");
  const [subTabLaporan, setSubTabLaporan] = useState<"harian" | "mingguan">(
    "harian",
  );

  const [dataSemuaMurid, setDataSemuaMurid] = useState<Murid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [statusAnak, setStatusAnak] = useState<
    Record<string, "belum" | "hadir" | "pulang">
  >({});
  const [kehadiranHarian, setKehadiranHarian] = useState<
    Record<string, Kehadiran>
  >({});
  const [statusDailySheetHarian, setStatusDailySheetHarian] = useState<
    Record<string, DailySheetMeta>
  >({});

  const [logKegiatan, setLogKegiatan] = useState<Record<string, any[]>>({});
  const [logHarian, setLogHarian] = useState<Record<string, LogAktivitas[]>>(
    {},
  );
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

  const [bukaSiaran, setBukaSiaran] = useState(false);
  const [tipeSiaran, setTipeSiaran] = useState("umum");
  const [teksSiaran, setTeksSiaran] = useState(TEMPLATE_PESAN.umum);

  const [chatPersonalAktif, setChatPersonalAktif] = useState<Murid | null>(
    null,
  );
  const [teksChatPersonal, setTeksChatPersonal] = useState("");
  const [isMengirimChat, setIsMengirimChat] = useState(false);

  const [dataLaporan, setDataLaporan] = useState<Record<string, any[]>>({});
  const [isLoadingLaporan, setIsLoadingLaporan] = useState(false);

  const [cariMurid, setCariMurid] = useState("");

  const [selectedStudentReport, setSelectedStudentReport] =
    useState<Murid | null>(null);
  const [weeklyOffset, setWeeklyOffset] = useState(0);
  const [weeklyData, setWeeklyData] = useState<{
    anak: Murid;
    dailyMap: Record<
      string,
      { hadir: Kehadiran | null; kegiatan: LogAktivitas[] }
    >;
    start: string;
    end: string;
  } | null>(null);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);

  // ---------- SESSION TIMEOUT HANDLER ----------
  useEffect(() => {
    if (tampilan === "dashboard" || tampilan === "kelas") {
      const timer = setTimeout(() => {
        alert(
          "Sesi Anda telah berakhir (token expired setelah 1 jam). Silakan login kembali."
        );
        performLogout(setTampilan, setNamaGuru);
      }, SESSION_TIMEOUT_MS);

      return () => clearTimeout(timer);
    }
  }, [tampilan]);

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
        const { data: muridData, error: muridError } = await supabase
          .from("murid")
          .select("*")
          .order("nama");
        if (muridError) throw muridError;
        if (muridData) setDataSemuaMurid(muridData);

        // ---------- DATA KEHADIRAN HARI INI ----------
        const hariIni = getTanggalLokal();
        const { data: hadirData, error: hadirError } = await supabase
          .from("kehadiran")
          .select("*")
          .eq("tanggal", hariIni);
        if (hadirError) throw hadirError;
        if (hadirData) {
          const statusMap: Record<string, "belum" | "hadir" | "pulang"> = {};
          const detailMap: Record<string, any> = {};
          hadirData.forEach((h) => {
            statusMap[h.murid_id] = h.status_hadir;
            detailMap[h.murid_id] = h;
          });
          setStatusAnak(statusMap);
          setKehadiranHarian(detailMap);
        }

        // ---------- DATA DAILY SHEET (untuk ikon) ----------
        const { start: startWITA, end: endWITA } = getRangeHariWITA();

        const { data: logSheet, error: logSheetError } = await supabase
          .from("log_aktivitas")
          .select("murid_id, metadata")
          .eq("kategori", "DailySheet")
          .gte("created_at", startWITA)
          .lt("created_at", endWITA);

        if (!logSheetError && logSheet) {
          const sheetMap: Record<string, any> = {};
          logSheet.forEach((l) => {
            if (!sheetMap[l.murid_id]) sheetMap[l.murid_id] = { foto_url: "" };
            sheetMap[l.murid_id] = {
              ...sheetMap[l.murid_id],
              ...(l.metadata || {}),
            };
            if (l.metadata?.foto_url) {
              sheetMap[l.murid_id].foto_url = sheetMap[l.murid_id].foto_url
                ? sheetMap[l.murid_id].foto_url + "," + l.metadata.foto_url
                : l.metadata.foto_url;
            }
          });
          setStatusDailySheetHarian(sheetMap);
        }

        // ---------- SEMUA LOG HARI INI (untuk laporan harian) ----------
        const { data: logHarianData, error: logHarianError } = await supabase
          .from("log_aktivitas")
          .select("*")
          .gte("created_at", startWITA)
          .lt("created_at", endWITA);

        if (logHarianData) {
          const logMap: Record<string, any[]> = {};
          logHarianData.forEach((l) => {
            if (!logMap[l.murid_id]) logMap[l.murid_id] = [];
            logMap[l.murid_id].push(l);
          });
          setLogHarian(logMap);
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
          const record = payload.new as Kehadiran;
          if (record && record.murid_id && record.status_hadir) {
            setStatusAnak((prev) => ({
              ...prev,
              [record.murid_id]: record.status_hadir,
            }));
            setKehadiranHarian((prev) => ({
              ...prev,
              [record.murid_id]: record,
            }));
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  useEffect(() => {
    const cekKehadiranGuru = async () => {
      const storedGuruId = localStorage.getItem("tk-guru-id");
      if (storedGuruId && tampilan === "dashboard") {
        const today = new Date().toISOString().split("T")[0];
        const { data } = await supabase
          .from("kehadiran_guru")
          .select("id")
          .eq("guru_id", storedGuruId)
          .eq("tanggal", today)
          .maybeSingle();
        if (data) setGuruHadir(true);
      }
    };
    cekKehadiranGuru();
  }, [tampilan]);

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
        .select("id, nama")
        .eq("pin_login", pinLogin.trim())
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        setLoginError("PIN tidak dikenali. Coba lagi.");
        setIsCheckingPin(false);
        return;
      }
      setNamaGuru(data.nama);

      // Simpan token JWT DULU
      const authRes = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinLogin.trim(), role: "guru" }),
      });
      const authData = await authRes.json();
      if (authData.token) {
        localStorage.setItem("tk-token", authData.token);
      }

      // Simpan ID guru di localStorage agar bisa dicek nanti
      localStorage.setItem("tk-guru-id", data.id);

      // Baru catat kehadiran (sekarang getAuthHeaders() sudah berisi token)
      try {
        const res = await fetch("/api/kehadiran-guru", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ guru_id: data.id }),
        });
        if (res.ok) {
          setGuruHadir(true);
        }
      } catch (e) {
        console.error("Gagal mencatat kehadiran guru:", e);
      }

      setTampilan("kelas");
    } catch (err) {
      setLoginError("Gagal memeriksa PIN. Periksa koneksi.");
    } finally {
      setIsCheckingPin(false);
    }
  };

  // ---------- FUNGSI BISNIS ----------
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
      await fetch("/api/log-aktivitas", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          murid_id: idAnak,
          deskripsi: teksKegiatan,
          kategori,
          metadata,
        }),
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ targetHp: nomorHp, pesanCustom: pesan }),
      });
      if (!res.ok) throw new Error("Respon API tidak ok");
    } catch (e) {
      alert("Gagal mengirim pesan WhatsApp. Periksa koneksi atau nomor HP.");
    }
  };

  const bukaChatPersonal = (anak: Murid) => {
    getaranHalus();
    setChatPersonalAktif(anak);
    setTeksChatPersonal(
      `Halo Bunda/Ayah Ananda ${anak.nama} yang hebat! 🌼\n\n`,
    );
  };

  const handleKirimChatPersonal = async () => {
    if (!chatPersonalAktif) return;
    if (!teksChatPersonal.trim()) return alert("Pesan tidak boleh kosong!");
    setIsMengirimChat(true);
    await kirimWA(chatPersonalAktif.nomor_hp_ortu, teksChatPersonal);
    setIsMengirimChat(false);
    setChatPersonalAktif(null);
    alert(`Pesan berhasil terkirim ke orang tua ${chatPersonalAktif.nama}!`);
  };

  const handleDatang = async (anak: Murid) => {
    getaranHalus();
    const today = getTanggalLokal();
    const nowStr = new Date().toISOString();
    const timeDatang = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    try {
      // Cek apakah sudah ada record kehadiran hari ini (SELECT masih aman)
      const { data: existing, error } = await supabase
        .from("kehadiran")
        .select("id")
        .eq("murid_id", anak.id)
        .eq("tanggal", today)
        .maybeSingle();

      if (error) throw error;

      if (existing) {
        // Jangan timpa jika sudah hadir
        const statusSekarang = statusAnak[anak.id];
        if (statusSekarang === "hadir") {
          alert("Anak ini sudah tercatat hadir. Tidak bisa diubah.");
          return;
        }

        // Kirim PUT ke API (aman, pakai service key + JWT)
        await fetch("/api/kehadiran", {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            id: existing.id,
            status_hadir: "hadir",
            waktu_datang: nowStr,
          }),
        });
      } else {
        // Belum ada record → POST ke API
        await fetch("/api/kehadiran", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            murid_id: anak.id,
            status_hadir: "hadir",
            waktu_datang: nowStr,
            tanggal: today,
          }),
        });
      }

      // Update state lokal
      setStatusAnak((prev) => ({ ...prev, [anak.id]: "hadir" }));

      // Catat log aktivitas (sudah pakai API)
      catatKegiatan(
        anak.id,
        "Tiba di sekolah dengan ceria (Check-In)",
        "Kehadiran",
      );

      // Kirim WA
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
    // Sekarang pengelolaan label sepenuhnya dilakukan di TabKegiatan
    // Kita hanya perlu menyimpan label yang aktif (opsional)
    setLabelAktivitas(label);
    // Tidak mengisi jenisKegiatan lagi
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
        const token = localStorage.getItem("tk-token") || "";
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

    for (const id of pilihanAnak) {
      const prevMeta = statusDailySheetHarian[id] || {};
      const newMakan = dailyMakan || prevMeta.makan || null;
      const newTidur =
        dailyTidurMulai &&
        dailyTidurSelesai &&
        `${dailyTidurMulai} - ${dailyTidurSelesai}`;

      const metadata = {
        makan: newMakan,
        tidur: newTidur || prevMeta.tidur || null,
        mood: dailyMood || prevMeta.mood || null,
        foto_url: uploadedImageUrl
          ? prevMeta.foto_url
            ? prevMeta.foto_url + "," + uploadedImageUrl
            : uploadedImageUrl
          : prevMeta.foto_url || null,
      };

      try {
        await fetch("/api/log-aktivitas", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            murid_id: id,
            deskripsi: jenisKegiatan || "Daily Sheet",
            kategori: "DailySheet",
            metadata,
          }),
        });
      } catch (error) {
        console.error("Gagal catat daily sheet untuk anak:", id, error);
      }
    }

    // Update status lokal
    for (const id of pilihanAnak) {
      setStatusDailySheetHarian((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          makan: dailyMakan || prev[id]?.makan || null,
          tidur:
            (dailyTidurMulai &&
              dailyTidurSelesai &&
              `${dailyTidurMulai} - ${dailyTidurSelesai}`) ||
            prev[id]?.tidur ||
            null,
          mood: dailyMood || prev[id]?.mood || null,
          foto_url: uploadedImageUrl
            ? prev[id]?.foto_url
              ? prev[id].foto_url + "," + uploadedImageUrl
              : uploadedImageUrl
            : prev[id]?.foto_url || null,
        },
      }));
    }

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

    // Refresh log harian agar laporan langsung terupdate
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            html { scroll-behavior: smooth; }
            .fade-in { animation: fade-in 0.5s ease-in; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            .hide-scrollbar::-webkit-scrollbar { display: none; }
          `,
        }}
      />

      {tampilan === "login" && (
        <LoginScreen
          pinLogin={pinLogin}
          onPinChange={setPinLogin}
          error={loginError}
          isLoading={isCheckingPin}
          onLogin={handleLogin}
        />
      )}

      {tampilan === "kelas" && (
        <KelasScreen
          namaGuru={namaGuru}
          jumlahMawar={muridSemua.filter((m) => m.kelas === "Mawar").length}
          jumlahMelati={muridSemua.filter((m) => m.kelas === "Melati").length}
          onPilihKelas={(kelas) => {
            setKelasAktif(kelas);
            setTabAktif("datang");
            setTampilan("dashboard");
          }}
          onLogout={() => performLogout(setTampilan, setNamaGuru)}
        />
      )}

      {tampilan === "dashboard" && (
        <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 pb-32 fade-in">
          <DashboardHeader
            namaGuru={namaGuru}
            kelasAktif={kelasAktif}
            onKembali={() => {
              setTampilan("kelas");
              setKelasAktif("");
            }}
            onLogout={() => performLogout(setTampilan, setNamaGuru)}
          />

          <SearchBar
            placeholder="Cari nama anak..."
            value={cariMurid}
            onChange={setCariMurid}
          />

          {tabAktif === "datang" && (
            <TabDatang
              muridBelumHadirFilter={muridBelumHadirFilter}
              muridHadirFilter={muridHadirFilter}
              statusAnak={statusAnak}
              statusDailySheetHarian={statusDailySheetHarian}
              onDatang={handleDatang}
              isLoading={isLoading}
            />
          )}

          {tabAktif === "kegiatan" && (
            <TabKegiatan
              muridSemuaFilter={muridSemuaFilter}
              logKegiatan={logKegiatan}
              logHarian={logHarian}
              pilihanAnak={pilihanAnak}
              onPilihAnak={(id) =>
                setPilihanAnak(
                  pilihanAnak.includes(id)
                    ? pilihanAnak.filter((x) => x !== id)
                    : [...pilihanAnak, id],
                )
              }
              jenisKegiatan={jenisKegiatan}
              onJenisKegiatanChange={setJenisKegiatan}
              dailyMakan={dailyMakan}
              onMakanChange={setDailyMakan}
              dailyTidurMulai={dailyTidurMulai}
              onTidurMulaiChange={setDailyTidurMulai}
              dailyTidurSelesai={dailyTidurSelesai}
              onTidurSelesaiChange={setDailyTidurSelesai}
              dailyMood={dailyMood}
              onMoodChange={setDailyMood}
              fotoAktivitas={fotoAktivitas}
              onFotoChange={setFotoAktivitas}
              isSaving={isSaving}
              onSimpan={simpanKegiatanMassal}
              labelAktivitas={labelAktivitas}
              onPilihLabel={handlePilihLabel}
              onBukaChat={bukaChatPersonal}
              onKirimSiaran={() => setBukaSiaran(true)}
              onEditLog={(log) => {}}
            />
          )}

          {tabAktif === "pulang" && (
            <TabPulang
              muridHadirFilter={muridHadirFilter}
              kehadiranHarian={kehadiranHarian}
              penjemput={penjemput}
              penjemputCustom={penjemputCustom}
              ketPenjemput={ketPenjemput}
              statusAnak={statusAnak}
              onPenjemputChange={(id, value) =>
                setPenjemput({ ...penjemput, [id]: value })
              }
              onPenjemputCustomChange={(id, value) =>
                setPenjemputCustom({ ...penjemputCustom, [id]: value })
              }
              onKetPenjemputChange={(id, value) =>
                setKetPenjemput({ ...ketPenjemput, [id]: value })
              }
              onPulang={(anak) => {}}
            />
          )}

          {tabAktif === "laporan" && (
            <TabLaporan
              muridSemuaFilter={muridSemuaFilter}
              selectedStudentReport={selectedStudentReport}
              onSelectStudent={setSelectedStudentReport}
              subTabLaporan={subTabLaporan}
              onSubTabChange={setSubTabLaporan}
              logHarian={logHarian}
              weeklyOffset={weeklyOffset}
              onWeeklyOffsetChange={setWeeklyOffset}
              isLoadingLaporan={isLoadingLaporan}
              isLoadingWeekly={isLoadingWeekly}
              weeklyData={weeklyData}
            />
          )}

          <BottomNav
            tabAktif={tabAktif}
            onTabChange={setTabAktif}
            guruHadir={guruHadir}
          />
        </div>
      )}

      <ChatModal
        anak={chatPersonalAktif}
        teks={teksChatPersonal}
        onTeksChange={setTeksChatPersonal}
        isLoading={isMengirimChat}
        onKirim={handleKirimChatPersonal}
        onTutup={() => setChatPersonalAktif(null)}
      />

      <BroadcastModal
        terbuka={bukaSiaran}
        tipe={tipeSiaran}
        onTipeChange={setTipeSiaran}
        teks={teksSiaran}
        onTeksChange={setTeksSiaran}
        templateUmum={TEMPLATE_PESAN.umum}
        templateSpp={TEMPLATE_PESAN.spp}
        templateBekal={TEMPLATE_PESAN.bekal}
        onTutup={() => setBukaSiaran(false)}
      />

      <EditLogModal
        log={null}
        onTutup={() => {}}
      />
    </>
  );
}
