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
  // Relaciones cargadas opcionales
  insumo_saliente?: {
    id_inventario?: number;
    nombre?: string;
    sku?: string;
  };
  repuesto_saliente_inventario?: {
    id_inventario?: number;
    nombre?: string;
    sku?: string;
  };
  repuesto_entrante_inventario?: {
    id_inventario?: number;
    nombre?: string;
    sku?: string;
  };
  repuesto_saliente?: {
    id_repuesto?: number;
    serial?: string;
    service_tag?: string;
  };
  repuesto_entrante?: {
    id_repuesto?: number;
    serial?: string;
    service_tag?: string;
  };
}

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
  fecha_anulacion?: string | null;
  id_admin_anulacion?: number | null;
  motivo_anulacion?: string | null;
  cliente?: {
    id_cliente?: number;
    nombre?: string;
    rut?: string;
    correo?: string;
    num_tlf?: string;
    direccion?: string;
    razon_social?: string;
  };
  tipo_orden?: {
    id_tipo_orden?: number;
    nombre?: string;
    descripcion?: string;
  };
  admin?: {
    id_admin?: number;
    nombre?: string;
    apellido?: string;
  };
  admin_anulacion?: {
    id_admin?: number;
    nombre?: string;
    apellido?: string;
  };
  detalles?: DetalleOrdenItem[];
  repuestos_entrada?: any[];
  repuestos_salida?: any[];
  reparaciones?: any[];
}
