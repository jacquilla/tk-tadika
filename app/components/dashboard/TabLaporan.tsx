import {
  ArrowLeft,
  ArrowRight,
  Loading,
  ArrowRight as ArrowRightIcon,
} from "@icon-park/react";

interface Props {
  subTabLaporan: "harian" | "mingguan";
  onSubTabChange: (sub: "harian" | "mingguan") => void;
  kehadiranHarian: Record<string, any>;
  muridSemuaFilter: any[];
  selectedStudentReport: any;
  onSelectStudent: (anak: any) => void;
  statusAnak: Record<string, string>;
  logKegiatan: Record<string, any[]>;
  statusDailySheetHarian: Record<string, any>;
  weeklyOffset: number;
  onWeeklyOffsetChange: (offset: number) => void;
  fetchWeeklyReportForChild: (anak: any) => void;
  weeklyData: any;
  isLoadingWeekly: boolean;
  renderFoto: (anak: any, cls: string) => React.ReactNode;
  getWeekRange: (offset: number) => {
    start: string;
    end: string;
    mondayDate: Date;
    sundayDate: Date;
  };
  logHarian: Record<string, any[]>; // ← BARU
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
  logHarian, // ← BARU
}: Props) {
  return (
    <div className="space-y-6">
      <h2 className="font-extrabold text-slate-800 text-xl tracking-tight mb-2">
        Laporan
      </h2>
      <div className="flex gap-2 bg-slate-100/80 p-1 rounded-2xl mb-4">
        <button
          onClick={() => onSubTabChange("harian")}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${subTabLaporan === "harian" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
        >
          Harian
        </button>
        <button
          onClick={() => onSubTabChange("mingguan")}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${subTabLaporan === "mingguan" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
        >
          Mingguan
        </button>
      </div>

      {subTabLaporan === "harian" && (
        <>
          <p className="text-xs font-bold text-slate-500">
            Klik anak untuk melihat laporan hari ini
          </p>
          <div className="space-y-3">
            {muridSemuaFilter.map((anak) => (
              <button
                key={anak.id}
                onClick={() => onSelectStudent(anak)}
                className="w-full bg-white/80 backdrop-blur p-4 rounded-2xl shadow-sm border border-white/60 flex items-center justify-between active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-4">
                  {renderFoto(
                    anak,
                    "w-12 h-12 rounded-xl object-cover border border-slate-100",
                  )}
                  <span className="font-bold text-slate-800 text-sm">
                    {anak.nama}
                  </span>
                </div>
                <ArrowRightIcon
                  theme="outline"
                  size={20}
                  className="text-slate-400"
                />
              </button>
            ))}
          </div>
          {selectedStudentReport && (
            <div className="mt-4 p-5 bg-white/90 backdrop-blur rounded-[2rem] shadow-md border border-white/60 slide-up">
              <h3 className="font-extrabold text-indigo-700 text-base mb-3">
                Laporan Hari Ini: {selectedStudentReport.nama}
              </h3>
              <div className="space-y-2 text-xs text-slate-700">
                <p>
                  <span className="font-bold">Status:</span>{" "}
                  {statusAnak[selectedStudentReport.id] === "hadir"
                    ? "Hadir"
                    : statusAnak[selectedStudentReport.id] === "pulang"
                      ? "Sudah Pulang"
                      : "Belum Hadir"}
                </p>
                {kehadiranHarian[selectedStudentReport.id] && (
                  <>
                    <p>
                      <span className="font-bold">Datang:</span>{" "}
                      {kehadiranHarian[selectedStudentReport.id].waktu_datang
                        ? new Date(
                            kehadiranHarian[selectedStudentReport.id]
                              .waktu_datang,
                          ).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </p>
                    <p>
                      <span className="font-bold">Pulang:</span>{" "}
                      {kehadiranHarian[selectedStudentReport.id].waktu_pulang
                        ? new Date(
                            kehadiranHarian[selectedStudentReport.id]
                              .waktu_pulang,
                          ).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </p>
                  </>
                )}{" "}
                {logHarian[selectedStudentReport.id] && (
                  <div>
                    <span className="font-bold">Aktivitas:</span>
                    <ul className="list-disc pl-5 mt-1">
                      {logHarian[selectedStudentReport.id].map(
                        (log: any, idx: number) => (
                          <li key={idx}>
                            [
                            {new Date(log.created_at).toLocaleTimeString(
                              "id-ID",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                            ] {log.deskripsi}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
                {statusDailySheetHarian[selectedStudentReport.id] && (
                  <div>
                    <span className="font-bold">Daily Sheet:</span>
                    <div className="flex gap-3 mt-1">
                      {statusDailySheetHarian[selectedStudentReport.id]
                        .makan && (
                        <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-lg text-[10px] font-bold">
                          🍱{" "}
                          {
                            statusDailySheetHarian[selectedStudentReport.id]
                              .makan
                          }
                        </span>
                      )}
                      {statusDailySheetHarian[selectedStudentReport.id]
                        .tidur && (
                        <span className="bg-violet-100 text-violet-800 px-2 py-1 rounded-lg text-[10px] font-bold">
                          💤{" "}
                          {
                            statusDailySheetHarian[selectedStudentReport.id]
                              .tidur
                          }
                        </span>
                      )}
                      {statusDailySheetHarian[selectedStudentReport.id]
                        .mood && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-[10px] font-bold">
                          😊{" "}
                          {
                            statusDailySheetHarian[selectedStudentReport.id]
                              .mood
                          }
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {subTabLaporan === "mingguan" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => onWeeklyOffsetChange(weeklyOffset - 1)}
              className="p-3 bg-white/80 border border-slate-200 rounded-xl active:scale-95"
            >
              <ArrowLeft theme="outline" size={20} className="text-slate-600" />
            </button>
            <span className="font-bold text-xs bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600">
              {getWeekRange(weeklyOffset).mondayDate.toLocaleDateString(
                "id-ID",
                { day: "numeric", month: "short" },
              )}{" "}
              -{" "}
              {getWeekRange(weeklyOffset).sundayDate.toLocaleDateString(
                "id-ID",
                { day: "numeric", month: "short" },
              )}
            </span>
            <button
              onClick={() => onWeeklyOffsetChange(weeklyOffset + 1)}
              className="p-3 bg-white/80 border border-slate-200 rounded-xl active:scale-95"
            >
              <ArrowRight
                theme="outline"
                size={20}
                className="text-slate-600"
              />
            </button>
          </div>
          <p className="text-xs font-bold text-slate-500 mb-2">
            Klik anak untuk melihat laporan mingguan
          </p>
          <div className="space-y-3">
            {muridSemuaFilter.map((anak) => (
              <button
                key={anak.id}
                onClick={() => fetchWeeklyReportForChild(anak)}
                className="w-full bg-white/80 backdrop-blur p-4 rounded-2xl shadow-sm border border-white/60 flex items-center justify-between active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-4">
                  {renderFoto(
                    anak,
                    "w-12 h-12 rounded-xl object-cover border border-slate-100",
                  )}
                  <span className="font-bold text-slate-800 text-sm">
                    {anak.nama}
                  </span>
                </div>
                <ArrowRightIcon
                  theme="outline"
                  size={20}
                  className="text-slate-400"
                />
              </button>
            ))}
          </div>
          {isLoadingWeekly && (
            <div className="flex justify-center py-8">
              <Loading className="animate-spin text-indigo-500" size={32} />
            </div>
          )}
          {weeklyData && !isLoadingWeekly && (
            <div className="mt-4 p-5 bg-white/90 backdrop-blur rounded-[2rem] shadow-md border border-white/60 slide-up">
              <h3 className="font-extrabold text-indigo-700 text-base mb-4">
                Laporan Mingguan: {weeklyData.anak.nama}
              </h3>
              <div className="space-y-4">
                {Object.entries(weeklyData.dailyMap).map(
                  ([date, data]: [string, any]) => {
                    const hari = new Date(date).toLocaleDateString("id-ID", {
                      weekday: "short",
                      day: "numeric",
                    });
                    return (
                      <div key={date} className="p-3 bg-slate-50/80 rounded-xl">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-extrabold text-slate-700 text-xs">
                            {hari}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${data.hadir ? (data.hadir.status_hadir === "hadir" || data.hadir.status_hadir === "pulang" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700") : "bg-slate-200 text-slate-600"}`}
                          >
                            {data.hadir
                              ? data.hadir.status_hadir === "pulang"
                                ? "Pulang"
                                : data.hadir.status_hadir
                              : "Tanpa Data"}
                          </span>
                        </div>
                        {data.kegiatan.length > 0 && (
                          <ul className="text-[10px] text-slate-600 list-disc pl-4">
                            {data.kegiatan.map((k: any, i: number) => (
                              <li key={i}>{k.deskripsi}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
