import { CheckOne, MagicWand, Home, ChartHistogram } from "@icon-park/react";

interface Props {
  tabAktif: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "datang", label: "Tiba", icon: CheckOne },
  { id: "kegiatan", label: "Aktivitas", icon: MagicWand },
  { id: "pulang", label: "Pulang", icon: Home },
  { id: "laporan", label: "Laporan", icon: ChartHistogram },
];

export default function BottomNav({ tabAktif, onTabChange }: Props) {
  return (
    // Background diubah menjadi lebih transparan (white/85) dengan blur yang lebih kuat (backdrop-blur-2xl)
    <div className="absolute bottom-6 left-6 right-6 z-40 bg-white/85 backdrop-blur-2xl border border-white/90 p-2.5 rounded-[2rem] shadow-[0_20px_50px_rgba(99,102,241,0.15)] flex justify-between items-center gap-1">
      {tabs.map((tab) => {
        const isActive = tabAktif === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex-1 min-w-[64px] py-2 flex flex-col items-center justify-center transition-all duration-500 ease-out active:scale-90 ${
              isActive
                ? "text-indigo-600 -translate-y-1.5" // Melayang ke atas saat aktif
                : "text-slate-400 hover:text-slate-500 hover:-translate-y-0.5"
            }`}
          >
            {/* Wrapper Ikon & Efek Glow */}
            <div className="relative mb-1">
              {isActive && (
                // Efek cahaya (glow) lembut di belakang ikon yang aktif
                <div className="absolute inset-0 bg-indigo-400 blur-md opacity-40 rounded-full scale-150"></div>
              )}

              <tab.icon
                theme={isActive ? "filled" : "outline"} // Outline saat biasa, Filled saat ditekan!
                size={24}
                strokeWidth={isActive ? 0 : 3.5}
                className="relative z-10 transition-all duration-300"
              />
            </div>

            {/* Teks Label */}
            <span
              className={`text-[9px] font-extrabold uppercase tracking-widest transition-all duration-300 ${
                isActive
                  ? "opacity-100"
                  : "opacity-0 scale-75 absolute -bottom-4" // Teks sembunyi jika tidak aktif agar UI lebih bersih
              }`}
            >
              {tab.label}
            </span>

            {/* Floating Indicator Dot (Titik Aktif di bawah) */}
            <div
              className={`absolute -bottom-1.5 w-1 h-1 rounded-full bg-indigo-500 transition-all duration-300 ${
                isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
              }`}
            ></div>
          </button>
        );
      })}
    </div>
  );
}
