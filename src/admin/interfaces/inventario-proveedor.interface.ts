export interface InventarioProveedorItem {
  id_inventario_proveedor: number;
  id_proveedor: number;
  id_inventario: number;
  codigo_proveedor: string;
  ultimo_monto_compra?: number | string;
  proveedor?: {
    id_proveedor: number;
    nombre: string;
    rut: string;
    telefono?: string;
    email?: string;
  };
  inventario?: {
    id_inventario: number;
    sku: string;
    nombre: string;
    tipo: string;
  };
}

