"use client";
import { useState, useRef } from "react";

const DATA_KELAS = {
  mawar: [
    {
      id: 101,
      nama: "Budi",
      hp: "62895406574589",
      foto: "https://ui-avatars.com/api/?name=Budi&background=random",
    },
    {
      id: 102,
      nama: "Ani",
      hp: "62895406574589",
      foto: "https://ui-avatars.com/api/?name=Ani&background=random",
    },
    {
      id: 103,
      nama: "Raisa",
      hp: "62895406574589",
      foto: "https://ui-avatars.com/api/?name=Raisa&background=random",
    },
  ],
  melati: [
    {
      id: 201,
      nama: "Putra",
      hp: "62895406574589",
      foto: "https://ui-avatars.com/api/?name=Putra&background=random",
    },
    {
      id: 202,
      nama: "Malfin",
      hp: "62895406574589",
      foto: "https://ui-avatars.com/api/?name=Malfin&background=random",
    },
    {
      id: 203,
      nama: "Jenni",
      hp: "62895406574589",
      foto: "https://ui-avatars.com/api/?name=Jenni&background=random",
    },
  ],
};

const TEMPLATE_PESAN = {
  umum: "Syalom Bunda/Ayah,\n\nIni adalah informasi resmi dari TK Tadika Mesra.\n\n[KETIK INFO DI SINI]\n\nKurré sumanga' atas perhatiannya. Tuhan memberkati.",
  spp: "Syalom Bunda/Ayah,\n\nSemoga keluarga dalam keadaan sehat selalu. Tabe', dengan penuh kerendahan hati kami dari administrasi TK Tadika Mesra ingin mengingatkan mengenai administrasi SPP bulan ini yang mungkin terlewat.\n\nJika sudah menyelesaikan administrasi, mohon abaikan pesan ini. Kurré sumanga' atas dukungan Bunda/Ayah yang luar biasa bagi kelancaran operasional sekolah kita. Tuhan memberkati. 🙏",
  bekal:
    "Syalom Bunda,\n\nTabe', demi kenyamanan dan kesehatan ananda selama berkegiatan di sekolah hari ini, mohon kesediaannya untuk membekali ananda dengan:\n\n- Botol minum pribadi\n- [TAMBAHKAN KEBUTUHAN LAIN, CTH: Baju Ganti]\n\nKurré sumanga' atas kerja samanya Bunda! 🎒✨",
};

// Komponen Icon Premium - skill senior: bungkus emoji dengan glass + gradient
const IconBadge = ({
  children,
  from,
  to,
  size = "w-14 h-14",
  text = "text-3xl",
}) => (
  <div
    className={`${size} rounded-2xl bg-gradient-to-br ${from} ${to} flex items-center justify-center shadow-lg ring-1 ring-white/20 backdrop-blur-sm`}
  >
    <span className={`${text} drop-shadow-md`}>{children}</span>
  </div>
);

