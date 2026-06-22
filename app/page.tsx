"use client";
import { useState } from "react";

// --- DATA DUMMY ---
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

// --- TEMPLATE SIARAN (BROADCAST) ---
const TEMPLATE_PESAN = {
  umum: "Syalom Bunda/Ayah,\n\nIni adalah informasi resmi dari TK Tadika Mesra.\n\n[KETIK INFO DI SINI]\n\nKurre sumanga' atas perhatiannya. Tuhan memberkati.",
  spp: "Syalom Bunda/Ayah,\n\nSemoga keluarga dalam keadaan sehat selalu. Tabe', dengan penuh kerendahan hati kami dari administrasi TK Tadika Mesra ingin mengingatkan mengenai administrasi SPP bulan ini yang mungkin terlewat.\n\nJika sudah menyelesaikan administrasi, mohon abaikan pesan ini. Kurre sumanga' atas dukungan Bunda/Ayah yang luar biasa bagi kelancaran operasional sekolah kita. Tuhan memberkati. 🙏",
  bekal:
    "Syalom Bunda,\n\nTabe', demi kenyamanan dan kesehatan ananda selama berkegiatan di sekolah hari ini, mohon kesediaannya untuk membekali ananda dengan:\n\n- Botol minum pribadi\n- [TAMBAHKAN KEBUTUHAN LAIN, CTH: Baju Ganti]\n\nKurre sumanga' atas kerja samanya Bunda! 🎒✨",
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

  // State untuk Pusat Siaran (Broadcast)
  const [bukaSiaran, setBukaSiaran] = useState(false);
  const [tipeSiaran, setTipeSiaran] = useState("umum");
  const [teksSiaran, setTeksSiaran] = useState(TEMPLATE_PESAN.umum);

  const muridSemua =
    kelasAktif === "mawar" ? DATA_KELAS.mawar : DATA_KELAS.melati;
  const muridBelumHadir = muridSemua.filter(
    (anak) => !statusAnak[anak.id] || statusAnak[anak.id] === "belum",
  );
  const muridHadir = muridSemua.filter(
    (anak) => statusAnak[anak.id] === "hadir",
  );

  const getaranHalus = () => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
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

    // Kirim ke semua murid di kelas aktif secara bersamaan
    for (const anak of muridSemua) {
      await kirimWA(anak.hp, `📢 *PENGUMUMAN KELAS*\n\n${teksSiaran}`);
    }
    alert("✅ Siaran berhasil terkirim!");
  };

  const handleDatang = (anak: any) => {
    getaranHalus();
    setStatusAnak((prev) => ({ ...prev, [anak.id]: "hadir" }));
    catatKegiatan(anak.id, "Tiba di sekolah (Check-In)");
    kirimWA(
      anak.hp,
      `🔔 *Notifikasi Kehadiran*\nSyalom Bunda, ananda *${anak.nama}* baru saja tiba di sekolah dan disambut oleh Guru ${namaGuru}.`,
    );
  };

  const simpanKegiatanMassal = () => {
    getaranHalus();
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
    const siapaJemput = penjemput[anak.id] || "Orang Tua";
    const detailJemput = ketPenjemput[anak.id] || "";

    setStatusAnak((prev) => ({ ...prev, [anak.id]: "pulang" }));
    let infoLog = `Pulang (Dijemput: ${siapaJemput}`;
    if (detailJemput) infoLog += ` - ${detailJemput}`;
    infoLog += `)`;
    catatKegiatan(anak.id, infoLog);

    const logHariIni = logKegiatan[anak.id] || [];
    const rangkumanText = logHariIni.join("\n- ");

    const pesanFinal = `📚 *Buku Penghubung Digital*\nHari ini ananda *${anak.nama}* telah selesai berkegiatan.

*Informasi Kepulangan:*
✅ Dijemput oleh: ${siapaJemput}
${detailJemput ? `📝 Keterangan: ${detailJemput}` : ""}

*Rangkuman Aktivitas Hari Ini:*
- ${rangkumanText}

Kurré sumanga', sampai jumpa besok!`;

    kirimWA(anak.hp, pesanFinal);
  };

  // --- TAMPILAN LOGIN & KELAS ---
  if (tampilan === "login") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 font-sans"
        style={{
          backgroundImage: "url('/bg.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {" "}
        <div className="bg-white w-full max-w-md p-8 rounded-[2rem] shadow-xl text-center border-2 border-indigo-100">
          <img
            src="logo-tk.jpeg"
            alt="Logo"
            className="w-28 h-28 mx-auto mb-6 shadow-md rounded-full border-4 border-white"
          />
          <h1 className="text-3xl font-black text-indigo-900 mb-2">
            TK Tadika Mesra
          </h1>
          <p className="text-indigo-400 font-bold mb-8">Portal Guru Digital</p>
          <input
            type="text"
            placeholder="Ketik Nama Guru..."
            className="w-full p-4 bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl mb-6 focus:border-indigo-400 outline-none text-indigo-900 font-bold text-center placeholder-indigo-300"
            value={namaGuru}
            onChange={(e) => setNamaGuru(e.target.value)}
          />
          <button
            onClick={() => {
              getaranHalus();
              namaGuru ? setTampilan("kelas") : alert("Isi nama dulu!");
            }}
            className="w-full bg-indigo-400 text-white font-black py-4 rounded-2xl text-lg border-b-4 border-indigo-500 hover:bg-indigo-500 active:border-b-0 active:translate-y-1 transition-all"
          >
            Masuk Aplikasi
          </button>
        </div>
      </div>
    );
  }

  if (tampilan === "kelas") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 font-sans"
        style={{
          backgroundImage: "url('/bg.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {" "}
        <div className="bg-white w-full max-w-md h-[800px] max-h-screen p-6 rounded-[2rem] shadow-xl overflow-y-auto border-2 border-indigo-100">
          <div className="flex justify-between items-center mb-8 border-b-2 border-indigo-50 pb-4">
            <h2 className="text-2xl font-black text-indigo-900">
              Halo, {namaGuru}!
            </h2>
            <button
              onClick={() => {
                getaranHalus();
                setTampilan("login");
              }}
              className="text-rose-400 font-bold active:scale-95"
            >
              Keluar
            </button>
          </div>
          <h3 className="text-indigo-400 font-bold mb-4">
            Pilih kelas hari ini:
          </h3>
          <div
            onClick={() => {
              getaranHalus();
              setKelasAktif("mawar");
              setTampilan("dashboard");
            }}
            className="bg-rose-100 border-2 border-rose-200 border-b-4 p-6 rounded-3xl mb-4 cursor-pointer hover:bg-rose-200 active:border-b-2 active:translate-y-1 transition-all flex items-center gap-5"
          >
            <div className="text-5xl drop-shadow-md">🌸</div>
            <div>
              <h4 className="text-2xl font-black text-rose-900">Kelas Mawar</h4>
              <p className="text-rose-600 font-bold">3 Murid</p>
            </div>
          </div>
          <div
            onClick={() => {
              getaranHalus();
              setKelasAktif("melati");
              setTampilan("dashboard");
            }}
            className="bg-amber-100 border-2 border-amber-200 border-b-4 p-6 rounded-3xl cursor-pointer hover:bg-amber-200 active:border-b-2 active:translate-y-1 transition-all flex items-center gap-5"
          >
            <div className="text-5xl drop-shadow-md">🌼</div>
            <div>
              <h4 className="text-2xl font-black text-amber-900">
                Kelas Melati
              </h4>
              <p className="text-amber-600 font-bold">3 Murid</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- TAMPILAN DASHBOARD & MODAL SIARAN ---
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 font-sans"
      style={{
        backgroundImage: "url('/bg.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {" "}
      <div className="bg-[#F8FAFC] w-full max-w-md h-screen relative flex flex-col overflow-hidden shadow-2xl">
        {/* HEADER DASHBOARD */}
        <div
          className={`p-5 pt-8 z-10 rounded-b-[2rem] shadow-sm border-b-2 ${kelasAktif === "mawar" ? "bg-rose-100 border-rose-200" : "bg-amber-100 border-amber-200"}`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="text-4xl drop-shadow-sm">
                {kelasAktif === "mawar" ? "🌸" : "🌼"}
              </div>
              <div>
                <h1
                  className={`text-xl font-black ${kelasAktif === "mawar" ? "text-rose-900" : "text-amber-900"}`}
                >
                  Kelas {kelasAktif === "mawar" ? "Mawar" : "Melati"}
                </h1>
                <p
                  className={`font-bold text-sm ${kelasAktif === "mawar" ? "text-rose-600" : "text-amber-600"}`}
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
              className={`px-4 py-2 rounded-xl text-sm font-black border-b-4 active:border-b-0 active:translate-y-1 transition-all ${kelasAktif === "mawar" ? "bg-rose-300 text-rose-900 border-rose-400" : "bg-amber-300 text-amber-900 border-amber-400"}`}
            >
              Kembali
            </button>
          </div>
        </div>

        {/* AREA KONTEN TENGAH */}
        <div className="flex-1 overflow-y-auto p-5 pb-32">
          {tabAktif === "datang" && (
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-4">
                <h2 className="font-black text-indigo-900 text-xl">
                  Check-In Pagi
                </h2>
                <span className="bg-teal-100 text-teal-800 text-xs font-black px-3 py-1 rounded-full">
                  Belum: {muridBelumHadir.length}
                </span>
              </div>
              {muridBelumHadir.length === 0 ? (
                <div className="text-center p-8 bg-teal-50 rounded-[2rem] border-2 border-teal-100 shadow-sm">
                  <div className="text-5xl mb-4">✨</div>
                  <h3 className="font-black text-teal-800 text-xl">
                    Luar Biasa!
                  </h3>
                  <p className="text-teal-600 font-bold">
                    Semua anak sudah hadir hari ini.
                  </p>
                </div>
              ) : (
                muridBelumHadir.map((anak) => (
                  <div
                    key={anak.id}
                    className="bg-white p-4 rounded-3xl shadow-sm border-2 border-indigo-50 flex items-center justify-between mb-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={anak.foto}
                        alt="Foto"
                        className="w-14 h-14 rounded-full object-cover border-4 border-indigo-50 shadow-sm"
                      />
                      <span className="font-black text-indigo-900 text-xl">
                        {anak.nama}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDatang(anak)}
                      className="bg-emerald-300 text-emerald-900 border-b-4 border-emerald-400 font-black px-6 py-3 rounded-2xl active:border-b-0 active:translate-y-1 transition-all"
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
              <h2 className="font-black text-indigo-900 text-xl mb-4">
                Aktivitas Kelas
              </h2>
              {muridHadir.length === 0 ? (
                <div className="text-center p-8 bg-orange-50 rounded-[2rem] border-2 border-orange-100 shadow-sm">
                  <div className="text-5xl mb-4">🧸</div>
                  <p className="text-orange-800 font-black text-lg">
                    Check-in anak terlebih dahulu di menu 🚪.
                  </p>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border-2 border-indigo-50">
                  <label className="block text-sm font-black text-indigo-900 mb-3">
                    1. Anak yang Ikut:
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                    <button
                      onClick={() => {
                        getaranHalus();
                        setPilihanAnak(muridHadir.map((m) => m.id));
                      }}
                      className="bg-indigo-100 text-indigo-800 px-5 py-2 rounded-2xl font-black whitespace-nowrap border-b-4 border-indigo-200 active:border-b-0 active:translate-y-1 transition-all"
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
                        className={`px-5 py-2 rounded-2xl font-black whitespace-nowrap border-b-4 transition-all active:border-b-0 active:translate-y-1 ${pilihanAnak.includes(anak.id) ? "bg-violet-400 text-white border-violet-500" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                      >
                        {anak.nama}
                      </button>
                    ))}
                  </div>
                  <label className="block text-sm font-black text-indigo-900 mt-2 mb-2">
                    2. Jenis Kegiatan:
                  </label>
                  <input
                    type="text"
                    placeholder="Ketik aktivitas..."
                    className="w-full p-4 bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl mb-4 outline-none focus:border-indigo-400 text-indigo-900 font-bold"
                    value={jenisKegiatan}
                    onChange={(e) => setJenisKegiatan(e.target.value)}
                  />
                  <label className="block text-sm font-black text-indigo-900 mb-2">
                    3. Kamera (Opsional):
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="block w-full text-sm text-indigo-800 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:font-black file:bg-violet-100 file:text-violet-800 hover:file:bg-violet-200 mb-6 cursor-pointer"
                  />
                  <button
                    onClick={simpanKegiatanMassal}
                    className="w-full bg-violet-400 text-white font-black py-4 rounded-2xl border-b-4 border-violet-500 active:border-b-0 active:translate-y-1 transition-all text-lg"
                  >
                    Simpan Laporan
                  </button>
                </div>
              )}
            </div>
          )}

          {tabAktif === "pulang" && (
            <div className="space-y-4">
              <h2 className="font-black text-indigo-900 text-xl mb-4">
                Check-Out & Info Jemput
              </h2>
              {muridHadir.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-[2rem] border-2 border-gray-200 shadow-sm">
                  <div className="text-5xl mb-4">🏡</div>
                  <p className="text-gray-500 font-black text-lg">
                    Semua anak sudah dijemput.
                  </p>
                </div>
              ) : (
                muridHadir.map((anak) => (
                  <div
                    key={anak.id}
                    className="bg-white p-5 rounded-[2rem] shadow-sm border-2 border-indigo-50 mb-6"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={anak.foto}
                        alt="Foto"
                        className="w-14 h-14 rounded-full object-cover border-4 border-indigo-50 shadow-sm"
                      />
                      <span className="font-black text-indigo-900 text-xl">
                        {anak.nama}
                      </span>
                    </div>
                    <div className="bg-amber-50 border-2 border-amber-100 p-4 rounded-2xl mb-5 text-sm text-amber-900 h-28 overflow-y-auto">
                      <strong className="font-black">Rekap Hari Ini:</strong>
                      <br />
                      <div className="mt-2 font-bold opacity-80 leading-relaxed">
                        {logKegiatan[anak.id]?.map((log, i) => (
                          <div key={i}>• {log}</div>
                        )) || "Belum ada catatan."}
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-black text-indigo-400 uppercase tracking-wider">
                        Status Jemputan
                      </label>
                      <select
                        className="w-full p-4 bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl text-indigo-900 font-black outline-none focus:border-indigo-400 appearance-none"
                        onChange={(e) =>
                          setPenjemput((prev) => ({
                            ...prev,
                            [anak.id]: e.target.value,
                          }))
                        }
                        defaultValue="Orang Tua"
                      >
                        <option value="Orang Tua">
                          👨‍👩‍👦 Dijemput Ayah / Ibu
                        </option>
                        <option value="Kakek/Nenek">
                          👴 Dijemput Kakek / Nenek
                        </option>
                        <option value="Paman/Bibi">
                          👨‍💼 Dijemput Paman / Bibi
                        </option>
                        <option value="Jemputan Sekolah">
                          🚌 Naik Jemputan Sekolah
                        </option>
                        <option value="Orang Lain">
                          ⚠️ Orang Lain / Ojek Online
                        </option>
                      </select>
                      <input
                        type="text"
                        placeholder="Keterangan (Cth: Plat B 1234)..."
                        className="w-full p-4 bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl outline-none focus:border-indigo-400 text-indigo-900 font-bold placeholder-indigo-300"
                        onChange={(e) =>
                          setKetPenjemput((prev) => ({
                            ...prev,
                            [anak.id]: e.target.value,
                          }))
                        }
                      />
                      <button
                        onClick={() => handlePulang(anak)}
                        className="w-full mt-2 bg-rose-400 text-white font-black py-4 rounded-2xl border-b-4 border-rose-500 active:border-b-0 active:translate-y-1 transition-all text-lg flex items-center justify-center gap-2"
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

        {/* --- TOMBOL MENGAPUNG (FAB) PUSAT SIARAN --- */}
        <button
          onClick={() => {
            getaranHalus();
            setBukaSiaran(true);
          }}
          className="absolute bottom-28 right-6 bg-sky-400 text-white p-4 rounded-full shadow-[0_10px_25px_-5px_rgba(56,189,248,0.5)] border-b-4 border-sky-500 active:border-b-0 active:translate-y-1 z-30 transition-all flex items-center justify-center"
        >
          <span className="text-3xl">📢</span>
        </button>

        {/* --- MODAL PUSAT SIARAN (BLUR OVERLAY) --- */}
        {bukaSiaran && (
          <div className="absolute inset-0 z-50 bg-indigo-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full p-6 rounded-[2rem] shadow-2xl border-4 border-sky-100 flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-indigo-900 flex items-center gap-2">
                  <span>📢</span> Pusat Siaran
                </h2>
                <button
                  onClick={() => {
                    getaranHalus();
                    setBukaSiaran(false);
                  }}
                  className="bg-gray-100 text-gray-500 p-2 rounded-full font-black active:scale-95"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-4 mb-2 custom-scrollbar">
                <button
                  onClick={() => {
                    getaranHalus();
                    setTipeSiaran("umum");
                    setTeksSiaran(TEMPLATE_PESAN.umum);
                  }}
                  className={`px-4 py-2 rounded-xl font-black whitespace-nowrap border-b-4 transition-all ${tipeSiaran === "umum" ? "bg-sky-400 text-white border-sky-500" : "bg-gray-100 text-gray-500 border-gray-200"}`}
                >
                  Info Umum
                </button>
                <button
                  onClick={() => {
                    getaranHalus();
                    setTipeSiaran("spp");
                    setTeksSiaran(TEMPLATE_PESAN.spp);
                  }}
                  className={`px-4 py-2 rounded-xl font-black whitespace-nowrap border-b-4 transition-all ${tipeSiaran === "spp" ? "bg-amber-400 text-amber-900 border-amber-500" : "bg-gray-100 text-gray-500 border-gray-200"}`}
                >
                  Tagihan SPP
                </button>
                <button
                  onClick={() => {
                    getaranHalus();
                    setTipeSiaran("bekal");
                    setTeksSiaran(TEMPLATE_PESAN.bekal);
                  }}
                  className={`px-4 py-2 rounded-xl font-black whitespace-nowrap border-b-4 transition-all ${tipeSiaran === "bekal" ? "bg-emerald-400 text-emerald-900 border-emerald-500" : "bg-gray-100 text-gray-500 border-gray-200"}`}
                >
                  Kebutuhan Anak
                </button>
              </div>

              <textarea
                className="w-full flex-1 min-h-[200px] p-4 bg-sky-50/50 border-2 border-sky-100 rounded-2xl outline-none focus:border-sky-400 text-indigo-900 font-bold resize-none mb-6"
                value={teksSiaran}
                onChange={(e) => setTeksSiaran(e.target.value)}
              />

              <button
                onClick={handleKirimSiaran}
                className="w-full bg-sky-400 text-white font-black py-4 rounded-2xl border-b-4 border-sky-500 active:border-b-0 active:translate-y-1 transition-all text-lg shadow-lg"
              >
                Kirim Siaran ke {muridSemua.length} Orang Tua
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM NAVIGATION (Gaya Mengapung 3D) */}
        <div className="absolute bottom-6 left-6 right-6 z-20">
          <div className="bg-white/90 backdrop-blur-md border-2 border-indigo-50 p-2 rounded-3xl shadow-xl flex justify-between gap-2">
            <button
              onClick={() => {
                getaranHalus();
                setTabAktif("datang");
              }}
              className={`flex-1 py-3 rounded-2xl flex flex-col items-center transition-all ${tabAktif === "datang" ? "bg-emerald-100 text-emerald-800 scale-100" : "text-indigo-300 scale-95 hover:text-indigo-400"}`}
            >
              <span className="text-2xl mb-1">🚪</span>
              <span className="text-[10px] font-black uppercase tracking-wider">
                Tiba
              </span>
            </button>
            <button
              onClick={() => {
                getaranHalus();
                setTabAktif("kegiatan");
              }}
              className={`flex-1 py-3 rounded-2xl flex flex-col items-center transition-all ${tabAktif === "kegiatan" ? "bg-violet-100 text-violet-800 scale-100" : "text-indigo-300 scale-95 hover:text-indigo-400"}`}
            >
              <span className="text-2xl mb-1">🎨</span>
              <span className="text-[10px] font-black uppercase tracking-wider">
                Aktivitas
              </span>
            </button>
            <button
              onClick={() => {
                getaranHalus();
                setTabAktif("pulang");
              }}
              className={`flex-1 py-3 rounded-2xl flex flex-col items-center transition-all ${tabAktif === "pulang" ? "bg-rose-100 text-rose-800 scale-100" : "text-indigo-300 scale-95 hover:text-indigo-400"}`}
            >
              <span className="text-2xl mb-1">🏡</span>
              <span className="text-[10px] font-black uppercase tracking-wider">
                Pulang
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
