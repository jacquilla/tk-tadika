import { Left, Peoples, Avatar } from "@icon-park/react";

interface Props {
  kelasAktif: string;
  muridHadir: number;
  guruHadir: boolean;
  onKembali: () => void;
}

export default function DashboardHeader({
  kelasAktif,
  muridHadir,
  guruHadir,
  onKembali,
}: Props) {
  const getaranHalus = () => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const namaKelas = kelasAktif.toLowerCase();
  const ikonDekoratif = namaKelas.includes("mawar")
    ? "🌸"
    : namaKelas.includes("melati")
      ? "🌼"
      : "✨";

  return (
    // Ditambahkan pt-8 untuk memberi ruang ekstra bagi notch/status bar iPhone XR
    <div className="z-40 sticky top-0 px-5 pt-8 pb-4 border-b border-white/60 bg-slate-50/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
      <div className="flex justify-between items-center">
        {/* Sisi Kiri: Informasi Utama Kelas */}
        <div className="flex flex-col justify-center">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
            Ruang Jurnal Harian
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 leading-none capitalize tracking-tight flex items-center gap-2">
            <span>Kelas {kelasAktif}</span>
            <span className="text-xl sm:text-2xl select-none">
              {ikonDekoratif}
            </span>
          </h1>

          {/* Lencana Status: Sekarang diubah menjadi bentuk Pil (rounded-full) */}
          <div className="flex items-center gap-2 mt-3">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all shadow-sm ${
                guruHadir
                  ? "bg-emerald-100/60 border border-emerald-200 text-emerald-700"
                  : "bg-rose-100/60 border border-rose-200 text-rose-700"
              }`}
            >
              <Avatar theme="filled" size={12} className="mt-[-1px]" />
              <span>{guruHadir ? "Guru Hadir" : "Guru Absen"}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-indigo-100/60 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">
              <Peoples theme="filled" size={12} className="mt-[-1px]" />
              <span>{muridHadir} Anak Hadir</span>
            </div>
          </div>
        </div>

        {/* Sisi Kanan: Tombol Navigasi kini Bundar Sempurna */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => {
              getaranHalus();
              onKembali();
            }}
            title="Kembali ke Menu Utama"
            // Mengubah bentuk dari squircle ke lingkaran penuh (rounded-full)
            className="w-12 h-12 bg-white border-2 border-slate-100 text-slate-600 rounded-full hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 active:scale-90 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.04)] flex items-center justify-center group"
          >
            <Left
              theme="outline"
              size={22}
              strokeWidth={4}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
