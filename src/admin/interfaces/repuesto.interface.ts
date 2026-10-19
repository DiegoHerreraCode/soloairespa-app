export interface RepuestoItem {
  id_repuesto: number;
  id_inventario: number;
  id_detalle_compra?: number | null;
  serial?: string;
  service_tag?: string;
  estado: 'nuevo' | 'reparado' | 'pendiente_reparacion';
  propietario?: boolean;
  id_orden_entrada?: number | null;
  id_orden_salida: number | null;
  costo_adquisicion?: number | string;
  costo_reparacion_base?: number | string;
  costo_total?: number | string;
  costo_reparacion_con_ganancia?: number | string;
  monto_venta_real?: number | string;
  utilidad?: number | string;
}
