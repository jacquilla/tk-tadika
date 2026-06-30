import { Search, Close } from "@icon-park/react";

interface Props {
  cariMurid: string;
  onCariChange: (val: string) => void;
  onClear: () => void;
}

export default function SearchBar({ cariMurid, onCariChange, onClear }: Props) {
  return (
    <div className="relative mb-4 slide-up z-10">
      <Search
        theme="outline"
        size={18}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
      />
      <input
        type="text"
        placeholder="Cari nama murid..."
        value={cariMurid}
        onChange={(e) => onCariChange(e.target.value)}
        className="w-full pl-10 pr-10 py-3 bg-white/80 backdrop-blur-sm border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400 focus:shadow-[0_0_0_4px_rgba(129,140,248,0.15)] transition-all placeholder:text-slate-400 text-slate-700"
      />
      {cariMurid && (
        <button
          onClick={onClear}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 active:scale-90 transition-all"
        >
          <Close theme="outline" size={16} strokeWidth={4} />
        </button>
      )}
    </div>
  );
}
