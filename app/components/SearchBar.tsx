import { Search, Close } from "@icon-park/react";

interface Props {
  cariMurid: string;
  onCariChange: (val: string) => void;
  onClear: () => void;
}

export default function SearchBar({ cariMurid, onCariChange, onClear }: Props) {
  return (
    <div className="relative z-30 slide-up group">
      {/* Ikon Kaca Pembesar: Akan berubah warna saat input aktif */}
      <Search
        theme="outline"
        size={18}
        strokeWidth={4}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
      />

      <input
        type="text"
        placeholder="Cari nama murid..."
        value={cariMurid}
        onChange={(e) => onCariChange(e.target.value)}
        className="w-full pl-11 pr-11 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400 focus:bg-white transition-all text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] focus:shadow-[0_4px_20px_rgba(99,102,241,0.15)] placeholder:text-slate-300"
      />

      {/* Tombol Clear (X): Hanya muncul jika ada teks */}
      {cariMurid && (
        <button
          onClick={onClear}
          title="Hapus pencarian"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-full transition-all active:scale-90"
        >
          <Close theme="outline" size={16} strokeWidth={4} />
        </button>
      )}
    </div>
  );
}
