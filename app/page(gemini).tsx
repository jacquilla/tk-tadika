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
              <img
                src="logo-tk.jpeg"
                alt="Logo"
                className="w-28 h-28 mx-auto mb-6 shadow-md rounded-full border-4 border-white object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://ui-avatars.com/api/?name=TK&background=C7D2FE&color=3730A3&rounded=true&size=128";
                }}
              />
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
                className="bg-rose-100 border-2 border-rose-200 border-b-4 p-6 rounded-3xl mb-4 cursor-pointer hover:bg-rose-200 active:border-b-0 active:translate-y-1 active:scale-[0.98] transition-all flex items-center gap-5 shadow-sm"
              >
                <div className="text-5xl">🌸</div>
                <div>
                  <h4 className="text-2xl font-black text-rose-900">
                    Kelas Mawar
                  </h4>
                  <p className="text-rose-700 font-bold">3 Murid</p>
                </div>
              </div>
              <div
                onClick={() => {
                  getaranHalus();
                  setKelasAktif("melati");
                  setTampilan("dashboard");
                }}
                className="bg-amber-100 border-2 border-amber-200 border-b-4 p-6 rounded-3xl cursor-pointer hover:bg-amber-200 active:border-b-0 active:translate-y-1 active:scale-[0.98] transition-all flex items-center gap-5 shadow-sm"
              >
                <div className="text-5xl">🌼</div>
                <div>
                  <h4 className="text-2xl font-black text-amber-900">
                    Kelas Melati
                  </h4>
                  <p className="text-amber-700 font-bold">3 Murid</p>
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
              className={`p-5 pt-8 z-10 shadow-sm border-b-2 ${kelasAktif === "mawar" ? "bg-rose-100 border-rose-200" : "bg-amber-100 border-amber-200"}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">
                    {kelasAktif === "mawar" ? "🌸" : "🌼"}
                  </div>
                  <div>
                    <h1
                      className={`text-xl font-black ${kelasAktif === "mawar" ? "text-rose-900" : "text-amber-900"}`}
                    >
                      Kelas {kelasAktif === "mawar" ? "Mawar" : "Melati"}
                    </h1>
                    <p
                      className={`font-bold text-sm ${kelasAktif === "mawar" ? "text-rose-700" : "text-amber-700"}`}
                    >
                      Guru: {namaGuru}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    getaranHalus();
                    setTampilan("kelas");
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-black border-b-4 active:border-b-0 active:translate-y-1 transition-all shadow ${kelasAktif === "mawar" ? "bg-rose-500 text-white border-rose-700 hover:bg-rose-600" : "bg-amber-500 text-white border-amber-700 hover:bg-amber-600"}`}
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
                    <span className="bg-teal-500 text-white text-xs font-black px-3 py-1 rounded-full shadow">
                      Belum: {muridBelumHadir.length}
                    </span>
                  </div>
                  {muridBelumHadir.length === 0 ? (
                    <div className="text-center p-8 bg-teal-50 rounded-[2rem] border-2 border-teal-200 shadow-sm">
                      <div className="text-5xl mb-4 animate-bounce">✨</div>
                      <h3 className="font-black text-teal-800 text-xl">
                        Luar Biasa!
                      </h3>
                      <p className="text-teal-700 font-bold">
                        Semua anak sudah hadir hari ini.
                      </p>
                    </div>
                  ) : (
                    muridBelumHadir.map((anak) => (
                      <div
                        key={anak.id}
                        className="bg-white p-4 rounded-3xl shadow-md border-2 border-slate-100 flex items-center justify-between mb-4 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={anak.foto}
                            alt="Foto"
                            className="w-14 h-14 rounded-full object-cover border-4 border-slate-100 shadow-sm"
                          />
                          <span className="font-black text-slate-900 text-xl">
                            {anak.nama}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDatang(anak)}
                          className="bg-emerald-500 text-white border-b-4 border-emerald-700 hover:bg-emerald-600 font-black px-7 py-3 rounded-2xl active:border-b-0 active:translate-y-1 transition-all shadow-md"
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
                    <div className="text-center p-8 bg-orange-50 rounded-[2rem] border-2 border-orange-200 shadow-sm">
                      <div className="text-5xl mb-4">🧸</div>
                      <p className="text-orange-800 font-black text-lg">
                        Check-in anak terlebih dahulu di menu 🚪.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-[2rem] shadow-md border-2 border-slate-100">
                      <label className="block text-sm font-black text-slate-800 mb-3">
                        1. Anak yang Ikut:
                      </label>
                      <div className="flex gap-2 overflow-x-auto pb-4">
                        <button
                          onClick={() => {
                            getaranHalus();
                            setPilihanAnak(muridHadir.map((m) => m.id));
                          }}
                          className="bg-slate-800 text-white px-5 py-2 rounded-2xl font-black whitespace-nowrap border-b-4 border-black hover:bg-black active:border-b-0 active:translate-y-1 transition-all"
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
                            className={`px-5 py-2 rounded-2xl font-black whitespace-nowrap border-b-4 transition-all active:border-b-0 active:translate-y-1 ${pilihanAnak.includes(anak.id) ? "bg-violet-500 text-white border-violet-700 shadow-md scale-105" : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"}`}
                          >
                            {anak.nama}
                          </button>
                        ))}
                      </div>
                      <label className="block text-sm font-black text-slate-800 mt-2 mb-2">
                        2. Jenis Kegiatan:
                      </label>
                      <input
                        type="text"
                        placeholder="Ketik aktivitas..."
                        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl mb-4 outline-none focus:border-violet-500 text-slate-900 font-bold text-lg"
                        value={jenisKegiatan}
                        onChange={(e) => setJenisKegiatan(e.target.value)}
                      />
                      <label className="block text-sm font-black text-slate-800 mb-2">
                        3. Kamera (Opsional):
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="block w-full text-sm text-slate-700 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:font-black file:bg-violet-100 file:text-violet-800 hover:file:bg-violet-200 mb-6 cursor-pointer"
                      />
                      <button
                        onClick={simpanKegiatanMassal}
                        className="w-full bg-violet-500 text-white font-black py-4 rounded-2xl border-b-4 border-violet-700 hover:bg-violet-600 active:border-b-0 active:translate-y-1 transition-all text-lg shadow-lg"
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
                    Check-Out & Info Jemput
                  </h2>
                  {muridHadir.length === 0 ? (
                    <div className="text-center p-8 bg-gray-50 rounded-[2rem] border-2 border-gray-200 shadow-sm">
                      <div className="text-5xl mb-4">🏡</div>
                      <p className="text-gray-600 font-black text-lg">
                        Semua anak sudah dijemput.
                      </p>
                    </div>
                  ) : (
                    muridHadir.map((anak) => (
                      <div
                        key={anak.id}
                        className="bg-white p-5 rounded-[2rem] shadow-md border-2 border-slate-100 mb-6"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <img
                            src={anak.foto}
                            alt="Foto"
                            className="w-14 h-14 rounded-full object-cover border-4 border-slate-100 shadow-sm"
                          />
                          <span className="font-black text-slate-900 text-xl">
                            {anak.nama}
                          </span>
                        </div>
                        <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl mb-5 text-sm text-amber-900 h-32 overflow-y-auto">
                          <strong className="font-black">
                            Rekap Hari Ini:
                          </strong>
                          <div className="mt-2 font-bold opacity-90 leading-relaxed space-y-1">
                            {logKegiatan[anak.id]?.map((log, i) => (
                              <div
                                key={i}
                                className="bg-white/70 p-2 rounded-lg"
                              >
                                ✅ {log}
                              </div>
                            )) || "Belum ada catatan."}
                          </div>
                        </div>
                        <div className="flex flex-col gap-3">
                          <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                            Status Jemputan
                          </label>
                          <select
                            className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 font-black outline-none focus:border-rose-400 text-base"
                            onChange={(e) =>
                              setPenjemput((prev) => ({
                                ...prev,
                                [anak.id]: e.target.value,
                              }))
                            }
                            defaultValue="Orang Tua"
                          >
                            <option value="Orang Tua">
                              👨👩👦 Dijemput Ayah / Ibu
                            </option>
                            <option value="Kakek/Nenek">
                              👴 Dijemput Kakek / Nenek
                            </option>
                            <option value="Paman/Bibi">
                              👨💼 Dijemput Paman / Bibi
                            </option>
                            <option value="Jemputan Sekolah">
                              🚌 Naik Jemputan Sekolah
                            </option>
                            <option value="Orang Lain">
                              ⚠ Orang Lain / Ojek Online
                            </option>
                          </select>
                          <input
                            type="text"
                            placeholder="Keterangan (Cth: Plat B 1234)..."
                            className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-rose-400 text-slate-900 font-bold"
                            onChange={(e) =>
                              setKetPenjemput((prev) => ({
                                ...prev,
                                [anak.id]: e.target.value,
                              }))
                            }
                          />
                          <button
                            onClick={() => handlePulang(anak)}
                            className="w-full mt-2 bg-rose-500 text-white font-black py-4 rounded-2xl border-b-4 border-rose-700 hover:bg-rose-600 active:border-b-0 active:translate-y-1 transition-all text-lg flex items-center justify-center gap-2 shadow-lg"
                          >
                            <span>Pulang & Kirim WA</span>
                            <span className="text-2xl">🚀</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                getaranHalus();
                setBukaSiaran(true);
              }}
              className="absolute bottom-32 right-6 bg-sky-500 text-white p-5 rounded-full shadow-xl border-b-4 border-sky-700 hover:bg-sky-600 active:border-b-0 active:translate-y-1 z-30 transition-all animate-pulse hover:animate-none"
            >
              <span className="text-3xl">📢</span>
            </button>

            {bukaSiaran && (
              <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full p-6 rounded-[2rem] shadow-2xl border-4 border-sky-100 flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                      <span>📢</span> Pusat Siaran
                    </h2>
                    <button
                      onClick={() => {
                        getaranHalus();
                        setBukaSiaran(false);
                      }}
                      className="bg-gray-100 text-gray-600 p-2 rounded-full font-black hover:bg-gray-200 active:scale-95"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
                    <button
                      onClick={() => {
                        getaranHalus();
                        setTipeSiaran("umum");
                        setTeksSiaran(TEMPLATE_PESAN.umum);
                      }}
                      className={`px-4 py-2 rounded-xl font-black whitespace-nowrap border-b-4 transition-all active:border-b-0 active:translate-y-1 ${tipeSiaran === "umum" ? "bg-sky-500 text-white border-sky-700" : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"}`}
                    >
                      Info Umum
                    </button>
                    <button
                      onClick={() => {
                        getaranHalus();
                        setTipeSiaran("spp");
                        setTeksSiaran(TEMPLATE_PESAN.spp);
                      }}
                      className={`px-4 py-2 rounded-xl font-black whitespace-nowrap border-b-4 transition-all active:border-b-0 active:translate-y-1 ${tipeSiaran === "spp" ? "bg-amber-500 text-white border-amber-700" : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"}`}
                    >
                      Tagihan SPP
                    </button>
                    <button
                      onClick={() => {
                        getaranHalus();
                        setTipeSiaran("bekal");
                        setTeksSiaran(TEMPLATE_PESAN.bekal);
                      }}
                      className={`px-4 py-2 rounded-xl font-black whitespace-nowrap border-b-4 transition-all active:border-b-0 active:translate-y-1 ${tipeSiaran === "bekal" ? "bg-emerald-500 text-white border-emerald-700" : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"}`}
                    >
                      Kebutuhan Anak
                    </button>
                  </div>
                  <textarea
                    className="w-full flex-1 min-h-[200px] p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-sky-500 text-slate-900 font-bold resize-none mb-6 text-base"
                    value={teksSiaran}
                    onChange={(e) => setTeksSiaran(e.target.value)}
                  />
                  <button
                    onClick={handleKirimSiaran}
                    className="w-full bg-sky-500 text-white font-black py-4 rounded-2xl border-b-4 border-sky-700 hover:bg-sky-600 active:border-b-0 active:translate-y-1 transition-all text-lg shadow-lg"
                  >
                    Kirim Siaran ke {muridSemua.length} Orang Tua
                  </button>
                </div>
              </div>
            )}

            <div className="absolute bottom-6 left-6 right-6 z-20">
              <div className="bg-white/95 backdrop-blur-lg border-2 border-slate-200 p-2 rounded-3xl shadow-xl flex justify-between gap-2">
                <button
                  onClick={() => {
                    getaranHalus();
                    setTabAktif("datang");
                  }}
                  className={`flex-1 py-3 rounded-2xl flex flex-col items-center transition-all ${tabAktif === "datang" ? "bg-emerald-500 text-white scale-105 shadow-lg" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
                >
                  <span className="text-2xl mb-1">🚪</span>
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    Tiba
                  </span>
                </button>
                <button
                  onClick={() => {
                    getaranHalus();
                    setTabAktif("kegiatan");
                  }}
                  className={`flex-1 py-3 rounded-2xl flex flex-col items-center transition-all ${tabAktif === "kegiatan" ? "bg-violet-500 text-white scale-105 shadow-lg" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
                >
                  <span className="text-2xl mb-1">🎨</span>
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    Aktivitas
                  </span>
                </button>
                <button
                  onClick={() => {
                    getaranHalus();
                    setTabAktif("pulang");
                  }}
                  className={`flex-1 py-3 rounded-2xl flex flex-col items-center transition-all ${tabAktif === "pulang" ? "bg-rose-500 text-white scale-105 shadow-lg" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
                >
                  <span className="text-2xl mb-1">🏡</span>
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    Pulang
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
