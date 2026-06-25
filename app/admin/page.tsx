"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "0000";

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [autentikasi, setAutentikasi] = useState(false);
  const [error, setError] = useState("");

  const [murid, setMurid] = useState<any[]>([]);
  const [namaBaru, setNamaBaru] = useState("");
  const [kelasBaru, setKelasBaru] = useState("mawar");
  const [noHpBaru, setNoHpBaru] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [totalHadir, setTotalHadir] = useState(0);
  const [totalLunas, setTotalLunas] = useState(0);
  const [totalMurid, setTotalMurid] = useState(0);

  const handleLogin = () => {
    if (pin === ADMIN_PIN) {
      setAutentikasi(true);
      setError("");
    } else {
      setError("PIN salah");
    }
  };

  const ambilData = async () => {
    const { data } = await supabase.from("murid").select("*").order("nama");
    if (data) setMurid(data);

    const today = new Date().toISOString().split("T")[0];
    const { count: hadir } = await supabase
      .from("kehadiran")
      .select("*", { count: "exact", head: true })
      .eq("tanggal", today)
      .eq("status_hadir", "hadir");
    setTotalHadir(hadir || 0);

    const { count: lunas } = await supabase
      .from("murid")
      .select("*", { count: "exact", head: true })
      .eq("status_spp", "LUNAS");
    setTotalLunas(lunas || 0);
    setTotalMurid(data?.length || 0);
  };

  const tambahMurid = async () => {
    if (!namaBaru.trim() || !noHpBaru.trim())
      return alert("Isi nama dan nomor HP!");
    let fotoUrl = "";
    if (fotoFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", fotoFile);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.imageUrl) {
          fotoUrl = data.imageUrl;
        } else {
          alert("Gagal upload foto: " + data.error);
          setUploading(false);
          return;
        }
      } catch (err) {
        alert("Gagal upload foto.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    await supabase.from("murid").insert([
      {
        nama: namaBaru,
        kelas: kelasBaru,
        nomor_hp_ortu: noHpBaru,
        status_spp: "LUNAS",
        foto_url: fotoUrl || null,
      },
    ]);
    setNamaBaru("");
    setNoHpBaru("");
    setFotoFile(null);
    ambilData();
  };

  const hapusMurid = async (id: string) => {
    if (!confirm("Hapus murid ini?")) return;
    await supabase.from("murid").delete().eq("id", id);
    ambilData();
  };

  const pindahKelas = async (id: string, kelasSekarang: string) => {
    const baru = kelasSekarang === "mawar" ? "melati" : "mawar";
    await supabase.from("murid").update({ kelas: baru }).eq("id", id);
    ambilData();
  };

  useEffect(() => {
    if (autentikasi) ambilData();
  }, [autentikasi]);

  // ========== UI ==========
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif; background: #F8FAFC; }
        .glass-panel { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        .fade-in { animation: fadeIn 0.5s ease-out forwards; }
        .slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes slideUp { 0% { opacity: 0; transform: translateY(40px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        .btn-premium { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 12px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.02); }
        .btn-premium:active { transform: scale(0.96); box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
        .btn-premium:hover { box-shadow: 0 12px 24px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.04); transform: translateY(-1px); }
      `,
        }}
      />

      {!autentikasi ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-900/30 to-slate-900/50 backdrop-blur-[8px]">
          <div className="w-full max-w-sm mx-auto p-8 glass-panel rounded-[3rem] shadow-2xl fade-in">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-extrabold text-slate-800">
                🔐 Admin
              </h1>
              <p className="text-slate-500 text-xs font-bold mt-2">
                Masukkan PIN untuk mengakses
              </p>
            </div>
            <input
              type="password"
              inputMode="numeric"
              placeholder="PIN Admin"
              className="w-full py-4 text-center text-2xl font-bold border-2 border-slate-200 rounded-2xl mb-4 outline-none focus:border-indigo-400 bg-white/80"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              autoFocus
            />
            {error && (
              <p className="text-rose-500 text-sm font-bold text-center mb-4">
                {error}
              </p>
            )}
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-extrabold py-4 rounded-2xl text-base active:scale-95 transition-all btn-premium"
            >
              Masuk
            </button>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-slate-50/80 p-6 fade-in">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-extrabold text-slate-800">
                🏫 Dashboard Admin
              </h1>
              <button
                onClick={() => setAutentikasi(false)}
                className="text-slate-500 font-bold hover:text-slate-700 transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Ringkasan */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="glass-panel p-4 rounded-2xl shadow-md text-center slide-up">
                <p className="text-xs text-slate-500">Total Murid</p>
                <p className="text-2xl font-extrabold text-slate-800">
                  {totalMurid}
                </p>
              </div>
              <div className="flex justify-end mb-8">
                <a
                  href="/api/export"
                  className="bg-emerald-500 text-white font-extrabold py-3 px-6 rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all btn-premium text-sm flex items-center gap-2"
                >
                  📥 Unduh Laporan Excel
                </a>
              </div>
              <div
                className="glass-panel p-4 rounded-2xl shadow-md text-center slide-up"
                style={{ animationDelay: "0.1s" }}
              >
                <p className="text-xs text-slate-500">Hadir Hari Ini</p>
                <p className="text-2xl font-extrabold text-emerald-600">
                  {totalHadir}
                </p>
              </div>
              <div
                className="glass-panel p-4 rounded-2xl shadow-md text-center slide-up"
                style={{ animationDelay: "0.2s" }}
              >
                <p className="text-xs text-slate-500">SPP Lunas</p>
                <p className="text-2xl font-extrabold text-indigo-600">
                  {totalLunas}/{totalMurid}
                </p>
              </div>
            </div>

            {/* Tambah Murid */}
            <div className="glass-panel p-6 rounded-[2rem] shadow-md mb-8 slide-up">
              <h2 className="text-lg font-extrabold mb-4 text-slate-800">
                ➕ Tambah Murid
              </h2>
              <div className="flex flex-col gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Nama Murid"
                  className="w-full p-4 bg-white/80 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400"
                  value={namaBaru}
                  onChange={(e) => setNamaBaru(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Nomor HP Orang Tua"
                  className="w-full p-4 bg-white/80 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400"
                  value={noHpBaru}
                  onChange={(e) => setNoHpBaru(e.target.value)}
                />
                <div className="flex gap-2 items-center">
                  <select
                    className="flex-1 p-4 bg-white/80 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400"
                    value={kelasBaru}
                    onChange={(e) => setKelasBaru(e.target.value)}
                  >
                    <option value="mawar">Kelas Mawar</option>
                    <option value="melati">Kelas Melati</option>
                  </select>
                  <label className="flex-1 p-4 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-pointer bg-white/80 text-center hover:border-indigo-300 transition-colors">
                    📷 {fotoFile ? fotoFile.name : "Upload Foto"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>
              <button
                onClick={tambahMurid}
                disabled={uploading}
                className="w-full bg-indigo-500 text-white font-extrabold py-4 rounded-2xl active:scale-95 transition-all btn-premium text-base disabled:opacity-50"
              >
                {uploading ? "Mengupload..." : "Simpan Murid"}
              </button>
            </div>

            {/* Daftar Murid */}
            <div className="glass-panel p-6 rounded-[2rem] shadow-md slide-up">
              <h2 className="text-lg font-extrabold mb-4 text-slate-800">
                📋 Daftar Murid
              </h2>
              {murid.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        m.foto_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(m.nama)}&background=EEF2FF&color=4F46E5&size=40`
                      }
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                      alt={m.nama}
                    />
                    <div>
                      <p className="font-bold text-slate-800">{m.nama}</p>
                      <p className="text-xs text-slate-500">
                        {m.kelas} · {m.nomor_hp_ortu}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => pindahKelas(m.id, m.kelas)}
                      className="text-xs bg-indigo-50 text-indigo-600 font-bold px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors"
                    >
                      Pindah Kelas
                    </button>
                    <button
                      onClick={() => hapusMurid(m.id)}
                      className="text-xs bg-rose-50 text-rose-600 font-bold px-3 py-1.5 rounded-xl hover:bg-rose-100 transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
