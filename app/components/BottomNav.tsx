import { CheckOne, Box, Logout, BankCard, ChartLine } from "@icon-park/react";

interface Props {
  tabAktif: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "datang", label: "Tiba", icon: CheckOne },
  { id: "kegiatan", label: "Aktivitas", icon: Box },
  { id: "pulang", label: "Pulang", icon: Logout },
  { id: "keuangan", label: "SPP", icon: BankCard },
  { id: "laporan", label: "Laporan", icon: ChartLine },
];

export default function BottomNav({ tabAktif, onTabChange }: Props) {
  return (
    <div className="absolute bottom-5 left-4 right-4 z-40 bg-white/80 backdrop-blur-xl border border-white/80 p-2 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] flex justify-between gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 min-w-[60px] py-3 rounded-2xl flex flex-col items-center transition-all ${tabAktif === tab.id ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          <tab.icon size={26} className="mb-1" strokeWidth={3} />
          <span className="text-[9px] font-extrabold uppercase">
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
