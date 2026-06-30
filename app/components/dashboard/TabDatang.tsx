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
  // Fungsi internal untuk haptic feedback
  const getaranHalus = () => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return (
    <div className="space-y-4 fade-in relative">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-5 px-1">
        <div className="flex flex-col">
          <h2 className="font-extrabold text-slate-800 text-xl tracking-tight">
            Check‑In Pagi
          </h2>
          <p className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase mt-1">
            Ketuk Ceklis untuk Hadir
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-md text-slate-600 text-[10px] font-extrabold px-3.5 py-2 rounded-xl border border-slate-200/60 shadow-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
          <span>{muridBelumHadirFilter.length} Belum Hadir</span>
        </div>
      </div>

      {/* Grid Gallery View - Dikonci 3 Kolom Saja */}
      <div className="grid grid-cols-3 gap-2.5 pb-10 px-1">
        {muridBelumHadirFilter.map((anak, i) => (
          <div
            key={anak.id}
            className="bg-white rounded-[1.25rem] shadow-[0_4px_15px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden slide-up group hover:shadow-[0_10px_25px_rgba(16,185,129,0.1)] transition-all duration-300 relative flex flex-col"
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            {/* Bagian Atas: Foto Profil menggunakan renderFoto Anda */}
            <div className="relative w-full aspect-4/5 bg-slate-50 [&>img]:w-full [&>img]:h-full [&>img]:object-cover">
              {/* Tombol Chat Melayang */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  getaranHalus();
                  onChat(anak);
                }}
                className="absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center text-white hover:bg-indigo-500 active:scale-90 transition-all border border-white/20 shadow-sm"
              >
                <Message theme="outline" size={13} strokeWidth={4} />
              </button>

              {/* RENDER FOTO ANDA TIDAK DIUBAH */}
              {renderFoto(
                anak,
                "relative w-full aspect-4/5 bg-slate-50 [&>img]:w-full [&>img]:h-full [&>img]:object-cover transition-transform duration-500 group-hover:scale-105",
              )}

              <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.03)] pointer-events-none"></div>
            </div>

            {/* Bagian Bawah: Nama Anak & Tombol Ceklis Hadir */}
            <button
              onClick={() => {
                getaranHalus();
                onDatang(anak);
              }}
              className="p-2 flex items-center justify-between gap-1.5 bg-white active:bg-emerald-50 transition-colors flex-1 w-full text-left outline-none"
            >
              <span className="text-[10px] font-extrabold text-slate-700 truncate flex-1 leading-tight">
                {anak.nama}
              </span>

              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200 group-hover:scale-110 active:scale-95 transition-transform">
                <Check theme="outline" size={12} strokeWidth={5} />
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
