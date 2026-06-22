"use client";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// INISIALISASI SUPABASE (Mengambil rahasia dari .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TEMPLATE_PESAN = {
  umum: "Syalom Bunda/Ayah,\n\nIni adalah informasi resmi dari TK Tadika Mesra.\n\n[KETIK INFO DI SINI]\n\nKurré sumanga' atas perhatiannya. Tuhan memberkati.",
  spp: "Syalom Bunda/Ayah,\n\nSemoga keluarga dalam keadaan sehat selalu. Tabe', dengan penuh kerendahan hati kami dari administrasi TK Tadika Mesra ingin mengingatkan mengenai administrasi SPP bulan ini yang mungkin terlewat.\n\nJika sudah menyelesaikan administrasi, mohon abaikan pesan ini. Kurré sumanga' atas dukungan Bunda/Ayah yang luar biasa bagi kelancaran operasional sekolah kita. Tuhan memberkati. 🙏",
  bekal:
    "Syalom Bunda,\n\nTabe', demi kenyamanan dan kesehatan ananda selama berkegiatan di sekolah hari ini, mohon kesediaannya untuk membekali ananda dengan:\n\n- Botol minum pribadi\n- [TAMBAHKAN KEBUTUHAN LAIN, CTH: Baju Ganti]\n\nKurré sumanga' atas kerja samanya Bunda! 🎒✨",
};

