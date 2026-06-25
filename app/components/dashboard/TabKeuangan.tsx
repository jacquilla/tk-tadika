import { Loading, Calendar, Message } from "@icon-park/react";

interface Props {
  muridSemuaFilter: any[];
  dapatkanStatusSpp: (anak: any) => string;
  handleResetDanTagihSppMassal: () => void;
  isResettingSpp: boolean;
  showUploadObj: Record<string, boolean>;
  strukFileObj: Record<string, File | null>;
  isUploadingStrukObj: Record<string, boolean>;
  setShowUploadObj: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  setStrukFileObj: React.Dispatch<
    React.SetStateAction<Record<string, File | null>>
  >;
  setIsUploadingStrukObj: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  bukaChatPersonal: (anak: any) => void;
  renderFoto: (anak: any, cls: string) => React.ReactNode;
  supabase: any;
  setStatusSppDinamis: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
}

export default function TabKeuangan({
  muridSemuaFilter,
  dapatkanStatusSpp,
  handleResetDanTagihSppMassal,
  isResettingSpp,
  showUploadObj,
  strukFileObj,
  isUploadingStrukObj,
  setShowUploadObj,
  setStrukFileObj,
  setIsUploadingStrukObj,
  bukaChatPersonal,
  renderFoto,
  supabase,
  setStatusSppDinamis,
}: Props) {
  return (
    <div className="space-y-5">
      <h2 className="font-extrabold text-slate-800 text-xl tracking-tight mb-4">
        Status SPP
      </h2>
      <div className="mb-6 slide-up">
        <button
          onClick={handleResetDanTagihSppMassal}
          disabled={isResettingSpp}
          className="w-full bg-slate-800 text-white p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:bg-slate-700 active:scale-95 transition-all shadow-2xl shadow-slate-200 disabled:opacity-50 btn-premium"
        >
          {isResettingSpp ? (
            <Loading
              theme="outline"
              size={32}
              className="animate-spin text-indigo-300"
            />
          ) : (
            <Calendar theme="outline" size={32} className="text-indigo-300" />
          )}
          <span className="font-bold text-lg tracking-wide">
            Mulai Penagihan Bulan Baru
          </span>
          <span className="text-xs text-slate-300 text-center font-medium leading-relaxed">
            Set semua murid menjadi menunggak & Kirim WA tagihan massal secara
            otomatis
          </span>
        </button>
      </div>

      <div className="space-y-4">
        {muridSemuaFilter.map((anak, i) => {
          const statusSpp = dapatkanStatusSpp(anak);
          const nominal = anak.nominal_spp || 350000;
          const strukUrl = anak.struk_url || "";
          const showUpload = showUploadObj[anak.id] || false;
          const strukFile = strukFileObj[anak.id] || null;
          const isUploadingStruk = isUploadingStrukObj[anak.id] || false;

          const setShowUpload = (val: boolean) =>
            setShowUploadObj((prev) => ({ ...prev, [anak.id]: val }));
          const setStrukFile = (f: File | null) =>
            setStrukFileObj((prev) => ({ ...prev, [anak.id]: f }));
          const setIsUploadingStruk = (val: boolean) =>
            setIsUploadingStrukObj((prev) => ({ ...prev, [anak.id]: val }));

          const handleUploadStruk = async () => {
            if (!strukFile) return alert("Pilih file struk!");
            setIsUploadingStruk(true);
            try {
              const formData = new FormData();
              formData.append("file", strukFile);
              const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
              });
              const data = await res.json();
              if (data.imageUrl) {
                await supabase
                  .from("murid")
                  .update({ status_spp: "LUNAS", struk_url: data.imageUrl })
                  .eq("id", anak.id);
                setStatusSppDinamis((prev) => ({
                  ...prev,
                  [anak.id]: "LUNAS",
                }));
                setShowUpload(false);
                setStrukFile(null);
                alert(
                  "Bukti bayar berhasil diunggah. Status SPP menjadi LUNAS.",
                );
              } else alert("Gagal upload struk.");
            } catch {
              alert("Gagal upload struk.");
            } finally {
              setIsUploadingStruk(false);
            }
          };

          return (
            <div
              key={anak.id}
              className="bg-white/90 backdrop-blur p-5 rounded-[2rem] shadow-md border border-white/60 slide-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {renderFoto(
                    anak,
                    "w-14 h-14 rounded-2xl border-2 border-white object-cover shadow-sm",
                  )}
                  <div>
                    <span className="font-bold text-slate-800 text-base">
                      {anak.nama}
                    </span>
                    <div className="text-xs text-slate-500 mt-1">
                      Nominal:{" "}
                      <span className="font-bold text-slate-700">
                        Rp {nominal.toLocaleString("id-ID")}
                      </span>
                      {strukUrl && (
                        <a
                          href={strukUrl}
                          target="_blank"
                          className="ml-2 text-indigo-600 underline"
                        >
                          Lihat Bukti
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => bukaChatPersonal(anak)}
                    className="bg-indigo-50 text-indigo-500 p-1.5 rounded-2xl hover:bg-indigo-100 transition-all active:scale-95"
                  >
                    <Message theme="outline" size={16} strokeWidth={4} />
                  </button>
                  {statusSpp === "MENUNGGAK" ? (
                    <button
                      onClick={() => setShowUpload(!showUpload)}
                      className="bg-amber-50 text-amber-600 font-bold text-xs px-4 py-2 rounded-xl border border-amber-200 active:scale-95 transition-all"
                    >
                      Upload Bukti
                    </button>
                  ) : (
                    <span className="px-6 py-3 rounded-2xl font-bold text-xs bg-emerald-50 text-emerald-600 border border-emerald-100">
                      LUNAS
                    </span>
                  )}
                </div>
              </div>
              {showUpload && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setStrukFile(e.target.files?.[0] || null)}
                    className="flex-1 text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:font-bold file:bg-indigo-50 file:text-indigo-600"
                  />
                  <button
                    onClick={handleUploadStruk}
                    disabled={isUploadingStruk || !strukFile}
                    className="bg-emerald-500 text-white font-extrabold text-xs px-5 py-2 rounded-xl active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isUploadingStruk ? "..." : "Konfirmasi"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
