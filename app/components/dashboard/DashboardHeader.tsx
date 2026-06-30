import Image from "next/image";
import { User, Left } from "@icon-park/react";

interface Props {
  kelasAktif: string;
  muridHadir: number;
  onKembali: () => void;
}

export default function DashboardHeader({
  kelasAktif,
  muridHadir,
  onKembali,
}: Props) {
  return (
    <div className="glass-panel z-40 sticky top-0 px-5 pt-6 pb-2 border-b-2 border-white/50">
      <div className="flex justify-between items-center">
        {/* === KIRI: Logo Sekolah & Info Kelas === */}
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            {/* Efek glowing lembut di belakang logo */}
            <div className="absolute inset-0 bg-indigo-300 blur-md rounded-full opacity-40"></div>
            <img
              src="/logo-tk.jpeg"
              alt="Logo TK Tadika Mesra"
              className="relative w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://ui-avatars.com/api/?name=TK&background=EEF2FF&color=4F46E5&rounded=false&size=128";
              }}
            />
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="text-lg font-extrabold text-slate-800 leading-none mb-1 capitalize">
              Kelas {kelasAktif}
            </h1>
            <div className="inline-flex items-center gap-1 bg-indigo-50/80 backdrop-blur-sm text-indigo-600 px-2.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-widest w-fit border border-indigo-100/50">
              <User theme="filled" size={10} /> {muridHadir} Hadir
            </div>
          </div>
        </div>

        {/* === KANAN: Logo PiaSmart & Tombol Kembali === */}
        <div className="flex items-center gap-3">
          {/* Logo PiaSmart */}
          <div className="w-11 h-11 relative shrink-0">
            <Image
              src="/piasmart.png"
              alt="PiaSmart"
              fill
              sizes="28px"
              className="object-contain opacity-80"
              priority
            />
          </div>

          {/* Tombol Kembali */}
          <button
            onClick={onKembali}
            className="p-2 bg-white/90 border border-slate-100 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-indigo-600 active:scale-75 transition-all shadow-sm flex items-center justify-center"
          >
            <Left theme="outline" size={16} strokeWidth={4} />
          </button>
        </div>
      </div>
    </div>
  );
}
