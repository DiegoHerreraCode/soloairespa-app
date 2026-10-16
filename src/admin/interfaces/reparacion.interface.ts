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
