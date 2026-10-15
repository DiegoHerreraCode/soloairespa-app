export interface OrdenItem {
  id_orden: number;
  id_cliente?: number;
  id_tipo_orden?: number;
  id_admin?: number;
  fecha_creacion: string;
  monto_total: string | number;
  monto_pendiente?: string | number;
  fecha_entrega_reparacion?: string | null;
  estado_operativo: 'en_espera' | 'en_proceso' | 'finalizada' | 'anulada';
  estado_administrativo?: 'pendiente_pago' | 'pagada';
  last_update?: string;
  cliente?: {
    nombre?: string;
    razon_social?: string;
  };
  tipo_orden?: {
    nombre?: string;
  };
}

export interface InventarioItem {
  id_inventario: number;
  nombre: string;
  sku?: string;
  cantidad_total: number;
  cantidad_propia: number;
  cantidad_cliente: number;
  stock_minimo: number;
}

export interface RepuestoItem {
  id_repuesto: number;
  id_inventario: number;
  serial?: string;
  estado: 'nuevo' | 'reparado' | 'pendiente_reparacion';
  propietario?: string;
  id_orden_salida: number | null;
}

export interface PagoCompraItem {
  id_pago_compra: number;
  id_compra: number;
  monto_a_pagar: string | number;
  fecha_pago?: string | null;
  fecha_pago_acordada?: string | null;
  estado: 'pendiente' | 'realizado';
}
