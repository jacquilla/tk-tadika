import { useState, useEffect } from "react";
import Image from "next/image";
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

export default function EditLogModal({
  log,
  onTutup,
  onSimpan,
  isSaving,
  tanggalHariIni,
}: Props) {
  const [deskripsi, setDeskripsi] = useState("");
  useEffect(() => {
    if (log) {
      setDeskripsi(log.deskripsi || "");
    }
  }, [log]);
  const [file, setFile] = useState<File | null>(null);
  const [metadata] = useState(log?.metadata || {});

  // Ambil jam dari log.created_at sebagai nilai awal
  const jamDariLog = log
    ? new Date(log.created_at).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";

  const [editedTime, setEditedTime] = useState(jamDariLog);

  if (!log) return null;

  const handleSimpan = async () => {
    const waktuBaru = editedTime
      ? new Date(editedTime).toISOString()
      : undefined;
    await onSimpan(log.id, deskripsi, metadata, file, waktuBaru);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-end justify-center sm:items-center sm:p-4 fade-in">
      {/* Modal Container dengan efek Glassmorphism Premium */}
      <div className="bg-white/95 backdrop-blur-xl w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col h-[85vh] sm:h-auto sm:max-h-[90vh] slide-up border border-white/60 relative overflow-hidden">
        {/* Dekorasi Latar Belakang (Subtle Glow) */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none"></div>

        {/* Handle for Mobile */}
        <div className="w-full flex justify-center pt-4 pb-1 sm:hidden relative z-10">
          <div className="w-12 h-1.5 bg-slate-200/80 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-7 py-5 flex justify-between items-center relative z-10 border-b border-slate-100/60">
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-3 truncate">
            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100">
              <Edit theme="outline" size={20} strokeWidth={4} />
            </div>
            Edit Aktivitas
          </h2>
          <button
            onClick={onTutup}
            className="w-10 h-10 flex items-center justify-center text-slate-400 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-all active:scale-90 border border-slate-100"
          >
            <Close theme="outline" size={20} strokeWidth={4} />
          </button>
        </div>

        {/* Body */}
        <div className="p-7 overflow-y-auto flex-1 hide-scrollbar flex flex-col gap-6 relative z-10">
          {/* Input Waktu */}
          <div className="group">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              Waktu Kegiatan
            </label>
            <div className="relative">
              <input
                type="time"
                className="w-full p-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-400 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.1)] transition-all text-slate-700 font-bold text-sm"
                value={editedTime}
                onChange={(e) => setEditedTime(e.target.value)}
              />
            </div>
            <p className="text-[10px] font-semibold text-slate-400 mt-2 flex items-center gap-1">
              🗓️ {tanggalHariIni} <span className="opacity-50">|</span> Hanya
              jam yang dapat diubah
            </p>
          </div>

          {/* Input Deskripsi (Warna text-slate-900 dipertahankan) */}
          <div className="group">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              Deskripsi
            </label>
            <textarea
              className="w-full p-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-400 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.1)] transition-all text-slate-900 font-semibold text-sm resize-y min-h-[120px] leading-relaxed"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          </div>

          {/* Input Foto */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              Foto (Opsional)
            </label>

            <div className="flex gap-3 mt-1">
              <label className="flex-1 flex flex-col items-center justify-center gap-1.5 p-4 bg-white text-indigo-500 font-bold text-xs rounded-2xl active:scale-95 transition-all cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 border-2 border-dashed border-indigo-200 shadow-sm">
                <Plus theme="outline" size={24} strokeWidth={3} />
                <span className="text-[10px] tracking-wide">Pilih Galeri</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>

              <label className="flex-1 flex flex-col items-center justify-center gap-1.5 p-4 bg-white text-indigo-500 font-bold text-xs rounded-2xl active:scale-95 transition-all cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 border-2 border-dashed border-indigo-200 shadow-sm">
                <Camera theme="outline" size={24} strokeWidth={3} />
                <span className="text-[10px] tracking-wide">Buka Kamera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            {/* Indikator Nama File Baru */}
            {file && (
              <div className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-xs font-semibold text-indigo-700 truncate">
                  {file.name}
                </p>
              </div>
            )}

            {/* Preview Foto Lama */}
            {!file && typeof log.metadata?.foto_url === "string" && (
              <div className="mt-4 relative w-full aspect-[4/3] group rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                <div className="absolute inset-0 bg-slate-900/10 z-10"></div>
                <Image
                  src={log.metadata.foto_url}
                  alt="foto"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                <div className="absolute bottom-3 left-3 z-20 bg-black/50 backdrop-blur-sm text-white text-[9px] px-2 py-1 rounded-md font-bold tracking-wider">
                  FOTO SAAT INI
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100/60 relative z-10 bg-white/50 backdrop-blur-sm">
          <button
            onClick={handleSimpan}
            disabled={isSaving || !deskripsi.trim()}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-extrabold py-4 rounded-2xl active:scale-[0.97] transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-200/50 btn-premium text-sm disabled:opacity-50 disabled:grayscale-[30%]"
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
            <span className="tracking-wide">Simpan Perubahan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
