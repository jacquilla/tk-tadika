"use client";
import { useState, useRef } from "react";

const DATA_KELAS = {
  mawar: [
    {
      id: 101,
      nama: "Budi",
      hp: "62895406574589",
      foto: "https://ui-avatars.com/api/?name=Budi&background=fecaca&color=991b1b",
    },
    {
      id: 102,
      nama: "Ani",
      hp: "62895406574589",
      foto: "https://ui-avatars.com/api/?name=Ani&background=fecaca&color=991b1b",
    },
    {
      id: 103,
      nama: "Raisa",
      hp: "62895406574589",
      foto: "https://ui-avatars.com/api/?name=Raisa&background=fecaca&color=991b1b",
    },
  ],
  melati: [
    {
      id: 201,
      nama: "Putra",
      hp: "62895406574589",
      foto: "https://ui-avatars.com/api/?name=Putra&background=fed7aa&color=92400e",
    },
    {
      id: 202,
      nama: "Malfin",
      hp: "62895406574589",
      foto: "https://ui-avatars.com/api/?name=Malfin&background=fed7aa&color=92400e",
    },
    {
      id: 203,
      nama: "Jenni",
      hp: "62895406574589",
      foto: "https://ui-avatars.com/api/?name=Jenni&background=fed7aa&color=92400e",
    },
  ],
};

const TEMPLATE_PESAN = {
  umum: "Syalom Bunda/Ayah,\n\nIni adalah informasi resmi dari TK Tadika Mesra.\n\n[KETIK INFO DI SINI]\n\nKurre sumanga' atas perhatiannya. Tuhan memberkati.",
  spp: "Syalom Bunda/Ayah,\n\nSemoga keluarga dalam keadaan sehat selalu. Tabe', dengan penuh kerendahan hati kami dari administrasi TK Tadika Mesra ingin mengingatkan mengenai administrasi SPP bulan ini yang mungkin terlewat.",
  bekal:
    "Syalom Bunda,\n\nTabe', demi kenyamanan ananda, mohon bekali dengan:\n- Botol minum pribadi\n- [TAMBAHKAN LAIN]",
};

