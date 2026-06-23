"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

// IMPORT ICONPARK (Library Standar Bytedance)
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
  Speaker,
  Close,
  BankCard,
  User,
  Send,
  Attention,
  Info,
  Box,
  ColorCard,
  MagicWand,
} from "@icon-park/react";
import "@icon-park/react/styles/index.css"; // Wajib di-import agar style dasar IconPark berjalan

// INISIALISASI SUPABASE
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TEMPLATE_PESAN = {
  umum: "Syalom Bunda/Ayah,\n\nIni adalah informasi resmi dari TK Tadika Mesra.\n\n[KETIK INFO DI SINI]\n\nKurré sumanga' atas perhatiannya. Tuhan memberkati.",
  spp: "Syalom Bunda/Ayah,\n\nSemoga keluarga dalam keadaan sehat selalu. Tabe', dengan penuh kerendahan hati kami dari administrasi TK Tadika Mesra ingin mengingatkan mengenai administrasi SPP bulan ini yang mungkin terlewat.\n\nJika sudah menyelesaikan administrasi, mohon abaikan pesan ini. Kurré sumanga' atas dukungan Bunda/Ayah yang luar biasa bagi kelancaran operasional sekolah kita. Tuhan memberkati. 🙏",
  bekal:
    "Syalom Bunda,\n\nTabe', demi kenyamanan dan kesehatan ananda selama berkegiatan di sekolah hari ini, mohon kesediaannya untuk membekali ananda dengan:\n\n- Botol minum pribadi\n- [TAMBAHKAN KEBUTUHAN LAIN]\n\nKurré sumanga' atas kerja samanya Bunda! 🎒✨",
};