export default function AppTK() {
  const [tampilan, setTampilan] = useState("login");
  const [namaGuru, setNamaGuru] = useState("");
  const [kelasAktif, setKelasAktif] = useState("");
  const [tabAktif, setTabAktif] = useState("datang");
  const [statusAnak, setStatusAnak] = useState<Record<number, string>>({});
  const [logKegiatan, setLogKegiatan] = useState<Record<number, string[]>>({});
  const [pilihanAnak, setPilihanAnak] = useState<number[]>([]);
  const [jenisKegiatan, setJenisKegiatan] = useState("");
  const [penjemput, setPenjemput] = useState<Record<number, string>>({});
  const [ketPenjemput, setKetPenjemput] = useState<Record<number, string>>({});
  const [bukaSiaran, setBukaSiaran] = useState(false);
  const [tipeSiaran, setTipeSiaran] = useState("umum");
  const [teksSiaran, setTeksSiaran] = useState(TEMPLATE_PESAN.umum);
  const audioRef = useRef<AudioContext | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const muridSemua =
    kelasAktif === "mawar" ? DATA_KELAS.mawar : DATA_KELAS.melati;
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

  const catatKegiatan = (idAnak: number, teksKegiatan: string) => {
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
      await kirimWA(anak.hp, `📢 *PENGUMUMAN KELAS*\n\n${teksSiaran}`);
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
      anak.hp,
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
    const pesanFinal = `📖 *Buku Penghubung Digital TK Tadika Mesra*\n\nSyalom Bunda/Ayah,\nHari ini ananda *${anak.nama}* telah mengikuti kegiatan di sekolah dengan penuh semangat! ✨\n\n📝 *Catatan Aktivitas Hari Ini:*\n- ${rangkumanText ? rangkumanText : "Berkegiatan rutin di kelas"}\n\n🚗 *Informasi Kepulangan:*\nAnanda telah dijemput dengan aman oleh: *${siapaJemput}*\n${detailJemput ? `Keterangan Penjemput: ${detailJemput}` : ""}\n\nTerima kasih atas kepercayaannya Bunda/Ayah. Selamat beristirahat dan sampai jumpa besok! Kurré sumanga'. 🙏`;
    kirimWA(anak.hp, pesanFinal);
  };

  return (
    <div
      className="fixed inset-0 w-full h-full flex items-center justify-center font-sans bg-gray-900"
      style={{
        backgroundImage: "url('/bg.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
      <div className="relative w-full max-w-md h-full md:h-[90vh] bg-[#F8FAFC] shadow-2xl md:rounded-[2.5rem] flex flex-col overflow-hidden border-4 border-white/20">
        {tampilan === "login" && (
          <div className="flex-1 flex items-center justify-center p-6 bg-indigo-50/90 backdrop-blur-md">
            <div className="bg-white w-full p-8 rounded-[2rem] shadow-xl text-center border-2 border-indigo-100">
              <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl ring-4 ring-white">
                <span className="text-4xl">🏫</span>
              </div>
              <h1 className="text-3xl font-black text-indigo-900 mb-2">
                TK Tadika Mesra
              </h1>
              <p className="text-indigo-500 font-bold mb-8">
                Portal Guru Digital
              </p>
              <input
                type="text"
                placeholder="Ketik Nama Guru..."
                className="w-full p-4 bg-indigo-50 border-2 border-indigo-200 rounded-2xl mb-6 focus:border-indigo-500 outline-none text-slate-900 font-bold text-center text-lg placeholder-indigo-300"
                value={namaGuru}
                onChange={(e) => setNamaGuru(e.target.value)}
              />
              <button
                onClick={() => {
                  getaranHalus();
                  namaGuru ? setTampilan("kelas") : alert("Isi nama dulu!");
                }}
                className="w-full bg-indigo-500 text-white font-black py-4 rounded-2xl text-lg border-b-4 border-indigo-700 hover:bg-indigo-600 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
              >
                Masuk Aplikasi
              </button>
            </div>
          </div>
        )}

        {tampilan === "kelas" && (
          <div className="flex-1 flex items-center justify-center p-6 bg-indigo-50/90 backdrop-blur-md overflow-y-auto">
            <div className="bg-white w-full p-6 rounded-[2rem] shadow-xl border-2 border-indigo-100">
              <div className="flex justify-between items-center mb-8 border-b-2 border-indigo-50 pb-4">
                <h2 className="text-2xl font-black text-slate-900">
                  Halo, {namaGuru}!
                </h2>
                <button
                  onClick={() => {
                    getaranHalus();
                    setTampilan("login");
                  }}
                  className="text-rose-500 font-bold active:scale-95"
                >
                  Keluar
                </button>
              </div>
              <h3 className="text-indigo-500 font-bold mb-4">
                Pilih kelas hari ini:
              </h3>

              <div
                onClick={() => {
                  getaranHalus();
                  setKelasAktif("mawar");
                  setTampilan("dashboard");
                }}
                className="group bg-white border-2 border-rose-100 p-5 rounded-3xl mb-4 cursor-pointer hover:shadow-xl hover:border-rose-200 active:scale-[0.98] transition-all flex items-center gap-5"
              >
                <IconBadge from="from-rose-400" to="to-pink-600">
                  🌸
                </IconBadge>
                <div className="flex-1">
                  <h4 className="text-2xl font-black text-slate-900 group-hover:text-rose-600 transition-colors">
                    Kelas Mawar
                  </h4>
                  <p className="text-slate-500 font-semibold">
                    3 Murid • Usia 4-5
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-rose-500 flex items-center justify-center transition-all">
                  <span className="text-slate-400 group-hover:text-white">
                    →
                  </span>
                </div>
              </div>

              <div
                onClick={() => {
                  getaranHalus();
                  setKelasAktif("melati");
                  setTampilan("dashboard");
                }}
                className="group bg-white border-2 border-amber-100 p-5 rounded-3xl cursor-pointer hover:shadow-xl hover:border-amber-200 active:scale-[0.98] transition-all flex items-center gap-5"
              >
                <IconBadge from="from-amber-400" to="to-orange-500">
                  🌼
                </IconBadge>
                <div className="flex-1">
                  <h4 className="text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                    Kelas Melati
                  </h4>
                  <p className="text-slate-500 font-semibold">
                    3 Murid • Usia 5-6
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-amber-500 flex items-center justify-center transition-all">
                  <span className="text-slate-400 group-hover:text-white">
                    →
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {tampilan === "dashboard" && (
          <>
            {showConfetti && (
              <div className="pointer-events-none absolute inset-0 z-50 flex items-start justify-center pt-24">
                <div className="text-4xl animate-bounce">🎉 ✨ 🌟</div>
              </div>
            )}

            <div
              className={`p-5 pt-8 z-10 shadow-sm border-b ${kelasAktif === "mawar" ? "bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100" : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100"}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <IconBadge
                    from={
                      kelasAktif === "mawar"
                        ? "from-rose-500"
                        : "from-amber-500"
                    }
                    to={
                      kelasAktif === "mawar" ? "to-pink-600" : "to-orange-500"
                    }
                    size="w-12 h-12"
                    text="text-2xl"
                  >
                    {kelasAktif === "mawar" ? "🌸" : "🌼"}
                  </IconBadge>
                  <div>
                    <h1 className="text-xl font-black text-slate-900">
                      Kelas {kelasAktif === "mawar" ? "Mawar" : "Melati"}
                    </h1>
                    <p className="font-semibold text-sm text-slate-600">
                      Guru: {namaGuru}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    getaranHalus();
                    setTampilan("kelas");
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                >
                  Kembali
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pb-36">
              {tabAktif === "datang" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end mb-4">
                    <h2 className="font-black text-slate-900 text-xl">
                      Check-In Pagi
                    </h2>
                    <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      Belum: {muridBelumHadir.length}
                    </span>
                  </div>
                  {muridBelumHadir.length === 0 ? (
                    <div className="text-center p-10 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                        <span className="text-3xl">✓</span>
                      </div>
                      <h3 className="font-black text-slate-900 text-xl">
                        Semua Hadir
                      </h3>
                      <p className="text-slate-500 font-medium mt-1">
                        Kelas siap memulai kegiatan
                      </p>
                    </div>
                  ) : (
                    muridBelumHadir.map((anak) => (
                      <div
                        key={anak.id}
                        className="group bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md hover:border-slate-200 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img
                              src={anak.foto}
                              alt="Foto"
                              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 group-hover:ring-emerald-200 transition-all"
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
                              <span className="text-[10px]">⏰</span>
                            </div>
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-lg block">
                              {anak.nama}
                            </span>
                            <span className="text-xs text-slate-500">
                              Menunggu check-in
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDatang(anak)}
                          className="bg-slate-900 text-white font-bold px-6 py-3 rounded-2xl hover:bg-black active:scale-95 transition-all shadow-md hover:shadow-lg"
                        >
                          Tiba
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tabAktif === "kegiatan" && (
                <div className="space-y-4">
                  <h2 className="font-black text-slate-900 text-xl mb-4">
                    Aktivitas Kelas
                  </h2>
                  {muridHadir.length === 0 ? (
                    <div className="text-center p-10 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                        <span className="text-3xl">📋</span>
                      </div>
                      <p className="text-slate-600 font-semibold">
                        Check-in anak di tab Tiba terlebih dahulu
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Pilih Anak
                      </label>
                      <div className="flex gap-2 overflow-x-auto pb-4 -mx-1 px-1">
                        <button
                          onClick={() => {
                            getaranHalus();
                            setPilihanAnak(muridHadir.map((m) => m.id));
                          }}
                          className="px-4 py-2.5 rounded-xl font-semibold whitespace-nowrap bg-slate-900 text-white hover:bg-black active:scale-95 transition-all text-sm"
                        >
                          Semua
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
                            className={`px-4 py-2.5 rounded-xl font-semibold whitespace-nowrap transition-all active:scale-95 text-sm border ${pilihanAnak.includes(anak.id) ? "bg-violet-600 text-white border-violet-600 shadow-md" : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"}`}
                          >
                            {anak.nama}
                          </button>
                        ))}
                      </div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mt-4 mb-2">
                        Catatan Kegiatan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Mewarnai, bernyanyi..."
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 text-slate-900 font-medium transition-all"
                        value={jenisKegiatan}
                        onChange={(e) => setJenisKegiatan(e.target.value)}
                      />
                      <button
                        onClick={simpanKegiatanMassal}
                        className="w-full mt-4 bg-violet-600 text-white font-bold py-4 rounded-2xl hover:bg-violet-700 active:scale-[0.98] transition-all shadow-lg shadow-violet-600/20"
                      >
                        Simpan Laporan
                      </button>
                    </div>
                  )}
                </div>
              )}

              {tabAktif === "pulang" && (
                <div className="space-y-4">
                  <h2 className="font-black text-slate-900 text-xl mb-4">
                    Check-Out
                  </h2>
                  {muridHadir.length === 0 ? (
                    <div className="text-center p-10 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                        <span className="text-3xl">✓</span>
                      </div>
                      <p className="text-slate-600 font-semibold">
                        Semua anak sudah pulang
                      </p>
                    </div>
                  ) : (
                    muridHadir.map((anak) => (
                      <div
                        key={anak.id}
                        className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <img
                            src={anak.foto}
                            alt="Foto"
                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100"
                          />
                          <div className="flex-1">
                            <span className="font-bold text-slate-900 block">
                              {anak.nama}
                            </span>
                            <span className="text-xs text-emerald-600 font-medium">
                              ● Hadir
                            </span>
                          </div>
                        </div>
                        <select
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 mb-3 text-sm"
                          onChange={(e) =>
                            setPenjemput((prev) => ({
                              ...prev,
                              [anak.id]: e.target.value,
                            }))
                          }
                          defaultValue="Orang Tua"
                        >
                          <option>👨‍👩‍👧 Orang Tua</option>
                          <option>👴 Kakek/Nenek</option>
                          <option>👨‍💼 Paman/Bibi</option>
                          <option>🚌 Jemputan</option>
                          <option>📱 Lainnya</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Catatan penjemput..."
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 text-slate-900 text-sm mb-3"
                          onChange={(e) =>
                            setKetPenjemput((prev) => ({
                              ...prev,
                              [anak.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          onClick={() => handlePulang(anak)}
                          className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-black active:scale-[0.98] transition-all shadow-md"
                        >
                          Pulang & Kirim WA
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* FAB Premium */}
            <button
              onClick={() => {
                getaranHalus();
                setBukaSiaran(true);
              }}
              className="absolute bottom-32 right-6 w-14 h-14 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/30 active:scale-95 z-30 transition-all flex items-center justify-center group"
            >
              <svg
                className="w-6 h-6 group-hover:scale-110 transition-transform"
                fill="none"
                viewBox="0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.34 15.84c-.03-.14-.06-.28-.09-.42-.13-.6-.22-1.2-.22-1.82 0-.62.09-1.22.22-1.82.03-.14.06-.28.09-.42M14 10.5c0-1.24-.4-2.37-1.07-3.3M19.5 12c0 4.142-3.358 7.5-7.5 7.5a7.464 7.464 0 01-4.35-1.4L3 19.5v-3.15A7.5 7.5 0 0112 4.5c4.142 0 7.5 3.358 7.5 7.5z"
                />
              </svg>
            </button>

            {bukaSiaran && (
              <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4">
                <div className="bg-white w-full md:max-w-md p-6 rounded-t-[2rem] md:rounded-[2rem] shadow-2xl max-h-[90vh] flex flex-col">
                  <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 md:hidden"></div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-slate-900">
                      Pusat Siaran
                    </h2>
                    <button
                      onClick={() => {
                        getaranHalus();
                        setBukaSiaran(false);
                      }}
                      className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-90 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex gap-2 mb-4">
                    {Object.entries({
                      umum: "Info Umum",
                      spp: "Tagihan",
                      bekal: "Bekal",
                    }).map(([k, v]) => (
                      <button
                        key={k}
                        onClick={() => {
                          getaranHalus();
                          setTipeSiaran(k);
                          setTeksSiaran(
                            TEMPLATE_PESAN[k as keyof typeof TEMPLATE_PESAN],
                          );
                        }}
                        className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${tipeSiaran === k ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="w-full flex-1 min-h-[180px] p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 text-slate-900 resize-none mb-4 text-sm"
                    value={teksSiaran}
                    onChange={(e) => setTeksSiaran(e.target.value)}
                  />
                  <button
                    onClick={handleKirimSiaran}
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black active:scale-[0.98] transition-all shadow-lg"
                  >
                    Kirim ke {muridSemua.length} Orang Tua
                  </button>
                </div>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-6 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent">
              <div className="bg-white border border-slate-200 p-1.5 rounded-2xl shadow-lg flex gap-1.5">
                {[
                  {
                    id: "datang",
                    label: "Tiba",
                    icon: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75",
                  },
                  {
                    id: "kegiatan",
                    label: "Aktivitas",
                    icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
                  },
                  {
                    id: "pulang",
                    label: "Pulang",
                    icon: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0.621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
                  },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      getaranHalus();
                      setTabAktif(t.id);
                    }}
                    className={`flex-1 py-3 rounded-xl flex-col items-center gap-1 transition-all ${tabAktif === t.id ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={t.icon}
                      />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
