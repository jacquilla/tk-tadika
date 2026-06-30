import { Message, Check } from "@icon-park/react";
import type { Murid } from "../../types/database";

interface Props {
  muridBelumHadirFilter: Murid[];
  onChat: (anak: Murid) => void;
  onDatang: (anak: Murid) => void;
  renderFoto: (anak: Murid, cls: string) => React.ReactNode;
}

export default function TabDatang({
  muridBelumHadirFilter,
  onChat,
  onDatang,
  renderFoto,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6 px-1">
        <div className="flex flex-col">
          <h2 className="font-extrabold text-slate-800 text-xl tracking-tight">
            Check‑In Pagi
          </h2>
          <p className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase mt-1">
            Absensi Kedatangan
          </p>
        </div>

        {/* Indikator Pill Premium */}
        <div className="bg-white/80 backdrop-blur-md text-slate-600 text-[10px] font-extrabold px-3.5 py-2 rounded-xl border border-slate-200/60 shadow-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
          <span>{muridBelumHadirFilter.length} Belum Hadir</span>
        </div>
      </div>

      {/* List Murid */}
      {muridBelumHadirFilter.map((anak, i) => (
        <div
          key={anak.id}
          className="bg-white/90 backdrop-blur-xl p-4 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white flex items-center justify-between slide-up hover:shadow-[0_15px_40px_rgba(16,185,129,0.08)] transition-all duration-300 group"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          {/* Sisi Kiri: Profil */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative shrink-0">
              {/* Efek glow di belakang foto */}
              <div className="absolute inset-0 bg-indigo-200 blur-md rounded-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
              {renderFoto(
                anak,
                "relative w-14 h-14 rounded-2xl object-cover border-[2.5px] border-white shadow-sm",
              )}
            </div>
            <span className="font-extrabold text-slate-800 text-base truncate tracking-tight">
              {anak.nama}
            </span>
          </div>

          {/* Sisi Kanan: Aksi */}
          <div className="flex items-center gap-2.5 ml-3 shrink-0">
            {/* Tombol Chat (Diubah menjadi lingkaran/circle agar rapi) */}
            <button
              onClick={() => onChat(anak)}
              className="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors border border-slate-100 active:scale-95 shrink-0"
              title="Kirim Pesan"
            >
              <Message theme="outline" size={18} strokeWidth={4} />
            </button>

            {/* Tombol Hadir (Emerald Gradient Premium) */}
            <button
              onClick={() => onDatang(anak)}
              className="bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-extrabold px-6 py-3 rounded-2xl shadow-[0_8px_20px_rgba(16,185,129,0.25)] hover:shadow-[0_10px_25px_rgba(16,185,129,0.35)] active:scale-95 transition-all flex items-center gap-2 btn-premium shrink-0"
            >
              <Check
                theme="outline"
                size={18}
                strokeWidth={5}
                className="mr-0.5"
              />
              <span>Hadir</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
