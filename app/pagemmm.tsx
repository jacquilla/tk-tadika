"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

// ---- TYPES (dev fix #1: no more any[]) ----
type Murid = {
  id: string;
  nama: string;
  kelas: string;
  foto_url?: string;
  nomor_hp_ortu: string;
  status_spp?: string;
};

// ---- SUPABASE (dev fix #2: guard empty env) ----
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

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

  const [dataSemuaMurid, setDataSemuaMurid] = useState<Murid[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [statusSppDinamis, setStatusSppDinamis] = useState<
    Record<string, string>
  >({});
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
  const confettiTimer = useRef<NodeJS.Timeout | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // ---- DATA FETCH ----
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    const tarikDataMurid = async () => {
      const { data, error } = await supabase.from("murid").select("*");
      if (error) console.error("Gagal menarik data:", error);
      else if (data) setDataSemuaMurid(data as Murid[]);
      setIsLoading(false);
    };
    tarikDataMurid();
  }, []);

  // dev fix #3: cleanup timer
  useEffect(
    () => () => {
      if (confettiTimer.current) clearTimeout(confettiTimer.current);
    },
    [],
  );

  // ---- MEMOIZED FILTERS (dev fix #4: performance) ----
  const muridSemua = useMemo(
    () =>
      dataSemuaMurid.filter(
        (m) => m.kelas?.toLowerCase() === kelasAktif.toLowerCase(),
      ),
    [dataSemuaMurid, kelasAktif],
  );
  const muridBelumHadir = useMemo(
    () =>
      muridSemua.filter(
        (a) => !statusAnak[a.id] || statusAnak[a.id] === "belum",
      ),
    [muridSemua, statusAnak],
  );
  const muridHadir = useMemo(
    () => muridSemua.filter((a) => statusAnak[a.id] === "hadir"),
    [muridSemua, statusAnak],
  );

  const getaranHalus = () => {
    if (typeof window !== "undefined" && navigator.vibrate)
      navigator.vibrate(50);
    try {
      if (!audioRef.current)
        audioRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      if (audioRef.current.state === "suspended") audioRef.current.resume();
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

  const dapatkanStatusSpp = (anak: Murid) =>
    statusSppDinamis[anak.id] || anak.status_spp || "LUNAS";

  const toggleSpp = async (idAnak: string, statusSaatIni: string) => {
    getaranHalus();
    const statusBaru = statusSaatIni === "LUNAS" ? "MENUNGGAK" : "LUNAS";
    setStatusSppDinamis((prev) => ({ ...prev, [idAnak]: statusBaru }));
    if (!supabase) return;
    const { error } = await supabase
      .from("murid")
      .update({ status_spp: statusBaru })
      .eq("id", idAnak);
    if (error) {
      alert("Gagal update status SPP ke database!");
      setStatusSppDinamis((prev) => ({ ...prev, [idAnak]: statusSaatIni }));
    }
  };

  const catatKegiatan = async (
    idAnak: string,
    teksKegiatan: string,
    kategori = "Umum",
  ) => {
    const waktu = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setLogKegiatan((prev) => ({
      ...prev,
      [idAnak]: [...(prev[idAnak] || []), `[${waktu}] ${teksKegiatan}`],
    }));
    if (supabase)
      await supabase
        .from("log_aktivitas")
        .insert({ murid_id: idAnak, deskripsi: teksKegiatan, kategori });
  };

  const klikMilestoneCepat = (kategori: string) => {
    getaranHalus();
    if (pilihanAnak.length === 0) {
      alert("Pilih minimal 1 anak terlebih dahulu!");
      return;
    }
    pilihanAnak.forEach((id) =>
      catatKegiatan(id, `Perkembangan: ${kategori}`, kategori),
    );
    alert(`✅ Berhasil merekam aktivitas ${kategori}!`);
    setPilihanAnak([]);
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
    setBukaSiaran(false);
    let targetPenerima = muridSemua;
    if (tipeSiaran === "spp") {
      targetPenerima = muridSemua.filter(
        (anak) => dapatkanStatusSpp(anak) === "MENUNGGAK",
      );
      if (targetPenerima.length === 0) {
        alert(
          "🎉 Hebat! Semua orang tua di kelas ini sudah lunas SPP. Siaran otomatis dibatalkan.",
        );
        return;
      }
    }
    alert(`📢 Mengirim siaran ke ${targetPenerima.length} orang tua murid...`);
    // dev fix #5: parallel instead of sequential
    await Promise.allSettled(
      targetPenerima.map((anak) =>
        kirimWA(anak.nomor_hp_ortu, `📢 *PENGUMUMAN KELAS*\n\n${teksSiaran}`),
      ),
    );
    alert("✅ Siaran berhasil terkirim!");
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    if (confettiTimer.current) clearTimeout(confettiTimer.current);
    confettiTimer.current = setTimeout(() => setShowConfetti(false), 900);
  };

  const handleDatang = async (anak: Murid) => {
    getaranHalus();
    triggerConfetti();
    setStatusAnak((prev) => ({ ...prev, [anak.id]: "hadir" }));
    if (supabase)
      await supabase
        .from("kehadiran")
        .insert({
          murid_id: anak.id,
          status_hadir: "hadir",
          waktu_datang: new Date().toISOString(),
        });
    catatKegiatan(anak.id, "Tiba di sekolah dengan ceria (Check-In)");
    kirimWA(
      anak.nomor_hp_ortu,
      `🔔 *Notifikasi Kehadiran*\nSyalom Bunda, ananda *${anak.nama}* baru saja tiba di sekolah dan disambut oleh Guru ${namaGuru}. Semoga harinya menyenangkan!`,
    );
  };

  const simpanKegiatanMassal = () => {
    getaranHalus();
    triggerConfetti();
    if (pilihanAnak.length === 0 || jenisKegiatan === "") {
      alert("Pilih minimal 1 anak dan isi jenis kegiatannya!");
      return;
    }
    pilihanAnak.forEach((id) => catatKegiatan(id, jenisKegiatan));
    setPilihanAnak([]);
    setJenisKegiatan("");
  };

  const handlePulang = async (anak: Murid) => {
    getaranHalus();
    triggerConfetti();
    const siapaJemput = penjemput[anak.id] || "Orang Tua";
    const detailJemput = ketPenjemput[anak.id] || "";
    setStatusAnak((prev) => ({ ...prev, [anak.id]: "pulang" }));
    if (supabase)
      await supabase
        .from("kehadiran")
        .update({
          status_hadir: "pulang",
          waktu_pulang: new Date().toISOString(),
          penjemput: siapaJemput,
          keterangan_jemput: detailJemput,
        })
        .eq("murid_id", anak.id);
    let infoLog = `Pulang (Dijemput: ${siapaJemput}${detailJemput ? ` - ${detailJemput}` : ""})`;
    catatKegiatan(anak.id, infoLog);
    const logHariIni = logKegiatan[anak.id] || [];
    const rangkumanText = logHariIni.join("\n- ");
    const pesanFinal = `📖 *Buku Penghubung Digital TK Tadika Mesra*\n\nSyalom Bunda/Ayah,\nHari ini ananda *${anak.nama}* telah mengikuti kegiatan di sekolah dengan penuh semangat! ✨\n\n📝 *Catatan Aktivitas Hari Ini:*\n- ${rangkumanText ? rangkumanText : "Berkegiatan rutin di kelas"}\n\n🚗 *Informasi Kepulangan:*\nAnanda telah dijemput dengan aman oleh: *${siapaJemput}*\n${detailJemput ? `Keterangan Penjemput: ${detailJemput}` : ""}\n\nTerima kasih atas kepercayaannya Bunda/Ayah. Selamat beristirahat dan sampai jumpa besok! Kurré sumanga'. 🙏`;
    kirimWA(anak.nomor_hp_ortu, pesanFinal);
  };

  const avatar = (anak: Murid) =>
    anak.foto_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(anak.nama)}&background=C7D2FE&color=3730A3&bold=true`;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center font-sans bg-slate-950"
      style={{
        backgroundImage: "url('/bg.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md h-[100dvh] md:h-[90vh] bg-slate-50/95 backdrop-blur-2xl shadow-2xl md:rounded-[2.5rem] flex flex-col overflow-hidden ring-1 ring-white/20">
        {/* LOGIN */}
        {tampilan === "login" && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="bg-white/90 backdrop-blur-xl w-full p-8 rounded-[2rem] shadow-xl border border-white/60">
              <div className="flex justify-center mb-4">
                <Image
                  src="/piasmart.png"
                  alt="PiaSmart"
                  width={90}
                  height={15}
                  priority
                  className="opacity-90"
                />
              </div>
              <div className="relative w-28 h-28 mx-auto mb-6">
                <img
                  src="logo-tk.jpeg"
                  alt="Logo"
                  className="w-full h-full rounded-full object-cover shadow-lg ring-4 ring-white"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://ui-avatars.com/api/?name=TK&background=C7D2FE&color=3730A3&rounded=true&size=128";
                  }}
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-2 rounded-full ring-2 ring-white shadow">
                  ✨
                </div>
              </div>
              <h1 className="text-3xl font-black text-center text-slate-900 tracking-tight">
                TK Tadika Mesra
              </h1>
              <p className="text-center text-indigo-500/80 font-bold mb-8 uppercase tracking-widest text-xs">
                Portal Guru Digital
              </p>
              {isLoading ? (
                <div className="mb-6 p-4 text-center text-indigo-500 font-bold animate-pulse">
                  Menghubungkan ke Database...
                </div>
              ) : (
                <div className="relative mb-6">
                  <input
                    type="text"
                    placeholder="Ketik Nama Guru..."
                    className="w-full p-4 pl-12 bg-indigo-50/70 border-2 border-indigo-100 rounded-2xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold text-lg transition-all"
                    value={namaGuru}
                    onChange={(e) => setNamaGuru(e.target.value)}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">
                    👋
                  </span>
                </div>
              )}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  getaranHalus();
                  namaGuru ? setTampilan("kelas") : alert("Isi nama dulu!");
                }}
                className={`w-full text-white font-black py-4 rounded-2xl text-lg transition-all active:scale-[0.98] shadow-lg ${isLoading ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"}`}
              >
                Masuk Aplikasi
              </button>
              <div className="flex justify-center mt-6">
                <Image
                  src="/logo-digi.png"
                  alt="digi"
                  width={60}
                  height={60}
                  priority
                  className="opacity-90"
                />
              </div>
            </div>
          </div>
        )}

        {/* PILIH KELAS */}
        {tampilan === "kelas" && (
          <div className="flex-1 flex flex-col p-6 bg-slate-50 overflow-y-auto">
            <div className="flex justify-between items-center mb-8 mt-2">
              <div>
                <p className="text-slate-500 font-bold text-sm">
                  Selamat Datang,
                </p>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Guru {namaGuru}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  getaranHalus();
                  setTampilan("login");
                }}
                className="bg-rose-100 text-rose-600 w-12 h-12 rounded-2xl font-bold grid place-items-center hover:bg-rose-200 active:scale-90 transition shadow-sm"
              >
                🚪
              </button>
            </div>
            <h3 className="text-slate-500 font-black mb-4 uppercase tracking-wider text-xs">
              Pilih Kelas Hari Ini
            </h3>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  getaranHalus();
                  setKelasAktif("mawar");
                  setTampilan("dashboard");
                }}
                className="w-full bg-white border-2 border-rose-100 p-6 rounded-[2rem] hover:border-rose-300 active:scale-[0.98] transition-all flex items-center gap-5 shadow-sm hover:shadow-md text-left"
              >
                <div className="w-16 h-16 bg-rose-100 rounded-2xl grid place-items-center text-4xl shadow-inner">
                  🌸
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-800">
                    Kelas Mawar
                  </h4>
                  <p className="text-rose-600 font-bold text-sm bg-rose-50 px-3 py-1 rounded-lg inline-block mt-1">
                    {dataSemuaMurid.filter((m) => m.kelas === "mawar").length}{" "}
                    Murid Terdaftar
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  getaranHalus();
                  setKelasAktif("melati");
                  setTampilan("dashboard");
                }}
                className="w-full bg-white border-2 border-amber-100 p-6 rounded-[2rem] hover:border-amber-300 active:scale-[0.98] transition-all flex items-center gap-5 shadow-sm hover:shadow-md text-left"
              >
                <div className="w-16 h-16 bg-amber-100 rounded-2xl grid place-items-center text-4xl shadow-inner">
                  🌼
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-800">
                    Kelas Melati
                  </h4>
                  <p className="text-amber-600 font-bold text-sm bg-amber-50 px-3 py-1 rounded-lg inline-block mt-1">
                    {dataSemuaMurid.filter((m) => m.kelas === "melati").length}{" "}
                    Murid Terdaftar
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* DASHBOARD */}
        {tampilan === "dashboard" && (
          <div className="flex flex-col h-full bg-slate-50 relative">
            {showConfetti && (
              <div className="pointer-events-none absolute inset-0 z-[100] grid place-items-center bg-white/20 backdrop-blur-sm">
                <div className="text-6xl animate-bounce drop-shadow-2xl">
                  🎉 ✨ 🌟
                </div>
              </div>
            )}

            <div
              className={`sticky top-0 z-30 px-6 pt-8 pb-4 backdrop-blur-xl border-b border-white/50 ${kelasAktif === "mawar" ? "bg-rose-50/80" : "bg-amber-50/80"}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl grid place-items-center text-2xl shadow-sm ${kelasAktif === "mawar" ? "bg-rose-200" : "bg-amber-200"}`}
                  >
                    {kelasAktif === "mawar" ? "🌸" : "🌼"}
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-slate-900 leading-none">
                      Kelas {kelasAktif === "mawar" ? "Mawar" : "Melati"}
                    </h1>
                    <p className="font-bold text-sm text-slate-500 mt-0.5">
                      Guru {namaGuru}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    getaranHalus();
                    setTampilan("kelas");
                  }}
                  className="bg-white/80 border border-slate-200 text-slate-600 w-10 h-10 rounded-xl grid place-items-center hover:bg-white active:scale-90 transition shadow-sm"
                >
                  🔙
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-36">
              {/* TAB DATANG */}
              {tabAktif === "datang" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-end mb-2">
                    <h2 className="font-black text-slate-900 text-2xl">
                      Check-In Pagi
                    </h2>
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-3 py-1 rounded-full ring-1 ring-emerald-200">
                      Sisa: {muridBelumHadir.length}
                    </span>
                  </div>
                  {muridBelumHadir.length === 0 ? (
                    <div className="text-center p-10 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[2rem] border border-emerald-100">
                      <div className="text-5xl mb-3">✨</div>
                      <h3 className="font-black text-emerald-800 text-xl">
                        Luar Biasa!
                      </h3>
                      <p className="text-emerald-600/80 font-semibold">
                        Semua anak sudah hadir.
                      </p>
                    </div>
                  ) : (
                    muridBelumHadir.map((anak) => (
                      <div
                        key={anak.id}
                        className="bg-white p-4 rounded-[1.75rem] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={avatar(anak)}
                            alt=""
                            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100"
                          />
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {anak.nama}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              Belum Hadir
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDatang(anak)}
                          className="bg-emerald-500 text-white font-black px-5 py-3 rounded-2xl shadow-md shadow-emerald-500/25 hover:bg-emerald-400 active:scale-95 transition flex items-center gap-1.5"
                        >
                          Tiba <span>👋</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB KEGIATAN */}
              {tabAktif === "kegiatan" && (
                <div>
                  <h2 className="font-black text-slate-900 text-2xl mb-4">
                    Aktivitas Kelas
                  </h2>
                  {muridHadir.length === 0 ? (
                    <div className="text-center p-10 bg-amber-50 rounded-[2rem] border border-amber-100">
                      <div className="text-5xl mb-3">🧸</div>
                      <p className="font-black text-amber-800">
                        Lakukan check-in dulu di menu 🚪
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-5">
                      <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                          1. Tumbuh Kembang (Klik Cepat)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => klikMilestoneCepat("Motorik 🏃♂")}
                            className="bg-rose-50 text-rose-700 ring-1 ring-rose-200 font-bold p-3 text-xs rounded-xl active:scale-95 hover:bg-rose-100 transition"
                          >
                            🏃♂ Motorik
                          </button>
                          <button
                            type="button"
                            onClick={() => klikMilestoneCepat("Kreativitas 🎨")}
                            className="bg-amber-50 text-amber-700 ring-1 ring-amber-200 font-bold p-3 text-xs rounded-xl active:scale-95 hover:bg-amber-100 transition"
                          >
                            🎨 Kreativitas
                          </button>
                          <button
                            type="button"
                            onClick={() => klikMilestoneCepat("Sosial 🤝")}
                            className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 font-bold p-3 text-xs rounded-xl active:scale-95 hover:bg-emerald-100 transition"
                          >
                            🤝 Sosial
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                          2. Pilih Peserta Kegiatan
                        </label>
                        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 hide-scrollbar">
                          <button
                            type="button"
                            onClick={() => {
                              getaranHalus();
                              setPilihanAnak(muridHadir.map((m) => m.id));
                            }}
                            className="shrink-0 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm active:scale-95"
                          >
                            + Pilih Semua
                          </button>
                          {muridHadir.map((anak) => (
                            <button
                              type="button"
                              key={anak.id}
                              onClick={() => {
                                getaranHalus();
                                setPilihanAnak((prev) =>
                                  prev.includes(anak.id)
                                    ? prev.filter((id) => id !== anak.id)
                                    : [...prev, anak.id],
                                );
                              }}
                              className={`shrink-0 px-4 py-2.5 rounded-xl font-bold text-sm ring-1 transition active:scale-95 ${pilihanAnak.includes(anak.id) ? "bg-violet-100 text-violet-700 ring-violet-300" : "bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100"}`}
                            >
                              {anak.nama} {pilihanAnak.includes(anak.id) && "✓"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                          3. Catatan Kegiatan
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Mewarnai Pemandangan..."
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:bg-white outline-none font-medium transition"
                          value={jenisKegiatan}
                          onChange={(e) => setJenisKegiatan(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                          4. Bukti Foto (Opsional)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:font-bold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={simpanKegiatanMassal}
                        className="w-full bg-violet-600 text-white font-black py-3.5 rounded-xl hover:bg-violet-500 active:scale-[0.98] transition shadow-lg shadow-violet-600/25"
                      >
                        Simpan ke Jurnal 📝
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB PULANG */}
              {tabAktif === "pulang" && (
                <div>
                  <h2 className="font-black text-slate-900 text-2xl mb-4">
                    Check-Out
                  </h2>
                  {muridHadir.length === 0 ? (
                    <div className="text-center p-10 bg-slate-100 rounded-[2rem]">
                      <div className="text-5xl mb-2 opacity-60">🏡</div>
                      <p className="font-bold text-slate-600">
                        Semua anak sudah pulang
                      </p>
                    </div>
                  ) : (
                    muridHadir.map((anak) => (
                      <div
                        key={anak.id}
                        className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 mb-4"
                      >
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                          <img
                            src={avatar(anak)}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100"
                          />
                          <span className="font-black text-lg">
                            {anak.nama}
                          </span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 mb-4 h-28 overflow-y-auto ring-1 ring-slate-200">
                          <p className="font-bold text-xs text-slate-600 mb-1">
                            📋 Rekap Hari Ini
                          </p>
                          {(logKegiatan[anak.id] || []).map((l, i) => (
                            <div
                              key={i}
                              className="text-sm py-0.5 text-slate-600"
                            >
                              • {l}
                            </div>
                          )) || (
                            <p className="text-slate-400 italic text-sm">
                              Belum ada aktivitas
                            </p>
                          )}
                        </div>
                        <select
                          className="w-full p-3 mb-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-rose-400 outline-none"
                          onChange={(e) =>
                            setPenjemput((prev) => ({
                              ...prev,
                              [anak.id]: e.target.value,
                            }))
                          }
                          defaultValue="Orang Tua"
                        >
                          <option>Orang Tua</option>
                          <option>Kakek/Nenek</option>
                          <option>Paman/Bibi</option>
                          <option>Jemputan Sekolah</option>
                          <option>Orang Lain</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Catatan (Cth: Plat B 1234, Baju Biru)..."
                          className="w-full p-3 mb-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none font-medium"
                          onChange={(e) =>
                            setKetPenjemput((prev) => ({
                              ...prev,
                              [anak.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => handlePulang(anak)}
                          className="w-full bg-rose-500 text-white font-black py-3.5 rounded-xl hover:bg-rose-400 active:scale-[0.98] transition shadow-md shadow-rose-500/25"
                        >
                          Pulang & Notif WA 🚀
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB KEUANGAN */}
              {tabAktif === "keuangan" && (
                <div>
                  <h2 className="font-black text-slate-900 text-2xl mb-1">
                    Dasbor SPP
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mb-3">
                    Tap status untuk ubah
                  </p>
                  {muridSemua.map((anak) => {
                    const s = dapatkanStatusSpp(anak);
                    return (
                      <div
                        key={anak.id}
                        className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between mb-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={avatar(anak)}
                            alt=""
                            className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-100"
                          />
                          <span className="font-bold">{anak.nama}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSpp(anak.id, s)}
                          className={`px-4 py-2 rounded-xl text-xs font-black ring-1 active:scale-95 transition ${s === "LUNAS" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"}`}
                        >
                          {s === "LUNAS" ? "🟢 LUNAS" : "🔴 MENUNGGAK"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FAB */}
            <button
              type="button"
              onClick={() => {
                getaranHalus();
                setBukaSiaran(true);
              }}
              className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-sky-500 text-white text-2xl grid place-items-center shadow-xl shadow-sky-500/30 ring-4 ring-white/30 hover:bg-sky-400 active:scale-90 transition z-20"
            >
              📢
            </button>

            {/* MODAL SIARAN */}
            {bukaSiaran && (
              <div className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center">
                <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl max-h-[85vh] flex flex-col">
                  <div className="flex items-center justify-between p-5 border-b">
                    <h2 className="font-black text-lg flex items-center gap-2">
                      📢 Pusat Siaran
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        getaranHalus();
                        setBukaSiaran(false);
                      }}
                      className="w-9 h-9 grid place-items-center rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-5 space-y-4 overflow-y-auto">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      <button
                        type="button"
                        onClick={() => {
                          getaranHalus();
                          setTipeSiaran("umum");
                          setTeksSiaran(TEMPLATE_PESAN.umum);
                        }}
                        className={`px-4 py-2 rounded-xl font-bold text-sm ring-1 whitespace-nowrap ${tipeSiaran === "umum" ? "bg-sky-100 text-sky-700 ring-sky-300" : "bg-slate-100 text-slate-600 ring-slate-200"}`}
                      >
                        Info Umum
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          getaranHalus();
                          setTipeSiaran("spp");
                          setTeksSiaran(TEMPLATE_PESAN.spp);
                        }}
                        className={`px-4 py-2 rounded-xl font-bold text-sm ring-1 whitespace-nowrap ${tipeSiaran === "spp" ? "bg-amber-100 text-amber-700 ring-amber-300" : "bg-slate-100 text-slate-600 ring-slate-200"}`}
                      >
                        Tagihan SPP
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          getaranHalus();
                          setTipeSiaran("bekal");
                          setTeksSiaran(TEMPLATE_PESAN.bekal);
                        }}
                        className={`px-4 py-2 rounded-xl font-bold text-sm ring-1 whitespace-nowrap ${tipeSiaran === "bekal" ? "bg-emerald-100 text-emerald-700 ring-emerald-300" : "bg-slate-100 text-slate-600 ring-slate-200"}`}
                      >
                        Kebutuhan Anak
                      </button>
                    </div>
                    <textarea
                      className="w-full h-56 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none font-medium resize-none"
                      value={teksSiaran}
                      onChange={(e) => setTeksSiaran(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleKirimSiaran}
                      className="w-full bg-sky-500 text-white font-black py-3.5 rounded-xl hover:bg-sky-400 active:scale-[0.98] transition shadow-lg shadow-sky-500/25"
                    >
                      Kirim Siaran PiaSmart ✈
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* BOTTOM NAV */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-white/90 backdrop-blur-xl border border-white/60 p-1.5 rounded-[1.75rem] shadow-xl flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    getaranHalus();
                    setTabAktif("datang");
                  }}
                  className={`flex-1 py-2.5 rounded-2xl flex flex-col items-center gap-0.5 transition-all ${tabAktif === "datang" ? "bg-emerald-500 text-white shadow-md scale-105" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <span className="text-lg">🚪</span>
                  <span className="text-[10px] font-black uppercase">Tiba</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    getaranHalus();
                    setTabAktif("kegiatan");
                  }}
                  className={`flex-1 py-2.5 rounded-2xl flex flex-col items-center gap-0.5 transition-all ${tabAktif === "kegiatan" ? "bg-violet-500 text-white shadow-md scale-105" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <span className="text-lg">🎨</span>
                  <span className="text-[10px] font-black uppercase">
                    Aktivitas
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    getaranHalus();
                    setTabAktif("pulang");
                  }}
                  className={`flex-1 py-2.5 rounded-2xl flex flex-col items-center gap-0.5 transition-all ${tabAktif === "pulang" ? "bg-rose-500 text-white shadow-md scale-105" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <span className="text-lg">🏡</span>
                  <span className="text-[10px] font-black uppercase">
                    Pulang
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    getaranHalus();
                    setTabAktif("keuangan");
                  }}
                  className={`flex-1 py-2.5 rounded-2xl flex flex-col items-center gap-0.5 transition-all ${tabAktif === "keuangan" ? "bg-amber-500 text-white shadow-md scale-105" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <span className="text-lg">💰</span>
                  <span className="text-[10px] font-black uppercase">SPP</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}
