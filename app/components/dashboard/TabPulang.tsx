import { Message, Home, Car, Down, Edit } from "@icon-park/react";
import type { Murid } from "../../types/database";

interface Props {
  muridHadirFilter: Murid[];
  penjemput: Record<string, string>;
  penjemputCustom: Record<string, string>; // Tetap di interface agar tidak error, tapi tidak dipakai di UI
  ketPenjemput: Record<string, string>;
  onChat: (anak: Murid) => void;
  onPulang: (anak: Murid) => void;
  onPenjemputChange: (id: string, val: string) => void;
  onPenjemputCustomChange: (id: string, val: string) => void; // Tetap di interface
  onKetChange: (id: string, val: string) => void;
  renderFoto: (anak: Murid, cls: string) => React.ReactNode;
}

export default function TabPulang({
  muridHadirFilter,
  penjemput,
  ketPenjemput,
  onChat,
  onPulang,
  onPenjemputChange,
  onKetChange,
  renderFoto,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6 px-1">
        <div className="flex flex-col">
          <h2 className="font-extrabold text-slate-800 text-xl tracking-tight">
            Check‑Out Sore
          </h2>
          <p className="text-[10px] text-slate-700 font-extrabold tracking-widest uppercase mt-1">
            Absensi Kepulangan
          </p>
        </div>

        {/* Indikator Sisa Murid */}
        <div className="bg-white/80 backdrop-blur-md text-slate-700 text-[10px] font-extrabold px-3.5 py-2 rounded-xl border border-slate-200/60 shadow-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
          <span>Sisa: {muridHadirFilter.length} Murid</span>
        </div>
      </div>

      {/* List Murid (Card Premium) */}
      {muridHadirFilter.map((anak, i) => {
        // Logika UX: Default "Orang Tua", Keterangan disembunyikan jika "Orang Tua"
        const currentPenjemput = penjemput[anak.id] || "Orang Tua";
        const isOrangTua = currentPenjemput === "Orang Tua";

        return (
          <div
            key={anak.id}
            className="bg-white/95 backdrop-blur-xl p-5 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white flex flex-col slide-up hover:shadow-[0_15px_40px_rgba(249,115,22,0.08)] transition-all duration-300 group overflow-hidden relative"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {/* Subtle Sunset Glow di pojok kartu */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-100/60 to-transparent rounded-full translate-x-10 -translate-y-10 pointer-events-none"></div>

            {/* Header Kartu (Profil & Chat) */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100/80 relative z-10">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-orange-200 blur-md rounded-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                  {renderFoto(
                    anak,
                    "relative w-14 h-14 rounded-2xl object-cover border-[2.5px] border-white shadow-sm",
                  )}
                </div>
                <span className="font-extrabold text-slate-800 text-lg tracking-tight">
                  {anak.nama}
                </span>
              </div>

              {/* Tombol Chat Bulat */}
              <button
                onClick={() => onChat(anak)}
                className="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-orange-50 hover:text-orange-500 transition-colors border border-slate-100 active:scale-95 shrink-0"
                title="Kirim Pesan"
              >
                <Message theme="outline" size={18} strokeWidth={4} />
              </button>
            </div>

            {/* Form Kepulangan */}
            <div className="space-y-3 relative z-10">
              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <Car theme="outline" size={14} className="text-orange-400" />
                Dijemput Oleh
              </label>

              {/* Custom Select Wrapper yang Elegan */}
              <div className="relative">
                <select
                  className="w-full pl-4 pr-10 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-700 text-sm font-bold outline-none focus:bg-white focus:border-orange-400 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] transition-all appearance-none cursor-pointer"
                  value={currentPenjemput}
                  onChange={(e) => onPenjemputChange(anak.id, e.target.value)}
                >
                  <option value="Orang Tua">Orang Tua Kandung</option>
                  <option value="Kakek/Nenek">Kakek / Nenek</option>
                  <option value="Driver">Driver / Jemputan</option>
                  <option value="Lainnya">Lainnya...</option>
                </select>
                {/* Ikon Chevron Kustom pengganti panah default browser */}
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                  <Down theme="outline" size={18} strokeWidth={4} />
                </div>
              </div>

              {/* Input Keterangan (Hanya muncul jika BUKAN Orang Tua) */}
              {!isOrangTua && (
                <div className="relative fade-in">
                  <div className="absolute top-3.5 left-4 text-slate-400">
                    <Edit theme="outline" size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Nama penjemput, Plat Motor, Baju..."
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-orange-400 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] text-slate-700 text-sm font-semibold transition-all placeholder:text-slate-500"
                    value={ketPenjemput[anak.id] || ""}
                    onChange={(e) => onKetChange(anak.id, e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              {/* Tombol Pulangkan (Sunset Gradient) */}
              <button
                onClick={() => onPulang(anak)}
                className="w-full mt-2 bg-gradient-to-r from-orange-400 to-rose-400 text-white font-extrabold py-4 rounded-2xl hover:shadow-[0_10px_25px_rgba(249,115,22,0.3)] active:scale-[0.97] transition-all text-sm flex items-center justify-center gap-2.5 shadow-[0_8px_20px_rgba(249,115,22,0.2)] btn-premium"
              >
                <Home
                  theme="outline"
                  size={20}
                  strokeWidth={4}
                  className="mb-0.5"
                />
                <span className="tracking-wide">Pulangkan & Kirim Notif</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
