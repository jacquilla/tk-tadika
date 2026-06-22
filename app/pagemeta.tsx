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

const IconBadge = ({
  children,
  from,
  to,
  size = "w-14 h-14",
  text = "text-3xl",
}: {
  children: React.ReactNode;
  from: string;
  to: string;
  size?: string;
  text?: string;
}) => (
  <div
    className={`${size} rounded-2xl bg-gradient-to-br ${from} ${to} flex items-center justify-center shadow-lg ring-1 ring-white/20`}
  >
    <span className={`${text} drop-shadow`}>{children}</span>
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
      navigator.vibrate(30);
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
      g.gain.value = 0.04;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.06);
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
    } catch {}
  };
  const handleKirimSiaran = async () => {
    getaranHalus();
    if (!teksSiaran) return;
    setBukaSiaran(false);
    for (const anak of muridSemua) {
      await kirimWA(anak.hp, `📢 *PENGUMUMAN KELAS*\n\n${teksSiaran}`);
    }
  };
  const handleDatang = (anak: any) => {
    getaranHalus();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 700);
    setStatusAnak((p) => ({ ...p, [anak.id]: "hadir" }));
    catatKegiatan(anak.id, "Tiba di sekolah dengan ceria (Check-In)");
    kirimWA(
      anak.hp,
      `🔔 *Notifikasi Kehadiran*\nSyalom Bunda, ananda *${anak.nama}* baru saja tiba di sekolah dan disambut oleh Guru ${namaGuru}. Semoga harinya menyenangkan!`,
    );
  };
  const simpanKegiatanMassal = () => {
    getaranHalus();
    if (!pilihanAnak.length || !jenisKegiatan) return;
    pilihanAnak.forEach((id) => catatKegiatan(id, jenisKegiatan));
    setPilihanAnak([]);
    setJenisKegiatan("");
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 700);
  };
  const handlePulang = (anak: any) => {
    getaranHalus();
    const siapa = penjemput[anak.id] || "Orang Tua";
    const detail = ketPenjemput[anak.id] || "";
    setStatusAnak((p) => ({ ...p, [anak.id]: "pulang" }));
    catatKegiatan(
      anak.id,
      `Pulang (Dijemput: ${siapa}${detail ? ` - ${detail}` : ""})`,
    );
    const rangkuman = (logKegiatan[anak.id] || []).join("\n- ");
    kirimWA(
      anak.hp,
      `📖 *Buku Penghubung Digital*\nAnanda *${anak.nama}* pulang dijemput ${siapa}. Catatan: ${rangkuman}`,
    );
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] flex justify-center bg-slate-950 touch-manipulation select-none"
      style={{
        backgroundImage: "url('/bg.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

      {/* MOBILE CENTERED CONTAINER */}
      <div className="relative w-full max-w-[420px] h-[100dvh] bg-[#F8FAFC] flex flex-col overflow-hidden shadow-2xl">
        {tampilan === "login" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-sm">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-600/20">
                <span className="text-4xl">🏫</span>
              </div>
              <h1 className="text-[32px] font-black text-center text-slate-900 tracking-tight">
                TK Tadika Mesra
              </h1>
              <p className="text-center text-slate-500 font-medium mt-1 mb-10">
                Portal Guru
              </p>

              <input
                type="text"
                placeholder="Nama Guru"
                value={namaGuru}
                onChange={(e) => setNamaGuru(e.target.value)}
                className="w-full h-[56px] px-5 bg-white border-2 border-slate-200 rounded-2xl focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10 text-[17px] font-medium text-center transition-all"
              />

              <button
                onClick={() => {
                  getaranHalus();
                  namaGuru && setTampilan("kelas");
                }}
                className="w-full h-[56px] mt-4 bg-slate-900 text-white font-bold rounded-2xl active:scale-[0.97] will-change-transform transition-transform text-[17px] shadow-lg shadow-slate-900/20"
              >
                Masuk
              </button>
            </div>
          </div>
        )}

        {tampilan === "kelas" && (
          <div className="flex-1 flex flex-col p-5 pt-12">
            <h2 className="text-[28px] font-black text-slate-900 text-center">
              Halo, {namaGuru}!
            </h2>
            <p className="text-center text-slate-500 mt-1 mb-8">
              Pilih kelas hari ini
            </p>

            <div className="space-y-3">
              {[
                {
                  k: "mawar",
                  n: "Kelas Mawar",
                  s: "3 Murid",
                  c: "from-rose-500 to-pink-600",
                  e: "🌸",
                },
                {
                  k: "melati",
                  n: "Kelas Melati",
                  s: "3 Murid",
                  c: "from-amber-500 to-orange-600",
                  e: "🌼",
                },
              ].map((kls) => (
                <button
                  key={kls.k}
                  onClick={() => {
                    getaranHalus();
                    setKelasAktif(kls.k);
                    setTampilan("dashboard");
                  }}
                  className="w-full h-[84px] bg-white rounded-3xl border border-slate-200 active:scale-[0.98] will-change-transform transition-transform flex items-center px-5 gap-4 shadow-sm"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${kls.c} flex items-center justify-center shadow-md`}
                  >
                    <span className="text-2xl">{kls.e}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-[18px] text-slate-900">
                      {kls.n}
                    </div>
                    <div className="text-[14px] text-slate-500">{kls.s}</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="text-slate-400">›</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tampilan === "dashboard" && (
          <>
            {showConfetti && (
              <div className="pointer-events-none absolute inset-0 z-50 flex items-start justify-center pt-20">
                <div className="text-3xl animate-[bounce_0.7s_ease-out]">
                  ✨
                </div>
              </div>
            )}

            {/* HEADER - centered */}
            <div className="px-5 pt-12 pb-4 bg-white border-b border-slate-100">
              <div className="flex items-center justify-center gap-3">
                <IconBadge
                  from={
                    kelasAktif === "mawar" ? "from-rose-500" : "from-amber-500"
                  }
                  to={kelasAktif === "mawar" ? "to-pink-600" : "to-orange-600"}
                  size="w-11 h-11"
                  text="text-xl"
                >
                  {kelasAktif === "mawar" ? "🌸" : "🌼"}
                </IconBadge>
                <div className="text-center">
                  <h1 className="font-black text-[20px] leading-none text-slate-900">
                    Kelas {kelasAktif === "mawar" ? "Mawar" : "Melati"}
                  </h1>
                  <p className="text-[13px] text-slate-500 mt-0.5">
                    {namaGuru}
                  </p>
                </div>
              </div>
            </div>

            {/* CONTENT - scroll smooth mobile */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-4 pb-28"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {tabAktif === "datang" && (
                <div className="pt-4 space-y-3">
                  {muridBelumHadir.map((anak) => (
                    <div
                      key={anak.id}
                      className="bg-white rounded-[20px] p-4 flex items-center gap-4 shadow-sm border border-slate-100 active:scale-[0.99] will-change-transform transition-transform"
                    >
                      <img
                        src={anak.foto}
                        className="w-14 h-14 rounded-2xl object-cover"
                        alt=""
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[17px] truncate text-slate-900">
                          {anak.nama}
                        </div>
                        <div className="text-[13px] text-slate-500">
                          Belum check-in
                        </div>
                      </div>
                      <button
                        onClick={() => handleDatang(anak)}
                        className="h-12 px-6 bg-emerald-500 text-white font-bold rounded-xl active:scale-95 will-change-transform transition-transform text-[15px] shrink-0"
                      >
                        Tiba
                      </button>
                    </div>
                  ))}
                  {muridBelumHadir.length === 0 && (
                    <div className="text-center py-16">
                      <div className="text-5xl mb-3">✓</div>
                      <div className="font-bold text-slate-900">
                        Semua hadir
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tabAktif === "kegiatan" && (
                <div className="pt-4">
                  <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                    <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-2 no-scrollbar">
                      {muridHadir.map((a) => (
                        <button
                          key={a.id}
                          onClick={() =>
                            setPilihanAnak((p) =>
                              p.includes(a.id)
                                ? p.filter((x) => x !== a.id)
                                : [...p, a.id],
                            )
                          }
                          className={`h-10 px-4 rounded-xl font-semibold text-[14px] whitespace-nowrap active:scale-95 will-change-transform transition-all border ${pilihanAnak.includes(a.id) ? "bg-violet-600 text-white border-violet-600" : "bg-slate-100 text-slate-700 border-transparent"}`}
                        >
                          {a.nama}
                        </button>
                      ))}
                    </div>
                    <input
                      value={jenisKegiatan}
                      onChange={(e) => setJenisKegiatan(e.target.value)}
                      placeholder="Tulis kegiatan..."
                      className="w-full h-[52px] mt-4 px-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-violet-500 focus:outline-none text-[16px]"
                    />
                    <button
                      onClick={simpanKegiatanMassal}
                      className="w-full h-[52px] mt-3 bg-violet-600 text-white font-bold rounded-xl active:scale-[0.98] will-change-transform transition-transform"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              )}

              {tabAktif === "pulang" && (
                <div className="pt-4 space-y-3">
                  {muridHadir.map((anak) => (
                    <div
                      key={anak.id}
                      className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-100"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={anak.foto}
                          className="w-12 h-12 rounded-xl object-cover"
                          alt=""
                        />
                        <div className="font-bold text-[16px] flex-1">
                          {anak.nama}
                        </div>
                      </div>
                      <select
                        onChange={(e) =>
                          setPenjemput((p) => ({
                            ...p,
                            [anak.id]: e.target.value,
                          }))
                        }
                        className="w-full h-[48px] px-3 bg-slate-50 rounded-xl border-slate-200 text-[15px] mb-2 focus:outline-none"
                      >
                        <option>Orang Tua</option>
                        <option>Kakek/Nenek</option>
                        <option>Jemputan</option>
                      </select>
                      <button
                        onClick={() => handlePulang(anak)}
                        className="w-full h-[48px] bg-slate-900 text-white font-bold rounded-xl active:scale-[0.98] will-change-transform transition-transform text-[15px]"
                      >
                        Pulang
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FAB - thumb zone */}
            <button
              onClick={() => {
                getaranHalus();
                setBukaSiaran(true);
              }}
              className="absolute bottom-[88px] right-5 w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-xl active:scale-90 will-change-transform transition-transform flex items-center justify-center z-30"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 11l18-5v12L3 14v-3z M11.6 16.8a3 3 0 1 1-5.2-2.9" />
              </svg>
            </button>

            {/* BOTTOM NAV - mobile centered */}
            <div className="absolute bottom-0 left-0 right-0 pb-[max(12px,env(safe-area-inset-bottom))] px-4 pt-3 bg-gradient-to-t from-white via-white to-white/80 backdrop-blur-xl border-t border-slate-100">
              <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
                {[
                  {
                    id: "datang",
                    l: "Tiba",
                    d: "M15 15l-3-3m0 0l-3 3m3-3v12M5 5h14",
                  },
                  {
                    id: "kegiatan",
                    l: "Aktivitas",
                    d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
                  },
                  {
                    id: "pulang",
                    l: "Pulang",
                    d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
                  },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      getaranHalus();
                      setTabAktif(t.id);
                    }}
                    className={`h-[60px] rounded-2xl flex-col items-center justify-center gap-1 active:scale-95 will-change-transform transition-all ${tabAktif === t.id ? "bg-slate-900 text-white shadow-md" : "text-slate-500"}`}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 24 24"
                      stroke="currentColor"
                      strokeWidth={tabAktif === t.id ? 2.2 : 1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={t.d}
                      />
                    </svg>
                    <span className="text-[11px] font-semibold tracking-wide">
                      {t.l}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* SIARAN SHEET */}
            {bukaSiaran && (
              <div
                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end"
                onClick={() => setBukaSiaran(false)}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-[420px] mx-auto bg-white rounded-t-[28px] p-5 pb-[max(20px,env(safe-area-inset-bottom))] animate-[slideUp_0.25s_ease-out] max-h-[85vh] overflow-auto"
                >
                  <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
                  <h3 className="font-black text-[20px] text-center mb-4">
                    Siaran Kelas
                  </h3>
                  <textarea
                    value={teksSiaran}
                    onChange={(e) => setTeksSiaran(e.target.value)}
                    className="w-full h-40 p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:border-slate-900 text-[15px]"
                  />
                  <button
                    onClick={handleKirimSiaran}
                    className="w-full h-[52px] mt-4 bg-slate-900 text-white font-bold rounded-2xl active:scale-[0.98] will-change-transform"
                  >
                    Kirim
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        html {
          -webkit-tap-highlight-color: transparent;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        * {
          touch-action: manipulation;
        }
      `}</style>
    </div>
  );
}
