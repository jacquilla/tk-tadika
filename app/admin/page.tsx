"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "0000";

const NAMA_BULAN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export default function AdminPage() {
  // ---------- Auth ----------
  const [pin, setPin] = useState("");
  const [autentikasi, setAutentikasi] = useState(false);
  const [error, setError] = useState("");

  // ---------- Data Utama ----------
  const [murid, setMurid] = useState<any[]>([]);
  const [guru, setGuru] = useState<any[]>([]);
  const [logAdmin, setLogAdmin] = useState<any[]>([]);
  const [riwayatSpp, setRiwayatSpp] = useState<any[]>([]);
  const [kehadiranHariIni, setKehadiranHariIni] = useState<any[]>([]);

  // ---------- Tab & Filter ----------
  const [tabAdmin, setTabAdmin] = useState<
    "utama" | "log" | "riwayat" | "kehadiran" | "buku"
  >("utama");
  const [cariAdmin, setCariAdmin] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterSpp, setFilterSpp] = useState("");

  // ---------- Form Tambah Murid ----------
  const [namaBaru, setNamaBaru] = useState("");
  const [kelasBaru, setKelasBaru] = useState("mawar");
  const [noHpBaru, setNoHpBaru] = useState("");
  const [nominalBaru, setNominalBaru] = useState("350000");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // ---------- Edit Murid ----------
  const [editId, setEditId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editKelas, setEditKelas] = useState("mawar");
  const [editNoHp, setEditNoHp] = useState("");
  const [editNominal, setEditNominal] = useState("");
  const [editFoto, setEditFoto] = useState<File | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // ---------- Guru ----------
  const [namaGuruBaru, setNamaGuruBaru] = useState("");
  const [pinGuruBaru, setPinGuruBaru] = useState("");
  const [editPinId, setEditPinId] = useState<string | null>(null);
  const [editPinBaru, setEditPinBaru] = useState("");

  // ---------- Buku Penghubung ----------
  const [bukuMurid, setBukuMurid] = useState<any>(null);
  const [bukuLog, setBukuLog] = useState<any[]>([]);
  const [bukuSheet, setBukuSheet] = useState<any>(null);

  // ---------- Ringkasan ----------
  const [totalHadir, setTotalHadir] = useState(0);
  const [totalLunas, setTotalLunas] = useState(0);
  const [totalMurid, setTotalMurid] = useState(0);
  const [totalPiutang, setTotalPiutang] = useState(0);

  // ---------- Grafik ----------
  const [chartHadir, setChartHadir] = useState<number[]>([]);
  const [chartLabel, setChartLabel] = useState<string[]>([]);

  // ---------- Kartu Iuran SPP ----------
  const [iuranMurid, setIuranMurid] = useState<any>(null);
  const [iuranData, setIuranData] = useState<Record<number, string | null>>({});
  const [tahunIuran, setTahunIuran] = useState(new Date().getFullYear());

  // ========== HANDLERS ==========
  const handleLogin = () => {
    if (pin === ADMIN_PIN) {
      setAutentikasi(true);
      setError("");
    } else setError("PIN salah");
  };

  const catatLog = async (aksi: string, detail = "") => {
    await supabase.from("log_admin").insert([{ aksi, detail }]);
  };

  const ambilData = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data: muridData } = await supabase
      .from("murid")
      .select("*")
      .order("nama");
    if (muridData) {
      setMurid(muridData);
      setTotalMurid(muridData.length);
      setTotalLunas(muridData.filter((m) => m.status_spp === "LUNAS").length);
      setTotalPiutang(
        muridData
          .filter((m) => m.status_spp !== "LUNAS")
          .reduce((sum, m) => sum + (m.nominal_spp || 350000), 0),
      );
    }

    const { data: guruData } = await supabase
      .from("guru")
      .select("*")
      .order("nama");
    if (guruData) setGuru(guruData);

    const { data: logData } = await supabase
      .from("log_admin")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (logData) setLogAdmin(logData);

    const { data: riwayat } = await supabase
      .from("riwayat_spp")
      .select("*, murid(nama)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (riwayat) setRiwayatSpp(riwayat);

    const { data: hadirData } = await supabase
      .from("kehadiran")
      .select("*, murid(nama, kelas)")
      .eq("tanggal", today)
      .order("waktu_datang", { ascending: true });
    if (hadirData) {
      setKehadiranHariIni(hadirData);
      setTotalHadir(
        hadirData.filter(
          (h) => h.status_hadir === "hadir" || h.status_hadir === "pulang",
        ).length,
      );
    }

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
  };

  // ---------- Kartu Iuran ----------
  const ambilIuran = async (anak: any) => {
    setIuranMurid(anak);
    const { data } = await supabase
      .from("iuran_spp")
      .select("*")
      .eq("murid_id", anak.id)
      .eq("tahun", tahunIuran);
    const map: Record<number, string | null> = {};
    for (let i = 1; i <= 12; i++) map[i] = null;
    if (data)
      data.forEach((d: any) => {
        map[d.bulan] = d.tanggal_bayar;
      });
    setIuranData(map);
  };

  const simpanTanggalBayar = async (bulan: number, tanggal: string | null) => {
    if (!iuranMurid) return;
    if (!tanggal) {
      await supabase
        .from("iuran_spp")
        .delete()
        .eq("murid_id", iuranMurid.id)
        .eq("tahun", tahunIuran)
        .eq("bulan", bulan);
    } else {
      await supabase.from("iuran_spp").upsert([
        {
          murid_id: iuranMurid.id,
          tahun: tahunIuran,
          bulan,
          tanggal_bayar: tanggal,
        },
      ]);
    }
    setIuranData((prev) => ({ ...prev, [bulan]: tanggal }));
  };

  // ---------- Buku Penghubung ----------
  const lihatBuku = async (anak: any) => {
    setBukuMurid(anak);
    const today = new Date().toISOString().split("T")[0];
    const { data: logData } = await supabase
      .from("log_aktivitas")
      .select("*")
      .eq("murid_id", anak.id)
      .gte("created_at", `${today}T00:00:00+08:00`)
      .order("created_at");
    setBukuLog(logData || []);
    const sheet = logData?.find((l) => l.kategori === "DailySheet")?.metadata;
    setBukuSheet(sheet || null);
  };

  // ---------- Murid CRUD ----------
  const tambahMurid = async () => {
    if (!namaBaru.trim() || !noHpBaru.trim())
      return alert("Lengkapi data murid.");
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
          alert("Gagal upload foto.");
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
    ambilData();
    catatLog("Tambah murid", namaBaru);
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
    if (!editNama.trim() || !editNoHp.trim()) return;
    setSavingEdit(true);
    let fotoUrl = "";
    if (editFoto) {
      const fd = new FormData();
      fd.append("file", editFoto);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (d.imageUrl) fotoUrl = d.imageUrl;
    }
    await supabase
      .from("murid")
      .update({
        nama: editNama,
        kelas: editKelas,
        nomor_hp_ortu: editNoHp,
        nominal_spp: parseInt(editNominal) || 350000,
        ...(fotoUrl ? { foto_url: fotoUrl } : {}),
      })
      .eq("id", editId!);
    setEditId(null);
    setSavingEdit(false);
    ambilData();
    catatLog("Edit murid", editNama);
  };

  const hapusMurid = async (id: string, nama: string) => {
    if (confirm(`Hapus ${nama}?`)) {
      await supabase.from("murid").delete().eq("id", id);
      ambilData();
      catatLog("Hapus murid", nama);
    }
  };

  const pindahKelas = async (id: string, nama: string, kelasLama: string) => {
    const baru = kelasLama === "mawar" ? "melati" : "mawar";
    await supabase.from("murid").update({ kelas: baru }).eq("id", id);
    ambilData();
    catatLog("Pindah kelas", `${nama} → ${baru}`);
  };

  // ---------- Guru ----------
  const tambahGuru = async () => {
    if (!namaGuruBaru.trim() || !pinGuruBaru.trim())
      return alert("Lengkapi data guru.");
    const { data: exist } = await supabase
      .from("guru")
      .select("id")
      .eq("pin_login", pinGuruBaru)
      .maybeSingle();
    if (exist) return alert("PIN sudah dipakai.");
    await supabase
      .from("guru")
      .insert([{ nama: namaGuruBaru, pin_login: pinGuruBaru }]);
    setNamaGuruBaru("");
    setPinGuruBaru("");
    ambilData();
    catatLog("Tambah guru", namaGuruBaru);
  };
  const hapusGuru = async (id: string, nama: string) => {
    if (confirm(`Hapus guru ${nama}?`)) {
      await supabase.from("guru").delete().eq("id", id);
      ambilData();
      catatLog("Hapus guru", nama);
    }
  };
  const gantiPinGuru = async () => {
    if (!editPinBaru.trim()) return;
    await supabase
      .from("guru")
      .update({ pin_login: editPinBaru })
      .eq("id", editPinId!);
    setEditPinId(null);
    setEditPinBaru("");
    ambilData();
    catatLog("Ganti PIN guru");
  };

  const filterMurid = () => {
    let list = murid;
    if (cariAdmin.trim())
      list = list.filter((m) =>
        m.nama.toLowerCase().includes(cariAdmin.toLowerCase()),
      );
    if (filterKelas) list = list.filter((m) => m.kelas === filterKelas);
    if (filterSpp) list = list.filter((m) => m.status_spp === filterSpp);
    return list;
  };

  useEffect(() => {
    if (autentikasi) ambilData();
  }, [autentikasi]);

  // ========== UI ==========
  if (!autentikasi)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-900/30 to-slate-900/50 backdrop-blur-[8px] p-6">
        <div className="w-full max-w-sm glass-panel rounded-[3rem] p-8 shadow-2xl fade-in">
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
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); body{font-family:'Plus Jakarta Sans',sans-serif;background:#F8FAFC;} .glass-panel{background:rgba(255,255,255,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);} .fade-in{animation:fadeIn .5s ease-out forwards;} .slide-up{animation:slideUp .6s cubic-bezier(.16,1,.3,1) forwards;opacity:0;} @keyframes slideUp{0%{opacity:0;transform:translateY(40px)}100%{opacity:1;transform:translateY(0)}} @keyframes fadeIn{0%{opacity:0}100%{opacity:1}} .btn-premium{transition:all .25s cubic-bezier(.4,0,.2,1);box-shadow:0 4px 12px rgba(0,0,0,.04),0 2px 6px rgba(0,0,0,.02)} .btn-premium:active{transform:scale(.96)} .btn-premium:hover{transform:translateY(-1px);box-shadow:0 12px 24px rgba(0,0,0,.08)}`}</style>

      <div className="min-h-screen bg-slate-50/80 p-4 fade-in">
        <div className="max-w-lg mx-auto">
          {/* Header & Tabs */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-extrabold text-slate-800">🏫 Admin</h1>
            <button
              onClick={() => setAutentikasi(false)}
              className="text-slate-500 font-bold"
            >
              Logout
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6 pb-2">
            {[
              { id: "utama", label: "📊 Utama" },
              { id: "kehadiran", label: "👥 Hadir" },
              { id: "buku", label: "📖 Buku" },
              { id: "riwayat", label: "💰 SPP" },
              { id: "log", label: "📜 Log" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTabAdmin(t.id as any)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${tabAdmin === t.id ? "bg-white shadow text-indigo-600" : "text-slate-500"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ---------- UTAMA ---------- */}
          {tabAdmin === "utama" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-panel p-4 rounded-2xl text-center slide-up">
                  <p className="text-xs text-slate-500">Total Murid</p>
                  <p className="text-2xl font-extrabold text-slate-800">
                    {totalMurid}
                  </p>
                </div>
                <div
                  className="glass-panel p-4 rounded-2xl text-center slide-up"
                  style={{ animationDelay: "0.1s" }}
                >
                  <p className="text-xs text-slate-500">Hadir Hari Ini</p>
                  <p className="text-2xl font-extrabold text-emerald-600">
                    {totalHadir}
                  </p>
                </div>
                <div
                  className="glass-panel p-4 rounded-2xl text-center slide-up"
                  style={{ animationDelay: "0.2s" }}
                >
                  <p className="text-xs text-slate-500">SPP Lunas</p>
                  <p className="text-2xl font-extrabold text-indigo-600">
                    {totalLunas}/{totalMurid}
                  </p>
                </div>
                <div
                  className="glass-panel p-4 rounded-2xl text-center slide-up"
                  style={{ animationDelay: "0.3s" }}
                >
                  <p className="text-xs text-slate-500">Piutang SPP</p>
                  <p className="text-lg font-extrabold text-rose-600">
                    Rp {totalPiutang.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl slide-up">
                <p className="text-xs font-bold text-slate-500 mb-2">
                  📊 Kehadiran 7 Hari
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
                      <span className="text-[8px] text-slate-400 mt-1">
                        {l}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href="/api/export"
                  className="flex-1 bg-emerald-500 text-white font-extrabold py-3 rounded-2xl text-sm text-center shadow-lg shadow-emerald-200 active:scale-95 transition-all btn-premium"
                >
                  📥 Excel
                </a>
                <button
                  onClick={() => {
                    const semua = murid
                      .map((m) => m.nomor_hp_ortu)
                      .filter(Boolean);
                    const pesan = prompt("Tulis pengumuman:");
                    if (pesan) {
                      semua.forEach((hp) =>
                        fetch("/api/wa", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            targetHp: hp,
                            pesanCustom: `📢 *PENGUMUMAN*\n\n${pesan}`,
                          }),
                        }),
                      );
                      alert("Terkirim!");
                    }
                  }}
                  className="flex-1 bg-amber-500 text-white font-extrabold py-3 rounded-2xl text-sm shadow-lg shadow-amber-200 active:scale-95 transition-all btn-premium"
                >
                  📢 Siaran
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Cari murid..."
                  className="flex-1 p-3 bg-white/80 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400"
                  value={cariAdmin}
                  onChange={(e) => setCariAdmin(e.target.value)}
                />
                <select
                  className="p-3 bg-white/80 border-2 border-slate-200 rounded-2xl text-sm font-bold"
                  value={filterKelas}
                  onChange={(e) => setFilterKelas(e.target.value)}
                >
                  <option value="">Kelas</option>
                  <option value="mawar">Mawar</option>
                  <option value="melati">Melati</option>
                </select>
                <select
                  className="p-3 bg-white/80 border-2 border-slate-200 rounded-2xl text-sm font-bold"
                  value={filterSpp}
                  onChange={(e) => setFilterSpp(e.target.value)}
                >
                  <option value="">SPP</option>
                  <option value="LUNAS">Lunas</option>
                  <option value="MENUNGGAK">Menunggak</option>
                </select>
              </div>

              <div className="glass-panel p-4 rounded-2xl slide-up">
                <h2 className="text-lg font-extrabold mb-4">
                  📋 Murid ({filterMurid().length})
                </h2>
                {filterMurid().map((m) => (
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
                        <p className="font-bold text-slate-800 text-sm">
                          {m.nama}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {m.kelas} · {m.nomor_hp_ortu} ·{" "}
                          <span
                            className={
                              m.status_spp === "LUNAS"
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }
                          >
                            {m.status_spp}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => bukaEdit(m)}
                        className="text-xs bg-amber-50 text-amber-600 font-bold px-2 py-1 rounded-lg"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => pindahKelas(m.id, m.nama, m.kelas)}
                        className="text-xs bg-indigo-50 text-indigo-600 font-bold px-2 py-1 rounded-lg"
                      >
                        Pindah
                      </button>
                      <button
                        onClick={() => hapusMurid(m.id, m.nama)}
                        className="text-xs bg-rose-50 text-rose-600 font-bold px-2 py-1 rounded-lg"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-panel p-4 rounded-2xl slide-up">
                <h2 className="text-lg font-extrabold mb-4">➕ Tambah Murid</h2>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nama"
                    className="w-full p-3 bg-white/80 border-2 border-slate-200 rounded-2xl text-sm font-bold"
                    value={namaBaru}
                    onChange={(e) => setNamaBaru(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="No HP"
                    className="w-full p-3 bg-white/80 border-2 border-slate-200 rounded-2xl text-sm font-bold"
                    value={noHpBaru}
                    onChange={(e) => setNoHpBaru(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Nominal SPP"
                    className="w-full p-3 bg-white/80 border-2 border-slate-200 rounded-2xl text-sm font-bold"
                    value={nominalBaru}
                    onChange={(e) => setNominalBaru(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <select
                      className="flex-1 p-3 bg-white/80 border-2 border-slate-200 rounded-2xl text-sm font-bold"
                      value={kelasBaru}
                      onChange={(e) => setKelasBaru(e.target.value)}
                    >
                      <option value="mawar">Mawar</option>
                      <option value="melati">Melati</option>
                    </select>
                    <label className="flex-1 p-3 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-pointer bg-white/80 text-center">
                      📷 {fotoFile ? fotoFile.name : "Foto"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          setFotoFile(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                  </div>
                  <button
                    onClick={tambahMurid}
                    disabled={uploading}
                    className="w-full bg-indigo-500 text-white font-extrabold py-3 rounded-2xl active:scale-95 transition-all btn-premium"
                  >
                    {uploading ? "Upload..." : "Simpan"}
                  </button>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl slide-up">
                <h2 className="text-lg font-extrabold mb-4">👩‍🏫 Guru</h2>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Nama"
                    className="flex-1 p-3 bg-white/80 border-2 border-slate-200 rounded-2xl text-sm font-bold"
                    value={namaGuruBaru}
                    onChange={(e) => setNamaGuruBaru(e.target.value)}
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="PIN"
                    className="w-20 p-3 bg-white/80 border-2 border-slate-200 rounded-2xl text-sm font-bold"
                    value={pinGuruBaru}
                    onChange={(e) =>
                      setPinGuruBaru(e.target.value.replace(/\D/g, ""))
                    }
                  />
                  <button
                    onClick={tambahGuru}
                    className="bg-indigo-500 text-white font-extrabold px-4 py-3 rounded-2xl active:scale-95"
                  >
                    +
                  </button>
                </div>
                {guru.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {g.nama}
                      </p>
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
                        className="text-xs bg-blue-50 text-blue-600 font-bold px-2 py-1 rounded-lg"
                      >
                        PIN
                      </button>
                      <button
                        onClick={() => hapusGuru(g.id, g.nama)}
                        className="text-xs bg-rose-50 text-rose-600 font-bold px-2 py-1 rounded-lg"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------- KEHADIRAN ---------- */}
          {tabAdmin === "kehadiran" && (
            <div className="glass-panel p-4 rounded-2xl slide-up">
              <h2 className="text-lg font-extrabold mb-4">
                👥 Kehadiran Hari Ini
              </h2>
              {kehadiranHariIni.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      {(h.murid as any)?.nama || "-"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {(h.murid as any)?.kelas || "-"} ·{" "}
                      {h.status_hadir === "pulang"
                        ? "Sudah Pulang"
                        : h.status_hadir}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-emerald-600">
                      {h.waktu_datang
                        ? new Date(h.waktu_datang).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </p>
                    <p className="text-rose-600">
                      {h.waktu_pulang
                        ? new Date(h.waktu_pulang).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ---------- BUKU ---------- */}
          {tabAdmin === "buku" && (
            <div className="glass-panel p-4 rounded-2xl slide-up">
              <h2 className="text-lg font-extrabold mb-4">
                📖 Buku Penghubung
              </h2>
              <div className="space-y-3">
                {murid.map((anak) => (
                  <button
                    key={anak.id}
                    onClick={() => lihatBuku(anak)}
                    className="w-full text-left p-3 bg-white/80 rounded-2xl shadow-sm border border-white/60 flex items-center gap-3 active:scale-[0.98] transition-all"
                  >
                    <img
                      src={
                        anak.foto_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(anak.nama)}&background=EEF2FF&color=4F46E5&size=32`
                      }
                      className="w-8 h-8 rounded-lg"
                    />
                    <span className="font-bold text-sm">{anak.nama}</span>
                  </button>
                ))}
              </div>
              {bukuMurid && (
                <div className="mt-4 p-4 bg-slate-50/80 rounded-2xl slide-up">
                  <h3 className="font-extrabold text-indigo-700 mb-2">
                    {bukuMurid.nama}
                  </h3>
                  <div className="text-xs space-y-1">
                    {bukuLog.map((l, i) => (
                      <p key={i}>
                        [
                        {new Date(l.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        ] {l.deskripsi}
                      </p>
                    ))}
                    {bukuSheet && (
                      <div className="flex gap-2 mt-2">
                        {bukuSheet.makan && (
                          <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-lg text-[10px] font-bold">
                            🍱 {bukuSheet.makan}
                          </span>
                        )}
                        {bukuSheet.tidur && (
                          <span className="bg-violet-100 text-violet-800 px-2 py-1 rounded-lg text-[10px] font-bold">
                            💤 {bukuSheet.tidur}
                          </span>
                        )}
                        {bukuSheet.mood && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-[10px] font-bold">
                            😊 {bukuSheet.mood}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------- SPP (Iuran + Riwayat) ---------- */}
          {tabAdmin === "riwayat" && (
            <div className="glass-panel p-4 rounded-2xl slide-up">
              <h2 className="text-lg font-extrabold mb-4">💰 Iuran SPP</h2>
              <div className="space-y-3">
                {murid.map((anak) => (
                  <div
                    key={anak.id}
                    className="flex items-center justify-between p-3 bg-white/80 rounded-2xl shadow-sm border border-white/60"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          anak.foto_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(anak.nama)}&background=EEF2FF&color=4F46E5&size=32`
                        }
                        className="w-8 h-8 rounded-lg"
                      />
                      <span className="font-bold text-sm">{anak.nama}</span>
                    </div>
                    <button
                      onClick={() => ambilIuran(anak)}
                      className="text-xs bg-indigo-50 text-indigo-600 font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-all"
                    >
                      Kartu Iuran
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <h3 className="text-base font-extrabold mb-3">
                  Riwayat Perubahan Status SPP
                </h3>
                {riwayatSpp.map((r) => (
                  <div
                    key={r.id}
                    className="flex justify-between text-xs border-b border-slate-100 py-2"
                  >
                    <span className="font-bold">
                      {(r.murid as any)?.nama || "-"}
                    </span>
                    <span>
                      {r.status_sebelum} → {r.status_sesudah}
                    </span>
                    <span>Rp {r.nominal?.toLocaleString("id-ID")}</span>
                    <span className="text-slate-400">
                      {new Date(r.created_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------- LOG ---------- */}
          {tabAdmin === "log" && (
            <div className="glass-panel p-4 rounded-2xl slide-up">
              <h2 className="text-lg font-extrabold mb-4">📜 Log Admin</h2>
              {logAdmin.map((l) => (
                <div
                  key={l.id}
                  className="flex justify-between text-xs border-b border-slate-100 py-2"
                >
                  <span className="font-bold">{l.aksi}</span>
                  <span className="text-slate-500">{l.detail}</span>
                  <span className="text-slate-400">
                    {new Date(l.created_at).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- MODAL KARTU IURAN ---------- */}
      {iuranMurid && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-lg flex items-center justify-center p-4 fade-in">
          <div className="bg-white w-full max-w-sm p-6 rounded-[2rem] shadow-2xl slide-up max-h-[80vh] overflow-y-auto hide-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-slate-800">
                🧾 Kartu Iuran {tahunIuran}
              </h2>
              <button
                onClick={() => setIuranMurid(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-2xl"
              >
                ✕
              </button>
            </div>
            <p className="text-sm font-bold text-slate-700 mb-4">
              {iuranMurid.nama} · {iuranMurid.kelas}
            </p>
            <div className="space-y-2">
              {NAMA_BULAN.map((nama, idx) => {
                const bulan = idx + 1;
                const sudahLunas = !!iuranData[bulan];
                return (
                  <div
                    key={bulan}
                    className={`flex items-center justify-between p-3 rounded-2xl border ${sudahLunas ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100"}`}
                  >
                    <span className="text-sm font-bold text-slate-700 w-12">
                      {nama}
                    </span>
                    {sudahLunas ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-700 font-bold">
                          Lunas ·{" "}
                          {new Date(iuranData[bulan]!).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short" },
                          )}
                        </span>
                        <button
                          onClick={() => simpanTanggalBayar(bulan, null)}
                          className="text-[10px] bg-rose-100 text-rose-600 px-2 py-1 rounded-lg font-bold active:scale-95"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <input
                        type="date"
                        className="text-xs p-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-700 outline-none focus:border-indigo-400"
                        onChange={(e) =>
                          simpanTanggalBayar(bulan, e.target.value || null)
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------- MODAL EDIT MURID ---------- */}
      {editId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-lg flex items-center justify-center p-4 fade-in">
          <div className="bg-white w-full max-w-sm p-6 rounded-[2rem] shadow-2xl slide-up">
            <h2 className="text-xl font-extrabold mb-4">✏️ Edit Murid</h2>
            <div className="space-y-3 mb-4">
              <input
                type="text"
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold"
                value={editNama}
                onChange={(e) => setEditNama(e.target.value)}
              />
              <input
                type="text"
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold"
                value={editNoHp}
                onChange={(e) => setEditNoHp(e.target.value)}
              />
              <input
                type="number"
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold"
                value={editNominal}
                onChange={(e) => setEditNominal(e.target.value)}
              />
              <select
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold"
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
                className="text-xs"
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
                className="flex-1 bg-indigo-500 text-white font-extrabold py-3 rounded-2xl"
              >
                {savingEdit ? "..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- MODAL GANTI PIN GURU ---------- */}
      {editPinId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-lg flex items-center justify-center p-4 fade-in">
          <div className="bg-white w-full max-w-sm p-6 rounded-[2rem] shadow-2xl slide-up">
            <h2 className="text-lg font-extrabold mb-4">🔑 Ganti PIN</h2>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="PIN Baru"
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold mb-4"
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
                onClick={gantiPinGuru}
                className="flex-1 bg-indigo-500 text-white font-extrabold py-3 rounded-2xl"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
