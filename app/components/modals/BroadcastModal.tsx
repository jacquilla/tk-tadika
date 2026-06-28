import { Loading, VolumeNotice, Close, Send } from "@icon-park/react";

interface Props {
  bukaSiaran: boolean;
  tipeSiaran: string;
  teksSiaran: string;
  isBroadcasting: boolean;
  onTutup: () => void;
  onUbahTeks: (teks: string) => void;
  onPilihTipe: (tipe: string, template: string) => void;
  onKirim: () => void;
  templateUmum: string;
  templateSpp: string;
}

export default function BroadcastModal({
  bukaSiaran,
  tipeSiaran,
  teksSiaran,
  isBroadcasting,
  onTutup,
  onUbahTeks,
  onPilihTipe,
  onKirim,
  templateUmum,
  templateSpp,
}: BroadcastModalProps) {
  if (!bukaSiaran) return null;

  return (
    <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-lg flex items-end justify-center sm:items-center sm:p-4 fade-in">
      <div className="bg-white w-full rounded-t-[3rem] sm:rounded-3xl shadow-2xl flex flex-col h-[85vh] sm:h-auto sm:max-h-[85vh] slide-up">
        <div className="w-full flex justify-center pt-4 pb-2 sm:hidden">
          <div className="w-16 h-1.5 bg-slate-200 rounded-full"></div>
        </div>
        <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-3">
            <VolumeNotice
              theme="outline"
              size={28}
              strokeWidth={4}
              fill="currentColor"
              className="text-orange-400"
            />{" "}
            Pusat Siaran
          </h2>
          <button
            onClick={onTutup}
            className="p-3 text-slate-400 hover:bg-slate-100 rounded-2xl transition-colors active:scale-90"
          >
            <Close
              theme="outline"
              size={24}
              strokeWidth={4}
              fill="currentColor"
            />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
          <div className="flex gap-3 overflow-x-auto pb-5 mb-5 hide-scrollbar">
            <button
              onClick={() => onPilihTipe("umum", templateUmum)}
              className={`px-6 py-4 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border-2 ${tipeSiaran === "umum" ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "bg-white border-slate-200 text-slate-600"}`}
            >
              Info Umum
            </button>
            <button
              onClick={() => onPilihTipe("spp", templateSpp)}
              className={`px-6 py-4 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border-2 ${tipeSiaran === "spp" ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "bg-white border-slate-200 text-slate-600"}`}
            >
              Tagihan SPP
            </button>
          </div>
          <textarea
            className="w-full flex-1 min-h-[240px] p-5 bg-slate-50 border-2 border-slate-200 rounded-3xl outline-none focus:border-indigo-400 text-slate-700 font-semibold text-sm resize-none mb-6 transition-all placeholder:text-slate-400"
            value={teksSiaran}
            onChange={(e) => onUbahTeks(e.target.value)}
          />
          <button
            disabled={isBroadcasting}
            onClick={onKirim}
            className="w-full bg-slate-800 text-white font-extrabold py-5 rounded-2xl active:scale-[0.97] transition-all flex justify-center gap-3 shadow-xl shadow-slate-200 btn-premium text-base"
          >
            {isBroadcasting ? (
              <Loading theme="outline" size={22} className="animate-spin" />
            ) : (
              <Send theme="outline" size={22} fill="currentColor" />
            )}
            <span>Kirim Broadcast</span>
          </button>
        </div>
      </div>
    </div>
  );
}