export default function AppTK() {
  const [tampilan, setTampilan] = useState("login");
  const [namaGuru, setNamaGuru] = useState("");
  const [kelasAktif, setKelasAktif] = useState("");
  const [tabAktif, setTabAktif] = useState("datang");

  // STATE DATABASE SUPABASE
  const [dataSemuaMurid, setDataSemuaMurid] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Perubahan Tipe Data: ID dari Supabase adalah UUID (String), bukan Number lagi
  const [statusAnak, setStatusAnak] = useState<Record<string, string>>({});
  const [logKegiatan, setLogKegiatan] = useState<Record<string, string[]>>({});
  const [pilihanAnak, setPilihanAnak] = useState<string[]>([]);
  const [jenisKegiatan, setJenisKegiatan] = useState("");
  const [penjemput, setPenjemput] = useState<Record<string, string>>({});
  const [ketPenjemput, setKetPenjemput] = useState<Record<string, string>>({});

  const [bukaSiaran, setBukaSiaran] = useState(false);
  const [tipeSiaran, setTipeSiaran] = useState("umum");
  const [teksSiaran, setTeksSiaran] = useState(TEMPLATE_PESAN.umum);

  const audioRef = useRef<AudioContext | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // FUNGSI TARIK DATA DARI SUPABASE
  useEffect(() => {
    const tarikDataMurid = async () => {
      const { data, error } = await supabase.from("murid").select("*");
      if (error) {
        console.error("Gagal menarik data:", error);
      } else if (data) {
        setDataSemuaMurid(data);
      }
      setIsLoading(false);
    };
    tarikDataMurid();
  }, []);

  // Filter Data Supabase Berdasarkan Kelas Aktif
  const muridSemua = dataSemuaMurid.filter(
    (m) => m.kelas.toLowerCase() === kelasAktif.toLowerCase(),
  );

  const muridBelumHadir = muridSemua.filter(
    (a) => !statusAnak[a.id] || statusAnak[a.id] === "belum",
  );
  const muridHadir = muridSemua.filter((a) => statusAnak[a.id] === "hadir");

  const getaranHalus = () => {
    if (typeof window !== "undefined" && navigator.vibrate)
      navigator.vibrate(50);
    try {
      if (!audioRef.current)
        audioRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      const ctx = audioRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = 720;
      g.gain.value = 0.05;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.07);
    } catch {}
  };

  // Catatan: idAnak sekarang bertipe string karena UUID
  const catatKegiatan = (idAnak: string, teksKegiatan: string) => {
    const waktu = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setLogKegiatan((prev) => ({
      ...prev,
      [idAnak]: [...(prev[idAnak] || []), `[${waktu}] ${teksKegiatan}`],
    }));
  };

  const kirimWA = async (nomorHp: string, pesanRangkuman: string) => {
    try {
      await fetch("/api/wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetHp: nomorHp,
          pesanCustom: pesanRangkuman,
        }),
      });
    } catch (e) {
      console.error("Error Server WA.");
    }
  };

  const handleKirimSiaran = async () => {
    getaranHalus();
    if (!teksSiaran) return alert("Pesan tidak boleh kosong!");
    alert(
      "📢 Mengirim siaran ke semua orang tua murid di kelas ini. Mohon tunggu...",
    );
    setBukaSiaran(false);
    for (const anak of muridSemua) {
      // Menggunakan nomor_hp_ortu sesuai nama kolom di database
      await kirimWA(
        anak.nomor_hp_ortu,
        `📢 *PENGUMUMAN KELAS*\n\n${teksSiaran}`,
      );
    }
    alert("✅ Siaran berhasil terkirim!");
  };

  const handleDatang = (anak: any) => {
    getaranHalus();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 900);
    setStatusAnak((prev) => ({ ...prev, [anak.id]: "hadir" }));
    catatKegiatan(anak.id, "Tiba di sekolah dengan ceria (Check-In)");
    kirimWA(
      anak.nomor_hp_ortu,
      `🔔 *Notifikasi Kehadiran*\nSyalom Bunda, ananda *${anak.nama}* baru saja tiba di sekolah dan disambut oleh Guru ${namaGuru}. Semoga harinya menyenangkan!`,
    );
  };

  const simpanKegiatanMassal = () => {
    getaranHalus();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 900);
    if (pilihanAnak.length === 0 || jenisKegiatan === "") {
      alert("Pilih minimal 1 anak dan isi jenis kegiatannya!");
      return;
    }
    pilihanAnak.forEach((id) => catatKegiatan(id, jenisKegiatan));
    setPilihanAnak([]);
    setJenisKegiatan("");
  };

  const handlePulang = (anak: any) => {
    getaranHalus();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 900);
    const siapaJemput = penjemput[anak.id] || "Orang Tua";
    const detailJemput = ketPenjemput[anak.id] || "";
    setStatusAnak((prev) => ({ ...prev, [anak.id]: "pulang" }));
    let infoLog = `Pulang (Dijemput: ${siapaJemput}`;
    if (detailJemput) infoLog += ` - ${detailJemput}`;
    infoLog += `)`;
    catatKegiatan(anak.id, infoLog);
    const logHariIni = logKegiatan[anak.id] || [];
    const rangkumanText = logHariIni.join("\n- ");
    const pesanFinal = `📖 *Buku Penghubung Digital TK Tadika Mesra*\n\nSyalom Bunda/Ayah,\nHari ini ananda *${anak.nama}* telah mengikuti kegiatan di sekolah dengan penuh semangat! ✨\n\n📝 *Catatan Aktivitas Hari Ini:*\n- ${
      rangkumanText ? rangkumanText : "Berkegiatan rutin di kelas"
    }\n\n🚗 *Informasi Kepulangan:*\nAnanda telah dijemput dengan aman oleh: *${siapaJemput}*\n${
      detailJemput ? `Keterangan Penjemput: ${detailJemput}` : ""
    }\n\nTerima kasih atas kepercayaannya Bunda/Ayah. Selamat beristirahat dan sampai jumpa besok! Kurré sumanga'. 🙏`;
    kirimWA(anak.nomor_hp_ortu, pesanFinal);
  };

  return (
    <div
      className="fixed inset-0 w-full min-h-[100dvh] flex items-center justify-center font-sans bg-slate-900"
      style={{
        backgroundImage: "url('/bg.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slideUpFade {
          0% { opacity: 0; transform: translateY(20px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.9); }
          60% { transform: scale(1.02); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes slideDownFade {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animate-pop-in { animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animate-slide-down { animation: slideDownFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .glass-panel { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
        .glass-nav { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />

      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[4px]"></div>

      <div className="relative w-full max-w-md h-[100dvh] md:h-[90vh] bg-[#F8FAFC] shadow-2xl md:rounded-[2.5rem] flex flex-col overflow-hidden border-0 md:border-4 border-white/20">
        {/* HALAMAN LOGIN */}
        {tampilan === "login" && (
          <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-indigo-50/90 to-white/90 backdrop-blur-md">
            <div className="bg-white/90 backdrop-blur-xl w-full p-8 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] text-center border border-white animate-pop-in">
              <div className="relative inline-block mb-6">
                <img
                  src="logo-tk.jpeg"
                  alt="Logo"
                  className="w-28 h-28 mx-auto shadow-xl rounded-full border-4 border-white object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://ui-avatars.com/api/?name=TK&background=C7D2FE&color=3730A3&rounded=true&size=128";
                  }}
                />
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-2 border-white shadow-sm">
                  ✨
                </div>
              </div>
              <h1 className="text-3xl font-black text-indigo-950 mb-1 tracking-tight">
                TK Tadika Mesra
              </h1>
              <p className="text-indigo-500/80 font-bold mb-8 uppercase tracking-widest text-xs">
                Portal Guru Digital
              </p>

              {isLoading ? (
                <div className="mb-6 p-4 text-indigo-500 font-bold animate-pulse">
                  Menghubungkan ke Database...
                </div>
              ) : (
                <div className="relative mb-6">
                  <input
                    type="text"
                    placeholder="Ketik Nama Guru..."
                    className="w-full p-4 pl-12 bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 font-bold text-lg placeholder-indigo-300 transition-all duration-300"
                    value={namaGuru}
                    onChange={(e) => setNamaGuru(e.target.value)}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-indigo-300">
                    👋
                  </span>
                </div>
              )}

              <button
                disabled={isLoading}
                onClick={() => {
                  getaranHalus();
                  namaGuru ? setTampilan("kelas") : alert("Isi nama dulu!");
                }}
                className={`w-full text-white font-black py-4 rounded-2xl text-lg border-b-4 transform active:scale-[0.98] transition-all duration-200 shadow-[0_10px_20px_-10px_rgba(79,70,229,0.5)] ${
                  isLoading
                    ? "bg-indigo-300 border-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 border-indigo-800 hover:bg-indigo-500 active:border-b-0 active:translate-y-1"
                }`}
              >
                Masuk Aplikasi
              </button>
            </div>
          </div>
        )}

        {/* HALAMAN PILIH KELAS */}
        {tampilan === "kelas" && (
          <div className="flex-1 flex flex-col p-6 bg-slate-50 overflow-y-auto hide-scrollbar">
            <div className="flex justify-between items-center mb-10 mt-4 animate-slide-down">
              <div>
                <p className="text-slate-500 font-bold text-sm">
                  Selamat Datang,
                </p>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Guru {namaGuru}
                </h2>
              </div>
              <button
                onClick={() => {
                  getaranHalus();
                  setTampilan("login");
                }}
                className="bg-rose-100 text-rose-600 w-12 h-12 rounded-full font-bold flex items-center justify-center hover:bg-rose-200 active:scale-90 transition-transform shadow-sm"
              >
                🚪
              </button>
            </div>

            <h3
              className="text-slate-500 font-black mb-4 uppercase tracking-wider text-xs animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              Pilih Kelas Hari Ini
            </h3>

            <div className="space-y-4">
              <div
                onClick={() => {
                  getaranHalus();
                  setKelasAktif("mawar");
                  setTampilan("dashboard");
                }}
                className="bg-white border-2 border-rose-100 p-6 rounded-[2rem] cursor-pointer hover:border-rose-300 active:scale-[0.97] transition-all duration-300 flex items-center gap-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-slide-up relative overflow-hidden"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="absolute -right-4 -top-4 text-8xl opacity-10 blur-sm">
                  🌸
                </div>
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-4xl shadow-inner relative z-10">
                  🌸
                </div>
                <div className="relative z-10">
                  <h4 className="text-2xl font-black text-slate-800">
                    Kelas Mawar
                  </h4>
                  <p className="text-rose-500 font-bold text-sm bg-rose-50 px-3 py-1 rounded-lg inline-block mt-1">
                    {dataSemuaMurid.filter((m) => m.kelas === "mawar").length}{" "}
                    Murid Terdaftar
                  </p>
                </div>
              </div>

              <div
                onClick={() => {
                  getaranHalus();
                  setKelasAktif("melati");
                  setTampilan("dashboard");
                }}
                className="bg-white border-2 border-amber-100 p-6 rounded-[2rem] cursor-pointer hover:border-amber-300 active:scale-[0.97] transition-all duration-300 flex items-center gap-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-slide-up relative overflow-hidden"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="absolute -right-4 -top-4 text-8xl opacity-10 blur-sm">
                  🌼
                </div>
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-4xl shadow-inner relative z-10">
                  🌼
                </div>
                <div className="relative z-10">
                  <h4 className="text-2xl font-black text-slate-800">
                    Kelas Melati
                  </h4>
                  <p className="text-amber-500 font-bold text-sm bg-amber-50 px-3 py-1 rounded-lg inline-block mt-1">
                    {dataSemuaMurid.filter((m) => m.kelas === "melati").length}{" "}
                    Murid Terdaftar
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HALAMAN DASHBOARD UTAMA */}
        {tampilan === "dashboard" && (
          <div className="flex flex-col h-full bg-slate-50 relative">
            {showConfetti && (
              <div className="pointer-events-none absolute inset-0 z-[100] flex items-center justify-center bg-white/20 backdrop-blur-sm animate-pop-in">
                <div className="text-6xl animate-bounce drop-shadow-2xl">
                  🎉 ✨ 🌟
                </div>
              </div>
            )}

            <div
              className={`glass-panel z-40 sticky top-0 px-6 pt-10 pb-4 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border-b border-white ${kelasAktif === "mawar" ? "bg-rose-50/80" : "bg-amber-50/80"}`}
            >
              <div className="flex justify-between items-center animate-slide-down">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm ${kelasAktif === "mawar" ? "bg-rose-200" : "bg-amber-200"}`}
                  >
                    {kelasAktif === "mawar" ? "🌸" : "🌼"}
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-slate-900 leading-none">
                      Kelas {kelasAktif === "mawar" ? "Mawar" : "Melati"}
                    </h1>
                    <p className="font-bold text-sm text-slate-500 mt-1">
                      Guru {namaGuru}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    getaranHalus();
                    setTampilan("kelas");
                  }}
                  className="bg-white border-2 border-slate-200 text-slate-600 p-3 rounded-xl font-black hover:bg-slate-50 active:scale-90 transition-transform shadow-sm"
                >
                  🔙
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-[140px] hide-scrollbar relative">
              {/* TAB: DATANG */}
              {tabAktif === "datang" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end mb-6 animate-slide-up">
                    <h2 className="font-black text-slate-900 text-2xl tracking-tight">
                      Check-In Pagi
                    </h2>
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-4 py-1.5 rounded-full shadow-sm border border-emerald-200">
                      Sisa: {muridBelumHadir.length}
                    </span>
                  </div>

                  {muridBelumHadir.length === 0 ? (
                    <div className="text-center p-10 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[2.5rem] border border-emerald-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-pop-in">
                      <div className="text-6xl mb-6 animate-bounce">✨</div>
                      <h3 className="font-black text-emerald-800 text-2xl mb-2">
                        Luar Biasa!
                      </h3>
                      <p className="text-emerald-600/80 font-bold leading-relaxed">
                        Semua anak yang terdaftar sudah hadir di kelas hari ini.
                      </p>
                    </div>
                  ) : (
                    muridBelumHadir.map((anak, i) => (
                      <div
                        key={anak.id}
                        className="bg-white p-4 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex items-center justify-between mb-4 hover:shadow-lg transition-all animate-slide-up"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={anak.foto_url}
                            alt="Foto"
                            className="w-16 h-16 rounded-full object-cover border-[3px] border-slate-50 shadow-sm"
                          />
                          <div>
                            <span className="font-black text-slate-800 text-lg block">
                              {anak.nama}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              Belum Hadir
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDatang(anak)}
                          className="bg-emerald-500 text-white font-black px-6 py-4 rounded-2xl shadow-[0_8px_15px_-5px_rgba(16,185,129,0.4)] hover:bg-emerald-400 active:scale-95 transition-all flex items-center gap-2"
                        >
                          <span>Tiba</span>
                          <span className="text-lg leading-none">👋</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB: KEGIATAN */}
              {tabAktif === "kegiatan" && (
                <div className="space-y-4">
                  <h2 className="font-black text-slate-900 text-2xl tracking-tight mb-6 animate-slide-up">
                    Aktivitas Kelas
                  </h2>

                  {muridHadir.length === 0 ? (
                    <div className="text-center p-10 bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2.5rem] border border-amber-100 shadow-sm animate-pop-in">
                      <div className="text-6xl mb-6">🧸</div>
                      <p className="text-amber-800 font-black text-xl mb-2">
                        Kelas Masih Kosong
                      </p>
                      <p className="text-amber-600/80 font-bold">
                        Lakukan check-in anak terlebih dahulu di menu 🚪.
                      </p>
                    </div>
                  ) : (
                    <div
                      className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 animate-slide-up"
                      style={{ animationDelay: "0.1s" }}
                    >
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                        1. Pilih Peserta Kegiatan
                      </label>
                      <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
                        <button
                          onClick={() => {
                            getaranHalus();
                            setPilihanAnak(muridHadir.map((m) => m.id));
                          }}
                          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black whitespace-nowrap active:scale-95 transition-transform shadow-md"
                        >
                          + Pilih Semua
                        </button>
                        {muridHadir.map((anak) => (
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
                            className={`px-6 py-3 rounded-2xl font-black whitespace-nowrap transition-all active:scale-95 border-2 ${
                              pilihanAnak.includes(anak.id)
                                ? "bg-violet-50 border-violet-500 text-violet-700 shadow-sm"
                                : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                            }`}
                          >
                            {anak.nama} {pilihanAnak.includes(anak.id) && "✓"}
                          </button>
                        ))}
                      </div>

                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mt-4 mb-3">
                        2. Catatan Kegiatan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Mewarnai Pemandangan..."
                        className="w-full p-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl mb-6 outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 text-slate-900 font-bold text-lg transition-all"
                        value={jenisKegiatan}
                        onChange={(e) => setJenisKegiatan(e.target.value)}
                      />

                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                        3. Bukti Foto (Opsional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:font-black file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 mb-8 cursor-pointer transition-colors"
                      />

                      <button
                        onClick={simpanKegiatanMassal}
                        className="w-full bg-violet-600 text-white font-black py-4 rounded-2xl hover:bg-violet-500 active:scale-95 transition-all duration-200 text-lg shadow-[0_10px_20px_-10px_rgba(124,58,237,0.5)] flex items-center justify-center gap-2"
                      >
                        <span>Simpan ke Jurnal</span>
                        <span>📝</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: PULANG */}
              {tabAktif === "pulang" && (
                <div className="space-y-4">
                  <h2 className="font-black text-slate-900 text-2xl tracking-tight mb-6 animate-slide-up">
                    Check-Out
                  </h2>

                  {muridHadir.length === 0 ? (
                    <div className="text-center p-10 bg-slate-100 rounded-[2.5rem] border border-slate-200 shadow-inner animate-pop-in">
                      <div className="text-6xl mb-6 opacity-50">🏡</div>
                      <p className="text-slate-500 font-black text-xl">
                        Kawasan Clear!
                      </p>
                      <p className="text-slate-400 font-bold mt-1">
                        Semua anak sudah pulang.
                      </p>
                    </div>
                  ) : (
                    muridHadir.map((anak, i) => (
                      <div
                        key={anak.id}
                        className="bg-white p-6 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6 animate-slide-up"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      >
                        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                          <img
                            src={anak.foto_url}
                            alt="Foto"
                            className="w-14 h-14 rounded-full object-cover border-[3px] border-slate-50 shadow-sm"
                          />
                          <span className="font-black text-slate-800 text-xl">
                            {anak.nama}
                          </span>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 mb-6 h-32 overflow-y-auto hide-scrollbar border border-slate-100">
                          <strong className="font-black text-slate-700 text-sm flex items-center gap-2 mb-3">
                            <span>📋</span> Rekap Hari Ini
                          </strong>
                          <div className="space-y-2">
                            {logKegiatan[anak.id]?.map((log, i) => (
                              <div
                                key={i}
                                className="bg-white p-3 rounded-xl text-sm font-bold text-slate-600 shadow-sm border border-slate-50"
                              >
                                {log}
                              </div>
                            )) || (
                              <div className="text-slate-400 text-sm font-bold italic text-center mt-6">
                                Belum ada aktivitas tercatat.
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">
                              Siapa yang menjemput?
                            </label>
                            <select
                              className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-slate-700 font-bold outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 transition-all appearance-none"
                              onChange={(e) =>
                                setPenjemput((prev) => ({
                                  ...prev,
                                  [anak.id]: e.target.value,
                                }))
                              }
                              defaultValue="Orang Tua"
                            >
                              <option value="Orang Tua">
                                👨👩👦 Orang Tua Kandung
                              </option>
                              <option value="Kakek/Nenek">
                                👴 Kakek / Nenek
                              </option>
                              <option value="Paman/Bibi">
                                👨💼 Paman / Bibi
                              </option>
                              <option value="Jemputan Sekolah">
                                🚌 Driver Jemputan
                              </option>
                              <option value="Orang Lain">
                                ⚠ Ojek Online / Lainnya
                              </option>
                            </select>
                          </div>
                          <input
                            type="text"
                            placeholder="Catatan (Cth: Plat B 1234, Baju Biru)..."
                            className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 text-slate-700 font-bold transition-all"
                            onChange={(e) =>
                              setKetPenjemput((prev) => ({
                                ...prev,
                                [anak.id]: e.target.value,
                              }))
                            }
                          />
                          <button
                            onClick={() => handlePulang(anak)}
                            className="w-full mt-2 bg-rose-500 text-white font-black py-4 rounded-2xl hover:bg-rose-400 active:scale-95 transition-all duration-200 text-lg flex items-center justify-center gap-2 shadow-[0_10px_20px_-10px_rgba(244,63,94,0.5)]"
                          >
                            <span>Pulang & Notif WA</span>
                            <span className="text-xl">🚀</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* FAB BROADCAST */}
            <button
              onClick={() => {
                getaranHalus();
                setBukaSiaran(true);
              }}
              className="absolute bottom-[110px] right-6 bg-sky-500 text-white w-16 h-16 rounded-full shadow-[0_10px_25px_rgba(14,165,233,0.5)] border-2 border-white/50 hover:bg-sky-400 active:scale-90 z-30 transition-all flex items-center justify-center animate-slide-up"
              style={{ animationDelay: "0.4s" }}
            >
              <span className="text-3xl filter drop-shadow-sm">📢</span>
            </button>

            {/* MODAL SIARAN WA */}
            {bukaSiaran && (
              <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center sm:items-center sm:p-4">
                <div className="bg-white w-full rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col h-[85vh] sm:h-auto sm:max-h-[90vh] animate-slide-up">
                  <div className="w-full flex justify-center pt-4 pb-2 sm:hidden">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
                  </div>
                  <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100">
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <span className="text-2xl">📢</span> Pusat Siaran
                    </h2>
                    <button
                      onClick={() => {
                        getaranHalus();
                        setBukaSiaran(false);
                      }}
                      className="bg-slate-100 text-slate-500 w-10 h-10 rounded-full font-black flex items-center justify-center hover:bg-slate-200 active:scale-90 transition-transform"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                      Template Cepat
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-6 hide-scrollbar">
                      <button
                        onClick={() => {
                          getaranHalus();
                          setTipeSiaran("umum");
                          setTeksSiaran(TEMPLATE_PESAN.umum);
                        }}
                        className={`px-5 py-2.5 rounded-2xl font-black whitespace-nowrap transition-all active:scale-95 ${tipeSiaran === "umum" ? "bg-sky-50 border-2 border-sky-500 text-sky-700" : "bg-white border-2 border-slate-100 text-slate-500"}`}
                      >
                        Info Umum
                      </button>
                      <button
                        onClick={() => {
                          getaranHalus();
                          setTipeSiaran("spp");
                          setTeksSiaran(TEMPLATE_PESAN.spp);
                        }}
                        className={`px-5 py-2.5 rounded-2xl font-black whitespace-nowrap transition-all active:scale-95 ${tipeSiaran === "spp" ? "bg-amber-50 border-2 border-amber-500 text-amber-700" : "bg-white border-2 border-slate-100 text-slate-500"}`}
                      >
                        Tagihan SPP
                      </button>
                      <button
                        onClick={() => {
                          getaranHalus();
                          setTipeSiaran("bekal");
                          setTeksSiaran(TEMPLATE_PESAN.bekal);
                        }}
                        className={`px-5 py-2.5 rounded-2xl font-black whitespace-nowrap transition-all active:scale-95 ${tipeSiaran === "bekal" ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-700" : "bg-white border-2 border-slate-100 text-slate-500"}`}
                      >
                        Kebutuhan Anak
                      </button>
                    </div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                      Isi Pesan WA
                    </label>
                    <textarea
                      className="w-full flex-1 min-h-[250px] p-5 bg-slate-50/50 border-2 border-slate-100 rounded-3xl outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 text-slate-800 font-bold resize-none mb-6 text-base leading-relaxed transition-all"
                      value={teksSiaran}
                      onChange={(e) => setTeksSiaran(e.target.value)}
                    />
                    <button
                      onClick={handleKirimSiaran}
                      className="w-full bg-sky-500 text-white font-black py-4 rounded-2xl hover:bg-sky-400 active:scale-95 transition-all duration-200 text-lg shadow-[0_10px_20px_-10px_rgba(14,165,233,0.5)] flex items-center justify-center gap-2"
                    >
                      <span>Kirim ke {muridSemua.length} Wali Murid</span>
                      <span>✈️</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* BOTTOM NAVIGATION BARS */}
            <div
              className="absolute bottom-6 left-6 right-6 z-40 animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="glass-nav border border-white/60 p-2 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] flex justify-between gap-2">
                <button
                  onClick={() => {
                    getaranHalus();
                    setTabAktif("datang");
                  }}
                  className={`flex-1 py-3.5 rounded-[1.5rem] flex flex-col items-center justify-center transition-all duration-300 relative ${tabAktif === "datang" ? "bg-emerald-500 text-white shadow-md transform scale-[1.02]" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"}`}
                >
                  <span
                    className={`text-2xl mb-1 transition-transform ${tabAktif === "datang" ? "scale-110" : ""}`}
                  >
                    🚪
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    Tiba
                  </span>
                </button>
                <button
                  onClick={() => {
                    getaranHalus();
                    setTabAktif("kegiatan");
                  }}
                  className={`flex-1 py-3.5 rounded-[1.5rem] flex flex-col items-center justify-center transition-all duration-300 relative ${tabAktif === "kegiatan" ? "bg-violet-500 text-white shadow-md transform scale-[1.02]" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"}`}
                >
                  <span
                    className={`text-2xl mb-1 transition-transform ${tabAktif === "kegiatan" ? "scale-110" : ""}`}
                  >
                    🎨
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    Aktivitas
                  </span>
                </button>
                <button
                  onClick={() => {
                    getaranHalus();
                    setTabAktif("pulang");
                  }}
                  className={`flex-1 py-3.5 rounded-[1.5rem] flex flex-col items-center justify-center transition-all duration-300 relative ${tabAktif === "pulang" ? "bg-rose-500 text-white shadow-md transform scale-[1.02]" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"}`}
                >
                  <span
                    className={`text-2xl mb-1 transition-transform ${tabAktif === "pulang" ? "scale-110" : ""}`}
                  >
                    🏡
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    Pulang
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
