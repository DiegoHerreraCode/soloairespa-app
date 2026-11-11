import type { TipoServicioTallerItem } from './tipo-servicio-taller.interface';

export interface ServicioTallerItem {
  id_servicio_taller: number;
  id_tipo_servicio_taller: number;
  nombre: string;
  descripcion?: string | null;
  costo_base: number;
  porcentaje_iva: number;
  porcentaje_ganancia: number;
  monto_venta_unitario?: number | string;
  tipo_servicio_taller?: TipoServicioTallerItem;
  created_at?: string;
  updated_at?: string;
}
