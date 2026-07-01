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

// Session timeout: 1 jam (match JWT expiry dari auth/route.ts)
const SESSION_TIMEOUT_MS = 60 * 60 * 1000;

const getTanggalLokal = () => {
  const d = new Date();
  const tahun = d.getFullYear();
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const tanggal = String(d.getDate()).padStart(2, "0");
  return `${tahun}-${bulan}-${tanggal}`;
};

const getRangeHariWITA = (): { start: string; end: string } => {
  const tanggalLokal = getTanggalLokal();
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
 * Helper untuk logout dengan cleanup lengkap
 * Menghapus semua token dan data dari localStorage
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

  // ---------- SESSION TIMEOUT HANDLER (1 hour = JWT expiry) ----------
  useEffect(() => {
    if (tampilan === "dashboard" || tampilan === "kelas") {
      const timer = setTimeout(() => {
        alert(
          "Sesi Anda telah berakhir (token expired setelah 1 jam). Silakan login kembali.",
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
        const { start: st, end: en } = getRangeHariWITA();
        const { data: logHarianData, error: logHarianError } = await supabase
          .from("log_aktivitas")
          .select("*")
          .gte("created_at", st)
          .lt("created_at", en);

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
    setLabelAktivitas(label);
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
        dailyTidurMulai && dailyTidurSelesai
          ? `${dailyTidurMulai} - ${dailyTidurSelesai}`
          : prevMeta.tidur || null;
      const newMood = dailyMood || prevMeta.mood || null;
      const prevFoto = prevMeta.foto_url || "";
      const newFoto = uploadedImageUrl
        ? prevFoto
          ? prevFoto + "," + uploadedImageUrl
          : uploadedImageUrl
        : prevFoto;

      const metaAnak = {
        makan: newMakan,
        tidur: newTidur,
        mood: newMood,
        foto_url: newFoto || null,
      };

      await catatKegiatan(
        id,
        jenisKegiatan || "Mengikuti rutinitas kelas harian.",
        "DailySheet",
        metaAnak,
      );
    }

    setStatusDailySheetHarian((prev) => {
      const newState = { ...prev };
      pilihanAnak.forEach((id) => {
        const prevMeta = prev[id] || {};
        newState[id] = {
          makan: dailyMakan || prevMeta.makan || null,
          tidur:
            dailyTidurMulai && dailyTidurSelesai
              ? `${dailyTidurMulai} - ${dailyTidurSelesai}`
              : prevMeta.tidur || null,
          mood: dailyMood || prevMeta.mood || null,
          foto_url: uploadedImageUrl
            ? prevMeta.foto_url
              ? prevMeta.foto_url + "," + uploadedImageUrl
              : uploadedImageUrl
            : prevMeta.foto_url || null,
        };
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

    // Refresh log harian agar laporan langsung terupdate
    const { start: st, end: en } = getRangeHariWITA();
    const { data: freshLog } = await supabase
      .from("log_aktivitas")
      .select("*")
      .gte("created_at", st)
      .lt("created_at", en);
    if (freshLog) {
      const logMap: Record<string, any[]> = {};
      freshLog.forEach((l) => {
        if (!logMap[l.murid_id]) logMap[l.murid_id] = [];
        logMap[l.murid_id].push(l);
      });
      setLogHarian(logMap);
    }
  };

  const [editLogTarget, setEditLogTarget] = useState<LogAktivitas | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleSimpanEditLog = async (
    logId: string,
    deskripsi: string,
    metadata: any,
    file: File | null | undefined,
    waktuBaru?: string,
  ) => {
    setIsSavingEdit(true);
    try {
      let uploadedUrl = metadata.foto_url || "";
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const token = localStorage.getItem("tk-token") || "";
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (data.imageUrl) uploadedUrl = data.imageUrl;
        else {
          alert("Gagal upload foto: " + data.error);
          setIsSavingEdit(false);
          return;
        }
      }

      const updatedMetadata = { ...metadata, foto_url: uploadedUrl };

      // Panggil API edit dengan JWT
      const res = await fetch("/api/log-aktivitas/edit", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: logId,
          deskripsi,
          metadata: updatedMetadata,
          waktuBaru: waktuBaru || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Gagal menyimpan perubahan.");
        setIsSavingEdit(false);
        return;
      }

      // Update state logHarian
      setLogHarian((prev) => {
        const newLog = { ...prev };
        for (const muridId in newLog) {
          newLog[muridId] = newLog[muridId].map((l) =>
            l.id === logId
              ? {
                  ...l,
                  deskripsi,
                  metadata: updatedMetadata,
                  ...(waktuBaru ? { created_at: waktuBaru } : {}),
                }
              : l,
          );
        }
        return newLog;
      });

      // Update state logKegiatan
      setLogKegiatan((prev) => {
        const newLog = { ...prev };
        for (const muridId in newLog) {
          newLog[muridId] = newLog[muridId].map((l: any) =>
            l.id === logId
              ? {
                  ...l,
                  teks: deskripsi,
                  metadata: updatedMetadata,
                  ...(waktuBaru
                    ? {
                        waktu: new Date(waktuBaru).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                      }
                    : {}),
                }
              : l,
          );
        }
        return newLog;
      });

      setEditLogTarget(null);
      alert("Aktivitas berhasil diperbarui!");
    } catch (err) {
      alert("Gagal menyimpan perubahan.");
      console.error(err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handlePulang = async (anak: Murid) => {
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
      // Cari record kehadiran hari ini
      const { data: existing, error: findError } = await supabase
        .from("kehadiran")
        .select("id")
        .eq("murid_id", anak.id)
        .eq("tanggal", today)
        .maybeSingle();

      if (findError) throw findError;
      if (!existing)
        throw new Error(
          "Data kehadiran tidak ditemukan. Pastikan anak sudah check‑in.",
        );

      // Update melalui API yang aman
      await fetch("/api/kehadiran", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: existing.id,
          status_hadir: "pulang",
          waktu_pulang: new Date().toISOString(),
          penjemput: siapaJemput,
          keterangan_jemput: detailJemput,
        }),
      });

      // Catat kegiatan pulang (tetap pakai API)
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
          (dailyMeta?.foto_url
            ? `📸 Foto kegiatan:\n${dailyMeta.foto_url
                .split(",")
                .map((url: string) => `- ${url}`)
                .join("\n")}\n`
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
        `\nTerima kasih sudah mempercayakan ananda kepada kami. Sampai jumpa besok dengan cerita baru! 😊🌈` +
        `\n${namaGuru}\n`;

      await kirimWA(anak.nomor_hp_ortu, pesanFinal);
    } catch (err) {
      alert("Gagal menyimpan data kepulangan. Pastikan anak sudah check‑in.");
    }
  };

  const handleKirimSiaran = async () => {
    getaranHalus();
    if (!teksSiaran.trim()) return alert("Pesan tidak boleh kosong!");
    setIsBroadcasting(true);
    try {
      // Broadcast hanya info umum, target semua murid di kelas
      for (const anak of muridSemua) {
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

  const fetchWeeklyReportForChild = async (anak: Murid) => {
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
        .gte("created_at", new Date(`${start}T00:00:00+08:00`).toISOString())
        .lte("created_at", new Date(`${end}T23:59:59+08:00`).toISOString());
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
      hadirData?.forEach((h) => {
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

  const renderFotoMurid = (anak: Murid, className: string) => {
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
          __html: `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); body { font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif; }`,
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
        <div className="relative w-full max-w-md h-[100dvh] md:h-[90vh] bg-white/90 backdrop-blur-xl shadow-[0_30px_70px_rgba(0,0,0,0.25)] md:rounded-[3rem] flex flex-col overflow-hidden border border-white/40">
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
                performLogout(setTampilan, setNamaGuru);
              }}
            />
          )}

          {tampilan === "dashboard" && (
            <div className="flex flex-col h-full relative fade-in">
              <DashboardHeader
                kelasAktif={kelasAktif}
                guruHadir={guruHadir}
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
                    kehadiranHarian={kehadiranHarian}
                    logKegiatan={logKegiatan}
                    statusDailySheetHarian={statusDailySheetHarian}
                    weeklyOffset={weeklyOffset}
                    onWeeklyOffsetChange={setWeeklyOffset}
                    fetchWeeklyReportForChild={fetchWeeklyReportForChild}
                    weeklyData={weeklyData}
                    isLoadingWeekly={isLoadingWeekly}
                    renderFoto={renderFotoMurid}
                    getWeekRange={getWeekRange}
                    logHarian={logHarian}
                    onEditLog={(log) => setEditLogTarget(log)}
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
              {/* FAB Broadcast – hanya muncul di dashboard */}
              <button
                onClick={() => {
                  getaranHalus();
                  setBukaSiaran(true);
                }}
                className="absolute bottom-[120px] right-6 bg-orange-400 text-white w-16 h-16 rounded-full shadow-[0_15px_35px_rgba(251,146,60,0.4)] hover:bg-orange-500 active:scale-90 z-40 transition-all flex items-center justify-center"
              >
                <VolumeNotice
                  theme="outline"
                  size={30}
                  strokeWidth={3}
                  fill="#fff"
                />
              </button>
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
          <EditLogModal
            log={editLogTarget}
            onTutup={() => setEditLogTarget(null)}
            onSimpan={handleSimpanEditLog}
            isSaving={isSavingEdit}
            tanggalHariIni={getTanggalLokal()}
          />
        </div>
      </div>
    </>
  );
}
