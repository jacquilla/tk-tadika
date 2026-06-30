import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Loading,
  Down,
  Edit,
  Time,
  Calendar,
} from "@icon-park/react";
import type {
  Murid,
  Kehadiran,
  LogAktivitas,
  DailySheetMeta,
} from "../../types/database";

interface Props {
  subTabLaporan: "harian" | "mingguan";
  onSubTabChange: (sub: "harian" | "mingguan") => void;
  muridSemuaFilter: Murid[];
  selectedStudentReport: Murid | null;
  onSelectStudent: (anak: Murid) => void;
  statusAnak: Record<string, "belum" | "hadir" | "pulang">;
  kehadiranHarian: Record<string, Kehadiran>;
  logKegiatan: Record<
    string,
    Array<{
      waktu: string;
      teks: string;
      metadata: DailySheetMeta;
      kategori: string;
    }>
  >;
  statusDailySheetHarian: Record<string, DailySheetMeta>;
  weeklyOffset: number;
  onWeeklyOffsetChange: (offset: number) => void;
  fetchWeeklyReportForChild: (anak: Murid) => void;
  weeklyData: {
    anak: Murid;
    dailyMap: Record<
      string,
      { hadir: Kehadiran | null; kegiatan: LogAktivitas[] }
    >;
    start: string;
    end: string;
  } | null;
  isLoadingWeekly: boolean;
  renderFoto: (anak: Murid, cls: string) => React.ReactNode;
  getWeekRange: (offset: number) => {
    start: string;
    end: string;
    mondayDate: Date;
    sundayDate: Date;
  };
  logHarian: Record<string, LogAktivitas[]>;
  onEditLog?: (log: LogAktivitas) => void;
}

