"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Check, VolumeNotice, Protect } from "@icon-park/react";
import DashboardHeader from "./components/dashboard/DashboardHeader";
import BroadcastModal from "./components/dashboard/BroadcastModal";
import { Kehadiran, Murid, PengaturanSekolah } from "./types/database";

interface MuridLengkap extends Murid {
  kehadiranHariIni?: Kehadiran | null;
}

export default function Home() {
  // --- Fungsi Getaran Internal ---
  const getaranHalus = () => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  // --- State Autentikasi ---
  const [autentikasi, setAutentikasi] = useState(false);
  const [pin, setPin] = useState("");
  const [errorLogin, setErrorLogin] = useState("");

  // --- State Data Utama ---
  const [daftarMurid, setDaftarMurid] = useState<MuridLengkap[]>([]);
  const [pengaturan, setPengaturan] = useState<PengaturanSekolah | null>(null);

  // --- State Guru ---
  const [guruHadir, setGuruHadir] = useState(false);
  const [guruNama, setGuruNama] = useState("");
  const [loadingAbsen, setLoadingAbsen] = useState(false);

  // --- State UI & Navigasi ---
  const [tab, setTab] = useState<"utama" | "kelas">("utama");
  const [kelasAktif, setKelasAktif] = useState<string>("mawar");
  const [pencarian, setPencarian] = useState("");

  // --- State Broadcast ---
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [tipeSiaran, setTipeSiaran] = useState<"umum" | "spp">("umum");
  const [teksSiaran, setTeksSiaran] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // ==========================================
  // LOGIKA AUTENTIKASI & DATA
  // ==========================================

  const cekKehadiranGuru = async (token: string) => {
    try {
      const res = await fetch("/api/kehadiran-guru?today=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.hadir) {
        setGuruHadir(true);
      }
    } catch (err) {
      console.error("Gagal memuat kehadiran guru:", err);
    }
  };

  const handleLogin = async () => {
    getaranHalus();
    setErrorLogin("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, role: "guru" }),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("tk-token", data.token);
        if (data.guru) {
          setGuruNama(data.guru.nama);
        }
        setAutentikasi(true);
        // Cek apakah guru ini sudah absen hari ini
        await cekKehadiranGuru(data.token);
      } else {
        setErrorLogin(data.error || "PIN salah");
      }
    } catch (err) {
      setErrorLogin("Gagal terhubung ke server");
    }
  };

  // Cek token tersimpan saat aplikasi dimuat
  useEffect(() => {
    const token = localStorage.getItem("tk-token");
    if (token) {
      setAutentikasi(true);
      cekKehadiranGuru(token);
    }
  }, []);

  const ambilData = async () => {
    try {
      const token = localStorage.getItem("tk-token") || "";
      const headers = { Authorization: `Bearer ${token}` };

      const [resMurid, resHadir, resAtur] = await Promise.all([
        fetch("/api/murid", { headers }),
        fetch("/api/kehadiran", { headers }),
        fetch("/api/pengaturan-sekolah", { headers }),
      ]);

      if (!resMurid.ok) {
        if (resMurid.status === 401 || resMurid.status === 403) {
          setAutentikasi(false);
          localStorage.removeItem("tk-token");
          return;
        }
      }

      const muridData = await resMurid.json();
      const kehadiranData = await resHadir.json();
      const pengaturanData = await resAtur.json();

      const today = new Date().toISOString().split("T")[0];
      const kehadiranHariIni = (kehadiranData.data || []).filter(
        (k: Kehadiran) => k.tanggal === today,
      );

      const muridLengkap = (muridData.data || []).map((m: Murid) => {
        const hadir = kehadiranHariIni.find(
          (k: Kehadiran) => k.murid_id === m.id,
        );
        return { ...m, kehadiranHariIni: hadir || null };
      });

      setDaftarMurid(muridLengkap);
      setPengaturan(pengaturanData.data?.[0] || null);
    } catch (err) {
      console.error("Gagal mengambil data:", err);
    }
  };

  useEffect(() => {
    if (autentikasi) {
      ambilData();
    }
  }, [autentikasi]);

  // ==========================================
  // HANDLERS AKSI
  // ==========================================

  const absenGuru = async () => {
    getaranHalus();
    setLoadingAbsen(true);
    try {
      const token = localStorage.getItem("tk-token");
      const res = await fetch("/api/kehadiran-guru", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setGuruHadir(true);
      } else {
        const data = await res.json();
        alert(data.error || "Gagal absen.");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setLoadingAbsen(false);
    }
  };

  const handleKehadiran = async (muridId: string, statusHadir: string) => {
    getaranHalus();
    const token = localStorage.getItem("tk-token") || "";
    const m = daftarMurid.find((x) => x.id === muridId);
    if (!m) return;

    // Optimistic UI update
    setDaftarMurid((prev) =>
      prev.map((anak) =>
        anak.id === muridId
          ? {
              ...anak,
              kehadiranHariIni: {
                ...anak.kehadiranHariIni,
                id: anak.kehadiranHariIni?.id || "temp",
                murid_id: muridId,
                tanggal: new Date().toISOString().split("T")[0],
                status_hadir: statusHadir,
              } as Kehadiran,
            }
          : anak,
      ),
    );

    try {
      await fetch("/api/kehadiran", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          murid_id: muridId,
          status_hadir: statusHadir,
        }),
      });
      ambilData();
    } catch (err) {
      console.error("Gagal update kehadiran:", err);
      ambilData(); // Revert jika gagal
    }
  };

  const kirimSiaran = async () => {
    getaranHalus();
    if (!teksSiaran.trim()) return;
    setIsBroadcasting(true);

    const token = localStorage.getItem("tk-token") || "";
    const targetMurid = filterMuridKelas(kelasAktif);
    let sukses = 0;

    for (const m of targetMurid) {
      if (!m.nomor_hp_ortu) continue;

      let pesan = teksSiaran
        .replace(/\[Nama\]/g, m.nama)
        .replace(/\[Kelas\]/g, m.kelas);

      if (tipeSiaran === "spp") {
        pesan = pesan.replace(
          /\[Nominal\]/g,
          `Rp ${(m.nominal_spp || 350000).toLocaleString("id-ID")}`,
        );
      }

      try {
        await fetch("/api/wa", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            targetHp: m.nomor_hp_ortu,
            pesanCustom: pesan,
          }),
        });
        sukses++;
      } catch (err) {
        console.error(`Gagal kirim ke ${m.nama}`);
      }
    }

    setIsBroadcasting(false);
    setShowBroadcast(false);
    alert(`Siaran berhasil dikirim ke ${sukses} kontak!`);
  };

  const handlePilihTipe = (tipe: string, template: string) => {
    setTipeSiaran(tipe as "umum" | "spp");
    setTeksSiaran(template);
  };

  // ==========================================
  // HELPERS
  // ==========================================

  const filterMuridKelas = (kelas: string): MuridLengkap[] => {
    return daftarMurid.filter((m) => m.kelas === kelas);
  };

  const listMuridTampil = useMemo(() => {
    return filterMuridKelas(kelasAktif).filter((m) =>
      m.nama.toLowerCase().includes(pencarian.toLowerCase()),
    );
  }, [daftarMurid, kelasAktif, pencarian]);

  // ==========================================
  // RENDER UI
  // ==========================================

  if (!autentikasi) {
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
            Portal Guru
          </h1>
          <p className="text-xs font-bold text-slate-400 text-center uppercase tracking-widest mb-8">
            Verifikasi Identitas
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
          {errorLogin && (
            <p className="text-rose-500 text-xs font-bold text-center mb-4 bg-rose-50 py-2 rounded-xl">
              {errorLogin}
            </p>
          )}
          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-extrabold py-4 rounded-2xl text-sm active:scale-95 transition-all shadow-[0_10px_25px_rgba(99,102,241,0.3)] btn-premium tracking-wide"
          >
            Masuk Kelas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto relative bg-slate-50 min-h-screen font-sans shadow-2xl shadow-slate-200/50 fade-in">
      {/* ----------------- TAB UTAMA (Pilih Kelas) ----------------- */}
      {tab === "utama" && (
        <div className="min-h-screen p-6 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200/40 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

          <div className="relative z-10 mb-10 text-center">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
              Halo, {guruNama || "Guru"}! 👋
            </h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Pilih kelas yang ingin dikelola
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10">
            {/* Kelas Mawar */}
            <button
              onClick={() => {
                getaranHalus();
                setKelasAktif("mawar");
                setTab("kelas");
              }}
              className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all flex flex-col items-center gap-3 active:scale-95"
            >
              <div className="w-16 h-16 rounded-[1.25rem] bg-rose-50 text-3xl flex items-center justify-center border border-rose-100 shadow-inner">
                🌸
              </div>
              <span className="font-extrabold text-slate-700 text-sm tracking-wide">
                Mawar
              </span>
            </button>

            {/* Kelas Melati */}
            <button
              onClick={() => {
                getaranHalus();
                setKelasAktif("melati");
                setTab("kelas");
              }}
              className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all flex flex-col items-center gap-3 active:scale-95"
            >
              <div className="w-16 h-16 rounded-[1.25rem] bg-amber-50 text-3xl flex items-center justify-center border border-amber-100 shadow-inner">
                🌼
              </div>
              <span className="font-extrabold text-slate-700 text-sm tracking-wide">
                Melati
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ----------------- TAB KELAS (Manajemen Kelas) ----------------- */}
      {tab === "kelas" && (
        <div className="pb-32 bg-slate-50 min-h-screen">
          <DashboardHeader
            kelasAktif={kelasAktif}
            muridHadir={
              filterMuridKelas(kelasAktif).filter(
                (m) => m.kehadiranHariIni?.status_hadir === "hadir",
              ).length
            }
            guruHadir={guruHadir}
            onKembali={() => {
              getaranHalus();
              setTab("utama");
            }}
          />

          {/* BANNER ABSEN GURU - Tampil jika belum absen */}
          {!guruHadir && (
            <div className="mx-5 mt-5 mb-2 p-4 bg-white rounded-[2rem] border-2 border-rose-100 shadow-[0_8px_20px_rgba(244,63,94,0.08)] flex items-center justify-between slide-up relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-2xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
              <div className="relative z-10">
                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-0.5">
                  Tugas Hari Ini
                </p>
                <p className="text-sm font-black text-slate-800">
                  Anda belum Check-In 👩‍🏫
                </p>
              </div>
              <button
                onClick={absenGuru}
                disabled={loadingAbsen}
                className="relative z-10 px-4 py-3 bg-rose-500 text-white font-black text-xs rounded-2xl active:scale-95 transition-all shadow-[0_4px_15px_rgba(244,63,94,0.3)] hover:bg-rose-600 disabled:opacity-70"
              >
                {loadingAbsen ? "Tunggu..." : "Hadir Sekarang"}
              </button>
            </div>
          )}

          {/* Search Bar - Sticky */}
          <div className="px-5 pt-4 pb-2 sticky top-[100px] z-30 bg-slate-50/90 backdrop-blur-md">
            <div className="relative">
              <Search
                theme="outline"
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Cari nama murid..."
                value={pencarian}
                onChange={(e) => setPencarian(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] text-xs font-bold outline-none focus:border-indigo-400 focus:bg-white transition-all text-slate-700 shadow-sm placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="px-5 pt-4">
            <div className="flex justify-between items-end mb-5">
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">
                  Check-In Pagi
                </h2>
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">
                  Ketuk ceklis untuk hadir
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider text-rose-600 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                <span>
                  {
                    filterMuridKelas(kelasAktif).filter(
                      (m) => m.kehadiranHariIni?.status_hadir !== "hadir",
                    ).length
                  }{" "}
                  Belum Hadir
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {listMuridTampil.map((murid) => {
                const sudahHadir =
                  murid.kehadiranHariIni?.status_hadir === "hadir";

                return (
                  <div
                    key={murid.id}
                    className={`relative p-3.5 rounded-[2rem] border-2 transition-all duration-300 flex flex-col shadow-sm ${
                      sudahHadir
                        ? "bg-white border-emerald-100"
                        : "bg-white border-slate-100 hover:border-indigo-100"
                    }`}
                  >
                    <div className="relative w-full aspect-square rounded-[1.25rem] overflow-hidden mb-3 bg-slate-50 border border-slate-100">
                      {murid.foto_url ? (
                        <img
                          src={murid.foto_url}
                          alt={murid.nama}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50/50">
                          <span className="text-3xl font-black text-indigo-600/30">
                            {murid.nama.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Lencana Kelas (Kecil di sudut) */}
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center">
                        <span className="text-[10px] opacity-70">
                          {murid.kelas === "mawar" ? "🌸" : "🌼"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center px-1 pb-1">
                      <p className="font-extrabold text-slate-800 text-[11px] truncate w-2/3 tracking-tight">
                        {murid.nama}
                      </p>
                      <button
                        onClick={() =>
                          handleKehadiran(
                            murid.id,
                            sudahHadir ? "pulang" : "hadir",
                          )
                        }
                        className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center transition-all ${
                          sudahHadir
                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                            : "bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500"
                        }`}
                      >
                        <Check theme="outline" size={14} strokeWidth={4} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TOMBOL FAB BROADCAST ----------------- */}
      {tab === "kelas" && (
        <button
          onClick={() => {
            getaranHalus();
            setTipeSiaran("umum");
            setTeksSiaran(
              pengaturan?.template_pesan_umum ||
                "Pengumuman: [Nama] kelas [Kelas]...",
            );
            setShowBroadcast(true);
          }}
          className="fixed bottom-28 right-6 w-[56px] h-[56px] bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-[0_10px_25px_rgba(245,158,11,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 btn-premium"
        >
          <VolumeNotice theme="outline" size={26} strokeWidth={4} />
        </button>
      )}

      {/* ----------------- BOTTOM NAVIGATION PILL ----------------- */}
      {tab === "kelas" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/95 backdrop-blur-xl border border-slate-100 p-2 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.08)] flex justify-around items-center z-50">
          <button className="flex flex-col items-center gap-1 p-2 w-16 text-indigo-600 active:scale-90 transition-transform relative">
            <div className="absolute -top-3 w-1 h-1 bg-indigo-600 rounded-full"></div>
            <Check theme="filled" size={22} />
            <span className="text-[9px] font-black uppercase tracking-wider">
              Tiba
            </span>
          </button>

          <button className="flex flex-col items-center gap-1 p-2 w-16 text-slate-300 hover:text-indigo-400 transition-colors active:scale-90 relative">
            <svg
              width="22"
              height="22"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z"
                fill="currentColor"
                fillOpacity="0.1"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <path
                d="M24 16A3 3 0 1 0 24 22A3 3 0 1 0 24 16Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <path
                d="M15 31L18.4239 25.8647C19.2329 24.6511 21.0366 24.5222 21.9961 25.6117L26.0039 30.159C26.9634 31.2485 28.7671 31.1196 29.5761 29.906L33 24"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-wider opacity-0">
              Buku
            </span>
          </button>
        </div>
      )}

      {/* ----------------- MODAL BROADCAST ----------------- */}
      <BroadcastModal
        bukaSiaran={showBroadcast}
        tipeSiaran={tipeSiaran}
        teksSiaran={teksSiaran}
        isBroadcasting={isBroadcasting}
        onTutup={() => setShowBroadcast(false)}
        onUbahTeks={setTeksSiaran}
        onPilihTipe={handlePilihTipe}
        onKirim={kirimSiaran}
        templateUmum={pengaturan?.template_pesan_umum || ""}
        templateSpp={pengaturan?.template_pesan_spp || ""}
      />
    </div>
  );
}
