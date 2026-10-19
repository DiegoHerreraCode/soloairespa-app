export interface EquipoItem {
  id_equipo: number;
  id_inventario: number;
  id_detalle_compra?: number | null;
  serial: string;
  is_deleted: boolean | number;
  created_at?: string;
  updated_at?: string;
}
