export interface OrdenItem {
  id_orden: number;
  id_cliente?: number;
  id_tipo_orden?: number;
  id_admin?: number;
  fecha_creacion: string;
  monto_total_gravado?: string | number;
  monto_total_exento?: string | number;
  monto_total_iva?: string | number;
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
    id_tipo_orden?: number;
    nombre?: string;
  };
  detalles?: DetalleOrdenItem[];
}

export interface DetalleOrdenItem {
  id_detalle_orden?: number;
  id_orden?: number;
  id_inventario_insumo_saliente?: number | null;
  id_inventario_repuesto_saliente?: number | null;
  id_repuesto_saliente?: number | null;
  id_inventario_repuesto_entrante?: number | null;
  id_repuesto_entrante?: number | null;
  cantidad: number;
  precio_unitario: number | string;
  monto_tasacion?: number | string;
  monto_total_linea_sin_iva?: number | string;
  porcentaje_iva?: number | string;
  monto_iva?: number | string;
  monto_total_linea_con_iva?: number | string;
}

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

export interface RepuestoItem {
  id_repuesto: number;
  id_inventario: number;
  id_detalle_compra?: number | null;
  serial?: string;
  service_tag?: string;
  estado: 'nuevo' | 'reparado' | 'pendiente_reparacion';
  propietario?: string;
  id_orden_entrada?: number | null;
  id_orden_salida: number | null;
  costo_adquisicion?: number | string;
  costo_reparacion_base?: number | string;
  costo_total?: number | string;
  costo_reparacion_con_ganancia?: number | string;
  monto_venta_real?: number | string;
  utilidad?: number | string;
}

export interface PagoCompraItem {
  id_pago_compra: number;
  id_compra: number;
  monto_a_pagar: string | number;
  porcentaje_monto_total?: string | number;
  fecha_pago?: string | null;
  fecha_pago_acordada?: string | null;
  estado: 'pendiente' | 'realizado';
  abono_al_bien?: string | number;
  abono_al_iva?: string | number;
}

export interface PagoClienteItem {
  id_pago_cliente: number;
  id_cliente: number;
  id_orden: number;
  monto: string | number;
  estado: 'completado' | 'anulado';
  fecha_pago: string;
  metodo_pago?: string;
  num_referencia?: string;
}

export interface TipoOrdenItem {
  id_tipo_orden: number;
  nombre: string;
  descripcion?: string;
}

export interface ReparacionItem {
  id_reparacion: number;
  id_repuesto: number;
  id_orden?: number | null;
  estado: 'pendiente' | 'en_proceso' | 'finalizada' | 'anulada';
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  costo_servicios_base?: number | string;
  costo_insumos_base?: number | string;
  costo_total?: number | string;
  costo_total_con_ganancia?: number | string;
  monto_total_iva?: number | string;
}
