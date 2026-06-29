import { useState } from "react";
import { Edit, Close, Loading, Save, Camera, Plus } from "@icon-park/react";
import type { LogAktivitas } from "../../types/database";

interface Props {
  log: LogAktivitas | null;
  onTutup: () => void;
  onSimpan: (
    logId: string,
    deskripsi: string,
    metadata: any,
    file?: File | null,
    waktuBaru?: string, // ISO string
  ) => Promise<void>;
  isSaving: boolean;
  tanggalHariIni: string; // "YYYY-MM-DD"
}

function toLocalDatetime(isoString?: string) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function EditLogModal({
  log,
  onTutup,
  onSimpan,
  isSaving,
  tanggalHariIni,
}: Props) {
  const [deskripsi, setDeskripsi] = useState(log?.deskripsi || "");
  const [file, setFile] = useState<File | null>(null);
  const [metadata] = useState(log?.metadata || {});

  const [editedTime, setEditedTime] = useState(
    log ? toLocalDatetime(log.created_at) : "",
  );

  if (!log) return null;

  const minDateTime = `${tanggalHariIni}T00:00`;
  const maxDateTime = `${tanggalHariIni}T23:59`;

  const handleSimpan = async () => {
    const waktuBaru = editedTime
      ? new Date(editedTime).toISOString()
      : undefined;
    await onSimpan(log.id, deskripsi, metadata, file, waktuBaru);
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-lg flex items-end justify-center sm:items-center sm:p-4 fade-in">
      <div className="bg-white w-full rounded-t-[3rem] sm:rounded-3xl shadow-2xl flex flex-col h-[80vh] sm:h-auto sm:max-h-[85vh] slide-up">
        {/* Handle */}
        <div className="w-full flex justify-center pt-4 pb-2 sm:hidden">
          <div className="w-16 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-3 truncate">
            <Edit
              theme="outline"
              size={28}
              strokeWidth={4}
              className="text-indigo-400"
            />
            Edit Aktivitas
          </h2>
          <button
            onClick={onTutup}
            className="p-3 text-slate-400 hover:bg-slate-100 rounded-2xl transition-colors active:scale-90"
          >
            <Close theme="outline" size={24} strokeWidth={4} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 hide-scrollbar flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              Waktu Kegiatan
            </label>
            <input
              type="datetime-local"
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-indigo-400 text-slate-700 font-semibold text-sm"
              value={editedTime}
              min={minDateTime}
              max={maxDateTime}
              onChange={(e) => setEditedTime(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Hanya jam dan menit yang dapat diubah (hari ini).
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              Deskripsi
            </label>
            <textarea
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-indigo-400 text-slate-700 font-semibold text-sm resize-y min-h-[100px]"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              Foto (opsional)
            </label>
            <div className="flex gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-indigo-50 text-indigo-600 font-extrabold text-xs rounded-2xl active:scale-95 transition-all cursor-pointer hover:bg-indigo-100 border-2 border-indigo-100">
                <Plus theme="outline" size={18} strokeWidth={4} />
                <span>Ganti Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-indigo-50 text-indigo-600 font-extrabold text-xs rounded-2xl active:scale-95 transition-all cursor-pointer hover:bg-indigo-100 border-2 border-indigo-100">
                <Camera theme="outline" size={18} strokeWidth={4} />
                <span>Kamera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            {file && <p className="text-xs text-slate-500 mt-2">{file.name}</p>}
            {!file && log.metadata?.foto_url && (
              <img
                src={log.metadata.foto_url}
                alt="foto"
                className="mt-2 rounded-xl max-h-32 object-cover"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100">
          <button
            onClick={handleSimpan}
            disabled={isSaving || !deskripsi.trim()}
            className="w-full bg-indigo-500 text-white font-extrabold py-5 rounded-2xl active:scale-[0.97] transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 btn-premium text-base disabled:opacity-70"
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
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
