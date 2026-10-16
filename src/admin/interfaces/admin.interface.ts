export interface AdminUserItem {
  id: number;
  name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdminItem {
  id_admin: number;
  id_user?: number;
  nombre: string;
  rut: string;
  num_tlf: string;
  direccion: string;
  created_at?: string;
  updated_at?: string;
  user?: AdminUserItem;
}
