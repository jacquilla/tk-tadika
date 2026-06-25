import {
  CheckOne,
  Attention,
  MagicWand,
  Bowl,
  SleepOne,
  EmotionHappy,
  Save,
  Loading,
} from "@icon-park/react";

interface Props {
  muridHadirFilter: any[];
  statusDailySheetHarian: Record<string, any>;
  pilihanAnak: string[];
  onPilihAnak: (ids: string[]) => void;
  labelAktivitas: string;
  onPilihLabel: (label: string) => void;
  jenisKegiatan: string;
  onJenisChange: (val: string) => void;
  onFotoChange: (file: File | null) => void;
  dailyMakan: string;
  onMakanChange: (val: string) => void;
  dailyTidurMulai: string;
  onTidurMulaiChange: (val: string) => void;
  dailyTidurSelesai: string;
  onTidurSelesaiChange: (val: string) => void;
  dailyMood: string;
  onMoodChange: (val: string) => void;
  isSaving: boolean;
  onSimpan: () => void;
  onGetaran: () => void;
  renderFoto: (anak: any, cls: string) => React.ReactNode;
}

export default function TabKegiatan({
  muridHadirFilter,
  statusDailySheetHarian,
  pilihanAnak,
  onPilihAnak,
  labelAktivitas,
  onPilihLabel,
  jenisKegiatan,
  onJenisChange,
  onFotoChange,
  dailyMakan,
  onMakanChange,
  dailyTidurMulai,
  onTidurMulaiChange,
  dailyTidurSelesai,
  onTidurSelesaiChange,
  dailyMood,
  onMoodChange,
  isSaving,
  onSimpan,
  onGetaran,
  renderFoto,
}: Props) {
  return (
    <div className="space-y-6">
      <h2 className="font-extrabold text-slate-800 text-xl tracking-tight mb-2">
        Aktivitas & Daily Sheet
      </h2>
      {muridHadirFilter.length === 0 ? (
        <div className="text-center py-16 bg-white/50 rounded-[2rem] border-2 border-dashed border-slate-200">
          <Attention
            theme="filled"
            size={48}
            fill="#94A3B8"
            className="mx-auto mb-3"
          />
          <h3 className="font-bold text-slate-600 text-base">
            Kelas Kosong / Tak Ditemukan
          </h3>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur p-6 rounded-[2.5rem] shadow-md border border-white/60 slide-up">
          <div className="flex justify-between items-center mb-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <CheckOne size={18} /> 1. Peserta
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onGetaran();
                  const belum = muridHadirFilter
                    .filter((m) => {
                      const d = statusDailySheetHarian[m.id];
                      return !d || (!d.makan && !d.tidur && !d.mood);
                    })
                    .map((m) => m.id);
                  onPilihAnak(belum);
                }}
                className="text-[10px] font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl active:scale-95 hover:bg-rose-100 transition-colors"
              >
                Pilih Belum
              </button>
              <button
                onClick={() => {
                  onGetaran();
                  onPilihAnak(
                    pilihanAnak.length === muridHadirFilter.length
                      ? []
                      : muridHadirFilter.map((m) => m.id),
                  );
                }}
                className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl active:scale-95 hover:bg-indigo-100 transition-colors"
              >
                {pilihanAnak.length === muridHadirFilter.length
                  ? "Batal"
                  : "Semua"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6 max-h-56 overflow-y-auto hide-scrollbar bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
            {muridHadirFilter.map((anak) => {
              const isSelected = pilihanAnak.includes(anak.id);
              const dailyData = statusDailySheetHarian[anak.id];
              const hasDailyData =
                !!dailyData &&
                (dailyData.makan || dailyData.tidur || dailyData.mood);
              return (
                <button
                  key={anak.id}
                  onClick={() => {
                    onGetaran();
                    onPilihAnak(
                      isSelected
                        ? pilihanAnak.filter((id) => id !== anak.id)
                        : [...pilihanAnak, anak.id],
                    );
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-left transition-all active:scale-95 border-2 ${isSelected ? "bg-indigo-50 border-indigo-400 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"}`}
                >
                  {renderFoto(
                    anak,
                    "w-10 h-10 rounded-xl object-cover border border-slate-100",
                  )}
                  <span
                    className={`text-xs font-bold ${isSelected ? "text-indigo-700" : "text-slate-700"}`}
                  >
                    {anak.nama}
                  </span>
                  {hasDailyData && (
                    <div className="flex items-center gap-1 ml-1">
                      {dailyData.makan && (
                        <Bowl
                          theme="filled"
                          size={16}
                          className="text-green-500"
                        />
                      )}
                      {dailyData.tidur && (
                        <SleepOne
                          theme="filled"
                          size={16}
                          className="text-violet-500"
                        />
                      )}
                      {dailyData.mood && (
                        <EmotionHappy
                          theme="filled"
                          size={16}
                          className={
                            dailyData.mood === "Senang"
                              ? "text-yellow-500"
                              : dailyData.mood === "Biasa"
                                ? "text-gray-500"
                                : "text-red-500"
                          }
                        />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <MagicWand size={16} /> 2. Jurnal & Foto
          </label>
          <div className="mb-3">
            <select
              className="w-full p-3 bg-white/80 border-2 border-slate-200 rounded-2xl text-slate-700 text-xs font-bold outline-none focus:border-indigo-400 transition-all"
              value={labelAktivitas}
              onChange={(e) => onPilihLabel(e.target.value)}
            >
              <option value="">✨ Pilih label kegiatan (opsional)</option>
              <option value="motorik">🏃 Motorik</option>
              <option value="kognitif">🧠 Kognitif</option>
              <option value="sosial">💬 Sosial-Emosional</option>
            </select>
          </div>
          <textarea
            placeholder="Ketik aktivitas anak di sini..."
            className="w-full min-h-[100px] p-4 bg-slate-50/80 border-2 border-slate-200 rounded-2xl mb-4 outline-none focus:border-indigo-400 text-slate-700 text-sm font-semibold resize-y placeholder:text-slate-400"
            value={jenisKegiatan}
            onChange={(e) => {
              onJenisChange(e.target.value);
              onPilihLabel("");
            }}
          />
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => onFotoChange(e.target.files?.[0] || null)}
            className="block w-full text-[10px] text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-bold file:bg-indigo-50 file:text-indigo-600 mb-6"
          />

          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Bowl size={14} /> 3. Daily Sheet Cepat
          </label>
          <div className="space-y-4 mb-5 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                <Bowl theme="outline" size={14} /> Makan Siang
              </p>
              <div className="flex gap-2">
                {["Habis", "Setengah", "Tidak Mau"].map((opsi) => (
                  <button
                    key={opsi}
                    onClick={() =>
                      onMakanChange(dailyMakan === opsi ? "" : opsi)
                    }
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg border active:scale-95 transition-all ${dailyMakan === opsi ? "bg-amber-100 border-amber-400 text-amber-800 shadow-sm" : "bg-white border-slate-200 text-slate-600"}`}
                  >
                    {opsi}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <SleepOne theme="outline" size={14} /> Tidur Mulai
                </p>
                <input
                  type="time"
                  value={dailyTidurMulai}
                  onChange={(e) => onTidurMulaiChange(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-indigo-400"
                />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-600 mb-1.5">
                  Selesai
                </p>
                <input
                  type="time"
                  value={dailyTidurSelesai}
                  onChange={(e) => onTidurSelesaiChange(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-indigo-400"
                />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                <EmotionHappy theme="outline" size={14} /> Mood
              </p>
              <div className="flex gap-2">
                {[
                  {
                    label: "Senang",
                    icon: "😊",
                    activeClass:
                      "bg-emerald-100 border-emerald-400 text-emerald-800 font-bold",
                  },
                  {
                    label: "Biasa",
                    icon: "😐",
                    activeClass:
                      "bg-indigo-100 border-indigo-400 text-indigo-800 font-bold",
                  },
                  {
                    label: "Rewel",
                    icon: "😭",
                    activeClass:
                      "bg-rose-100 border-rose-400 text-rose-800 font-bold",
                  },
                ].map((m) => {
                  const isActive = dailyMood === m.label;
                  return (
                    <button
                      key={m.label}
                      onClick={() => onMoodChange(isActive ? "" : m.label)}
                      className={`flex-1 py-2 rounded-lg border flex justify-center items-center gap-1 active:scale-95 transition-all ${isActive ? m.activeClass : "bg-white border-slate-200 text-slate-500 grayscale opacity-70"}`}
                    >
                      <span className="text-sm">{m.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={onSimpan}
            disabled={isSaving}
            className="w-full bg-indigo-500 text-white font-extrabold py-5 rounded-2xl active:scale-[0.97] transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 btn-premium text-base"
          >
            {isSaving ? (
              <Loading
                theme="outline"
                size={22}
                strokeWidth={4}
                className="animate-spin"
              />
            ) : (
              <Save
                theme="outline"
                size={22}
                strokeWidth={4}
                fill="currentColor"
              />
            )}
            <span>Kirim Jurnal & Sheet</span>
          </button>
        </div>
      )}
    </div>
  );
}
