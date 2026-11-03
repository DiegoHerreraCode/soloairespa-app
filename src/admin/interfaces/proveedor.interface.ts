import type { InventarioProveedorItem } from './inventario-proveedor.interface';

export interface ProveedorItem {
  id_proveedor: number;
  nombre: string;
  rut: string;
  correo: string;
  num_tlf: string;
  direccion: string;
  created_at?: string;
  updated_at?: string;
  inventario_proveedores?: InventarioProveedorItem[];
}
