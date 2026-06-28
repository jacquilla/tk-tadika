import { Message, Home } from "@icon-park/react";
import type { Murid } from "../types/database";

interface Props {
  muridHadirFilter: Murid[];
  penjemput: Record<string, string>;
  penjemputCustom: Record<string, string>;
  ketPenjemput: Record<string, string>;
  onChat: (anak: Murid) => void;
  onPulang: (anak: Murid) => void;
  onPenjemputChange: (id: string, val: string) => void;
  onPenjemputCustomChange: (id: string, val: string) => void;
  onKetChange: (id: string, val: string) => void;
  renderFoto: (anak: Murid, cls: string) => React.ReactNode;
}

export default function TabPulang({
  muridHadirFilter,
  penjemput,
  penjemputCustom,
  ketPenjemput,
  onChat,
  onPulang,
  onPenjemputChange,
  onPenjemputCustomChange,
  onKetChange,
  renderFoto,
}: Props) {
  return (
    <div className="space-y-6">
      {" "}
      <h2 className="font-extrabold text-slate-800 text-xl tracking-tight mb-4">
        Check‑Out
      </h2>
      {muridHadirFilter.map((anak, i) => (
        <div
          key={anak.id}
          className="bg-white/90 backdrop-blur p-6 rounded-[2.5rem] shadow-md border border-white/60 slide-up"
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              {renderFoto(
                anak,
                "w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm",
              )}
              <span className="font-bold text-slate-800 text-lg">
                {anak.nama}
              </span>
            </div>
            <button
              onClick={() => onChat(anak)}
              className="bg-indigo-50 text-indigo-500 p-1.5 rounded-2xl hover:bg-indigo-100 transition-all active:scale-95"
            >
              <Message theme="outline" size={16} strokeWidth={4} />
            </button>
          </div>
          <div className="space-y-5">
            <select
              className="w-full p-4 bg-white/80 border-2 border-slate-200 rounded-2xl text-slate-700 text-sm font-bold outline-none focus:border-indigo-400 transition-all"
              value={penjemput[anak.id] || "Orang Tua"}
              onChange={(e) => onPenjemputChange(anak.id, e.target.value)}
            >
              <option value="Orang Tua">Orang Tua Kandung</option>
              <option value="Kakek/Nenek">Kakek / Nenek</option>
              <option value="Driver">Driver Jemputan</option>
              <option value="Lainnya">Lainnya...</option>
            </select>
            {(penjemput[anak.id] === "Lainnya" || !penjemput[anak.id]) && (
              <input
                type="text"
                placeholder="Tuliskan nama penjemput"
                className="w-full p-4 bg-white/80 border-2 border-slate-200 rounded-2xl outline-none focus:border-indigo-400 text-slate-700 text-sm font-semibold transition-all placeholder:text-slate-400"
                value={penjemputCustom[anak.id] || ""}
                onChange={(e) =>
                  onPenjemputCustomChange(anak.id, e.target.value)
                }
              />
            )}
            <input
              type="text"
              placeholder="Catatan Baju / Plat Nomor..."
              className="w-full p-4 bg-white/80 border-2 border-slate-200 rounded-2xl outline-none focus:border-indigo-400 text-slate-700 text-sm font-semibold transition-all placeholder:text-slate-400"
              value={ketPenjemput[anak.id] || ""}
              onChange={(e) => onKetChange(anak.id, e.target.value)}
            />
            <button
              onClick={() => onPulang(anak)}
              className="w-full mt-4 bg-orange-400 text-white font-extrabold py-5 rounded-2xl hover:bg-orange-500 active:scale-[0.97] transition-all text-base flex items-center justify-center gap-3 shadow-xl shadow-orange-200 btn-premium"
            >
              <Home
                theme="outline"
                size={22}
                strokeWidth={4}
                fill="currentColor"
              />{" "}
              <span>Pulangkan & Kirim Notif</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
