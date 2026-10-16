export interface InventarioItem {
  id_inventario: number;
  id_modelo?: number;
  sku?: string;
  nombre: string;
  tipo: 'insumo' | 'compresor' | 'valvula' | 'equipo';
  condicion?: string;
  cantidad_total: number;
  cantidad_propia: number;
  cantidad_cliente: number;
  stock_minimo: number;
  monto_compra_prom?: number | string;
  ultimo_monto_compra?: number | string;
  monto_venta_unitario?: number | string;
}
