import { useState, useEffect } from "react";
import {
  CheckOne,
  Attention,
  MagicWand,
  Bowl,
  SleepOne,
  EmotionHappy,
  Save,
  Loading,
  Plus,
  Camera,
  CloseSmall,
  Picture,
} from "@icon-park/react";
import type { Murid, DailySheetMeta } from "../../types/database";

interface Props {
  muridHadirFilter: Murid[];
  statusDailySheetHarian: Record<string, DailySheetMeta>;
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
  renderFoto: (anak: Murid, cls: string) => React.ReactNode;
}

// Daftar Master Kategori untuk UI Smart Blocks
const PILIHAN_KATEGORI = [
  { id: "agamaMoral", label: "Agama & Moral", icon: "🕌" },
  { id: "motorik", label: "Motorik", icon: "🏃" },
  { id: "kognitif", label: "Kognitif", icon: "🧠" },
  { id: "sosialEmosional", label: "Sosial-Emosional", icon: "💬" },
  { id: "bahasa", label: "Bahasa", icon: "🗣️" },
  { id: "seni", label: "Seni", icon: "🎨" },
  { id: "umum", label: "Aktivitas Umum", icon: "🌟" },
];

// Template teks awal untuk setiap kategori (akan muncul di WhatsApp dengan format rapi)
const TEMPLATE_KATEGORI: Record<string, string> = {
  agamaMoral: "🕌 *Agama & Moral*\nAnanda belajar tentang ",
  motorik: "🏃 *Motorik*\nAnanda melatih keterampilan ",
  kognitif: "🧠 *Kognitif*\nAnanda mengasah kemampuan berpikir melalui ",
  sosialEmosional:
    "💬 *Sosial-Emosional*\nAnanda belajar berinteraksi dan mengelola emosi saat ",
  bahasa: "🗣️ *Bahasa*\nAnanda mengembangkan kemampuan berbahasa lewat ",
  seni: "🎨 *Seni*\nAnanda berkreasi dan mengekspresikan diri melalui ",
  umum: "🌟 *Aktivitas Umum*\nKegiatan hari ini: ",
};