export default function AppTK() {
  const [tampilan, setTampilan] = useState("login");
  const [namaGuru, setNamaGuru] = useState("");
  const [kelasAktif, setKelasAktif] = useState<"mawar" | "melati" | "">("");
  const [tabAktif, setTabAktif] = useState("datang");
  const [statusAnak, setStatusAnak] = useState<Record<number, string>>({});
  const [logKegiatan, setLogKegiatan] = useState<Record<number, string[]>>({});
  const [pilihanAnak, setPilihanAnak] = useState<number[]>([]);
  const [jenisKegiatan, setJenisKegiatan] = useState("");
  const [penjemput, setPenjemput] = useState<Record<number, string>>({});
  const [ketPenjemput, setKetPenjemput] = useState<Record<number, string>>({});
  const [bukaSiaran, setBukaSiaran] = useState(false);
  const [teksSiaran, setTeksSiaran] = useState(TEMPLATE_PESAN.umum);
  const [confetti, setConfetti] = useState<{ id: number; x: number }[]>([]);
  const audioRef = useRef<AudioContext | null>(null);

  const muridSemua =
    kelasAktif === "mawar" ? DATA_KELAS.mawar : DATA_KELAS.melati;
  const muridBelumHadir = muridSemua.filter((a) => !statusAnak[a.id]);
  const muridHadir = muridSemua.filter((a) => statusAnak[a.id] === "hadir");

  const playPop = (freq = 700) => {
    try {
      if (!audioRef.current)
        audioRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      const ctx = audioRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = freq;
      g.gain.value = 0.08;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.07);
    } catch {}
  };
  const getar = () => {
    if (navigator.vibrate) navigator.vibrate(40);
    playPop();
  };

  const triggerCelebration = () => {
    getar();
    playPop(900);
    setConfetti(
      Array.from({ length: 14 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 90,
      })),
    );
    setTimeout(() => setConfetti([]), 1200);
  };

  const catat = (id: number, teks: string) => {
    const waktu = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setLogKegiatan((p) => ({
      ...p,
      [id]: [...(p[id] || []), `[${waktu}] ${teks}`],
    }));
  };
  const kirimWA = async (hp: string, pesan: string) => {
    await fetch("/api/wa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetHp: hp, pesanCustom: pesan }),
    });
  };

  const handleDatang = (anak: any) => {
    triggerCelebration();
    setStatusAnak((p) => ({ ...p, [anak.id]: "hadir" }));
    catat(anak.id, "Tiba di sekolah");
    kirimWA(
      anak.hp,
      `🔔 Ananda *${anak.nama}* tiba, disambut Guru ${namaGuru}.`,
    );
  };
  const handlePulang = (anak: any) => {
    getar();
    const siapa = penjemput[anak.id] || "Orang Tua";
    setStatusAnak((p) => ({ ...p, [anak.id]: "pulang" }));
    catat(anak.id, `Pulang dijemput ${siapa}`);
    kirimWA(anak.hp, `📚 *${anak.nama}* pulang. Dijemput: ${siapa}`);
  };

  if (tampilan === "login") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[url('/bg.jpeg')] bg-cover">
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />
        <div className="relative bg-white w-full max-w-md p-8 rounded-[2.5rem] border-4 border-white shadow-xl text-center">
          <div className="w-28 h-28 mx-auto mb-5 rounded-full bg-gradient-to-b from-amber-300 to-orange-400 flex items-center justify-center text-5xl shadow-[0_8px_0_0_#ea580c] animate-bounce">
            🏫
          </div>
          <h1 className="text-4xl font-black text-slate-800">
            TK Tadika Mesra
          </h1>
          <input
            value={namaGuru}
            onChange={(e) => setNamaGuru(e.target.value)}
            placeholder="Nama Guru..."
            className="w-full mt-6 p-4 bg-violet-50 border-4 border-violet-100 rounded-3xl text-center font-bold outline-none"
          />
          <button
            onClick={() => {
              getar();
              namaGuru && setTampilan("kelas");
            }}
            className="w-full mt-4 bg-violet-500 text-white font-black py-4 rounded-3xl shadow-[0_8px_0_0_#5b21b6] active:translate-y-1 active:shadow-[0_2px_0_0_#5b21b6]"
          >
            Masuk 🚀
          </button>
        </div>
      </div>
    );
  }

  if (tampilan === "kelas") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[url('/bg.jpeg')] bg-cover">
        <div className="absolute inset-0 bg-white/70" />
        <div className="relative bg-white p-7 rounded-[2.5rem] w-full max-w-md border-4">
          <h2 className="text-2xl font-black">Halo, {namaGuru}!</h2>
          <button
            onClick={() => {
              setKelasAktif("mawar");
              setTampilan("dashboard");
              getar();
            }}
            className="w-full mt-4 p-6 rounded-[2rem] bg-gradient-to-b from-rose-400 to-pink-500 text-white flex items-center gap-4 shadow-[0_10px_0_0_#be185d] active:translate-y-2"
          >
            <span className="text-5xl">🌸</span>
            <div className="text-left">
              <div className="text-2xl font-black">Kelas Mawar</div>
            </div>
          </button>
          <button
            onClick={() => {
              setKelasAktif("melati");
              setTampilan("dashboard");
              getar();
            }}
            className="w-full mt-4 p-6 rounded-[2rem] bg-gradient-to-b from-amber-400 to-orange-500 text-white flex items-center gap-4 shadow-[0_10px_0_0_#c2410c] active:translate-y-2"
          >
            <span className="text-5xl">🌼</span>
            <div className="text-left">
              <div className="text-2xl font-black">Kelas Melati</div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('/bg.jpeg')] bg-cover">
      <div className="absolute inset-0 bg-slate-100/80" />
      <div className="relative bg-[#F8FAFC] w-full max-w-md h-[90vh] flex flex-col rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden">
        {confetti.map((c) => (
          <div
            key={c.id}
            className="absolute top-20 text-2xl animate-[pop_1.2s_ease-out_forwards] z-50"
            style={{ left: `${c.x}%` }}
          >
            🎉
          </div>
        ))}

        {/* HEADER - INI YANG TADI KURANG TUTUP */}
        <div
          className={`p-5 ${kelasAktif === "mawar" ? "bg-rose-200" : "bg-amber-200"}`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="text-4xl">
                {kelasAktif === "mawar" ? "🌸" : "🌼"}
              </div>
              <div>
                <h1 className="font-black text-xl">
                  Kelas {kelasAktif === "mawar" ? "Mawar" : "Melati"}
                </h1>
                <p className="text-sm font-bold text-slate-600">
                  Guru: {namaGuru}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                getar();
                setTampilan("kelas");
              }}
              className="px-4 py-2 bg-white rounded-xl font-black shadow"
            >
              Kembali
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 pb-32">
          {tabAktif === "datang" &&
            muridBelumHadir.map((a) => (
              <div
                key={a.id}
                className="bg-white p-4 mb-3 rounded-3xl border-4 flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <img src={a.foto} className="w-12 h-12 rounded-full" />
                  <span className="font-black text-lg">{a.nama}</span>
                </div>
                <button
                  onClick={() => handleDatang(a)}
                  className="px-6 py-3 bg-emerald-500 text-white font-black rounded-2xl shadow-[0_6px_0_0_#059669] active:translate-y-1"
                >
                  Tiba
                </button>
              </div>
            ))}
          {tabAktif === "pulang" &&
            muridHadir.map((a) => (
              <div
                key={a.id}
                className="bg-white p-4 mb-3 rounded-3xl border-4"
              >
                <div className="font-black mb-2">{a.nama}</div>
                <select
                  onChange={(e) =>
                    setPenjemput((p) => ({ ...p, [a.id]: e.target.value }))
                  }
                  className="w-full p-2 border-2 rounded-xl mb-2"
                >
                  <option>Orang Tua</option>
                  <option>Kakek</option>
                  <option>Jemputan</option>
                </select>
                <button
                  onClick={() => handlePulang(a)}
                  className="w-full py-3 bg-rose-500 text-white font-black rounded-2xl shadow-[0_6px_0_0_#be123c] active:translate-y-1"
                >
                  Pulang & WA 🚀
                </button>
              </div>
            ))}
        </div>

        <div className="absolute bottom-5 left-5 right-5">
          <div className="bg-white p-2 rounded-[2rem] border-4 flex gap-2">
            <button
              onClick={() => {
                setTabAktif("datang");
                getar();
              }}
              className={`flex-1 py-3 rounded-2xl font-black ${tabAktif === "datang" ? "bg-emerald-500 text-white" : "text-slate-400"}`}
            >
              🚪 Tiba
            </button>
            <button
              onClick={() => {
                setTabAktif("pulang");
                getar();
              }}
              className={`flex-1 py-3 rounded-2xl font-black ${tabAktif === "pulang" ? "bg-rose-500 text-white" : "text-slate-400"}`}
            >
              🏡 Pulang
            </button>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes pop {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-80px) scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
