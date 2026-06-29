import { useState } from "react";
import Image from "next/image";
import { Loading, Login, PreviewOpen, PreviewClose } from "@icon-park/react";

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
  // State untuk mengontrol visibilitas PIN
  const [showPin, setShowPin] = useState(false);

  return (
    <div className="flex-1 flex flex-col p-6 bg-white/95 fade-in relative">
      {/* Logo & Nama Sekolah */}
      <div className="w-full pt-10 pb-6 flex justify-center">
        <div className="w-24 h-24 relative">
          <Image
            src="/piasmart.png"
            alt="PiaSmart"
            fill
            sizes="96px"
            priority
            className="object-contain opacity-95 drop-shadow-md"
          />
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="w-full text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-indigo-200 blur-2xl rounded-full opacity-30"></div>
            {/* Menggunakan tag img biasa karena ini mungkin aset placeholder luar, jika lokal, ganti ke <Image> */}
            <img
              src="/logo-tk.jpeg"
              alt="Logo TK"
              className="relative w-28 h-28 mx-auto shadow-xl rounded-[2rem] border-4 border-white object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://ui-avatars.com/api/?name=TK&background=EEF2FF&color=4F46E5&rounded=false&size=128";
              }}
            />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 mb-1 tracking-tight">
            TK Tadika Mesra
          </h1>
          <p className="text-slate-500 font-semibold mb-10 text-[10px] tracking-widest uppercase">
            Portal Guru Digital
          </p>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-indigo-400 space-y-4 mb-8">
              <Loading
                theme="outline"
                size={36}
                strokeWidth={4}
                fill="currentColor"
                className="animate-spin"
              />
              <span className="text-sm font-semibold text-slate-500">
                Menghubungkan ke server...
              </span>
            </div>
          ) : (
            <>
              {/* === KOLOM INPUT PIN === */}
              {/* Menggunakan max-w-[280px] agar pas dan sejajar persis dengan tombol */}
              <div className="relative mb-4 w-full max-w-[280px] mx-auto">
                <input
                  type={showPin ? "text" : "password"} // Dinamis berdasarkan state showPin
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Masukkan PIN"
                  // Menambahkan px-12 (kiri-kanan) agar teks tetap rata tengah namun tidak menabrak ikon mata
                  className="w-full py-3 px-12 bg-slate-50 border-2 border-slate-50 rounded-xl text-center text-xl font-bold tracking-widest outline-none focus:border-indigo-400 transition-all placeholder:text-slate-400 text-slate-700"
                  value={pinLogin}
                  onChange={(e) =>
                    onPinChange(e.target.value.replace(/\D/g, ""))
                  }
                  autoFocus
                />

                {/* Tombol Toggle Ikon Mata */}
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors focus:outline-none p-1"
                  tabIndex={-1}
                >
                  {showPin ? (
                    <PreviewOpen theme="outline" size={20} strokeWidth={3} />
                  ) : (
                    <PreviewClose theme="outline" size={20} strokeWidth={3} />
                  )}
                </button>
              </div>

              {loginError && (
                <p className="text-rose-500 text-xs font-bold mb-4">
                  {loginError}
                </p>
              )}

              {/* === TOMBOL MASUK === */}
              <div className="w-full max-w-[280px] mx-auto">
                <button
                  disabled={isLoading || isCheckingPin}
                  onClick={onLogin}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-extrabold py-3.5 rounded-2xl text-sm active:scale-[0.97] transition-all disabled:opacity-50 shadow-xl shadow-indigo-200 btn-premium flex justify-center items-center gap-3"
                >
                  {isCheckingPin ? (
                    <Loading
                      theme="outline"
                      size={22}
                      strokeWidth={4}
                      className="animate-spin"
                    />
                  ) : (
                    <Login
                      theme="outline"
                      size={22}
                      strokeWidth={4}
                      fill="currentColor"
                    />
                  )}
                  <span>Masuk</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="w-full pb-4 flex flex-col items-center justify-center opacity-60">
        <span className="text-[8px] text-slate-500 font-bold tracking-widest mb-2 uppercase">
          Powered By
        </span>
        <div className="w-16 aspect-[5/7] relative">
          <Image
            src="/logo-digi.png"
            alt="Digi.ID"
            fill
            sizes="64px"
            priority
            className="object-contain grayscale opacity-60"
          />
        </div>
      </div>
    </div>
  );
}