// Fungsi untuk mengurai string jenisKegiatan (format [Label]\nTeks) menjadi array activityBlocks
const parseJenisKegiatanToBlocks = (
  text: string,
): { id: string; labelId: string; text: string }[] => {
  if (!text) return [];
  const blocks: { id: string; labelId: string; text: string }[] = [];
  // Pola: [Nama Label]\nTeks (sampai sebelum label berikutnya atau akhir)
  const regex = /\[(.+?)\]\n([\s\S]*?)(?=\n\[|$)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const labelName = match[1].trim();
    const teks = match[2].trim();
    // Cari id label dari PILIHAN_KATEGORI
    const kat = PILIHAN_KATEGORI.find((k) => k.label === labelName);
    if (kat) {
      blocks.push({
        id: Date.now().toString() + Math.random(),
        labelId: kat.id,
        text: teks,
      });
    }
  }
  return blocks;
};

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
  // STATE LOKAL: Untuk UI Multi-Aktivitas (Smart Blocks)
  // Kita simpan array block di sini, lalu kita gabungkan otomatis jadi 1 string ke `onJenisChange`
  const [activityBlocks, setActivityBlocks] = useState<
    { id: string; labelId: string; text: string }[]
  >([]);

  // Sinkronisasi awal: Jika jenisKegiatan dari parent ada, dan activityBlocks masih kosong, parsing menjadi blok
  useEffect(() => {
    if (jenisKegiatan && activityBlocks.length === 0) {
      const blocks = parseJenisKegiatanToBlocks(jenisKegiatan);
      if (blocks.length > 0) {
        setActivityBlocks(blocks);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // hanya saat mount

  // Efek Sinkronisasi: Reset blocks jika parent (jenisKegiatan) kosong (misal setelah disave)
  useEffect(() => {
    if (!jenisKegiatan) {
      setActivityBlocks([]);
    }
  }, [jenisKegiatan]);

  // Efek Agregasi: Menggabungkan semua block menjadi teks rapi untuk database
  useEffect(() => {
    if (activityBlocks.length > 0) {
      const combinedText = activityBlocks
        .map((b) => {
          const kat = PILIHAN_KATEGORI.find((k) => k.id === b.labelId);
          return `[${kat?.label || "Aktivitas"}]\n${b.text}`;
        })
        .join("\n");

      onJenisChange(combinedText);
      // Kirim label "Multi" atau label pertama agar logic parent tidak error
      onPilihLabel(
        activityBlocks.length > 1 ? "semua" : activityBlocks[0].labelId,
      );
    } else {
      onJenisChange("");
      onPilihLabel("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityBlocks]);

  const addBlock = (kategoriId: string) => {
    onGetaran();
    if (activityBlocks.find((b) => b.labelId === kategoriId)) return; // Jangan dobel
    setActivityBlocks([
      ...activityBlocks,
      {
        id: Date.now().toString(),
        labelId: kategoriId,
        text: TEMPLATE_KATEGORI[kategoriId] || "",
      },
    ]);
  };

  const removeBlock = (id: string) => {
    onGetaran();
    setActivityBlocks(activityBlocks.filter((b) => b.id !== id));
  };

  const updateBlockText = (id: string, text: string) => {
    setActivityBlocks(
      activityBlocks.map((b) => (b.id === id ? { ...b, text } : b)),
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="font-extrabold text-slate-800 text-xl tracking-tight mb-2 pl-1">
        Aktivitas & Daily Sheet
      </h2>

      {muridHadirFilter.length === 0 ? (
        <div className="flex flex-col items-center py-16 bg-white/50 rounded-[2rem] border-2 border-dashed border-slate-200">
          <Attention theme="filled" size={48} fill="#DC2626" className="mb-3" />
          <h3 className="font-bold text-red-800 text-base">
            Kelas Kosong / Tak Ditemukan
          </h3>
        </div>
      ) : (
        <div className="bg-white/95 backdrop-blur-xl p-5 sm:p-6 rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-white/80 slide-up relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          {/* ======================================= */}
          {/* 1. SELEKSI PESERTA (Scalable Grid 2 Kolom) */}
          {/* ======================================= */}
          <div className="flex justify-between items-center mb-4 relative z-10">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              1. Peserta
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
                className="text-[10px] font-extrabold text-rose-500 bg-rose-50/80 border border-rose-100 px-3 py-2 rounded-xl active:scale-95 hover:bg-rose-100 transition-all shadow-sm"
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
                className="text-[10px] font-extrabold text-indigo-500 bg-indigo-50/80 border border-indigo-100 px-3 py-2 rounded-xl active:scale-95 hover:bg-indigo-100 transition-all shadow-sm"
              >
                {pilihanAnak.length === muridHadirFilter.length
                  ? "Batalkan"
                  : "Semua"}
              </button>
            </div>
          </div>

          {/* Grid Peserta: Mendukung 20+ Anak dengan tampilan padat nan estetik */}
          <div className="grid grid-cols-2 gap-2 mb-8 max-h-[260px] overflow-y-auto hide-scrollbar bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100/80 relative z-10">
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
                  className={`relative flex items-center gap-2.5 p-2 rounded-[1.25rem] text-left transition-all active:scale-[0.98] border-2 overflow-hidden ${
                    isSelected
                      ? "bg-white border-indigo-400 shadow-[0_4px_15px_rgba(99,102,241,0.15)]"
                      : "bg-white/60 border-transparent hover:bg-white hover:border-slate-200"
                  }`}
                >
                  {/* Efek seleksi background */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-transparent pointer-events-none"></div>
                  )}

                  {renderFoto(
                    anak,
                    "relative w-9 h-9 rounded-xl object-cover shadow-sm shrink-0",
                  )}

                  <div className="flex-1 min-w-0 py-0.5">
                    <p
                      className={`text-[11px] font-extrabold truncate ${
                        isSelected ? "text-indigo-700" : "text-slate-600"
                      }`}
                    >
                      {anak.nama}
                    </p>
                    {/* Status Ikon Tetap Filled untuk Visibilitas */}
                    {hasDailyData && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {dailyData.makan && (
                          <Bowl
                            theme="filled"
                            size={10}
                            className="text-emerald-500"
                          />
                        )}
                        {dailyData.tidur && (
                          <SleepOne
                            theme="filled"
                            size={10}
                            className="text-violet-500"
                          />
                        )}
                        {dailyData.mood && (
                          <EmotionHappy
                            theme="filled"
                            size={10}
                            className={
                              dailyData.mood === "Senang"
                                ? "text-yellow-500"
                                : dailyData.mood === "Biasa"
                                  ? "text-slate-400"
                                  : "text-rose-500"
                            }
                          />
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ======================================= */}
          {/* 2. JURNAL & FOTO (Smart Multi-Blocks UI) */}
          {/* ======================================= */}
          <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            2. Multi-Jurnal & Media
          </label>

          <div className="relative z-10 mb-8">
            {/* Quick Chips Selector (Menggantikan Dropdown lama) */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-1 -mx-2 px-2">
              {PILIHAN_KATEGORI.map((kat) => (
                <button
                  key={kat.id}
                  onClick={() => addBlock(kat.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-extrabold text-slate-600 whitespace-nowrap active:scale-90 transition-all hover:border-indigo-300 hover:text-indigo-600 shadow-sm"
                >
                  <span className="text-sm">{kat.icon}</span>
                  {kat.label}
                </button>
              ))}
            </div>

            {/* Smart Blocks Container */}
            <div className="space-y-3">
              {activityBlocks.length === 0 && (
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-400">
                    👆 Klik label di atas untuk menambahkan aktivitas. Bisa
                    pilih lebih dari satu!
                  </p>
                </div>
              )}

              {activityBlocks.map((block) => {
                const kat = PILIHAN_KATEGORI.find(
                  (k) => k.id === block.labelId,
                );
                return (
                  <div
                    key={block.id}
                    className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm relative group fade-in"
                  >
                    {/* Header Block */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wider">
                        <span>{kat?.icon}</span>
                        {kat?.label}
                      </div>
                      <button
                        onClick={() => removeBlock(block.id)}
                        className="w-6 h-6 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-100 hover:text-rose-500 transition-colors"
                      >
                        <CloseSmall size={16} strokeWidth={4} />
                      </button>
                    </div>
                    {/* Textbox Kecil untuk Spesifik Aspek */}
                    <textarea
                      placeholder={`Detail aktivitas ${kat?.label}...`}
                      className="w-full min-h-[60px] p-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-indigo-300 transition-all text-slate-700 text-xs font-semibold resize-y placeholder:text-slate-300"
                      value={block.text}
                      onChange={(e) =>
                        updateBlockText(block.id, e.target.value)
                      }
                    />
                  </div>
                );
              })}
            </div>

            {/* Action Bar File Upload (Elegan & Pipih) */}
            <div className="flex gap-2 mt-4 bg-slate-50/80 p-2 rounded-2xl border border-slate-100">
              <label className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-slate-600 font-extrabold text-[10px] uppercase tracking-wider rounded-xl active:scale-95 transition-all cursor-pointer hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-slate-200">
                <Picture theme="outline" size={16} strokeWidth={4} />
                <span>Pilih Galeri</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onFotoChange(e.target.files?.[0] || null)}
                />
              </label>
              <div className="w-px bg-slate-200 my-1"></div>
              <label className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-slate-600 font-extrabold text-[10px] uppercase tracking-wider rounded-xl active:scale-95 transition-all cursor-pointer hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-slate-200">
                <Camera theme="outline" size={16} strokeWidth={4} />
                <span>Buka Kamera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => onFotoChange(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          {/* ======================================= */}
          {/* 3. DAILY SHEET CEPAT */}
          {/* ======================================= */}
          <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            3. Daily Sheet Cepat
          </label>
          <div className="space-y-4 mb-6 bg-slate-50/80 p-4 sm:p-5 rounded-[2rem] border border-slate-100 relative z-10">
            {/* Makan Siang */}
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                {/* Diubah jadi Outline */}
                <Bowl
                  theme="outline"
                  size={16}
                  className="text-emerald-500"
                />{" "}
                Makan Siang
              </p>
              <div className="flex gap-2">
                {["Habis", "Setengah", "Tidak Mau"].map((opsi) => (
                  <button
                    key={opsi}
                    onClick={() => {
                      onGetaran();
                      onMakanChange(dailyMakan === opsi ? "" : opsi);
                    }}
                    className={`flex-1 py-2.5 text-[11px] font-extrabold rounded-xl border active:scale-95 transition-all ${
                      dailyMakan === opsi
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {opsi}
                  </button>
                ))}
              </div>
            </div>

            {/* Tidur */}
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                  <SleepOne
                    theme="outline"
                    size={16}
                    className="text-violet-500"
                  />{" "}
                  Tidur Mulai
                </p>
                <input
                  type="time"
                  value={dailyTidurMulai}
                  onChange={(e) => onTidurMulaiChange(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 outline-none focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all"
                />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-600 mb-2">Selesai</p>
                <input
                  type="time"
                  value={dailyTidurSelesai}
                  onChange={(e) => onTidurSelesaiChange(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 outline-none focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all"
                />
              </div>
            </div>

            {/* Mood */}
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                <EmotionHappy
                  theme="outline"
                  size={16}
                  className="text-amber-500"
                />{" "}
                Mood / Emosi
              </p>
              <div className="flex gap-2">
                {[
                  {
                    label: "Senang",
                    icon: "😊",
                    activeClass: "bg-amber-50 border-amber-300 text-amber-700",
                  },
                  {
                    label: "Biasa",
                    icon: "😐",
                    activeClass: "bg-slate-100 border-slate-300 text-slate-700",
                  },
                  {
                    label: "Rewel",
                    icon: "😭",
                    activeClass: "bg-rose-50 border-rose-300 text-rose-700",
                  },
                ].map((m) => {
                  const isActive = dailyMood === m.label;
                  return (
                    <button
                      key={m.label}
                      onClick={() => {
                        onGetaran();
                        onMoodChange(isActive ? "" : m.label);
                      }}
                      className={`flex-1 py-2.5 rounded-xl border flex flex-col justify-center items-center gap-1 active:scale-95 transition-all ${
                        isActive
                          ? `${m.activeClass} shadow-sm`
                          : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 grayscale opacity-70"
                      }`}
                    >
                      <span className="text-base">{m.icon}</span>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest">
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ======================================= */}
          {/* TOMBOL SIMPAN UTAMA */}
          {/* ======================================= */}
          <button
            onClick={() => {
              onGetaran();
              onSimpan();
            }}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-extrabold py-4 rounded-2xl active:scale-[0.97] transition-all flex items-center justify-center gap-3 shadow-[0_10px_25px_rgba(99,102,241,0.3)] btn-premium text-sm relative z-10 disabled:opacity-70 disabled:grayscale-[20%]"
          >
            {isSaving ? (
              <Loading
                theme="outline"
                size={22}
                strokeWidth={4}
                className="animate-spin"
              />
            ) : (
              <Save theme="outline" size={22} strokeWidth={4} />
            )}
            <span className="tracking-wide">Kirim Jurnal & Sheet</span>
          </button>
        </div>
      )}
    </div>
  );
}
