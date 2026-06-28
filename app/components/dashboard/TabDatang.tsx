import { Message } from "@icon-park/react";
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
      <div className="flex justify-between items-end mb-6">
        <h2 className="font-extrabold text-slate-800 text-xl tracking-tight">
          Check‑In Pagi
        </h2>
        <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-4 py-2 rounded-xl border border-indigo-100">
          Belum Hadir: {muridBelumHadirFilter.length}
        </span>
      </div>
      {muridBelumHadirFilter.map((anak, i) => (
        <div
          key={anak.id}
          className="bg-white/90 backdrop-blur p-5 rounded-[2rem] shadow-md border border-white/60 flex items-center justify-between slide-up"
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {renderFoto(
              anak,
              "w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm",
            )}
            <span className="font-bold text-slate-800 text-base truncate">
              {anak.nama}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            <button
              onClick={() => onChat(anak)}
              className="bg-indigo-50 text-indigo-500 p-1.5 rounded-2xl hover:bg-indigo-100 transition-all active:scale-95"
            >
              <Message theme="outline" size={16} strokeWidth={4} />
            </button>
            <button
              onClick={() => onDatang(anak)}
              className="bg-orange-400 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-lg shadow-orange-200 active:scale-95 transition-all btn-premium text-sm"
            >
              Hadir
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
