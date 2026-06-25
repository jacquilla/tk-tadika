import { Peoples, User, Left } from "@icon-park/react";

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
    <div className="glass-panel z-40 sticky top-0 px-6 pt-12 pb-4 border-b border-white/40">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${kelasAktif === "mawar" ? "bg-indigo-400" : "bg-teal-400"}`}
          >
            <Peoples
              theme="outline"
              size={28}
              strokeWidth={3}
              fill="currentColor"
            />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 leading-tight">
              Kelas {kelasAktif === "mawar" ? "Mawar" : "Melati"}
            </h1>
            <div className="mt-1 inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              <User theme="filled" size={12} /> 1 Guru : {muridHadir} Hadir
            </div>
          </div>
        </div>
        <button
          onClick={onKembali}
          className="p-4 bg-white/80 border border-slate-200 text-slate-500 rounded-2xl hover:bg-white active:scale-95 transition-all shadow-sm"
        >
          <Left theme="outline" size={22} strokeWidth={4} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