export default function AppTK() {
  // 1. STATE MANAGEMENT
  const [tampilan, setTampilan] = useState("login");
  const [namaGuru, setNamaGuru] = useState("");
  const [kelasAktif, setKelasAktif] = useState("");
  const [tabAktif, setTabAktif] = useState("datang");

  const [dataSemuaMurid, setDataSemuaMurid] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

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

  // 2. DATA FETCHING
  useEffect(() => {
    const tarikDataMurid = async () => {
      const { data, error } = await supabase.from("murid").select("*");
      if (error) console.error("Gagal menarik data:", error);
      else if (data) setDataSemuaMurid(data);
      setIsLoading(false);
    };
    tarikDataMurid();
  }, []);

  const muridSemua = dataSemuaMurid.filter(
    (m) => m.kelas.toLowerCase() === kelasAktif.toLowerCase(),
  );
  const muridBelumHadir = muridSemua.filter(
    (a) => !statusAnak[a.id] || statusAnak[a.id] === "belum",
  );
  const muridHadir = muridSemua.filter((a) => statusAnak[a.id] === "hadir");

  // 3. FUNGSI LOGIKA & UX
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
    await supabase
      .from("log_aktivitas")
      .insert({ murid_id: idAnak, deskripsi: teksKegiatan, kategori });
  };

  // Asisten Template (Menyuntikkan Teks)
  const klikMilestoneCepat = (kategori: string) => {
    getaranHalus();
    let templateTeks = "";

    if (kategori === "Motorik") {
      templateTeks =
        "[Motorik] Melatih gerak fisik dan koordinasi anak melalui kegiatan: ";
    } else if (kategori === "Kreativitas") {
      templateTeks =
        "[Kreativitas] Mengasah imajinasi dan ide kreatif anak saat membuat karya: ";
    } else if (kategori === "Sosial") {
      templateTeks =
        "[Sosial] Melatih interaksi, keberanian, dan kemandirian anak ketika: ";
    }

    setJenisKegiatan((prev) =>
      prev ? prev + "\n" + templateTeks : templateTeks,
    );
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
    setIsBroadcasting(true);

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

    setIsBroadcasting(false);
    setBukaSiaran(false);
    alert("Siaran berhasil terkirim!");
  };

  const handleDatang = async (anak: any) => {
    getaranHalus();
    setStatusAnak((prev) => ({ ...prev, [anak.id]: "hadir" }));
    await supabase.from("kehadiran").insert({
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

  const simpanKegiatanMassal = async () => {
    getaranHalus();
    if (pilihanAnak.length === 0 || jenisKegiatan.trim() === "")
      return alert("Pilih minimal 1 anak dan isi catatan kegiatannya!");

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    for (const id of pilihanAnak) {
      await catatKegiatan(id, jenisKegiatan);
    }

    setPilihanAnak([]);
    setJenisKegiatan("");
    setIsSaving(false);
  };

  const handlePulang = async (anak: any) => {
    getaranHalus();
    const siapaJemput = penjemput[anak.id] || "Orang Tua";
    const detailJemput = ketPenjemput[anak.id] || "";
    setStatusAnak((prev) => ({ ...prev, [anak.id]: "pulang" }));

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
    const pesanFinal = `📖 *Buku Penghubung Digital TK Tadika Mesra*\n\nSyalom Bunda/Ayah,\nHari ini ananda *${anak.nama}* telah mengikuti kegiatan di sekolah dengan penuh semangat! ✨\n\n📝 *Catatan Aktivitas Hari Ini:*\n- ${rangkumanText || "Berkegiatan rutin di kelas"}\n\n🚗 *Informasi Kepulangan:*\nAnanda telah dijemput dengan aman oleh: *${siapaJemput}*\n${detailJemput ? `Keterangan Penjemput: ${detailJemput}` : ""}\n\nTerima kasih atas kepercayaannya Bunda/Ayah. Selamat beristirahat dan sampai jumpa besok! Kurre sumanga'. 🙏`;
    kirimWA(anak.nomor_hp_ortu, pesanFinal);
  };

  // 4. UI RENDER DENGAN TEMA PASTEL PREMIUM
  return (
    <div
      className="fixed inset-0 w-full min-h-[100dvh] flex items-center justify-center font-sans bg-slate-50"
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
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .glass-panel { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes slideUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
      `,
        }}
      />

      {/* Overlay Gelap Transparan untuk membuat konten form popup lebih pop-out */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]"></div>

      <div className="relative w-full max-w-md h-[100dvh] md:h-[90vh] bg-[#F8FAFC] shadow-[0_20px_50px_rgba(0,0,0,0.2)] md:rounded-[2.5rem] flex flex-col overflow-hidden border-0 md:border border-white/60">
        {/* === HALAMAN LOGIN === */}
        {tampilan === "login" && (
          <div className="flex-1 flex flex-col p-6 bg-white fade-in relative">
            <div className="w-full pt-8 pb-4 flex justify-center">
              <Image
                src="/piasmart.png"
                alt="PiaSmart"
                width={120}
                height={30}
                priority
                className="opacity-90 object-contain"
              />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <div className="w-full text-center">
                <div className="relative inline-block mb-8">
                  <img
                    src="logo-tk.jpeg"
                    alt="Logo TK"
                    className="w-28 h-28 mx-auto shadow-sm rounded-3xl border-2 border-slate-50 object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://ui-avatars.com/api/?name=TK&background=EEF2FF&color=4F46E5&rounded=false&size=128";
                    }}
                  />
                </div>

                <h1 className="text-2xl font-extrabold text-slate-800 mb-1 tracking-tight">
                  TK Tadika Mesra
                </h1>
                <p className="text-slate-400 font-bold mb-10 text-[11px] tracking-widest uppercase">
                  Portal Guru Digital
                </p>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center text-indigo-500 space-y-3 mb-8">
                    <Loading
                      theme="outline"
                      size={32}
                      strokeWidth={4}
                      fill="currentColor"
                      className="animate-spin"
                    />
                    <span className="text-sm font-semibold">
                      Menghubungkan ke server...
                    </span>
                  </div>
                ) : (
                  <div className="relative mb-8 w-full max-w-[300px] mx-auto">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <User
                        theme="outline"
                        size={20}
                        strokeWidth={4}
                        fill="currentColor"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Masukkan nama Anda..."
                      className="w-full pl-12 pr-4 py-4 bg-slate-50/80 border border-slate-200 rounded-2xl focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-700 font-bold text-base transition-all placeholder:text-slate-400"
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
                      namaGuru ? setTampilan("kelas") : alert("Isi nama dulu!");
                    }}
                    className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl text-base hover:bg-indigo-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_20px_-6px_rgba(79,70,229,0.4)] flex justify-center items-center gap-2"
                  >
                    Masuk Sistem{" "}
                    <Login
                      theme="outline"
                      size={20}
                      strokeWidth={4}
                      fill="currentColor"
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full pb-6 flex flex-col items-center justify-center opacity-80">
              <span className="text-[9px] text-slate-400 font-bold tracking-widest mb-2 uppercase">
                Powered By
              </span>
              <Image
                src="/logo-digi.png"
                alt="Digi.ID"
                width={70}
                height={70}
                className="object-contain grayscale hover:grayscale-0 transition-all duration-300"
              />
            </div>
          </div>
        )}

        {/* === HALAMAN KELAS === */}
        {tampilan === "kelas" && (
          <div className="flex-1 flex flex-col p-6 bg-slate-50 overflow-y-auto hide-scrollbar fade-in">
            <div className="flex justify-between items-center mb-10 mt-4">
              <div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">
                  Selamat Bertugas,
                </p>
                <h2 className="text-2xl font-extrabold text-slate-800">
                  Guru {namaGuru}
                </h2>
              </div>
              <button
                onClick={() => {
                  getaranHalus();
                  setTampilan("login");
                }}
                className="p-3.5 bg-white border border-slate-200 text-slate-400 rounded-full hover:bg-slate-100 hover:text-slate-600 active:scale-95 transition-all shadow-sm"
              >
                <Logout
                  theme="outline"
                  size={20}
                  strokeWidth={4}
                  fill="currentColor"
                />
              </button>
            </div>

            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">
              Pilih Kelas Hari Ini
            </p>

            <div className="space-y-4">
              <button
                onClick={() => {
                  getaranHalus();
                  setKelasAktif("mawar");
                  setTampilan("dashboard");
                }}
                className="w-full bg-white border border-indigo-100 p-5 rounded-3xl hover:border-indigo-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-[0.98] transition-all flex items-center gap-5 text-left group relative overflow-hidden"
              >
                <div className="w-16 h-16 bg-indigo-50/50 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors relative z-10">
                  <Peoples
                    theme="outline"
                    size={28}
                    strokeWidth={3}
                    fill="currentColor"
                  />
                </div>
                <div className="relative z-10">
                  <h4 className="text-xl font-extrabold text-slate-800">
                    Kelas Mawar
                  </h4>
                  <p className="text-indigo-500 font-bold text-xs mt-1 bg-indigo-50 px-2.5 py-1 rounded-md inline-block">
                    {dataSemuaMurid.filter((m) => m.kelas === "mawar").length}{" "}
                    Murid
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  getaranHalus();
                  setKelasAktif("melati");
                  setTampilan("dashboard");
                }}
                className="w-full bg-white border border-teal-100 p-5 rounded-3xl hover:border-teal-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-[0.98] transition-all flex items-center gap-5 text-left group relative overflow-hidden"
              >
                <div className="w-16 h-16 bg-teal-50/50 rounded-2xl flex items-center justify-center text-teal-500 group-hover:bg-teal-500 group-hover:text-white transition-colors relative z-10">
                  <Peoples
                    theme="outline"
                    size={28}
                    strokeWidth={3}
                    fill="currentColor"
                  />
                </div>
                <div className="relative z-10">
                  <h4 className="text-xl font-extrabold text-slate-800">
                    Kelas Melati
                  </h4>
                  <p className="text-teal-500 font-bold text-xs mt-1 bg-teal-50 px-2.5 py-1 rounded-md inline-block">
                    {dataSemuaMurid.filter((m) => m.kelas === "melati").length}{" "}
                    Murid
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* === HALAMAN DASHBOARD UTAMA === */}
        {tampilan === "dashboard" && (
          <div className="flex flex-col h-full relative fade-in">
            {/* Header */}
            <div className="glass-panel z-40 sticky top-0 px-6 pt-10 pb-4 border-b border-slate-200/50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-white shadow-sm ${kelasAktif === "mawar" ? "bg-indigo-500" : "bg-teal-500"}`}
                  >
                    <Peoples
                      theme="outline"
                      size={24}
                      strokeWidth={3}
                      fill="currentColor"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-800 leading-tight">
                      Kelas {kelasAktif === "mawar" ? "Mawar" : "Melati"}
                    </h1>
                    <p className="font-bold text-[11px] text-slate-400 uppercase tracking-wide">
                      Guru {namaGuru}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    getaranHalus();
                    setTampilan("kelas");
                  }}
                  className="p-3 bg-white border border-slate-200 text-slate-500 rounded-full hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                >
                  <Left
                    theme="outline"
                    size={20}
                    strokeWidth={4}
                    fill="currentColor"
                  />
                </button>
              </div>
            </div>

            {/* Area Konten Scroll */}
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-[160px] hide-scrollbar relative">
              {/* TAB: DATANG */}
              {tabAktif === "datang" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end mb-4">
                    <h2 className="font-extrabold text-slate-800 text-xl tracking-tight">
                      Check-In Pagi
                    </h2>
                    <span className="bg-indigo-50 text-indigo-600 text-[11px] font-extrabold px-3 py-1.5 rounded-lg border border-indigo-100">
                      Belum Hadir: {muridBelumHadir.length}
                    </span>
                  </div>

                  {muridBelumHadir.length === 0 ? (
                    <div className="text-center py-12 bg-emerald-50/50 rounded-[2rem] border border-emerald-100">
                      <div className="inline-flex bg-white p-4 rounded-full text-emerald-500 shadow-sm border border-emerald-50 mb-4">
                        <CheckOne theme="filled" size={36} fill="#10B981" />
                      </div>
                      <h3 className="font-extrabold text-emerald-800 text-lg">
                        Kelas Penuh!
                      </h3>
                      <p className="text-emerald-600/80 font-medium text-sm mt-1">
                        Semua murid telah hadir hari ini.
                      </p>
                    </div>
                  ) : (
                    muridBelumHadir.map((anak, i) => (
                      <div
                        key={anak.id}
                        className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex items-center justify-between slide-up"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={anak.foto_url}
                            alt="Foto"
                            className="w-14 h-14 rounded-[1.25rem] object-cover border-2 border-slate-50"
                          />
                          <div>
                            <span className="font-bold text-slate-800 block text-base">
                              {anak.nama}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400">
                              Menunggu Kedatangan
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDatang(anak)}
                          className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-indigo-500 active:scale-95 transition-all flex items-center gap-2 text-sm shadow-[0_4px_15px_-5px_rgba(79,70,229,0.4)]"
                        >
                          Hadir
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB: KEGIATAN */}
              {tabAktif === "kegiatan" && (
                <div className="space-y-6">
                  <h2 className="font-extrabold text-slate-800 text-xl tracking-tight mb-2">
                    Aktivitas Kelas
                  </h2>

                  {muridHadir.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-slate-200 border-dashed">
                      <div className="inline-flex bg-white p-4 rounded-full shadow-sm border border-slate-100 mb-4">
                        <Attention theme="filled" size={36} fill="#94A3B8" />
                      </div>
                      <h3 className="font-extrabold text-slate-700 text-lg">
                        Kelas Masih Kosong
                      </h3>
                      <p className="text-slate-500 font-medium text-sm mt-1">
                        Lakukan check-in terlebih dahulu.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 slide-up">
                      {/* URUTAN 1: PILIH PESERTA */}
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <CheckOne
                          theme="outline"
                          size={14}
                          strokeWidth={4}
                          fill="currentColor"
                        />{" "}
                        1. Pilih Peserta
                      </label>
                      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 hide-scrollbar">
                        <button
                          onClick={() => {
                            getaranHalus();
                            setPilihanAnak(muridHadir.map((m) => m.id));
                          }}
                          className="bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap active:scale-95 transition-all shadow-sm"
                        >
                          Semua Hadir
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
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all active:scale-95 border-2 ${pilihanAnak.includes(anak.id) ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"}`}
                          >
                            {anak.nama}
                          </button>
                        ))}
                      </div>

                      <div className="h-px bg-slate-100 w-full mb-6"></div>

                      {/* URUTAN 2: ASISTEN TEMPLATE */}
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <MagicWand
                          theme="outline"
                          size={14}
                          strokeWidth={4}
                          fill="currentColor"
                        />{" "}
                        2. Asisten Penulis Pintar
                      </label>
                      <div className="grid grid-cols-3 gap-2 mb-6">
                        <button
                          onClick={() => klikMilestoneCepat("Motorik")}
                          className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-200 active:scale-[0.98] transition-all group"
                        >
                          <ChartLine
                            theme="outline"
                            size={24}
                            strokeWidth={3}
                            fill="#F43F5E"
                            className="mb-2 group-hover:scale-110 transition-transform"
                          />
                          <span className="text-[11px] font-extrabold text-rose-700">
                            Motorik
                          </span>
                        </button>
                        <button
                          onClick={() => klikMilestoneCepat("Kreativitas")}
                          className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-200 active:scale-[0.98] transition-all group"
                        >
                          <ColorCard
                            theme="outline"
                            size={24}
                            strokeWidth={3}
                            fill="#F59E0B"
                            className="mb-2 group-hover:scale-110 transition-transform"
                          />
                          <span className="text-[11px] font-extrabold text-amber-700">
                            Kreativitas
                          </span>
                        </button>
                        <button
                          onClick={() => klikMilestoneCepat("Sosial")}
                          className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-200 active:scale-[0.98] transition-all group"
                        >
                          <Peoples
                            theme="outline"
                            size={24}
                            strokeWidth={3}
                            fill="#10B981"
                            className="mb-2 group-hover:scale-110 transition-transform"
                          />
                          <span className="text-[11px] font-extrabold text-emerald-700">
                            Sosial
                          </span>
                        </button>
                      </div>

                      {/* URUTAN 3: CATATAN */}
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 mt-4 flex items-center gap-1.5">
                        <Message
                          theme="outline"
                          size={14}
                          strokeWidth={4}
                          fill="currentColor"
                        />{" "}
                        3. Detail Kegiatan
                      </label>
                      <textarea
                        placeholder="Contoh: Belajar mewarnai dengan jari (finger painting) bersama teman-teman..."
                        className="w-full min-h-[100px] p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-4 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 text-slate-800 text-sm font-bold transition-all resize-y placeholder:text-slate-400 placeholder:font-medium"
                        value={jenisKegiatan}
                        onChange={(e) => setJenisKegiatan(e.target.value)}
                      />

                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Camera
                          theme="outline"
                          size={14}
                          strokeWidth={4}
                          fill="currentColor"
                        />{" "}
                        4. Foto (Opsional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 mb-6 cursor-pointer transition-colors"
                      />

                      <button
                        onClick={simpanKegiatanMassal}
                        disabled={isSaving}
                        className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-500 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(79,70,229,0.4)]"
                      >
                        {isSaving ? (
                          <Loading
                            theme="outline"
                            size={20}
                            strokeWidth={4}
                            fill="currentColor"
                            className="animate-spin"
                          />
                        ) : (
                          <Save
                            theme="outline"
                            size={20}
                            strokeWidth={4}
                            fill="currentColor"
                          />
                        )}
                        <span>
                          {isSaving
                            ? "Menyimpan Jurnal..."
                            : "Simpan & Kirim Laporan"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: PULANG */}
              {tabAktif === "pulang" && (
                <div className="space-y-4">
                  <h2 className="font-extrabold text-slate-800 text-xl tracking-tight mb-4">
                    Check-Out
                  </h2>

                  {muridHadir.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-slate-200 border-dashed">
                      <div className="inline-flex bg-white p-4 rounded-full shadow-sm border border-slate-100 mb-4">
                        <Home
                          theme="outline"
                          size={36}
                          strokeWidth={3}
                          fill="#94A3B8"
                        />
                      </div>
                      <h3 className="font-extrabold text-slate-700 text-lg">
                        Area Steril
                      </h3>
                      <p className="text-slate-500 font-medium text-sm mt-1">
                        Semua anak sudah dipulangkan.
                      </p>
                    </div>
                  ) : (
                    muridHadir.map((anak, i) => (
                      <div
                        key={anak.id}
                        className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-4 slide-up"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100">
                          <img
                            src={anak.foto_url}
                            alt="Foto"
                            className="w-14 h-14 rounded-[1.25rem] object-cover border-2 border-slate-50"
                          />
                          <span className="font-bold text-slate-800 text-lg">
                            {anak.nama}
                          </span>
                        </div>

                        <div className="bg-slate-50/80 rounded-2xl p-4 mb-6 max-h-40 overflow-y-auto hide-scrollbar border border-slate-100">
                          <strong className="font-extrabold text-slate-600 text-xs flex items-center gap-2 mb-3">
                            <ChartLine
                              theme="outline"
                              size={16}
                              strokeWidth={4}
                              fill="currentColor"
                            />{" "}
                            Rekap Jurnal Hari Ini
                          </strong>
                          <div className="space-y-2">
                            {logKegiatan[anak.id]?.map((log, i) => (
                              <div
                                key={i}
                                className="bg-white px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 shadow-sm border border-slate-50/50 leading-relaxed"
                              >
                                {log}
                              </div>
                            )) || (
                              <div className="text-slate-400 text-xs font-bold italic text-center py-3">
                                Belum ada aktivitas tercatat.
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">
                              Identitas Penjemput
                            </label>
                            <div className="relative">
                              <select
                                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-slate-700 text-sm font-bold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 appearance-none transition-all"
                                onChange={(e) =>
                                  setPenjemput((prev) => ({
                                    ...prev,
                                    [anak.id]: e.target.value,
                                  }))
                                }
                                defaultValue="Orang Tua"
                              >
                                <option value="Orang Tua">
                                  Orang Tua Kandung
                                </option>
                                <option value="Kakek/Nenek">
                                  Kakek / Nenek
                                </option>
                                <option value="Paman/Bibi">Paman / Bibi</option>
                                <option value="Jemputan Sekolah">
                                  Driver Jemputan
                                </option>
                                <option value="Orang Lain">
                                  Ojek Online / Lainnya
                                </option>
                              </select>
                              <Left
                                theme="outline"
                                size={20}
                                strokeWidth={4}
                                fill="currentColor"
                                className="text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 -rotate-90 pointer-events-none"
                              />
                            </div>
                          </div>
                          <input
                            type="text"
                            placeholder="Catatan (Cth: Baju Biru, Plat DP 1234 XY)..."
                            className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 text-slate-700 text-sm font-bold transition-all placeholder:text-slate-300 placeholder:font-medium"
                            onChange={(e) =>
                              setKetPenjemput((prev) => ({
                                ...prev,
                                [anak.id]: e.target.value,
                              }))
                            }
                          />
                          <button
                            onClick={() => handlePulang(anak)}
                            className="w-full mt-2 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-500 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(79,70,229,0.4)]"
                          >
                            <Home
                              theme="outline"
                              size={18}
                              strokeWidth={4}
                              fill="currentColor"
                            />{" "}
                            <span>Pulangkan & Kirim Notif</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB: KEUANGAN SPP */}
              {tabAktif === "keuangan" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <BankCard
                      theme="outline"
                      size={26}
                      strokeWidth={3}
                      fill="#1E293B"
                    />
                    <h2 className="font-extrabold text-slate-800 text-xl tracking-tight">
                      Status SPP
                    </h2>
                  </div>
                  <div className="text-xs font-bold text-indigo-700 mb-6 bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3 leading-relaxed">
                    <Info
                      theme="outline"
                      size={20}
                      strokeWidth={4}
                      fill="currentColor"
                      className="flex-shrink-0 mt-0.5"
                    />
                    <p>
                      Ketuk status pembayaran di sebelah kanan nama murid untuk
                      mengubah tagihan secara instan.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {muridSemua.map((anak, i) => {
                      const statusSpp = dapatkanStatusSpp(anak);
                      return (
                        <div
                          key={anak.id}
                          className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex items-center justify-between slide-up"
                          style={{ animationDelay: `${i * 0.05}s` }}
                        >
                          <div className="flex items-center gap-4">
                            <img
                              src={anak.foto_url}
                              alt="Foto"
                              className="w-12 h-12 rounded-[1.25rem] border-2 border-slate-50 object-cover"
                            />
                            <span className="font-bold text-slate-800 text-base">
                              {anak.nama}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleSpp(anak.id, statusSpp)}
                            className={`px-5 py-2.5 rounded-xl font-extrabold text-[11px] transition-all active:scale-95 border-2 ${statusSpp === "LUNAS" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}
                          >
                            {statusSpp === "LUNAS" ? "LUNAS" : "MENUNGGAK"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* FAB BROADCAST */}
            <button
              onClick={() => {
                getaranHalus();
                setBukaSiaran(true);
              }}
              className="absolute bottom-[100px] right-6 bg-slate-900 text-white w-14 h-14 rounded-full shadow-[0_10px_25px_rgba(15,23,42,0.4)] hover:bg-slate-800 active:scale-90 z-30 transition-all flex items-center justify-center"
            >
              <Speaker theme="filled" size={24} fill="#fff" />
            </button>

            {/* MODAL SIARAN WA */}
            {bukaSiaran && (
              <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-[4px] flex items-end justify-center sm:items-center sm:p-4 fade-in">
                <div className="bg-white w-full rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl flex flex-col h-[85vh] sm:h-auto sm:max-h-[90vh] slide-up">
                  <div className="w-full flex justify-center pt-4 pb-2 sm:hidden">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
                  </div>
                  <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100">
                    <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                      <Speaker
                        theme="outline"
                        size={24}
                        strokeWidth={4}
                        fill="currentColor"
                      />{" "}
                      Pusat Siaran
                    </h2>
                    <button
                      onClick={() => {
                        getaranHalus();
                        setBukaSiaran(false);
                      }}
                      className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-full transition-colors active:scale-90"
                    >
                      <Close
                        theme="outline"
                        size={20}
                        strokeWidth={4}
                        fill="currentColor"
                      />
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                      Template Pesan
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar">
                      <button
                        onClick={() => {
                          getaranHalus();
                          setTipeSiaran("umum");
                          setTeksSiaran(TEMPLATE_PESAN.umum);
                        }}
                        className={`px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border-2 ${tipeSiaran === "umum" ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "bg-white border-slate-100 text-slate-500"}`}
                      >
                        Info Umum
                      </button>
                      <button
                        onClick={() => {
                          getaranHalus();
                          setTipeSiaran("spp");
                          setTeksSiaran(TEMPLATE_PESAN.spp);
                        }}
                        className={`px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border-2 ${tipeSiaran === "spp" ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "bg-white border-slate-100 text-slate-500"}`}
                      >
                        Tagihan SPP
                      </button>
                      <button
                        onClick={() => {
                          getaranHalus();
                          setTipeSiaran("bekal");
                          setTeksSiaran(TEMPLATE_PESAN.bekal);
                        }}
                        className={`px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border-2 ${tipeSiaran === "bekal" ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "bg-white border-slate-100 text-slate-500"}`}
                      >
                        Kebutuhan Anak
                      </button>
                    </div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                      Editor Teks
                    </label>
                    <textarea
                      className="w-full flex-1 min-h-[220px] p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 text-slate-700 font-bold text-sm resize-none mb-6 transition-all leading-relaxed"
                      value={teksSiaran}
                      onChange={(e) => setTeksSiaran(e.target.value)}
                    />
                    <button
                      disabled={isBroadcasting}
                      onClick={handleKirimSiaran}
                      className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:active:scale-100"
                    >
                      {isBroadcasting ? (
                        <Loading
                          theme="outline"
                          size={20}
                          strokeWidth={4}
                          fill="currentColor"
                          className="animate-spin"
                        />
                      ) : (
                        <Send
                          theme="outline"
                          size={20}
                          strokeWidth={4}
                          fill="currentColor"
                        />
                      )}
                      <span>
                        {isBroadcasting
                          ? "Mengirim Siaran..."
                          : "Kirim Pesan WhatsApp"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* BOTTOM NAVIGATION BARS */}
            <div className="absolute bottom-6 left-6 right-6 z-40 bg-white/95 backdrop-blur-xl border border-slate-200/60 p-2 rounded-3xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.1)] flex justify-between gap-1">
              <button
                onClick={() => {
                  getaranHalus();
                  setTabAktif("datang");
                }}
                className={`flex-1 py-3 rounded-2xl flex flex-col items-center justify-center transition-all relative group ${tabAktif === "datang" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
              >
                <Login
                  theme="outline"
                  size={24}
                  strokeWidth={tabAktif === "datang" ? 4 : 3}
                  fill="currentColor"
                  className="mb-1"
                />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                  Tiba
                </span>
              </button>
              <button
                onClick={() => {
                  getaranHalus();
                  setTabAktif("kegiatan");
                }}
                className={`flex-1 py-3 rounded-2xl flex flex-col items-center justify-center transition-all relative group ${tabAktif === "kegiatan" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
              >
                <Box
                  theme="outline"
                  size={24}
                  strokeWidth={tabAktif === "kegiatan" ? 4 : 3}
                  fill="currentColor"
                  className="mb-1"
                />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                  Aktivitas
                </span>
              </button>
              <button
                onClick={() => {
                  getaranHalus();
                  setTabAktif("pulang");
                }}
                className={`flex-1 py-3 rounded-2xl flex flex-col items-center justify-center transition-all relative group ${tabAktif === "pulang" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
              >
                <Logout
                  theme="outline"
                  size={24}
                  strokeWidth={tabAktif === "pulang" ? 4 : 3}
                  fill="currentColor"
                  className="mb-1"
                />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                  Pulang
                </span>
              </button>
              <button
                onClick={() => {
                  getaranHalus();
                  setTabAktif("keuangan");
                }}
                className={`flex-1 py-3 rounded-2xl flex flex-col items-center justify-center transition-all relative group ${tabAktif === "keuangan" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
              >
                <BankCard
                  theme="outline"
                  size={24}
                  strokeWidth={tabAktif === "keuangan" ? 4 : 3}
                  fill="currentColor"
                  className="mb-1"
                />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                  SPP
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