export default function TabLaporan({
  subTabLaporan,
  onSubTabChange,
  muridSemuaFilter,
  selectedStudentReport,
  onSelectStudent,
  statusAnak,
  kehadiranHarian,
  logKegiatan,
  statusDailySheetHarian,
  weeklyOffset,
  onWeeklyOffsetChange,
  fetchWeeklyReportForChild,
  weeklyData,
  isLoadingWeekly,
  renderFoto,
  getWeekRange,
  logHarian,
  onEditLog,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fungsi internal untuk getaran halus (Haptic Feedback)
  const getaranHalus = () => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  // Handler Ganti Tab (Reset state akordion agar lebih rapi)
  const handleTabSwitch = (tab: "harian" | "mingguan") => {
    getaranHalus();
    setExpandedId(null);
    onSubTabChange(tab);
  };

  return (
    <div className="space-y-6 fade-in relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/40 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none -z-10"></div>

      <div className="px-1">
        <h2 className="font-extrabold text-slate-800 text-xl tracking-tight mb-1">
          Laporan Akademik
        </h2>
        <p className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase mb-4">
          Evaluasi & Jurnal
        </p>
      </div>

      {/* Toggle Sub-Tab Mewah (Pill Style) */}
      <div className="flex gap-1.5 bg-slate-200/50 backdrop-blur-md p-1.5 rounded-[1.25rem] shadow-inner mb-6 mx-1">
        <button
          onClick={() => handleTabSwitch("harian")}
          className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all duration-300 ${
            subTabLaporan === "harian"
              ? "bg-white text-indigo-600 shadow-[0_4px_15px_rgba(0,0,0,0.05)] scale-100"
              : "text-slate-400 hover:text-slate-500 scale-[0.98]"
          }`}
        >
          Harian
        </button>
        <button
          onClick={() => handleTabSwitch("mingguan")}
          className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all duration-300 ${
            subTabLaporan === "mingguan"
              ? "bg-white text-indigo-600 shadow-[0_4px_15px_rgba(0,0,0,0.05)] scale-100"
              : "text-slate-400 hover:text-slate-500 scale-[0.98]"
          }`}
        >
          Mingguan
        </button>
      </div>

      {/* ======================================= */}
      {/* ========== HARIAN SECTION ============= */}
      {/* ======================================= */}
      {subTabLaporan === "harian" && (
        <div className="space-y-3 slide-up">
          {muridSemuaFilter.map((anak, i) => {
            const isExpanded = expandedId === anak.id;
            return (
              <div
                key={anak.id}
                className={`bg-white/90 backdrop-blur-xl rounded-[2rem] border transition-all duration-300 overflow-hidden ${
                  isExpanded
                    ? "border-indigo-100 shadow-[0_15px_40px_rgba(99,102,241,0.08)] mb-4"
                    : "border-white shadow-sm hover:shadow-md"
                }`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {/* Header Tombol */}
                <button
                  onClick={() => {
                    getaranHalus();
                    setExpandedId(isExpanded ? null : anak.id);
                    onSelectStudent(anak);
                  }}
                  className="w-full p-4 flex items-center justify-between active:scale-[0.98] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    {renderFoto(
                      anak,
                      "w-12 h-12 rounded-2xl object-cover border-2 border-slate-50 shadow-sm transition-transform group-hover:scale-105",
                    )}
                    <div className="text-left">
                      <span className="font-extrabold text-slate-800 text-sm block">
                        {anak.nama}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${
                          statusAnak[anak.id] === "hadir"
                            ? "text-emerald-500"
                            : statusAnak[anak.id] === "pulang"
                              ? "text-slate-400"
                              : "text-rose-400"
                        }`}
                      >
                        {statusAnak[anak.id] === "hadir"
                          ? "• Sedang di Kelas"
                          : statusAnak[anak.id] === "pulang"
                            ? "• Sudah Pulang"
                            : "• Belum Hadir"}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isExpanded
                        ? "bg-indigo-50 text-indigo-500 rotate-180"
                        : "bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-400"
                    }`}
                  >
                    <Down theme="outline" size={16} strokeWidth={4} />
                  </div>
                </button>

                {/* Konten Expand Harian */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-1 slide-up">
                    <div className="border-t border-slate-100/80 pt-4">
                      {/* Grid Waktu Datang & Pulang */}
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-3.5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
                            <Time theme="outline" size={16} strokeWidth={4} />
                          </div>
                          <div>
                            <p className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-widest">
                              Tiba
                            </p>
                            <p className="text-sm font-bold text-slate-700">
                              {kehadiranHarian[anak.id]?.waktu_datang
                                ? new Date(
                                    kehadiranHarian[anak.id]!
                                      .waktu_datang as string,
                                  ).toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "--:--"}
                            </p>
                          </div>
                        </div>
                        <div className="bg-orange-50/50 border border-orange-100/50 rounded-2xl p-3.5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                            <Time theme="outline" size={16} strokeWidth={4} />
                          </div>
                          <div>
                            <p className="text-[9px] text-orange-600 font-extrabold uppercase tracking-widest">
                              Pulang
                            </p>
                            <p className="text-sm font-bold text-slate-700">
                              {kehadiranHarian[anak.id]?.waktu_pulang
                                ? new Date(
                                    kehadiranHarian[anak.id]!
                                      .waktu_pulang as string,
                                  ).toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "--:--"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Daily Sheet Chips */}
                      {statusDailySheetHarian[anak.id] && (
                        <div className="mb-5">
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
                            Kondisi Anak
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {statusDailySheetHarian[anak.id].makan && (
                              <span className="bg-amber-50 border border-amber-100 text-amber-600 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm">
                                🍱 {statusDailySheetHarian[anak.id].makan}
                              </span>
                            )}
                            {statusDailySheetHarian[anak.id].tidur && (
                              <span className="bg-violet-50 border border-violet-100 text-violet-600 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm">
                                💤 {statusDailySheetHarian[anak.id].tidur}
                              </span>
                            )}
                            {statusDailySheetHarian[anak.id].mood && (
                              <span className="bg-rose-50 border border-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm">
                                {statusDailySheetHarian[anak.id].mood ===
                                "Senang"
                                  ? "😊"
                                  : statusDailySheetHarian[anak.id].mood ===
                                      "Biasa"
                                    ? "😐"
                                    : "😭"}{" "}
                                {statusDailySheetHarian[anak.id].mood}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Timeline Aktivitas */}
                      {logHarian[anak.id] && logHarian[anak.id].length > 0 && (
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                            Jurnal Aktivitas
                          </p>
                          <div className="border-l-2 border-indigo-50 ml-3 pl-5 space-y-4 relative">
                            {logHarian[anak.id].map(
                              (log: LogAktivitas, idx: number) => (
                                <div key={log.id || idx} className="relative">
                                  {/* Timeline Dot */}
                                  <div className="absolute -left-[27px] top-1 w-3 h-3 bg-white border-2 border-indigo-400 rounded-full"></div>

                                  <div className="flex items-start justify-between gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/80">
                                    <div className="flex-1">
                                      <span className="text-[10px] font-extrabold text-indigo-500 mb-1 block">
                                        {new Date(
                                          log.created_at,
                                        ).toLocaleTimeString("id-ID", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                      <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {log.deskripsi}
                                      </p>

                                      {/* Thumbnail Foto Premium */}
                                      {typeof log.metadata?.foto_url ===
                                        "string" && (
                                        <div className="mt-2 w-full max-w-[140px] aspect-square relative rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                          <img
                                            src={log.metadata.foto_url}
                                            alt="foto aktivitas"
                                            className="object-cover w-full h-full"
                                          />
                                        </div>
                                      )}
                                    </div>

                                    {/* Tombol Edit */}
                                    {statusAnak[anak.id] !== "pulang" && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          getaranHalus();
                                          onEditLog?.(log);
                                        }}
                                        className="p-2 text-slate-400 bg-white shadow-sm border border-slate-100 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all active:scale-90 shrink-0"
                                        title="Edit Aktivitas"
                                      >
                                        <Edit
                                          theme="outline"
                                          size={14}
                                          strokeWidth={4}
                                        />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================= */}
      {/* ========= MINGGUAN SECTION ============ */}
      {/* ======================================= */}
      {subTabLaporan === "mingguan" && (
        <div className="slide-up">
          {/* Floating Date Picker */}
          <div className="bg-white/90 backdrop-blur-xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-2 rounded-2xl flex items-center justify-between mb-6">
            <button
              onClick={() => {
                getaranHalus();
                onWeeklyOffsetChange(weeklyOffset - 1);
              }}
              className="p-3.5 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-500 rounded-xl active:scale-95 transition-all"
            >
              <ArrowLeft theme="outline" size={18} strokeWidth={4} />
            </button>
            <div className="flex items-center gap-2">
              <Calendar theme="outline" size={16} className="text-indigo-400" />
              <span className="font-extrabold text-xs text-slate-700">
                {getWeekRange(weeklyOffset).mondayDate.toLocaleDateString(
                  "id-ID",
                  {
                    day: "numeric",
                    month: "short",
                  },
                )}{" "}
                -{" "}
                {getWeekRange(weeklyOffset).sundayDate.toLocaleDateString(
                  "id-ID",
                  {
                    day: "numeric",
                    month: "short",
                  },
                )}
              </span>
            </div>
            <button
              onClick={() => {
                getaranHalus();
                onWeeklyOffsetChange(weeklyOffset + 1);
              }}
              className="p-3.5 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-500 rounded-xl active:scale-95 transition-all"
            >
              <ArrowRight theme="outline" size={18} strokeWidth={4} />
            </button>
          </div>

          <div className="space-y-3">
            {muridSemuaFilter.map((anak) => {
              const isExpanded = expandedId === anak.id;
              return (
                <div
                  key={anak.id}
                  className={`bg-white/90 backdrop-blur-xl rounded-[2rem] border transition-all duration-300 overflow-hidden ${
                    isExpanded
                      ? "border-indigo-100 shadow-[0_15px_40px_rgba(99,102,241,0.08)] mb-4"
                      : "border-white shadow-sm hover:shadow-md"
                  }`}
                >
                  {/* Header Tombol (Sama kerennya dengan Harian) */}
                  <button
                    onClick={() => {
                      getaranHalus();
                      setExpandedId(isExpanded ? null : anak.id);
                      if (!isExpanded) {
                        fetchWeeklyReportForChild(anak);
                      }
                    }}
                    className="w-full p-4 flex items-center justify-between active:scale-[0.98] transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      {renderFoto(
                        anak,
                        "w-12 h-12 rounded-2xl object-cover border-2 border-slate-50 shadow-sm transition-transform group-hover:scale-105",
                      )}
                      <span className="font-extrabold text-slate-800 text-sm">
                        {anak.nama}
                      </span>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isExpanded
                          ? "bg-indigo-50 text-indigo-500 rotate-180"
                          : "bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-400"
                      }`}
                    >
                      <Down theme="outline" size={16} strokeWidth={4} />
                    </div>
                  </button>

                  {/* Konten Expand Mingguan */}
                  {isExpanded && (
                    <div className="px-4 pb-5 slide-up">
                      <div className="border-t border-slate-100/80 pt-4">
                        {isLoadingWeekly ? (
                          <div className="flex flex-col items-center justify-center py-6 gap-3">
                            <Loading
                              className="animate-spin text-indigo-400"
                              size={28}
                              strokeWidth={4}
                            />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Menarik Data...
                            </span>
                          </div>
                        ) : weeklyData && weeklyData.anak.id === anak.id ? (
                          <div className="space-y-3">
                            {Object.entries(weeklyData.dailyMap).map(
                              ([date, data]: [string, any]) => {
                                const hari = new Date(date).toLocaleDateString(
                                  "id-ID",
                                  {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "short",
                                  },
                                );
                                return (
                                  <div
                                    key={date}
                                    className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl"
                                  >
                                    <div className="flex justify-between items-center mb-3">
                                      <span className="font-extrabold text-slate-700 text-xs">
                                        {hari}
                                      </span>
                                      <span
                                        className={`text-[9px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm ${
                                          data.hadir
                                            ? data.hadir.status_hadir ===
                                                "hadir" ||
                                              data.hadir.status_hadir ===
                                                "pulang"
                                              ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
                                              : "bg-rose-100 text-rose-600 border border-rose-200"
                                            : "bg-slate-200 text-slate-500 border border-slate-300"
                                        }`}
                                      >
                                        {data.hadir
                                          ? data.hadir.status_hadir === "pulang"
                                            ? "Hadir"
                                            : data.hadir.status_hadir
                                          : "Kosong"}
                                      </span>
                                    </div>

                                    {/* Rekap Kegiatan Mingguan */}
                                    {data.kegiatan.length > 0 ? (
                                      <ul className="text-[11px] font-semibold text-slate-600 space-y-1.5 ml-1 border-l-2 border-indigo-100 pl-3">
                                        {data.kegiatan.map(
                                          (k: any, i: number) => (
                                            <li
                                              key={i}
                                              className="line-clamp-2"
                                            >
                                              {k.deskripsi}
                                            </li>
                                          ),
                                        )}
                                      </ul>
                                    ) : (
                                      <p className="text-[10px] font-semibold text-slate-400 italic">
                                        Tidak ada catatan aktivitas.
                                      </p>
                                    )}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        ) : (
                          <p className="text-center text-xs text-slate-400 py-4 font-semibold">
                            Gagal memuat atau tidak ada data.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
