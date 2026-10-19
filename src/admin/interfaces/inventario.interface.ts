export interface InventarioItem {
  id_inventario: number;
  id_modelo?: number | null;
  sku?: string;
  nombre: string;
  tipo: 'insumo' | 'compresor' | 'valvula' | 'equipo';
  condicion?: string | null;
  cantidad_total: number;
  cantidad_propia: number;
  cantidad_cliente: number;
  stock_minimo: number;
  porcentaje_iva?: number | string;
  porcentaje_ganancia?: number | string;
  monto_compra_prom?: number | string;
  ultimo_monto_compra?: number | string;
  monto_venta_unitario?: number | string;
  created_at?: string;
  updated_at?: string;
}
