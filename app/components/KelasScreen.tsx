import { Peoples, Logout } from "@icon-park/react";

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
  return (
    <div className="flex-1 p-6 bg-slate-50/80 overflow-y-auto hide-scrollbar fade-in">
      <div className="flex justify-between items-center mb-10 mt-4">
        <div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">
            Selamat Bertugas,
          </p>
          <h2 className="text-2xl font-extrabold text-slate-800">
            Guru {namaGuru}
          </h2>
        </div>
        <button
          onClick={onLogout}
          className="p-4 bg-white/90 border border-slate-200 text-slate-500 rounded-2xl hover:bg-white active:scale-95 transition-all shadow-sm"
        >
          <Logout
            theme="outline"
            size={22}
            strokeWidth={4}
            fill="currentColor"
          />
        </button>
      </div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
        Pilih Kelas Hari Ini
      </p>
      <div className="space-y-5">
        <button
          onClick={() => onPilihKelas("mawar")}
          className="w-full bg-white/80 backdrop-blur border-2 border-indigo-100 p-6 rounded-[2rem] hover:border-indigo-300 active:scale-[0.98] transition-all flex items-center gap-5 text-left group shadow-md hover:shadow-xl"
        >
          <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
            <Peoples
              theme="outline"
              size={36}
              strokeWidth={3}
              fill="currentColor"
            />
          </div>
          <div>
            <h4 className="text-xl font-extrabold text-slate-800">
              Kelas Mawar
            </h4>
            <p className="text-indigo-500 font-bold text-xs mt-2 bg-indigo-50 px-4 py-1.5 rounded-xl inline-block">
              {jumlahMawar} Murid
            </p>
          </div>
        </button>
        <button
          onClick={() => onPilihKelas("melati")}
          className="w-full bg-white/80 backdrop-blur border-2 border-teal-100 p-6 rounded-[2rem] hover:border-teal-300 active:scale-[0.98] transition-all flex items-center gap-5 text-left group shadow-md hover:shadow-xl"
        >
          <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-500 group-hover:bg-teal-500 group-hover:text-white transition-colors">
            <Peoples
              theme="outline"
              size={36}
              strokeWidth={3}
              fill="currentColor"
            />
          </div>
          <div>
            <h4 className="text-xl font-extrabold text-slate-800">
              Kelas Melati
            </h4>
            <p className="text-teal-500 font-bold text-xs mt-2 bg-teal-50 px-4 py-1.5 rounded-xl inline-block">
              {jumlahMelati} Murid
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
