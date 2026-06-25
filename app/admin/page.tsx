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

  // Murid
  const [murid, setMurid] = useState<any[]>([]);
  const [namaBaru, setNamaBaru] = useState("");
  const [kelasBaru, setKelasBaru] = useState("mawar");
  const [noHpBaru, setNoHpBaru] = useState("");
  const [nominalBaru, setNominalBaru] = useState("350000");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Edit murid
  const [editId, setEditId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editKelas, setEditKelas] = useState("mawar");
  const [editNoHp, setEditNoHp] = useState("");
  const [editNominal, setEditNominal] = useState("");
  const [editFoto, setEditFoto] = useState<File | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Guru
  const [guru, setGuru] = useState<any[]>([]);
  const [namaGuruBaru, setNamaGuruBaru] = useState("");
  const [pinGuruBaru, setPinGuruBaru] = useState("");
  const [editPinId, setEditPinId] = useState<string | null>(null);
  const [editPinBaru, setEditPinBaru] = useState("");

  // Ringkasan
  const [totalHadir, setTotalHadir] = useState(0);
  const [totalLunas, setTotalLunas] = useState(0);
  const [totalMurid, setTotalMurid] = useState(0);

  // Grafik kehadiran 7 hari
  const [chartHadir, setChartHadir] = useState<number[]>([]);
  const [chartLabel, setChartLabel] = useState<string[]>([]);

  // Log admin & riwayat SPP
  const [logAdmin, setLogAdmin] = useState<any[]>([]);
  const [riwayatSpp, setRiwayatSpp] = useState<any[]>([]);
  const [tabAdmin, setTabAdmin] = useState<"utama" | "log" | "riwayat">(
    "utama",
  );

  // Pengumuman massal
  const [bukaPengumuman, setBukaPengumuman] = useState(false);
  const [teksPengumuman, setTeksPengumuman] = useState("");

  const handleLogin = () => {
    if (pin === ADMIN_PIN) {
      setAutentikasi(true);
      setError("");
    } else setError("PIN salah");
  };

  const catatLog = async (aksi: string, detail: string = "") => {
    await supabase.from("log_admin").insert([{ aksi, detail }]);
    ambilLog(); // refresh log
  };

  const ambilLog = async () => {
    const { data } = await supabase
      .from("log_admin")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setLogAdmin(data);
  };

  const ambilRiwayatSpp = async () => {
    const { data } = await supabase
      .from("riwayat_spp")
      .select("*, murid(nama)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setRiwayatSpp(data);
  };

  const ambilData = async () => {
    // Murid
    const { data: muridData } = await supabase
      .from("murid")
      .select("*")
      .order("nama");
    if (muridData) setMurid(muridData);

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
    setTotalMurid(muridData?.length || 0);

    // Guru
    const { data: guruData } = await supabase
      .from("guru")
      .select("*")
      .order("nama");
    if (guruData) setGuru(guruData);

    // Grafik 7 hari
    const labels: string[] = [];
    const values: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const tgl = d.toISOString().split("T")[0];
      labels.push(
        new Date(tgl).toLocaleDateString("id-ID", { weekday: "short" }),
      );
      const { count } = await supabase
        .from("kehadiran")
        .select("*", { count: "exact", head: true })
        .eq("tanggal", tgl)
        .eq("status_hadir", "hadir");
      values.push(count || 0);
    }
    setChartLabel(labels);
    setChartHadir(values);

    ambilLog();
    ambilRiwayatSpp();
  };

  // ---------- Murid ----------
  const tambahMurid = async () => {
    if (!namaBaru.trim() || !noHpBaru.trim() || !nominalBaru.trim())
      return alert("Isi nama, nomor HP, dan nominal SPP!");
    let fotoUrl = "";
    if (fotoFile) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", fotoFile);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await res.json();
        if (d.imageUrl) fotoUrl = d.imageUrl;
        else {
          alert("Gagal upload foto: " + d.error);
          setUploading(false);
          return;
        }
      } catch {
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
        nominal_spp: parseInt(nominalBaru) || 350000,
        status_spp: "LUNAS",
        foto_url: fotoUrl || null,
      },
    ]);
    setNamaBaru("");
    setNoHpBaru("");
    setNominalBaru("350000");
    setFotoFile(null);
    catatLog("Tambah Murid", `Menambahkan ${namaBaru} ke kelas ${kelasBaru}`);
    ambilData();
  };

  const bukaEdit = (m: any) => {
    setEditId(m.id);
    setEditNama(m.nama);
    setEditKelas(m.kelas);
    setEditNoHp(m.nomor_hp_ortu);
    setEditNominal(String(m.nominal_spp || 350000));
    setEditFoto(null);
  };

  const simpanEdit = async () => {
    if (!editNama.trim() || !editNoHp.trim())
      return alert("Nama dan No HP wajib diisi.");
    setSavingEdit(true);
    let fotoUrl = "";
    if (editFoto) {
      const fd = new FormData();
      fd.append("file", editFoto);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (d.imageUrl) fotoUrl = d.imageUrl;
      else {
        alert("Gagal upload foto: " + d.error);
        setSavingEdit(false);
        return;
      }
    }
    const update: any = {
      nama: editNama,
      kelas: editKelas,
      nomor_hp_ortu: editNoHp,
      nominal_spp: parseInt(editNominal) || 350000,
    };
    if (fotoUrl) update.foto_url = fotoUrl;
    await supabase.from("murid").update(update).eq("id", editId!);
    catatLog("Edit Murid", `Mengedit data murid ID ${editId}`);
    setEditId(null);
    setSavingEdit(false);
    ambilData();
  };

  const hapusMurid = async (id: string, nama: string) => {
    if (!confirm(`Hapus murid ${nama}?`)) return;
    await supabase.from("murid").delete().eq("id", id);
    catatLog("Hapus Murid", `Menghapus murid ${nama}`);
    ambilData();
  };

  const pindahKelas = async (id: string, nama: string, kelasLama: string) => {
    const baru = kelasLama === "mawar" ? "melati" : "mawar";
    await supabase.from("murid").update({ kelas: baru }).eq("id", id);
    catatLog(
      "Pindah Kelas",
      `${nama} dipindahkan dari ${kelasLama} ke ${baru}`,
    );
    ambilData();
  };

  // ---------- Guru ----------
  const tambahGuru = async () => {
    if (!namaGuruBaru.trim() || !pinGuruBaru.trim())
      return alert("Nama dan PIN wajib diisi.");
    const { data: exist } = await supabase
      .from("guru")
      .select("id")
      .eq("pin_login", pinGuruBaru)
      .maybeSingle();
    if (exist) return alert("PIN sudah digunakan guru lain.");
    await supabase
      .from("guru")
      .insert([{ nama: namaGuruBaru, pin_login: pinGuruBaru }]);
    setNamaGuruBaru("");
    setPinGuruBaru("");
    catatLog("Tambah Guru", `Menambahkan guru ${namaGuruBaru}`);
    ambilData();
  };

  const hapusGuru = async (id: string, nama: string) => {
    if (!confirm(`Hapus guru ${nama}?`)) return;
    await supabase.from("guru").delete().eq("id", id);
    catatLog("Hapus Guru", `Menghapus guru ${nama}`);
    ambilData();
  };

  const gantiPinGuru = async (id: string, nama: string) => {
    if (!editPinBaru.trim()) return alert("Masukkan PIN baru.");
    await supabase.from("guru").update({ pin_login: editPinBaru }).eq("id", id);
    catatLog("Ganti PIN Guru", `Mengganti PIN guru ${nama}`);
    setEditPinId(null);
    setEditPinBaru("");
    ambilData();
  };

  // ---------- Pengumuman Massal ----------
  const kirimPengumumanMassal = async () => {
    if (!teksPengumuman.trim()) return alert("Tulis pesan pengumuman.");
    const semua = murid.map((m) => m.nomor_hp_ortu).filter(Boolean);
    for (const hp of semua) {
      await fetch("/api/wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetHp: hp,
          pesanCustom: `📢 *PENGUMUMAN SEKOLAH*\n\n${teksPengumuman}`,
        }),
      });
    }
    alert("Pengumuman terkirim ke semua orang tua!");
    setBukaPengumuman(false);
    setTeksPengumuman("");
    catatLog(
      "Pengumuman Massal",
      `Mengirim pengumuman ke ${semua.length} orang tua`,
    );
  };

  // ---------- Ekspor ----------
  const unduhCSV = (data: any[], kolom: string[], namaFile: string) => {
    let csv = kolom.join(",") + "\n";
    data.forEach((row) => {
      csv += kolom.map((k) => `"${row[k] || ""}"`).join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = namaFile;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEksporLengkap = () => {
    // Ekspor murid
    const dataMurid = murid.map((m) => ({
      nama: m.nama,
      kelas: m.kelas,
      no_hp: m.nomor_hp_ortu,
      spp: m.status_spp,
      nominal: m.nominal_spp,
    }));
    unduhCSV(
      dataMurid,
      ["nama", "kelas", "no_hp", "spp", "nominal"],
      "data-murid.csv",
    );

    // Ekspor riwayat SPP
    const dataRiwayat = riwayatSpp.map((r) => ({
      murid: (r.murid as any)?.nama || "-",
      sebelum: r.status_sebelum,
      sesudah: r.status_sesudah,
      nominal: r.nominal,
      tanggal: new Date(r.created_at).toLocaleString("id-ID"),
    }));
    unduhCSV(
      dataRiwayat,
      ["murid", "sebelum", "sesudah", "nominal", "tanggal"],
      "riwayat-spp.csv",
    );

    // Ekspor log admin
    const dataLog = logAdmin.map((l) => ({
      aksi: l.aksi,
      detail: l.detail,
      waktu: new Date(l.created_at).toLocaleString("id-ID"),
    }));
    unduhCSV(dataLog, ["aksi", "detail", "waktu"], "log-admin.csv");
  };

  useEffect(() => {
    if (autentikasi) ambilData();
  }, [autentikasi]);

  // ========== UI ==========
  if (!autentikasi)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-900/30 to-slate-900/50 backdrop-blur-[8px]">
        <div className="w-full max-w-sm mx-auto p-8 glass-panel rounded-[3rem] shadow-2xl fade-in">
          <h1 className="text-3xl font-extrabold text-slate-800 text-center mb-6">
            🔐 Admin
          </h1>
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
    );

  return (
    <div className="min-h-screen bg-slate-50/80 p-6 fade-in">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800">
            🏫 Dashboard Admin
          </h1>
          <button
            onClick={() => setAutentikasi(false)}
            className="text-slate-500 font-bold hover:text-slate-700"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "utama", label: "📊 Utama" },
            { id: "log", label: "📜 Log" },
            { id: "riwayat", label: "💰 Riwayat SPP" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTabAdmin(t.id as any)}
              className={`px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all ${tabAdmin === t.id ? "bg-white shadow text-indigo-600" : "text-slate-500"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tabAdmin === "utama" && (
          <>
            {/* Ringkasan & Grafik */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="glass-panel p-4 rounded-2xl shadow-md text-center slide-up">
                <p className="text-xs text-slate-500">Total Murid</p>
                <p className="text-2xl font-extrabold text-slate-800">
                  {totalMurid}
                </p>
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

            <div className="glass-panel p-4 rounded-2xl shadow-md mb-6 slide-up">
              <p className="text-xs font-bold text-slate-500 mb-2">
                📊 Kehadiran 7 Hari Terakhir
              </p>
              <div className="flex items-end gap-1 h-20">
                {chartLabel.map((l, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 mb-1">
                      {chartHadir[i]}
                    </span>
                    <div
                      className="w-full bg-indigo-400 rounded-t-md"
                      style={{
                        height: `${Math.min((chartHadir[i] / (totalMurid || 1)) * 100, 100)}%`,
                      }}
                    ></div>
                    <span className="text-[8px] text-slate-400 mt-1">{l}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end mb-8">
              <button
                onClick={() => setBukaPengumuman(true)}
                className="bg-amber-500 text-white font-extrabold py-3 px-5 rounded-2xl shadow-lg shadow-amber-200 active:scale-95 transition-all btn-premium text-sm"
              >
                📢 Pengumuman Massal
              </button>
              <a
                href="/api/export"
                className="bg-emerald-500 text-white font-extrabold py-3 px-5 rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all btn-premium text-sm flex items-center gap-2"
              >
                📥 Unduh Kehadiran
              </a>
              <button
                onClick={handleEksporLengkap}
                className="bg-indigo-500 text-white font-extrabold py-3 px-5 rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all btn-premium text-sm"
              >
                📦 Ekspor Lengkap
              </button>
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
                  className="w-full p-4 bg-white/80 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400 text-slate-700"
                  value={namaBaru}
                  onChange={(e) => setNamaBaru(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Nomor HP Orang Tua"
                  className="w-full p-4 bg-white/80 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400 text-slate-700"
                  value={noHpBaru}
                  onChange={(e) => setNoHpBaru(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Nominal SPP"
                  className="w-full p-4 bg-white/80 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400 text-slate-700"
                  value={nominalBaru}
                  onChange={(e) => setNominalBaru(e.target.value)}
                />
                <div className="flex gap-2 items-center">
                  <select
                    className="flex-1 p-4 bg-white/80 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400 text-slate-700"
                    value={kelasBaru}
                    onChange={(e) => setKelasBaru(e.target.value)}
                  >
                    <option value="mawar">Kelas Mawar</option>
                    <option value="melati">Kelas Melati</option>
                  </select>
                  <label className="flex-1 p-4 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-pointer bg-white/80 text-center hover:border-indigo-300">
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
            <div className="glass-panel p-6 rounded-[2rem] shadow-md slide-up mb-8">
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
                      className="w-10 h-10 rounded-xl object-cover border"
                    />
                    <div>
                      <p className="font-bold text-slate-800">{m.nama}</p>
                      <p className="text-xs text-slate-500">
                        {m.kelas} · {m.nomor_hp_ortu} · Rp{" "}
                        {m.nominal_spp?.toLocaleString("id-ID") || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => bukaEdit(m)}
                      className="text-xs bg-amber-50 text-amber-600 font-bold px-3 py-1.5 rounded-xl hover:bg-amber-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => pindahKelas(m.id, m.nama, m.kelas)}
                      className="text-xs bg-indigo-50 text-indigo-600 font-bold px-3 py-1.5 rounded-xl hover:bg-indigo-100"
                    >
                      Pindah
                    </button>
                    <button
                      onClick={() => hapusMurid(m.id, m.nama)}
                      className="text-xs bg-rose-50 text-rose-600 font-bold px-3 py-1.5 rounded-xl hover:bg-rose-100"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Manajemen Guru */}
            <div className="glass-panel p-6 rounded-[2rem] shadow-md slide-up">
              <h2 className="text-lg font-extrabold mb-4 text-slate-800">
                👩‍🏫 Manajemen Guru
              </h2>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Nama Guru"
                  className="flex-1 p-3 bg-white/80 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400 text-slate-700"
                  value={namaGuruBaru}
                  onChange={(e) => setNamaGuruBaru(e.target.value)}
                />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="PIN"
                  className="w-24 p-3 bg-white/80 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400 text-slate-700"
                  value={pinGuruBaru}
                  onChange={(e) =>
                    setPinGuruBaru(e.target.value.replace(/\D/g, ""))
                  }
                />
                <button
                  onClick={tambahGuru}
                  className="bg-indigo-500 text-white font-extrabold px-5 py-3 rounded-2xl active:scale-95 transition-all btn-premium text-sm"
                >
                  Tambah
                </button>
              </div>
              {guru.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{g.nama}</p>
                    <p className="text-[10px] text-slate-500">
                      PIN: {g.pin_login}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditPinId(g.id);
                        setEditPinBaru("");
                      }}
                      className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-xl hover:bg-blue-100"
                    >
                      Ganti PIN
                    </button>
                    <button
                      onClick={() => hapusGuru(g.id, g.nama)}
                      className="text-xs bg-rose-50 text-rose-600 font-bold px-3 py-1 rounded-xl hover:bg-rose-100"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tabAdmin === "log" && (
          <div className="glass-panel p-6 rounded-[2rem] shadow-md">
            <h2 className="text-lg font-extrabold mb-4 text-slate-800">
              📜 Log Aktivitas Admin
            </h2>
            <div className="space-y-2">
              {logAdmin.map((l) => (
                <div
                  key={l.id}
                  className="flex justify-between text-xs border-b border-slate-100 pb-2"
                >
                  <span className="font-bold">{l.aksi}</span>
                  <span className="text-slate-500">{l.detail}</span>
                  <span className="text-slate-400">
                    {new Date(l.created_at).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tabAdmin === "riwayat" && (
          <div className="glass-panel p-6 rounded-[2rem] shadow-md">
            <h2 className="text-lg font-extrabold mb-4 text-slate-800">
              💰 Riwayat SPP
            </h2>
            <div className="space-y-2">
              {riwayatSpp.map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between text-xs border-b border-slate-100 pb-2"
                >
                  <span className="font-bold">
                    {(r.murid as any)?.nama || "-"}
                  </span>
                  <span className="text-slate-500">
                    {r.status_sebelum} → {r.status_sesudah}
                  </span>
                  <span className="text-slate-500">
                    Rp {r.nominal?.toLocaleString("id-ID")}
                  </span>
                  <span className="text-slate-400">
                    {new Date(r.created_at).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Edit Murid */}
      {editId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-lg flex items-center justify-center p-4 fade-in">
          <div className="bg-white max-w-md w-full p-6 rounded-[2rem] shadow-2xl slide-up">
            <h2 className="text-xl font-extrabold text-slate-800 mb-4">
              ✏️ Edit Murid
            </h2>
            <div className="flex flex-col gap-3 mb-4">
              <input
                type="text"
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400 text-slate-700"
                value={editNama}
                onChange={(e) => setEditNama(e.target.value)}
                placeholder="Nama"
              />
              <input
                type="text"
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400 text-slate-700"
                value={editNoHp}
                onChange={(e) => setEditNoHp(e.target.value)}
                placeholder="No HP"
              />
              <input
                type="number"
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400 text-slate-700"
                value={editNominal}
                onChange={(e) => setEditNominal(e.target.value)}
                placeholder="Nominal SPP"
              />
              <select
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400 text-slate-700"
                value={editKelas}
                onChange={(e) => setEditKelas(e.target.value)}
              >
                <option value="mawar">Mawar</option>
                <option value="melati">Melati</option>
              </select>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditFoto(e.target.files?.[0] || null)}
                className="text-xs text-slate-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditId(null)}
                className="flex-1 bg-slate-200 text-slate-700 font-extrabold py-3 rounded-2xl"
              >
                Batal
              </button>
              <button
                onClick={simpanEdit}
                disabled={savingEdit}
                className="flex-1 bg-indigo-500 text-white font-extrabold py-3 rounded-2xl active:scale-95 transition-all"
              >
                {savingEdit ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ganti PIN Guru */}
      {editPinId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-lg flex items-center justify-center p-4 fade-in">
          <div className="bg-white max-w-sm w-full p-6 rounded-[2rem] shadow-2xl slide-up">
            <h2 className="text-lg font-extrabold mb-4">🔑 Ganti PIN Guru</h2>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="PIN Baru"
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold mb-4 outline-none focus:border-indigo-400"
              value={editPinBaru}
              onChange={(e) =>
                setEditPinBaru(e.target.value.replace(/\D/g, ""))
              }
            />
            <div className="flex gap-3">
              <button
                onClick={() => setEditPinId(null)}
                className="flex-1 bg-slate-200 text-slate-700 font-extrabold py-3 rounded-2xl"
              >
                Batal
              </button>
              <button
                onClick={() =>
                  gantiPinGuru(
                    editPinId,
                    guru.find((g) => g.id === editPinId)?.nama || "",
                  )
                }
                className="flex-1 bg-indigo-500 text-white font-extrabold py-3 rounded-2xl active:scale-95"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pengumuman Massal */}
      {bukaPengumuman && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-lg flex items-center justify-center p-4 fade-in">
          <div className="bg-white max-w-md w-full p-6 rounded-[2rem] shadow-2xl slide-up">
            <h2 className="text-xl font-extrabold mb-4">
              📢 Pengumuman ke Semua Orang Tua
            </h2>
            <textarea
              className="w-full min-h-[150px] p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl mb-4 text-sm font-semibold outline-none focus:border-indigo-400"
              value={teksPengumuman}
              onChange={(e) => setTeksPengumuman(e.target.value)}
              placeholder="Tulis pengumuman..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setBukaPengumuman(false);
                  setTeksPengumuman("");
                }}
                className="flex-1 bg-slate-200 text-slate-700 font-extrabold py-3 rounded-2xl"
              >
                Batal
              </button>
              <button
                onClick={kirimPengumumanMassal}
                className="flex-1 bg-indigo-500 text-white font-extrabold py-3 rounded-2xl active:scale-95"
              >
                Kirim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
