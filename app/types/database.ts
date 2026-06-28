export interface Guru {
  id: string;
  nama: string;
  pin_login: string;
  created_at: string;
}

export interface Murid {
  id: string;
  nama: string;
  kelas: "mawar" | "melati";
  nomor_hp_ortu: string;
  foto_url: string | null;
  status_spp: "LUNAS" | "MENUNGGAK";
  catatan_medis: string | null;
  nominal_spp: number;
  struk_url: string | null;
  created_at: string;
}

export interface Kehadiran {
  id: string;
  murid_id: string;
  tanggal: string;
  status_hadir: "belum" | "hadir" | "pulang";
  waktu_datang: string | null;
  waktu_pulang: string | null;
  penjemput: string | null;
  keterangan_jemput: string | null;
  created_at: string;
}

export interface LogAktivitas {
  id: string;
  murid_id: string;
  kategori: string;
  deskripsi: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DailySheetMeta {
  makan?: string | null;
  tidur?: string | null;
  mood?: string | null;
  foto_url?: string | null;
}

export interface LogAdmin {
  id: string;
  aksi: string;
  detail: string;
  created_at: string;
}

export interface RiwayatSpp {
  id: string;
  murid_id: string;
  status_sebelum: string;
  status_sesudah: string;
  nominal: number;
  created_at: string;
}

import type { DailySheetMeta } from "./database";
