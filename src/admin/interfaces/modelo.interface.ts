import type { MarcaItem } from './marca.interface';

export interface ModeloItem {
  id_modelo: number;
  id_marca: number;
  nombre: string;
  descripcion?: string | null;
  marca?: MarcaItem;
  created_at?: string;
  updated_at?: string;
}
