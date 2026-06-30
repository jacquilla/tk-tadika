import { Logout, SunOne, Planet, Right } from "@icon-park/react";

interface Props {
  namaGuru: string;
  jumlahMawar: number;
  jumlahMelati: number;
  onPilihKelas: (kelas: string) => void;
  onLogout: () => void;
}

export default function KelasScreen({
  namaGuru,
  jumlahMawar,
  jumlahMelati,
  onPilihKelas,
  onLogout,
}: Props) {
  // Fungsi getaran halus (Haptic Feedback)
  const getaranHalus = () => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return (
    <div className="flex-1 p-6 relative overflow-y-auto hide-scrollbar fade-in bg-slate-50/50">
      {/* Dekorasi Background Subtle */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-100/50 to-transparent pointer-events-none -z-10"></div>

      {/* Header & Logout */}
      <div className="flex justify-between items-center mb-10 mt-6">
        <div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-widest mb-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            Selamat Bertugas,
          </p>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Guru {namaGuru}
          </h2>
        </div>
        <button
          onClick={() => {
            getaranHalus();
            onLogout();
          }}
          className="w-11 h-11 bg-rose-50/80 border border-rose-100/80 text-rose-500 rounded-[1.25rem] hover:bg-rose-100 hover:text-rose-600 active:scale-90 transition-all flex items-center justify-center shadow-[0_4px_15px_rgba(225,29,72,0.1)] backdrop-blur-sm"
          title="Keluar"
        >
          <Logout
            theme="outline"
            size={20}
            strokeWidth={4}
            fill="currentColor"
            className="-ml-0.5" // Sedikit margin agar visualnya seimbang di tengah
          />
        </button>
      </div>

      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-5 ml-1">
        Pilih Kelas Hari Ini
      </p>

      <div className="space-y-5">
        {/* === KARTU KELAS MAWAR === */}
        <button
          onClick={() => {
            getaranHalus();
            onPilihKelas("mawar");
          }}
          className="w-full relative overflow-hidden bg-white/90 backdrop-blur-xl border border-white/80 p-5 rounded-[2.5rem] active:scale-[0.98] transition-all duration-300 flex items-center gap-5 text-left group shadow-[0_15px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgba(225,29,72,0.12)] hover:-translate-y-1"
        >
          {/* Latar belakang efek kilap (Glossy effect) */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/60 to-transparent rounded-full translate-x-10 -translate-y-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Ikon Animasi */}
          <div className="relative w-20 h-20 shrink-0">
            {/* Glow effect di belakang ikon */}
            <div className="absolute inset-0 bg-rose-400 blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500 rounded-full animate-pulse"></div>
            <div className="relative h-full w-full bg-gradient-to-br from-rose-50 to-rose-100 rounded-[1.75rem] border border-rose-200 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
              <SunOne
                theme="filled"
                size={36}
                className="text-rose-500 animate-[spin_8s_linear_infinite]"
              />
            </div>
          </div>

          <div className="flex-1">
            <h4 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Kelas Mawar
            </h4>
            <div className="mt-2 inline-flex items-center gap-1.5 bg-rose-50 border border-rose-100/50 text-rose-600 px-3 py-1.5 rounded-xl text-[10px] font-extrabold tracking-widest uppercase shadow-sm">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
              {jumlahMawar} Murid
            </div>
          </div>

          {/* Panah Indikator */}
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-500 transition-colors mr-2">
            <Right theme="outline" size={20} strokeWidth={4} />
          </div>
        </button>

        {/* === KARTU KELAS MELATI === */}
        <button
          onClick={() => {
            getaranHalus();
            onPilihKelas("melati");
          }}
          className="w-full relative overflow-hidden bg-white/90 backdrop-blur-xl border border-white/80 p-5 rounded-[2.5rem] active:scale-[0.98] transition-all duration-300 flex items-center gap-5 text-left group shadow-[0_15px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgba(20,184,166,0.12)] hover:-translate-y-1"
        >
          {/* Latar belakang efek kilap (Glossy effect) */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/60 to-transparent rounded-full translate-x-10 -translate-y-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Ikon Animasi */}
          <div className="relative w-20 h-20 shrink-0">
            {/* Glow effect di belakang ikon */}
            <div className="absolute inset-0 bg-teal-400 blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500 rounded-full animate-pulse"></div>
            <div className="relative h-full w-full bg-gradient-to-br from-teal-50 to-teal-100 rounded-[1.75rem] border border-teal-200 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
              <Planet
                theme="filled"
                size={36}
                className="text-teal-500 animate-[bounce_3s_infinite]" // Animasi mengambang (floating)
              />
            </div>
          </div>

          <div className="flex-1">
            <h4 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Kelas Melati
            </h4>
            <div className="mt-2 inline-flex items-center gap-1.5 bg-teal-50 border border-teal-100/50 text-teal-600 px-3 py-1.5 rounded-xl text-[10px] font-extrabold tracking-widest uppercase shadow-sm">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
              {jumlahMelati} Murid
            </div>
          </div>

          {/* Panah Indikator */}
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors mr-2">
            <Right theme="outline" size={20} strokeWidth={4} />
          </div>
        </button>
      </div>
    </div>
  );
}
