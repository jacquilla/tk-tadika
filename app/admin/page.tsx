"use client";
import type {
  Murid,
  Kehadiran,
  LogAktivitas,
  Guru,
  LogAdmin,
  RiwayatSpp,
  DailySheetMeta,
} from "../types/database";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getAuthHeaders } from "../lib/api-helpers";
import {
  ChartPie,
  Peoples,
  BookOne,
  Wallet,
  History,
  Edit,
  Switch,
  Delete,
  Plus,
  Camera,
  Search,
  Logout,
  CloseSmall,
  Download,
  Broadcast,
  Protect,
  Check,
} from "@icon-park/react";

// Tipe kehadiran dengan join murid
interface KehadiranDenganMurid extends Kehadiran {
  murid?: Pick<Murid, "nama" | "kelas"> | null;
}

const NAMA_BULAN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export default function AdminPage() {
  // Fungsi internal untuk getaran halus (Haptic Feedback)
  const getaranHalus = () => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  // ---------- Auth ----------
  const [pin, setPin] = useState("");
  const [autentikasi, setAutentikasi] = useState(false);
  const [error, setError] = useState("");

  // ---------- Data Utama ----------
  const [murid, setMurid] = useState<Murid[]>([]);
  const [guru, setGuru] = useState<Guru[]>([]);
  const [logAdmin, setLogAdmin] = useState<LogAdmin[]>([]);
  const [riwayatSpp, setRiwayatSpp] = useState<RiwayatSpp[]>([]);
  const [kehadiranHariIni, setKehadiranHariIni] = useState<
    KehadiranDenganMurid[]
  >([]);

  // ---------- Tab & Filter ----------
  const [tabAdmin, setTabAdmin] = useState<
    "utama" | "log" | "riwayat" | "kehadiran" | "buku"
  >("utama");
  const [cariAdmin, setCariAdmin] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterSpp, setFilterSpp] = useState("");

  // ---------- Form Tambah Murid ----------
  const [namaBaru, setNamaBaru] = useState("");
  const [kelasBaru, setKelasBaru] = useState("mawar");
  const [noHpBaru, setNoHpBaru] = useState("");
  const [nominalBaru, setNominalBaru] = useState("350000");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // ---------- Edit Murid ----------
  const [editId, setEditId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editKelas, setEditKelas] = useState("mawar");
  const [editNoHp, setEditNoHp] = useState("");
  const [editNominal, setEditNominal] = useState("");
  const [editFoto, setEditFoto] = useState<File | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // ---------- Guru ----------
  const [namaGuruBaru, setNamaGuruBaru] = useState("");
  const [pinGuruBaru, setPinGuruBaru] = useState("");
  const [editPinId, setEditPinId] = useState<string | null>(null);
  const [editPinBaru, setEditPinBaru] = useState("");

  // ---------- Buku Penghubung ----------
  const [bukuMurid, setBukuMurid] = useState<Murid | null>(null);
  const [bukuLog, setBukuLog] = useState<LogAktivitas[]>([]);
  const [bukuSheet, setBukuSheet] = useState<DailySheetMeta | null>(null);

  // ---------- Ringkasan ----------
  const [totalHadir, setTotalHadir] = useState(0);
  const [totalLunas, setTotalLunas] = useState(0);
  const [totalMurid, setTotalMurid] = useState(0);
  const [totalPiutang, setTotalPiutang] = useState(0);

  // ---------- Grafik ----------
  const [chartHadir, setChartHadir] = useState<number[]>([]);
  const [chartLabel, setChartLabel] = useState<string[]>([]);

  // ---------- Kartu Iuran SPP ----------
  const [iuranMurid, setIuranMurid] = useState<Murid | null>(null);
  const [iuranData, setIuranData] = useState<Record<number, string | null>>({});
  const [tahunIuran, setTahunIuran] = useState(new Date().getFullYear());

  // ========== HANDLERS ==========

  // SOLUSI KONTRAKDIKSI #1: Validasi 100% di Server
  const handleLogin = async () => {
    getaranHalus();
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, role: "admin" }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("tk-token", data.token);
        setAutentikasi(true);
      } else {
        setError(data.error || "PIN admin salah");
      }
    } catch (err) {
      setError("Gagal terhubung ke server");
    }
  };

  const catatLog = async (aksi: string, detail = "") => {
    await fetch("/api/log-admin", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ aksi, detail }),
    });
  };

  const ambilData = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data: muridData } = await supabase
      .from("murid")
      .select("*")
      .order("nama");
    if (muridData) {
      setMurid(muridData as Murid[]);
      setTotalMurid(muridData.length);
      setTotalLunas(
        muridData.filter((m: any) => m.status_spp === "LUNAS").length,
      );
      setTotalPiutang(
        muridData
          .filter((m: any) => m.status_spp !== "LUNAS")
          .reduce((sum, m: any) => sum + (m.nominal_spp || 350000), 0),
      );
    }

    // SOLUSI KONTRAKDIKSI #3: Kita tetap ambil data guru, tapi UI tidak merender PIN-nya
    const { data: guruData } = await supabase
      .from("guru")
      .select("*")
      .order("nama");
    if (guruData) setGuru(guruData as Guru[]);

    const { data: logData } = await supabase
      .from("log_admin")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (logData) setLogAdmin(logData as LogAdmin[]);

    const { data: riwayat } = await supabase
      .from("riwayat_spp")
      .select("*, murid(nama)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (riwayat) setRiwayatSpp(riwayat as RiwayatSpp[]);

    const { data: hadirData } = await supabase
      .from("kehadiran")
      .select("*, murid(nama, kelas)")
      .eq("tanggal", today)
      .order("waktu_datang", { ascending: true });
    if (hadirData) {
      setKehadiranHariIni(hadirData as KehadiranDenganMurid[]);
      setTotalHadir(
        hadirData.filter(
          (h: any) => h.status_hadir === "hadir" || h.status_hadir === "pulang",
        ).length,
      );
    }

    const labels: string[] = [];
    const values: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const tgl = d.toISOString().split("T")[0];
      labels.push(
        new Date(tgl).toLocaleDateString("id-ID", { weekday: "short" }),
      );
      const { count } = await supabase
        .from("kehadiran")
        .select("*", { count: "exact", head: true })
        .eq("tanggal", tgl)
        .eq("status_hadir", "hadir");
      values.push(count || 0);
    }
    setChartLabel(labels);
    setChartHadir(values);
  };

  const ambilIuran = async (anak: Murid) => {
    getaranHalus();
    setIuranMurid(anak);
    const { data } = await supabase
      .from("iuran_spp")
      .select("*")
      .eq("murid_id", anak.id)
      .eq("tahun", tahunIuran);
    const map: Record<number, string | null> = {};
    for (let i = 1; i <= 12; i++) map[i] = null;
    if (data)
      data.forEach((d: any) => {
        map[d.bulan] = d.tanggal_bayar;
      });
    setIuranData(map);
  };

  const simpanTanggalBayar = async (bulan: number, tanggal: string | null) => {
    getaranHalus();
    if (!iuranMurid) return;
    const muridId = iuranMurid.id;
    if (!tanggal) {
      await fetch("/api/iuran-spp", {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({ murid_id: muridId, tahun: tahunIuran, bulan }),
      });
    } else {
      await fetch("/api/iuran-spp", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          murid_id: muridId,
          tahun: tahunIuran,
          bulan,
          tanggal_bayar: tanggal,
        }),
      });
    }
    setIuranData((prev) => ({ ...prev, [bulan]: tanggal }));

    const bulanSekarang = new Date().getMonth() + 1;
    if (bulan === bulanSekarang && tahunIuran === new Date().getFullYear()) {
      const statusBaru = tanggal ? "LUNAS" : "MENUNGGAK";
      await fetch("/api/murid", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: muridId, status_spp: statusBaru }),
      });
      await ambilData();
    }
  };

  const lihatBuku = async (anak: Murid) => {
    getaranHalus();
    setBukuMurid(anak);
    const today = new Date().toISOString().split("T")[0];
    const { data: logData } = await supabase
      .from("log_aktivitas")
      .select("*")
      .eq("murid_id", anak.id)
      .gte("created_at", `${today}T00:00:00+08:00`)
      .order("created_at");
    setBukuLog((logData as LogAktivitas[]) || []);
    const sheet = (logData as LogAktivitas[])?.find(
      (l) => l.kategori === "DailySheet",
    )?.metadata as DailySheetMeta | undefined;
    setBukuSheet(sheet || null);
  };

  // ---------- Murid CRUD ----------
  const tambahMurid = async () => {
    getaranHalus();
    if (!namaBaru.trim() || !noHpBaru.trim())
      return alert("Lengkapi data murid.");
    let fotoUrl = "";
    if (fotoFile) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", fotoFile);
        const token = localStorage.getItem("tk-token") || "";
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: fd,
        });
        const d = await res.json();
        if (d.imageUrl) fotoUrl = d.imageUrl;
        else {
          alert("Gagal upload foto.");
          setUploading(false);
          return;
        }
      } catch {
        alert("Gagal upload foto.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    await fetch("/api/murid", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        nama: namaBaru,
        kelas: kelasBaru,
        nomor_hp_ortu: noHpBaru,
        nominal_spp: parseInt(nominalBaru) || 350000,
        status_spp: "LUNAS",
        foto_url: fotoUrl || null,
      }),
    });
    setNamaBaru("");
    setNoHpBaru("");
    setNominalBaru("350000");
    setFotoFile(null);
    ambilData();
    catatLog("Tambah murid", namaBaru);
  };

  const bukaEdit = (m: Murid) => {
    getaranHalus();
    setEditId(m.id);
    setEditNama(m.nama);
    setEditKelas(m.kelas);
    setEditNoHp(m.nomor_hp_ortu);
    setEditNominal(String(m.nominal_spp || 350000));
    setEditFoto(null);
  };

  const simpanEdit = async () => {
    getaranHalus();
    if (!editNama.trim() || !editNoHp.trim()) return;
    setSavingEdit(true);
    let fotoUrl = "";
    if (editFoto) {
      const fd = new FormData();
      fd.append("file", editFoto);
      const token = localStorage.getItem("tk-token") || "";
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await res.json();
      if (d.imageUrl) fotoUrl = d.imageUrl;
    }
    await fetch("/api/murid", {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        id: editId,
        nama: editNama,
        kelas: editKelas,
        nomor_hp_ortu: editNoHp,
        nominal_spp: parseInt(editNominal) || 350000,
        ...(fotoUrl ? { foto_url: fotoUrl } : {}),
      }),
    });
    setEditId(null);
    setSavingEdit(false);
    ambilData();
    catatLog("Edit murid", editNama);
  };

  const hapusMurid = async (id: string, nama: string) => {
    getaranHalus();
    if (confirm(`Hapus data murid ${nama}?`)) {
      await fetch("/api/murid", {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id }),
      });
      ambilData();
      catatLog("Hapus murid", nama);
    }
  };

  const pindahKelas = async (id: string, nama: string, kelasLama: string) => {
    getaranHalus();
    const baru = kelasLama === "mawar" ? "melati" : "mawar";
    await fetch("/api/murid", {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ id, kelas: baru }),
    });
    ambilData();
    catatLog("Pindah kelas", `${nama} → ${baru}`);
  };

  // ---------- Guru ----------
  const tambahGuru = async () => {
    getaranHalus();
    if (!namaGuruBaru.trim() || !pinGuruBaru.trim())
      return alert("Lengkapi data guru.");
    const { data: exist } = await supabase
      .from("guru")
      .select("id")
      .eq("pin_login", pinGuruBaru)
      .maybeSingle();
    if (exist) return alert("PIN sudah dipakai. Gunakan kombinasi lain.");
    await fetch("/api/guru", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ nama: namaGuruBaru, pin_login: pinGuruBaru }),
    });
    setNamaGuruBaru("");
    setPinGuruBaru("");
    ambilData();
    catatLog("Tambah guru", namaGuruBaru);
  };

  // SOLUSI KONTRAKDIKSI #2: Menambahkan getAuthHeaders()
  const hapusGuru = async (id: string, nama: string) => {
    getaranHalus();
    if (confirm(`Hapus guru ${nama}?`)) {
      try {
        const res = await fetch("/api/guru", {
          method: "DELETE",
          headers: getAuthHeaders(),
          body: JSON.stringify({ id }),
        });
        if (res.ok) {
          ambilData();
          catatLog("Hapus guru", nama);
        } else {
          const errData = await res.json();
          alert(errData.error || "Gagal menghapus guru");
        }
      } catch (err) {
        alert("Terjadi kesalahan jaringan");
      }
    }
  };

  // Perbaikan bug parameter: membaca state editPinId dan editPinBaru langsung
  const gantiPinGuru = async () => {
    getaranHalus();
    if (!editPinId || !editPinBaru.trim()) return;
    try {
      const res = await fetch("/api/guru", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: editPinId, pin_login: editPinBaru }),
      });
      if (res.ok) {
        alert("PIN berhasil diperbarui");
        setEditPinId(null);
        setEditPinBaru("");
        ambilData();
        catatLog("Ganti PIN guru");
      } else {
        const errData = await res.json();
        alert(errData.error || "Gagal mengganti PIN");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan");
    }
  };

  const filterMurid = () => {
    let list = murid;
    if (cariAdmin.trim())
      list = list.filter((m) =>
        m.nama.toLowerCase().includes(cariAdmin.toLowerCase()),
      );
    if (filterKelas) list = list.filter((m) => m.kelas === filterKelas);
    if (filterSpp) list = list.filter((m) => m.status_spp === filterSpp);
    return list;
  };

  const SESSION_DURATION = 12 * 60 * 60 * 1000;

  useEffect(() => {
    if (autentikasi) {
      ambilData();
      const timer = setTimeout(() => {
        alert("Sesi admin telah berakhir. Silakan login kembali.");
        setAutentikasi(false);
      }, SESSION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [autentikasi]);

  // ========== UI ==========
  if (!autentikasi)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden p-6 fade-in">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-300/30 blur-[100px]"></div>
          <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-300/30 blur-[100px]"></div>
        </div>

        <div className="w-full max-w-sm bg-white/80 backdrop-blur-2xl border border-white rounded-[2.5rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] relative z-10 slide-up">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner">
              <Protect theme="outline" size={32} strokeWidth={3} />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 text-center tracking-tight mb-2">
            Portal Admin
          </h1>
          <p className="text-xs font-bold text-slate-400 text-center uppercase tracking-widest mb-8">
            Otorisasi Diperlukan
          </p>

          <input
            type="password"
            inputMode="numeric"
            placeholder="Masukkan PIN"
            className="w-full py-4 text-center text-xl tracking-widest font-extrabold border-2 border-slate-100 rounded-2xl mb-4 outline-none focus:border-indigo-400 focus:bg-white bg-slate-50 transition-all text-slate-700"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            autoFocus
          />
          {error && (
            <p className="text-rose-500 text-xs font-bold text-center mb-4 bg-rose-50 py-2 rounded-xl">
              {error}
            </p>
          )}
          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-extrabold py-4 rounded-2xl text-sm active:scale-95 transition-all shadow-[0_10px_25px_rgba(99,102,241,0.3)] btn-premium tracking-wide"
          >
            Verifikasi & Masuk
          </button>
        </div>
      </div>
    );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #F8FAFC; }
        .glass-panel { background: rgba(255,255,255,0.9); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.8); shadow: 0 10px 40px rgba(0,0,0,0.04); }
        .fade-in { animation: fadeIn .5s ease-out forwards; }
        .slide-up { animation: slideUp .6s cubic-bezier(.16,1,.3,1) forwards; opacity: 0; }
        @keyframes slideUp { 0% { opacity: 0; transform: translateY(40px) } 100% { opacity: 1; transform: translateY(0) } }
        @keyframes fadeIn { 0% { opacity: 0 } 100% { opacity: 1 } }
        .btn-premium { transition: all .25s cubic-bezier(.4,0,.2,1); }
        .btn-premium:active { transform: scale(.96); }
        .btn-premium:hover { transform: translateY(-1px); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 fade-in relative overflow-x-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-100/40 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none -z-10"></div>

        <div className="max-w-2xl mx-auto">
          {/* ========== HEADER ========== */}
          <div className="flex justify-between items-center mb-8 mt-2 px-2">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                Pusat Kendali
              </h1>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">
                Dashboard Administrator
              </p>
            </div>
            <button
              onClick={() => {
                getaranHalus();
                localStorage.removeItem("tk-token");
                setAutentikasi(false);
              }}
              className="w-10 h-10 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-sm"
              title="Keluar"
            >
              <Logout
                theme="outline"
                size={18}
                strokeWidth={4}
                className="ml-0.5"
              />
            </button>
          </div>

          {/* ========== NAVIGASI TAB ========== */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-8 pb-2 px-1">
            {[
              { id: "utama", label: "Dashboard", icon: ChartPie },
              { id: "kehadiran", label: "Kehadiran", icon: Peoples },
              { id: "buku", label: "Buku Penghubung", icon: BookOne },
              { id: "riwayat", label: "Keuangan SPP", icon: Wallet },
              { id: "log", label: "Log Sistem", icon: History },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  getaranHalus();
                  setTabAdmin(t.id as any);
                }}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${
                  tabAdmin === t.id
                    ? "bg-slate-800 text-white shadow-[0_8px_20px_rgba(30,41,59,0.2)]"
                    : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <t.icon
                  theme={tabAdmin === t.id ? "filled" : "outline"}
                  size={16}
                  strokeWidth={3}
                />
                {t.label}
              </button>
            ))}
          </div>

          {/* ========== TAB UTAMA ========== */}
          {tabAdmin === "utama" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm slide-up relative overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
                    <Peoples theme="outline" size={20} strokeWidth={4} />
                  </div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Total Murid
                  </p>
                  <p className="text-3xl font-extrabold text-slate-800 mt-1">
                    {totalMurid}
                  </p>
                </div>
                <div
                  className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm slide-up relative overflow-hidden"
                  style={{ animationDelay: "0.1s" }}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
                    <ChartPie theme="outline" size={20} strokeWidth={4} />
                  </div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Hadir Hari Ini
                  </p>
                  <p className="text-3xl font-extrabold text-emerald-500 mt-1">
                    {totalHadir}
                  </p>
                </div>
                <div
                  className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm slide-up relative overflow-hidden"
                  style={{ animationDelay: "0.2s" }}
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
                    <Check theme="outline" size={20} strokeWidth={4} />
                  </div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    SPP Lunas
                  </p>
                  <p className="text-3xl font-extrabold text-indigo-500 mt-1">
                    {totalLunas}
                    <span className="text-lg text-slate-300">
                      /{totalMurid}
                    </span>
                  </p>
                </div>
                <div
                  className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm slide-up relative overflow-hidden"
                  style={{ animationDelay: "0.3s" }}
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
                    <Wallet theme="outline" size={20} strokeWidth={4} />
                  </div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Total Piutang
                  </p>
                  <p className="text-xl sm:text-2xl font-extrabold text-rose-500 mt-1 tracking-tight">
                    Rp {totalPiutang.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-[2.5rem] slide-up border border-white">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400"></span>{" "}
                  Grafik Kehadiran 7 Hari
                </p>
                <div className="flex items-end justify-between gap-2 h-28 px-2">
                  {chartLabel.map((l, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center group"
                    >
                      <span className="text-[10px] font-bold text-slate-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {chartHadir[i]}
                      </span>
                      <div className="w-full max-w-[28px] bg-slate-100 rounded-full h-full relative overflow-hidden">
                        <div
                          className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-500 to-indigo-300 rounded-full transition-all duration-1000 ease-out"
                          style={{
                            height: `${Math.min((chartHadir[i] / (totalMurid || 1)) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-[9px] font-extrabold uppercase text-slate-500 mt-3 tracking-wider">
                        {l}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 slide-up">
                <a
                  href="/api/export"
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-extrabold py-4 rounded-[1.5rem] text-xs text-center shadow-[0_8px_20px_rgba(16,185,129,0.25)] active:scale-95 transition-all btn-premium flex flex-col items-center justify-center gap-1"
                >
                  <Download theme="outline" size={20} strokeWidth={4} />
                  <span>Unduh Excel</span>
                </a>
                <button
                  onClick={() => {
                    getaranHalus();
                    const semua = murid
                      .map((m) => m.nomor_hp_ortu)
                      .filter(Boolean);
                    const pesan = prompt(
                      "Tulis pengumuman massal via WhatsApp:",
                    );
                    if (pesan) {
                      semua.forEach((hp) =>
                        fetch("/api/wa", {
                          method: "POST",
                          headers: getAuthHeaders(), // ← gunakan header yang berisi token JWT
                          body: JSON.stringify({
                            targetHp: hp,
                            pesanCustom: `📢 *PENGUMUMAN*\n\n${pesan}`,
                          }),
                        }),
                      );
                      alert("Pesan siaran sedang diproses!");
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-400 text-white font-extrabold py-4 rounded-[1.5rem] text-xs shadow-[0_8px_20px_rgba(245,158,11,0.25)] active:scale-95 transition-all btn-premium flex flex-col items-center justify-center gap-1"
                >
                  <Broadcast theme="outline" size={20} strokeWidth={4} />
                  <span>Siaran WA</span>
                </button>
              </div>

              <div className="bg-white p-2.5 rounded-[1.5rem] shadow-sm border border-slate-100 flex gap-2 slide-up">
                <div className="relative flex-1">
                  <Search
                    theme="outline"
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Cari murid..."
                    className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-transparent rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-300 transition-all text-slate-700 placeholder-slate-400"
                    value={cariAdmin}
                    onChange={(e) => setCariAdmin(e.target.value)}
                  />
                </div>
                <select
                  className="px-3 py-3 bg-slate-50 border border-transparent rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-indigo-300 transition-all cursor-pointer"
                  value={filterKelas}
                  onChange={(e) => {
                    getaranHalus();
                    setFilterKelas(e.target.value);
                  }}
                >
                  <option value="">Semua Kelas</option>
                  <option value="mawar">Mawar</option>
                  <option value="melati">Melati</option>
                </select>
                <select
                  className="px-3 py-3 bg-slate-50 border border-transparent rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-indigo-300 transition-all cursor-pointer"
                  value={filterSpp}
                  onChange={(e) => {
                    getaranHalus();
                    setFilterSpp(e.target.value);
                  }}
                >
                  <option value="">Status SPP</option>
                  <option value="LUNAS">Lunas</option>
                  <option value="MENUNGGAK">Menunggak</option>
                </select>
              </div>

              <div className="glass-panel p-5 sm:p-6 rounded-[2.5rem] slide-up border border-white">
                <div className="flex justify-between items-end mb-5">
                  <h2 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>{" "}
                    Direktori Murid
                  </h2>
                  <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-xl text-[10px] font-extrabold">
                    {filterMurid().length} Ditemukan
                  </span>
                </div>
                <div className="space-y-3">
                  {filterMurid().map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between bg-white p-3.5 rounded-[1.5rem] border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.02)] group hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] transition-all"
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <img
                          src={
                            m.foto_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(m.nama)}&background=EEF2FF&color=4F46E5&size=40`
                          }
                          className="w-11 h-11 rounded-[14px] object-cover border-2 border-white shadow-sm"
                          alt={m.nama}
                        />
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-800 text-sm truncate tracking-tight">
                            {m.nama}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                              {m.kelas}
                            </span>
                            <span
                              className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md ${m.status_spp === "LUNAS" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                            >
                              {m.status_spp}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 ml-2">
                        <button
                          onClick={() => bukaEdit(m)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-500 active:scale-90 transition-all border border-transparent hover:border-amber-100"
                          title="Edit"
                        >
                          <Edit theme="outline" size={16} strokeWidth={4} />
                        </button>
                        <button
                          onClick={() => pindahKelas(m.id, m.nama, m.kelas)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 active:scale-90 transition-all border border-transparent hover:border-indigo-100"
                          title="Pindah Kelas"
                        >
                          <Switch theme="outline" size={16} strokeWidth={4} />
                        </button>
                        <button
                          onClick={() => hapusMurid(m.id, m.nama)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 active:scale-90 transition-all border border-transparent hover:border-rose-100"
                          title="Hapus"
                        >
                          <Delete theme="outline" size={16} strokeWidth={4} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-5 sm:p-6 rounded-[2.5rem] slide-up border border-white">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>{" "}
                  Pendaftaran Murid Baru
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nama Lengkap"
                      className="w-full p-4 bg-white/60 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-400 focus:bg-white transition-all placeholder-slate-400"
                      value={namaBaru}
                      onChange={(e) => setNamaBaru(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="No. HP Orang Tua (WA)"
                      className="w-full p-4 bg-white/60 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-400 focus:bg-white transition-all placeholder-slate-400"
                      value={noHpBaru}
                      onChange={(e) => setNoHpBaru(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      placeholder="Nominal SPP"
                      className="flex-1 p-4 bg-white/60 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-400 focus:bg-white transition-all placeholder-slate-400"
                      value={nominalBaru}
                      onChange={(e) => setNominalBaru(e.target.value)}
                    />
                    <select
                      className="w-[120px] p-4 bg-white/60 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 outline-none focus:border-emerald-400 focus:bg-white transition-all cursor-pointer"
                      value={kelasBaru}
                      onChange={(e) => setKelasBaru(e.target.value)}
                    >
                      <option value="mawar">Mawar</option>
                      <option value="melati">Melati</option>
                    </select>
                  </div>
                  <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-extrabold text-slate-500 cursor-pointer bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300 transition-all">
                    <Camera
                      theme="outline"
                      size={18}
                      strokeWidth={4}
                      className="text-slate-400"
                    />
                    <span className="truncate">
                      {fotoFile
                        ? fotoFile.name
                        : "Pilih Foto Profil (Opsional)"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        getaranHalus();
                        setFotoFile(e.target.files?.[0] || null);
                      }}
                    />
                  </label>
                  <button
                    onClick={tambahMurid}
                    disabled={uploading}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-4 rounded-2xl active:scale-[0.98] transition-all btn-premium text-sm flex items-center justify-center gap-2 mt-2"
                  >
                    {uploading ? (
                      "Mengunggah..."
                    ) : (
                      <>
                        <Plus theme="outline" size={18} strokeWidth={4} />{" "}
                        Simpan Data Murid
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="glass-panel p-5 sm:p-6 rounded-[2.5rem] slide-up border border-white">
                <div className="flex justify-between items-end mb-5">
                  <h2 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>{" "}
                    Otoritas Guru
                  </h2>
                </div>
                <div className="flex bg-slate-50 p-2 rounded-2xl border border-slate-100 mb-5">
                  <input
                    type="text"
                    placeholder="Nama Guru"
                    className="flex-1 p-3 bg-transparent text-xs font-bold text-slate-800 placeholder-slate-400 outline-none"
                    value={namaGuruBaru}
                    onChange={(e) => setNamaGuruBaru(e.target.value)}
                  />
                  <div className="w-px bg-slate-200 my-2 mx-1"></div>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="PIN Baru"
                    className="w-24 p-3 bg-transparent text-xs text-center font-bold text-slate-800 placeholder-slate-400 outline-none tracking-widest"
                    value={pinGuruBaru}
                    onChange={(e) =>
                      setPinGuruBaru(e.target.value.replace(/\D/g, ""))
                    }
                  />
                  <button
                    onClick={tambahGuru}
                    className="bg-purple-500 text-white font-extrabold w-12 rounded-xl active:scale-95 transition-all flex items-center justify-center shadow-md shadow-purple-200"
                  >
                    <Plus theme="outline" size={18} strokeWidth={5} />
                  </button>
                </div>
                <div className="space-y-2">
                  {guru.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center font-extrabold">
                          {g.nama.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 text-sm">
                            {g.nama}
                          </p>
                          {/* PIN disembunyikan sesuai rekomendasi keamanan */}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            getaranHalus();
                            setEditPinId(g.id);
                            setEditPinBaru("");
                          }}
                          className="px-3 py-2 bg-slate-50 hover:bg-purple-50 text-slate-500 hover:text-purple-600 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all border border-slate-100"
                        >
                          Ubah PIN
                        </button>
                        <button
                          onClick={() => hapusGuru(g.id, g.nama)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 active:scale-90 transition-all border border-slate-100"
                          title="Cabut Akses"
                        >
                          <Delete theme="outline" size={16} strokeWidth={4} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---------- KEHADIRAN TAB ---------- */}
          {tabAdmin === "kehadiran" && (
            <div className="glass-panel p-5 sm:p-6 rounded-[2.5rem] slide-up border border-white">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>{" "}
                Rekap Kehadiran Hari Ini
              </p>
              <div className="space-y-3">
                {kehadiranHariIni.length === 0 ? (
                  <p className="text-xs text-center text-slate-400 py-10 font-bold">
                    Belum ada data absensi hari ini.
                  </p>
                ) : (
                  kehadiranHariIni.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
                    >
                      <div>
                        <p className="font-extrabold text-slate-800 text-sm mb-0.5">
                          {h.murid?.nama || "-"}
                        </p>
                        <div className="flex gap-2 items-center">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md">
                            {h.murid?.kelas || "-"}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md ${h.status_hadir === "hadir" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                          >
                            {h.status_hadir === "pulang"
                              ? "SUDAH PULANG"
                              : h.status_hadir}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col gap-1">
                        <div className="flex items-center justify-end gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          <span className="text-[9px] font-extrabold uppercase">
                            Tiba:
                          </span>
                          <span className="text-xs font-bold">
                            {h.waktu_datang
                              ? new Date(h.waktu_datang).toLocaleTimeString(
                                  "id-ID",
                                  { hour: "2-digit", minute: "2-digit" },
                                )
                              : "--:--"}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-1.5 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                          <span className="text-[9px] font-extrabold uppercase">
                            Pulang:
                          </span>
                          <span className="text-xs font-bold">
                            {h.waktu_pulang
                              ? new Date(h.waktu_pulang).toLocaleTimeString(
                                  "id-ID",
                                  { hour: "2-digit", minute: "2-digit" },
                                )
                              : "--:--"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ---------- BUKU PENGHUBUNG TAB ---------- */}
          {tabAdmin === "buku" && (
            <div className="glass-panel p-5 sm:p-6 rounded-[2.5rem] slide-up border border-white">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>{" "}
                Arsip Buku Penghubung
              </p>
              <div className="space-y-3">
                {murid.map((anak) => (
                  <div
                    key={anak.id}
                    className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        getaranHalus();
                        lihatBuku(
                          bukuMurid?.id === anak.id ? (null as any) : anak,
                        );
                      }}
                      className="w-full text-left p-4 flex items-center justify-between active:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={
                            anak.foto_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(anak.nama)}&background=EEF2FF&color=4F46E5&size=40`
                          }
                          className="w-10 h-10 rounded-xl object-cover border border-slate-100"
                        />
                        <span className="font-extrabold text-sm text-slate-800">
                          {anak.nama}
                        </span>
                      </div>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${bukuMurid?.id === anak.id ? "bg-indigo-50 text-indigo-500 rotate-180" : "bg-slate-50 text-slate-400"}`}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                    </button>
                    {bukuMurid?.id === anak.id && (
                      <div className="px-5 pb-5 pt-1 slide-up">
                        <div className="border-t border-slate-100 pt-4">
                          {bukuLog.length === 0 && !bukuSheet ? (
                            <p className="text-xs text-slate-400 italic font-semibold">
                              Belum ada jurnal/aktivitas hari ini.
                            </p>
                          ) : (
                            <div className="space-y-4">
                              {bukuSheet && (
                                <div>
                                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                                    Daily Sheet
                                  </span>
                                  <div className="flex gap-2 flex-wrap">
                                    {bukuSheet.makan && (
                                      <span className="bg-amber-50 border border-amber-100 text-amber-600 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm">
                                        🍱 {bukuSheet.makan}
                                      </span>
                                    )}
                                    {bukuSheet.tidur && (
                                      <span className="bg-violet-50 border border-violet-100 text-violet-600 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm">
                                        💤 {bukuSheet.tidur}
                                      </span>
                                    )}
                                    {bukuSheet.mood && (
                                      <span className="bg-rose-50 border border-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm">
                                        😊 {bukuSheet.mood}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              {bukuLog.length > 0 && (
                                <div>
                                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-3">
                                    Timeline
                                  </span>
                                  <div className="border-l-2 border-indigo-50 ml-2 pl-4 space-y-4 relative">
                                    {bukuLog.map((l, i) => (
                                      <div key={i} className="relative">
                                        <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 bg-white border-2 border-indigo-400 rounded-full"></div>
                                        <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                                          <span className="text-[9px] font-extrabold text-indigo-500 mb-1 block">
                                            {new Date(
                                              l.created_at,
                                            ).toLocaleTimeString("id-ID", {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </span>
                                          <p className="text-xs font-semibold text-slate-700 whitespace-pre-wrap">
                                            {l.deskripsi}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------- SPP TAB ---------- */}
          {tabAdmin === "riwayat" && (
            <div className="space-y-6">
              <div className="glass-panel p-5 sm:p-6 rounded-[2.5rem] slide-up border border-white">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>{" "}
                  Pembayaran Iuran
                </p>
                <div className="relative mb-5">
                  <Search
                    theme="outline"
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Cari murid..."
                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-400 text-slate-800 placeholder-slate-400 shadow-sm transition-all"
                    value={cariAdmin}
                    onChange={(e) => setCariAdmin(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  {murid
                    .filter((anak) =>
                      anak.nama.toLowerCase().includes(cariAdmin.toLowerCase()),
                    )
                    .map((anak) => (
                      <div
                        key={anak.id}
                        className="flex items-center justify-between p-3.5 bg-white rounded-2xl shadow-sm border border-slate-100"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              anak.foto_url ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(anak.nama)}&background=EEF2FF&color=4F46E5&size=32`
                            }
                            className="w-10 h-10 rounded-[10px] object-cover"
                          />
                          <span className="font-extrabold text-sm text-slate-800">
                            {anak.nama}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            getaranHalus();
                            ambilIuran(anak);
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-extrabold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl active:scale-95 transition-all border border-emerald-100"
                        >
                          Kartu SPP
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              <div className="glass-panel p-5 sm:p-6 rounded-[2.5rem] slide-up border border-white">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>{" "}
                  Riwayat Perubahan Status SPP
                </p>
                <div className="space-y-3">
                  {riwayatSpp.length === 0 ? (
                    <p className="text-xs text-slate-400 italic font-semibold text-center py-4">
                      Belum ada riwayat transaksi.
                    </p>
                  ) : (
                    riwayatSpp.map((r) => (
                      <div
                        key={r.id}
                        className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
                      >
                        <div>
                          <p className="font-extrabold text-slate-800 text-sm mb-1">
                            {r.murid?.nama || "-"}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                              {r.status_sebelum}
                            </span>
                            <span className="text-slate-300">→</span>
                            <span
                              className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md border ${r.status_sesudah === "LUNAS" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"}`}
                            >
                              {r.status_sesudah}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-700">
                            Rp {r.nominal?.toLocaleString("id-ID")}
                          </p>
                          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">
                            {new Date(r.created_at).toLocaleDateString(
                              "id-ID",
                              { day: "numeric", month: "short" },
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---------- LOG TAB ---------- */}
          {tabAdmin === "log" && (
            <div className="glass-panel p-5 sm:p-6 rounded-[2.5rem] slide-up border border-white">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span> Log
                Aktivitas Sistem
              </p>
              <div className="border-l-2 border-slate-100 ml-2 pl-4 space-y-5 relative">
                {logAdmin.map((l) => (
                  <div key={l.id} className="relative">
                    <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 bg-white border-2 border-slate-300 rounded-full"></div>
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 mb-0.5">
                        {new Date(l.created_at).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="font-extrabold text-slate-800 text-sm">
                        {l.aksi}
                      </p>
                      {l.detail && (
                        <p className="text-xs font-semibold text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 mt-1.5 inline-block">
                          {l.detail}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================= MODALS ========================== */}

      {/* MODAL KARTU IURAN */}
      {iuranMurid && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
          <div className="bg-white/95 backdrop-blur-xl w-full max-w-sm rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] slide-up flex flex-col max-h-[85vh] border border-white/60">
            <div className="flex justify-between items-center p-6 border-b border-slate-100/60 relative z-10 bg-white/50 rounded-t-[2.5rem]">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">
                  Kartu SPP {tahunIuran}
                </h2>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mt-1">
                  {iuranMurid.nama} • {iuranMurid.kelas}
                </p>
              </div>
              <button
                onClick={() => {
                  getaranHalus();
                  setIuranMurid(null);
                }}
                className="w-8 h-8 flex items-center justify-center text-slate-400 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-all active:scale-90"
              >
                <CloseSmall size={20} strokeWidth={4} />
              </button>
            </div>

            <div className="overflow-y-auto hide-scrollbar p-6 space-y-3">
              {NAMA_BULAN.map((nama, idx) => {
                const bulan = idx + 1;
                const sudahLunas = !!iuranData[bulan];
                return (
                  <div
                    key={bulan}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${sudahLunas ? "bg-emerald-50/50 border-emerald-100 shadow-sm" : "bg-white border-slate-200"}`}
                  >
                    <span
                      className={`text-sm font-extrabold w-10 ${sudahLunas ? "text-emerald-700" : "text-slate-600"}`}
                    >
                      {nama}
                    </span>
                    {sudahLunas ? (
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest border border-emerald-200/50 bg-white px-2 py-1 rounded-md">
                          {new Date(iuranData[bulan]!).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short" },
                          )}
                        </span>
                        <button
                          onClick={() => {
                            getaranHalus();
                            simpanTanggalBayar(bulan, null);
                          }}
                          className="w-7 h-7 flex items-center justify-center bg-white text-rose-400 hover:text-rose-600 border border-rose-100 rounded-lg active:scale-90 transition-all shadow-sm"
                        >
                          <CloseSmall size={16} strokeWidth={4} />
                        </button>
                      </div>
                    ) : (
                      <input
                        type="date"
                        className="text-[10px] p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-extrabold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition-all cursor-pointer"
                        onChange={(e) => {
                          getaranHalus();
                          simpanTanggalBayar(bulan, e.target.value || null);
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT MURID */}
      {editId && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
          <div className="bg-white/95 backdrop-blur-xl w-full max-w-sm p-6 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] slide-up border border-white/60">
            <h2 className="text-xl font-extrabold mb-5 text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Edit
              Profil Murid
            </h2>
            <div className="space-y-3 mb-6">
              <input
                type="text"
                placeholder="Nama Lengkap"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-amber-400 focus:bg-white outline-none transition-all"
                value={editNama}
                onChange={(e) => setEditNama(e.target.value)}
              />
              <input
                type="text"
                placeholder="No HP"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-amber-400 focus:bg-white outline-none transition-all"
                value={editNoHp}
                onChange={(e) => setEditNoHp(e.target.value)}
              />
              <input
                type="number"
                placeholder="Nominal SPP"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-amber-400 focus:bg-white outline-none transition-all"
                value={editNominal}
                onChange={(e) => setEditNominal(e.target.value)}
              />
              <div className="flex gap-3">
                <select
                  className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-amber-400 focus:bg-white outline-none transition-all cursor-pointer"
                  value={editKelas}
                  onChange={(e) => setEditKelas(e.target.value)}
                >
                  <option value="mawar">Mawar</option>
                  <option value="melati">Melati</option>
                </select>
                <label className="flex-1 p-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-extrabold text-slate-500 cursor-pointer bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300 transition-all flex items-center justify-center gap-1">
                  <Camera theme="outline" size={16} /> <span>Ubah Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditFoto(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  getaranHalus();
                  setEditId(null);
                }}
                className="flex-1 bg-slate-100 text-slate-600 font-extrabold py-3.5 rounded-2xl active:scale-95 transition-all text-sm hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={simpanEdit}
                disabled={savingEdit}
                className="flex-[2] bg-amber-500 text-white font-extrabold py-3.5 rounded-2xl active:scale-95 transition-all text-sm shadow-[0_8px_20px_rgba(245,158,11,0.25)] hover:shadow-lg disabled:opacity-70"
              >
                {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GANTI PIN GURU */}
      {editPinId && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
          <div className="bg-white/95 backdrop-blur-xl w-full max-w-xs p-6 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] slide-up border border-white/60 text-center">
            <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Protect theme="outline" size={24} strokeWidth={4} />
            </div>
            <h2 className="text-lg font-extrabold mb-1 text-slate-800">
              Setel Ulang PIN
            </h2>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-5">
              Otoritas Keamanan Guru
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Masukkan 6 Digit PIN"
              className="w-full py-4 text-center text-lg tracking-[0.5em] bg-slate-50 border border-slate-200 rounded-2xl font-extrabold mb-6 outline-none focus:border-purple-400 focus:bg-white transition-all text-slate-700"
              value={editPinBaru}
              onChange={(e) =>
                setEditPinBaru(e.target.value.replace(/\D/g, ""))
              }
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  getaranHalus();
                  setEditPinId(null);
                }}
                className="flex-1 bg-slate-100 text-slate-600 font-extrabold py-3 rounded-2xl active:scale-95 transition-all text-xs hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={gantiPinGuru}
                className="flex-[1.5] bg-purple-500 text-white font-extrabold py-3 rounded-2xl active:scale-95 transition-all text-xs shadow-[0_8px_20px_rgba(168,85,247,0.25)] hover:shadow-lg"
              >
                Simpan PIN Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
