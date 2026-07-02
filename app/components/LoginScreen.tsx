import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Loading,
  Login,
  PreviewOpen,
  PreviewClose,
  Close,
  Message,
  CheckOne,
  Attention,
} from "@icon-park/react";

interface LoginScreenProps {
  isLoading: boolean;
  pinLogin: string;
  loginError: string;
  isCheckingPin: boolean;
  onPinChange: (value: string) => void;
  onLogin: () => void;
}

export default function LoginScreen({
  isLoading,
  pinLogin,
  loginError,
  isCheckingPin,
  onPinChange,
  onLogin,
}: LoginScreenProps) {
  const [showPin, setShowPin] = useState(false);

  // State untuk Modal OTP
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [isRequestingOTP, setIsRequestingOTP] = useState(false);
  const [requestStatus, setRequestStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [requestMessage, setRequestMessage] = useState("");

  // Bersihkan form saat modal ditutup
  useEffect(() => {
    if (!isModalOpen) {
      setTimeout(() => {
        setPhoneInput("");
        setRequestStatus("idle");
        setRequestMessage("");
      }, 300); // Menunggu animasi selesai
    }
  }, [isModalOpen]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;

    setIsRequestingOTP(true);
    setRequestStatus("idle");

    // --- MASTER VALIDATION: Selalu pastikan formatnya 62... ---
    // Karena di UI kita akan menampilkan +62 terpisah, phoneInput hanya berisi angka 812...
    const finalPhoneNumber = "62" + phoneInput;

    try {
      const res = await fetch(
        "https://clpgfvsqllhegyocorgm.supabase.co/functions/v1/request-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nomor_hp_guru: finalPhoneNumber }),
        },
      );
      const data = await res.json();

      if (res.ok && data.ok) {
        setRequestStatus("success");
        setRequestMessage(
          "PIN berhasil dikirim! Silakan periksa pesan WhatsApp Anda.",
        );
      } else {
        setRequestStatus("error");
        setRequestMessage(
          data.error || "Nomor tidak terdaftar atau terjadi kesalahan.",
        );
      }
    } catch (err) {
      setRequestStatus("error");
      setRequestMessage(
        "Gagal terhubung ke server. Periksa koneksi internet Anda.",
      );
    } finally {
      setIsRequestingOTP(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-white/95 fade-in relative overflow-hidden">
      {/* Dekorasi Latar Belakang */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-64 h-64 bg-emerald-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

      {/* Header: Logo & Nama Sekolah */}
      <div className="w-full pt-12 pb-8 flex flex-col items-center justify-center relative z-10">
        <div className="w-24 h-24 relative mb-4">
          <Image
            src="/piasmart.png"
            alt="PiaSmart"
            fill
            sizes="96px"
            priority
            className="object-contain opacity-95 drop-shadow-xl"
          />
        </div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          TK Tadika Mesra
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Portal Guru & Staf
        </p>
      </div>

      {/* Form Login Utama */}
      <div className="flex-1 flex flex-col items-center w-full max-w-sm mx-auto relative z-10">
        <div className="w-full bg-white/60 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-100 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
          <div className="relative mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">
              PIN Akses Harian
            </label>
            <div className="relative flex items-center">
              <input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pinLogin}
                onChange={(e) => onPinChange(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && pinLogin.length >= 4) {
                    onLogin();
                  }
                }}
                disabled={isCheckingPin || isLoading}
                placeholder="• • • • • •"
                className="w-full bg-slate-50/50 border-2 border-slate-100 text-slate-800 text-center font-black text-2xl tracking-[0.5em] rounded-2xl p-4 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100/50 transition-all placeholder:text-slate-300 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 text-slate-400 hover:text-indigo-500 transition-colors p-2 rounded-xl hover:bg-slate-100/50"
              >
                {showPin ? (
                  <PreviewOpen size={20} />
                ) : (
                  <PreviewClose size={20} />
                )}
              </button>
            </div>
          </div>

          {loginError && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-500 animate-in slide-in-from-top-2">
              <Attention theme="outline" size={16} />
              <p className="text-sm font-semibold">{loginError}</p>
            </div>
          )}

          <button
            onClick={onLogin}
            disabled={isCheckingPin || isLoading || pinLogin.length < 4}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl shadow-[0_8px_20px_rgba(79,70,229,0.25)] hover:shadow-[0_12px_25px_rgba(79,70,229,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isCheckingPin ? (
              <>
                <Loading className="animate-spin" size={20} />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <span>Masuk Ruang Kelas</span>
                <Login size={20} />
              </>
            )}
          </button>
        </div>

        {/* Tombol Trigger Lupa PIN (UX Copywriting Upgrade) */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="mt-8 px-4 py-2 text-[13px] font-semibold text-slate-500 hover:text-indigo-600 active:scale-95 transition-all flex items-center gap-2 rounded-full hover:bg-indigo-50"
        >
          Belum punya PIN hari ini?
        </button>
      </div>

      {/* FOOTER & LOGO DIGI */}
      <div className="w-full pb-6 pt-4 flex flex-col items-center justify-center opacity-70 relative z-10 group selection:bg-transparent">
        <span className="text-[9px] font-black tracking-[0.2em] mb-2 uppercase text-slate-400 group-hover:text-emerald-500 transition-colors duration-500">
          Powered By
        </span>

        {/* Container Utama Logo */}
        <div className="w-16 aspect-5/7 relative overflow-hidden cursor-pointer">
          {/* LAYER 1: Logo State Awal (Grayscale & Opacity Rendah) */}
          <div className="absolute inset-0 grayscale opacity-40 group-hover:opacity-20 transition-all duration-700">
            <Image
              src="/logo-digi.png"
              alt="Digi Logo Base"
              fill
              sizes="64px"
              className="object-contain"
            />
          </div>

          {/* LAYER 2: Efek Rambatan Warna Aquamarine dari Bawah ke Atas */}
          {/* Menggunakan clip-path animasi naik-turun saat hover atau loop */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none filter drop-shadow-[0_0_8px_rgba(20,250,210,0.5)]"
            style={{
              // Warna Aquamarine murni disuntikkan via tint filter CSS modern
              // Jika logo Anda aslinya sudah berwarna aquamarine, baris sepia/hue-rotate di bawah bisa dihapus.
              // Jika logo hitam/putih, filter ini akan memaksanya menjadi aquamarine menyala.
              mixBlendMode: "color-burn",
            }}
          >
            <Image
              src="/logo-digi.png"
              alt="Digi Logo Aquamarine"
              fill
              sizes="64px"
              className="object-contain"
            />
          </div>

          {/* LAYER 3: The Magical Wave Mask (Efek Kilatan Air Merambat) */}
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-400 via-aquamarine-400 to-transparent mix-blend-color-left opacity-0 group-hover:animate-shine-up pointer-events-none"></div>
        </div>
      </div>

      {/* --- MODAL MINTA OTP (THE BILLION DOLLAR UI) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          {/* Backdrop Blur */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => !isRequestingOTP && setIsModalOpen(false)}
          ></div>

          {/* Modal Container */}
          <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-[0_25px_50px_rgba(0,0,0,0.25)] p-6 sm:p-8 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isRequestingOTP}
              className="absolute top-5 right-5 p-2 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
            >
              <Close size={20} strokeWidth={4} />
            </button>

            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 text-emerald-500">
              <Message size={24} strokeWidth={4} />
            </div>

            <h3 className="text-xl font-black text-slate-800 mb-2">
              Minta PIN Akses
            </h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
              Masukkan nomor WhatsApp Anda yang terdaftar. Sistem akan
              mengirimkan PIN baru untuk sesi hari ini.
            </p>

            <form onSubmit={handleRequestOTP} className="space-y-4">
              {/* --- INPUT MOBILE-FIRST DENGAN SMART PREFIX --- */}
              <div className="flex items-stretch bg-slate-50 border-2 border-slate-100 rounded-2xl focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-50 transition-all overflow-hidden group">
                {/* Prefix Label (Visual) */}
                <div className="flex items-center justify-center pl-4 pr-3 bg-slate-100/50 border-r border-slate-200/60 text-slate-500 font-extrabold text-sm group-focus-within:text-emerald-600 group-focus-within:bg-emerald-50/50 transition-colors">
                  +62
                </div>

                {/* Input Area */}
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="812 3456 7890"
                  value={phoneInput}
                  onChange={(e) => {
                    // Cerdas: Hapus semua karakter non-angka
                    let val = e.target.value.replace(/\D/g, "");
                    // Cerdas: Jika guru paste/mengetik awalan '0' atau '62', langsung potong!
                    val = val.replace(/^(62|0)/, "");
                    setPhoneInput(val);
                  }}
                  disabled={isRequestingOTP || requestStatus === "success"}
                  className="flex-1 w-full bg-transparent text-slate-800 font-black text-lg tracking-wide px-4 py-3.5 focus:outline-none placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400 disabled:opacity-60"
                />
              </div>

              {/* Status Messages */}
              {requestStatus === "success" && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-emerald-600 animate-in slide-in-from-bottom-2">
                  <CheckOne
                    theme="filled"
                    size={18}
                    className="mt-0.5 shrink-0"
                  />
                  <p className="text-sm font-semibold leading-snug">
                    {requestMessage}
                  </p>
                </div>
              )}
              {requestStatus === "error" && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-rose-500 animate-in slide-in-from-bottom-2">
                  <Attention
                    theme="filled"
                    size={18}
                    className="mt-0.5 shrink-0"
                  />
                  <p className="text-sm font-semibold leading-snug">
                    {requestMessage}
                  </p>
                </div>
              )}

              {/* Action Button */}
              {requestStatus !== "success" ? (
                <button
                  type="submit"
                  disabled={!phoneInput || isRequestingOTP}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-2xl shadow-[0_8px_20px_rgba(16,185,129,0.25)] hover:shadow-[0_12px_25px_rgba(16,185,129,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {isRequestingOTP ? (
                    <>
                      <Loading className="animate-spin" size={18} />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <span>Kirim ke WhatsApp</span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-2xl transition-all mt-2"
                >
                  Tutup & Kembali Login
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
