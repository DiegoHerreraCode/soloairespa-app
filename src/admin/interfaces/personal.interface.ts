export interface PersonalItem {
  id_personal: number;
  nombre: string;
  rut: string;
  correo: string;
  num_tlf: string;
  direccion: string;
  disponible: boolean;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
}
