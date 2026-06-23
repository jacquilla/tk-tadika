"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

// IMPORT ICONPARK
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
  Time,
  EmotionHappy,
  Bowl,
  SleepOne,
  Notes,
  Calendar,
  MailOpen,
} from "@icon-park/react";
import "@icon-park/react/styles/index.css";

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
  const [isResettingSpp, setIsResettingSpp] = useState(false);
  const [statusAnak, setStatusAnak] = useState<Record<string, string>>({});

  const [logKegiatan, setLogKegiatan] = useState<Record<string, any[]>>({});
  const [pilihanAnak, setPilihanAnak] = useState<string[]>([]);
  const [jenisKegiatan, setJenisKegiatan] = useState("");

  const [dailyMakan, setDailyMakan] = useState("");
  const [dailyTidurMulai, setDailyTidurMulai] = useState("");
  const [dailyTidurSelesai, setDailyTidurSelesai] = useState("");
  const [dailyMood, setDailyMood] = useState("");

  const [penjemput, setPenjemput] = useState<Record<string, string>>({});
  const [ketPenjemput, setKetPenjemput] = useState<Record<string, string>>({});

  const [bukaSiaran, setBukaSiaran] = useState(false);
  const [tipeSiaran, setTipeSiaran] = useState("umum");
  const [teksSiaran, setTeksSiaran] = useState(TEMPLATE_PESAN.umum);

  const [chatPersonalAktif, setChatPersonalAktif] = useState<any>(null);
  const [teksChatPersonal, setTeksChatPersonal] = useState("");
  const [isMengirimChat, setIsMengirimChat] = useState(false);

  const [dataLaporan, setDataLaporan] = useState<Record<string, any[]>>({});
  const [isLoadingLaporan, setIsLoadingLaporan] = useState(false);

  // FETCHING AWAL
  useEffect(() => {
    const tarikDataAwal = async () => {
      const { data: muridData } = await supabase.from("murid").select("*");
      if (muridData) setDataSemuaMurid(muridData);

      const hariIni = new Date().toISOString().split("T")[0];
      const { data: hadirData } = await supabase
        .from("kehadiran")
        .select("*")
        .gte("waktu_datang", hariIni);

      if (hadirData) {
        const statusMap: Record<string, string> = {};
        hadirData.forEach((h) => {
          statusMap[h.murid_id] = h.status_hadir;
        });
        setStatusAnak(statusMap);
      }
      setIsLoading(false);
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

  // FETCHING LAPORAN 7 HARI
  useEffect(() => {
    const tarikLaporan7Hari = async () => {
      if (tabAktif !== "laporan") return;

      setIsLoadingLaporan(true);
      const tglBatas = new Date();
      tglBatas.setDate(tglBatas.getDate() - 7);
      const tglFilter = tglBatas.toISOString();

      const muridIds = dataSemuaMurid
        .filter((m) => m.kelas.toLowerCase() === kelasAktif.toLowerCase())
        .map((m) => m.id);
      if (muridIds.length === 0) {
        setIsLoadingLaporan(false);
        return;
      }

      const { data: hadirData } = await supabase
        .from("kehadiran")
        .select("*")
        .in("murid_id", muridIds)
        .gte("waktu_datang", tglFilter)
        .order("waktu_datang", { ascending: false });
      const { data: logData } = await supabase
        .from("log_aktivitas")
        .select("murid_id, created_at")
        .in("murid_id", muridIds)
        .gte("created_at", tglFilter);

      const grouped: Record<string, any[]> = {};
      if (hadirData) {
        hadirData.forEach((h) => {
          const date = h.waktu_datang.split("T")[0];
          if (!grouped[date]) grouped[date] = [];

          const logAnak =
            logData?.filter(
              (l) => l.murid_id === h.murid_id && l.created_at.startsWith(date),
            ) || [];
          grouped[date].push({
            ...h,
            murid_nama:
              dataSemuaMurid.find((m) => m.id === h.murid_id)?.nama ||
              "Tanpa Nama",
            total_kegiatan: logAnak.length,
          });
        });
      }
      setDataLaporan(grouped);
      setIsLoadingLaporan(false);
    };

    tarikLaporan7Hari();
  }, [tabAktif, kelasAktif, dataSemuaMurid]);

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
  };

  const dapatkanStatusSpp = (anak: any) =>
    statusSppDinamis[anak.id] || anak.status_spp || "LUNAS";

  const toggleSpp = async (idAnak: string, statusSaatIni: string) => {
    getaranHalus();
    const statusBaru = statusSaatIni === "LUNAS" ? "MENUNGGAK" : "LUNAS";
    setStatusSppDinamis((prev) => ({ ...prev, [idAnak]: statusBaru }));
    await supabase
      .from("murid")
      .update({ status_spp: statusBaru })
      .eq("id", idAnak);
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
      await supabase
        .from("murid")
        .update({ status_spp: "MENUNGGAK" })
        .in("id", muridIds);

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
    await supabase.from("log_aktivitas").insert({
      murid_id: idAnak,
      deskripsi: teksKegiatan,
      kategori,
      metadata,
    });
  };

  const klikMilestoneCepat = (kategori: string) => {
    getaranHalus();
    const templates: Record<string, string> = {
      Motorik:
        "[Motorik] Melatih gerak fisik dan koordinasi anak melalui kegiatan: ",
      Kreativitas:
        "[Kreativitas] Mengasah imajinasi dan ide kreatif anak saat membuat karya: ",
      Sosial:
        "[Sosial] Melatih interaksi, keberanian, dan kemandirian anak ketika: ",
    };
    setJenisKegiatan((prev) =>
      prev ? prev + "\n" + templates[kategori] : templates[kategori],
    );
  };

  const kirimWA = async (nomorHp: string, pesan: string) => {
    try {
      await fetch("/api/wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetHp: nomorHp, pesanCustom: pesan }),
      });
    } catch (e) {
      console.error("Error WA");
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
    setStatusAnak((prev) => ({ ...prev, [anak.id]: "hadir" }));
    await supabase.from("kehadiran").insert({
      murid_id: anak.id,
      status_hadir: "hadir",
      waktu_datang: new Date().toISOString(),
    });
    catatKegiatan(
      anak.id,
      "Tiba di sekolah dengan ceria (Check-In)",
      "Kehadiran",
    );
  };

  const simpanKegiatanMassal = async () => {
    getaranHalus();
    if (pilihanAnak.length === 0) return alert("Pilih minimal 1 anak!");
    if (!jenisKegiatan && !dailyMakan && !dailyMood)
      return alert("Isi catatan kegiatan atau daily sheet!");

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    const metadataSheet = {
      makan: dailyMakan || null,
      tidur:
        dailyTidurMulai && dailyTidurSelesai
          ? `${dailyTidurMulai} - ${dailyTidurSelesai}`
          : null,
      mood: dailyMood || null,
    };

    for (const id of pilihanAnak) {
      await catatKegiatan(
        id,
        jenisKegiatan || "Mengikuti rutinitas kelas harian.",
        "DailySheet",
        metadataSheet,
      );
    }

    setPilihanAnak([]);
    setJenisKegiatan("");
    setDailyMakan("");
    setDailyTidurMulai("");
    setDailyTidurSelesai("");
    setDailyMood("");
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

    catatKegiatan(
      anak.id,
      `Pulang (Dijemput: ${siapaJemput}${detailJemput ? ` - ${detailJemput}` : ""})`,
      "Kehadiran",
    );

    const logHariIni = logKegiatan[anak.id] || [];
    let ringkasanDaily = "";
    const logDailySheet = logHariIni
      .filter((l) => l.kategori === "DailySheet" && l.metadata)
      .pop();
    if (logDailySheet && logDailySheet.metadata) {
      const m = logDailySheet.metadata;
      ringkasanDaily =
        `\n\n📊 *Daily Sheet Ananda:*\n` +
        (m.makan ? `🍱 Porsi Makan: *${m.makan}*\n` : "") +
        (m.tidur ? `💤 Tidur Siang: *${m.tidur}*\n` : "") +
        (m.mood ? `😊 Mood Dominan: *${m.mood}*\n` : "");
    }
    const rangkumanText = logHariIni
      .filter((l) => l.kategori !== "Kehadiran")
      .map((l) => `- [${l.waktu}] ${l.teks}`)
      .join("\n");

    const pesanFinal = `📖 *Buku Penghubung Digital TK Tadika Mesra*\n\nSyalom Bunda/Ayah,\nHari ini ananda *${anak.nama}* telah mengikuti kegiatan di sekolah dengan baik! ✨\n\n📝 *Aktivitas Hari Ini:*\n${rangkumanText || "- Berkegiatan rutin di kelas"}${ringkasanDaily}\n\n🚗 *Informasi Kepulangan:*\nAnanda telah dijemput oleh: *${siapaJemput}*\n${detailJemput ? `Keterangan: ${detailJemput}` : ""}\n\nTerima kasih atas kepercayaannya Bunda/Ayah. Kurré sumanga'. 🙏`;
    kirimWA(anak.nomor_hp_ortu, pesanFinal);
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

      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]"></div>

      <div className="relative w-full max-w-md h-[100dvh] md:h-[90vh] bg-[#F8FAFC] shadow-[0_20px_50px_rgba(0,0,0,0.2)] md:rounded-[2.5rem] flex flex-col overflow-hidden border-0 md:border border-white/60">
        {/* --- HALAMAN LOGIN --- */}
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
                <p className="text-slate-400 font-bold mb-10 text-[10px] tracking-widest uppercase">
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
              <span className="text-[10px] text-slate-400 font-bold tracking-widest mb-2 uppercase">
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

        {/* --- HALAMAN PILIH KELAS --- */}
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
                  setTabAktif("datang");
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
                  setTabAktif("datang");
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

        {/* --- HALAMAN DASHBOARD UTAMA --- */}
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
                    <div className="mt-1 inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">
                      <User theme="filled" size={10} /> 1 Guru :{" "}
                      {muridHadir.length} Hadir
                    </div>
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
                            className="w-12 h-12 rounded-[1rem] object-cover border-2 border-slate-50"
                          />
                          <span className="font-bold text-slate-800">
                            {anak.nama}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => bukaChatPersonal(anak)}
                            className="bg-indigo-50 text-indigo-600 p-2.5 rounded-2xl hover:bg-indigo-100 transition-all active:scale-95"
                          >
                            <Message
                              theme="outline"
                              size={20}
                              strokeWidth={4}
                            />
                          </button>
                          <button
                            onClick={() => handleDatang(anak)}
                            className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-2xl shadow-md active:scale-95 transition-all"
                          >
                            Hadir
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB: KEGIATAN */}
              {tabAktif === "kegiatan" && (
                <div className="space-y-6">
                  <h2 className="font-extrabold text-slate-800 text-xl tracking-tight mb-2">
                    Aktivitas & Daily Sheet
                  </h2>

                  {muridHadir.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-slate-200 border-dashed">
                      <div className="inline-flex bg-white p-4 rounded-full shadow-sm border border-slate-100 mb-4">
                        <Attention theme="filled" size={36} fill="#94A3B8" />
                      </div>
                      <h3 className="font-extrabold text-slate-700">
                        Kelas Masih Kosong
                      </h3>
                      <p className="text-slate-500 font-medium text-sm mt-1">
                        Lakukan check-in terlebih dahulu.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 slide-up">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <CheckOne size={14} /> 1. Peserta
                        </label>
                        <button
                          onClick={() => {
                            getaranHalus();
                            setPilihanAnak(
                              pilihanAnak.length === muridHadir.length
                                ? []
                                : muridHadir.map((m) => m.id),
                            );
                          }}
                          className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md active:scale-95"
                        >
                          {pilihanAnak.length === muridHadir.length
                            ? "Batal Pilih"
                            : "Pilih Semua"}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-5 max-h-32 overflow-y-auto hide-scrollbar bg-slate-50 p-2 rounded-2xl border border-slate-100">
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
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border-2 ${pilihanAnak.includes(anak.id) ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"}`}
                          >
                            {anak.nama}
                          </button>
                        ))}
                      </div>

                      <div className="h-px bg-slate-100 w-full mb-5"></div>

                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <MagicWand size={14} /> 2. Asisten Penulis
                      </label>
                      <div className="grid grid-cols-3 gap-2 mb-5">
                        <button
                          onClick={() => klikMilestoneCepat("Motorik")}
                          className="flex flex-col items-center p-2 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 active:scale-[0.98] transition-all"
                        >
                          <ChartLine
                            theme="outline"
                            size={20}
                            strokeWidth={3}
                            fill="#F43F5E"
                            className="mb-1"
                          />
                          <span className="text-[10px] font-extrabold text-rose-700">
                            Motorik
                          </span>
                        </button>
                        <button
                          onClick={() => klikMilestoneCepat("Kreativitas")}
                          className="flex flex-col items-center p-2 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 active:scale-[0.98] transition-all"
                        >
                          <ColorCard
                            theme="outline"
                            size={20}
                            strokeWidth={3}
                            fill="#F59E0B"
                            className="mb-1"
                          />
                          <span className="text-[10px] font-extrabold text-amber-700">
                            Kreativitas
                          </span>
                        </button>
                        <button
                          onClick={() => klikMilestoneCepat("Sosial")}
                          className="flex flex-col items-center p-2 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 active:scale-[0.98] transition-all"
                        >
                          <Peoples
                            theme="outline"
                            size={20}
                            strokeWidth={3}
                            fill="#10B981"
                            className="mb-1"
                          />
                          <span className="text-[10px] font-extrabold text-emerald-700">
                            Sosial
                          </span>
                        </button>
                      </div>

                      <textarea
                        placeholder="Contoh: Belajar mewarnai dengan jari (finger painting)..."
                        className="w-full min-h-[80px] p-3 bg-slate-50 border-2 border-slate-100 rounded-xl mb-3 outline-none focus:border-indigo-400 text-slate-800 text-sm font-bold resize-y"
                        value={jenisKegiatan}
                        onChange={(e) => setJenisKegiatan(e.target.value)}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-bold file:bg-indigo-50 file:text-indigo-600 mb-6"
                      />

                      <div className="h-px bg-slate-100 w-full mb-5"></div>

                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <Bowl size={14} /> 3. Daily Sheet Cepat
                      </label>
                      <div className="space-y-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                            <Bowl theme="outline" size={14} /> Makan Siang
                          </p>
                          <div className="flex gap-2">
                            {["Habis", "Setengah", "Tidak Mau"].map((opsi) => (
                              <button
                                key={opsi}
                                onClick={() =>
                                  setDailyMakan(dailyMakan === opsi ? "" : opsi)
                                }
                                className={`flex-1 py-2 text-xs font-bold rounded-lg border active:scale-95 ${dailyMakan === opsi ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-white border-slate-200 text-slate-500"}`}
                              >
                                {opsi}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                              <SleepOne theme="outline" size={14} /> Tidur Mulai
                            </p>
                            <input
                              type="time"
                              value={dailyTidurMulai}
                              onChange={(e) =>
                                setDailyTidurMulai(e.target.value)
                              }
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-600 mb-2">
                              Selesai
                            </p>
                            <input
                              type="time"
                              value={dailyTidurSelesai}
                              onChange={(e) =>
                                setDailyTidurSelesai(e.target.value)
                              }
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                            <EmotionHappy theme="outline" size={14} /> Mood Anak
                          </p>
                          <div className="flex gap-2">
                            {[
                              { label: "Senang", icon: "😊", color: "emerald" },
                              { label: "Biasa", icon: "😐", color: "indigo" },
                              { label: "Rewel", icon: "😭", color: "rose" },
                            ].map((m) => (
                              <button
                                key={m.label}
                                onClick={() =>
                                  setDailyMood(
                                    dailyMood === m.label ? "" : m.label,
                                  )
                                }
                                className={`flex-1 py-2 text-sm rounded-lg border flex justify-center items-center gap-1.5 active:scale-95 ${dailyMood === m.label ? `bg-${m.color}-100 border-${m.color}-300 text-${m.color}-800 font-extrabold` : "bg-white border-slate-200 text-slate-400 grayscale opacity-70"}`}
                              >
                                <span>{m.icon}</span>{" "}
                                <span className="text-[10px] uppercase tracking-wider">
                                  {m.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={simpanKegiatanMassal}
                        disabled={isSaving}
                        className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(79,70,229,0.4)]"
                      >
                        {isSaving ? (
                          <Loading className="animate-spin" />
                        ) : (
                          <Save />
                        )}{" "}
                        <span>Kirim Jurnal & Sheet</span>
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
                        <Home theme="outline" size={36} fill="#94A3B8" />
                      </div>
                      <h3 className="font-extrabold text-slate-700">
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
                        <div className="flex items-center justify-between mb-5 pb-5 border-b border-slate-100">
                          <div className="flex items-center gap-4">
                            <img
                              src={anak.foto_url}
                              className="w-14 h-14 rounded-[1.25rem] object-cover border-2 border-slate-50"
                            />
                            <span className="font-bold text-slate-800 text-lg">
                              {anak.nama}
                            </span>
                          </div>
                          <button
                            onClick={() => bukaChatPersonal(anak)}
                            className="bg-indigo-50 text-indigo-600 p-2.5 rounded-2xl hover:bg-indigo-100 transition-all active:scale-95"
                          >
                            <Message
                              theme="outline"
                              size={20}
                              strokeWidth={4}
                            />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <select
                            className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-slate-700 text-sm font-bold outline-none focus:border-indigo-400 transition-all appearance-none"
                            onChange={(e) =>
                              setPenjemput((prev) => ({
                                ...prev,
                                [anak.id]: e.target.value,
                              }))
                            }
                            defaultValue="Orang Tua"
                          >
                            <option value="Orang Tua">Orang Tua Kandung</option>
                            <option value="Kakek/Nenek">Kakek / Nenek</option>
                            <option value="Driver">Driver Jemputan</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Catatan Baju / Plat Nomor..."
                            className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-400 text-slate-700 text-sm font-bold transition-all"
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
                  <h2 className="font-extrabold text-slate-800 text-xl tracking-tight mb-4">
                    Status SPP
                  </h2>

                  <div className="mb-6 slide-up">
                    <button
                      onClick={handleResetDanTagihSppMassal}
                      disabled={isResettingSpp}
                      className="w-full bg-slate-900 text-white p-4 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-lg disabled:opacity-50"
                    >
                      {isResettingSpp ? (
                        <Loading
                          theme="outline"
                          size={28}
                          className="animate-spin text-indigo-400"
                        />
                      ) : (
                        <Calendar
                          theme="outline"
                          size={28}
                          className="text-indigo-400"
                        />
                      )}
                      <span className="font-extrabold text-sm tracking-wide">
                        Mulai Penagihan Bulan Baru
                      </span>
                      <span className="text-[10px] text-slate-400 text-center font-medium leading-relaxed px-2">
                        Set semua murid menjadi menunggak &<br />
                        Kirim WA tagihan massal secara otomatis
                      </span>
                    </button>
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
                              className="w-12 h-12 rounded-[1.25rem] border-2 border-slate-50 object-cover"
                            />
                            <div>
                              <span className="font-bold text-slate-800 text-base block mb-0.5">
                                {anak.nama}
                              </span>
                              <button
                                onClick={() => bukaChatPersonal(anak)}
                                className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100 transition-colors"
                              >
                                <MailOpen size={12} /> Japri Ortu
                              </button>
                            </div>
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

              {/* TAB: LAPORAN 7 HARI */}
              {tabAktif === "laporan" && (
                <div className="space-y-6">
                  <h2 className="font-extrabold text-slate-800 text-xl tracking-tight mb-2">
                    Laporan 7 Hari Terakhir
                  </h2>
                  {isLoadingLaporan ? (
                    <div className="flex justify-center items-center py-12">
                      <Loading
                        className="animate-spin text-indigo-500"
                        size={32}
                      />
                    </div>
                  ) : Object.keys(dataLaporan).length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-slate-200 border-dashed">
                      <Notes
                        theme="filled"
                        size={36}
                        fill="#94A3B8"
                        className="mx-auto mb-2"
                      />
                      <h3 className="font-extrabold text-slate-700">
                        Belum Ada Data Historis
                      </h3>
                    </div>
                  ) : (
                    Object.keys(dataLaporan)
                      .sort(
                        (a, b) => new Date(b).getTime() - new Date(a).getTime(),
                      )
                      .map((tgl) => (
                        <div
                          key={tgl}
                          className="bg-white p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-4 slide-up"
                        >
                          <h3 className="font-extrabold text-indigo-700 text-xs mb-4 bg-indigo-50 inline-block px-3 py-1.5 rounded-lg uppercase tracking-wider">
                            {new Date(tgl).toLocaleDateString("id-ID", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </h3>
                          <div className="space-y-3">
                            {dataLaporan[tgl].map((h: any) => (
                              <div
                                key={h.id}
                                className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100"
                              >
                                <div>
                                  <span className="font-bold text-slate-800 text-sm block">
                                    {h.murid_nama}
                                  </span>
                                  <span className="text-[10px] font-extrabold text-slate-400">
                                    Total Kegiatan: {h.total_kegiatan} Jurnal
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="block text-[11px] font-bold text-emerald-600">
                                    Masuk:{" "}
                                    {new Date(
                                      h.waktu_datang,
                                    ).toLocaleTimeString("id-ID", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  <span className="block text-[11px] font-bold text-rose-600">
                                    Keluar:{" "}
                                    {h.waktu_pulang
                                      ? new Date(
                                          h.waktu_pulang,
                                        ).toLocaleTimeString("id-ID", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "Belum"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>

            {/* MODAL POIN 3: CHAT PERSONAL 1:1 */}
            {chatPersonalAktif && (
              <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-[4px] flex items-end justify-center sm:items-center sm:p-4 fade-in">
                <div className="bg-white w-full rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl flex flex-col h-[75vh] sm:h-auto sm:max-h-[90vh] slide-up">
                  <div className="w-full flex justify-center pt-4 pb-2 sm:hidden">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
                  </div>
                  <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100">
                    <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 truncate">
                      <Message
                        theme="outline"
                        size={24}
                        strokeWidth={4}
                        fill="currentColor"
                      />{" "}
                      Chat Ortu: {chatPersonalAktif.nama}
                    </h2>
                    <button
                      onClick={() => setChatPersonalAktif(null)}
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
                  <div className="p-6 overflow-y-auto flex-1 hide-scrollbar flex flex-col">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                      Tulis Pesan
                    </label>
                    <textarea
                      className="w-full flex-1 min-h-[200px] p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-indigo-400 text-slate-700 font-bold text-sm resize-none mb-6 transition-all leading-relaxed"
                      value={teksChatPersonal}
                      onChange={(e) => setTeksChatPersonal(e.target.value)}
                    />
                    <button
                      disabled={isMengirimChat}
                      onClick={handleKirimChatPersonal}
                      className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:active:scale-100"
                    >
                      {isMengirimChat ? (
                        <Loading
                          theme="outline"
                          size={20}
                          strokeWidth={4}
                          className="animate-spin"
                        />
                      ) : (
                        <Send theme="outline" size={20} strokeWidth={4} />
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
                    <textarea
                      className="w-full flex-1 min-h-[220px] p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-indigo-400 text-slate-700 font-bold text-sm resize-none mb-6 transition-all"
                      value={teksSiaran}
                      onChange={(e) => setTeksSiaran(e.target.value)}
                    />
                    <button
                      disabled={isBroadcasting}
                      onClick={handleKirimSiaran}
                      className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl active:scale-[0.98] transition-all flex justify-center gap-2"
                    >
                      {isBroadcasting ? (
                        <Loading className="animate-spin" />
                      ) : (
                        <Send />
                      )}{" "}
                      <span>Kirim Broadcast</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* BOTTOM NAVIGATION BARS */}
            <div className="absolute bottom-4 left-4 right-4 z-40 bg-white/95 backdrop-blur-xl border border-slate-200/60 p-2 rounded-3xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.1)] flex justify-between gap-1 overflow-x-auto hide-scrollbar">
              <button
                onClick={() => {
                  getaranHalus();
                  setTabAktif("datang");
                }}
                className={`flex-1 min-w-[60px] py-2 rounded-2xl flex flex-col items-center transition-all ${tabAktif === "datang" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
              >
                <Login size={22} className="mb-1" />
                <span className="text-[9px] font-extrabold uppercase">
                  Tiba
                </span>
              </button>
              <button
                onClick={() => {
                  getaranHalus();
                  setTabAktif("kegiatan");
                }}
                className={`flex-1 min-w-[60px] py-2 rounded-2xl flex flex-col items-center transition-all ${tabAktif === "kegiatan" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
              >
                <Box size={22} className="mb-1" />
                <span className="text-[9px] font-extrabold uppercase">
                  Aktivitas
                </span>
              </button>
              <button
                onClick={() => {
                  getaranHalus();
                  setTabAktif("pulang");
                }}
                className={`flex-1 min-w-[60px] py-2 rounded-2xl flex flex-col items-center transition-all ${tabAktif === "pulang" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
              >
                <Logout size={22} className="mb-1" />
                <span className="text-[9px] font-extrabold uppercase">
                  Pulang
                </span>
              </button>
              <button
                onClick={() => {
                  getaranHalus();
                  setTabAktif("keuangan");
                }}
                className={`flex-1 min-w-[60px] py-2 rounded-2xl flex flex-col items-center transition-all ${tabAktif === "keuangan" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
              >
                <BankCard size={22} className="mb-1" />
                <span className="text-[9px] font-extrabold uppercase">SPP</span>
              </button>
              <button
                onClick={() => {
                  getaranHalus();
                  setTabAktif("laporan");
                }}
                className={`flex-1 min-w-[60px] py-2 rounded-2xl flex flex-col items-center transition-all ${tabAktif === "laporan" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
              >
                <Notes size={22} className="mb-1" />
                <span className="text-[9px] font-extrabold uppercase">
                  Laporan
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
