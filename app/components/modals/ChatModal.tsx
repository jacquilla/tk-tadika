import { Message, Close, Send, Loading } from "@icon-park/react";
import type { Murid } from "../../types/database";

interface Props {
  chatPersonalAktif: Murid | null;
  teksChatPersonal: string;
  isMengirimChat: boolean;
  onTutup: () => void;
  onKirim: () => void;
  onUbahTeks: (val: string) => void;
}

export default function ChatModal({
  chatPersonalAktif,
  teksChatPersonal,
  isMengirimChat,
  onTutup,
  onKirim,
  onUbahTeks,
}: Props) {
  if (!chatPersonalAktif) return null;
  return (
    <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-lg flex items-end justify-center sm:items-center sm:p-4 fade-in">
      <div className="bg-white w-full rounded-t-[3rem] sm:rounded-3xl shadow-2xl flex flex-col h-[80vh] sm:h-auto sm:max-h-[85vh] slide-up">
        <div className="w-full flex justify-center pt-4 pb-2 sm:hidden">
          <div className="w-16 h-1.5 bg-slate-200 rounded-full"></div>
        </div>
        <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-3 truncate">
            <Message
              theme="outline"
              size={28}
              strokeWidth={4}
              fill="currentColor"
              className="text-indigo-400"
            />{" "}
            Chat: {chatPersonalAktif.nama}
          </h2>
          <button
            onClick={onTutup}
            className="p-3 text-slate-400 hover:bg-slate-100 rounded-2xl transition-colors active:scale-90"
          >
            <Close
              theme="outline"
              size={24}
              strokeWidth={4}
              fill="currentColor"
            />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 hide-scrollbar flex flex-col">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
            Tulis Pesan
          </label>
          <textarea
            className="w-full flex-1 min-h-[220px] p-5 bg-slate-50 border-2 border-slate-200 rounded-3xl outline-none focus:border-indigo-400 text-slate-700 font-semibold text-sm resize-none mb-6 transition-all leading-relaxed placeholder:text-slate-400"
            value={teksChatPersonal}
            onChange={(e) => onUbahTeks(e.target.value)}
          />
          <button
            disabled={isMengirimChat}
            onClick={onKirim}
            className="w-full bg-indigo-500 text-white font-extrabold py-5 rounded-2xl active:scale-[0.97] transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 btn-premium text-base disabled:opacity-70"
          >
            {isMengirimChat ? (
              <Loading
                theme="outline"
                size={22}
                strokeWidth={4}
                className="animate-spin"
              />
            ) : (
              <Send
                theme="outline"
                size={22}
                strokeWidth={4}
                fill="currentColor"
              />
            )}
            <span>Kirim via WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
