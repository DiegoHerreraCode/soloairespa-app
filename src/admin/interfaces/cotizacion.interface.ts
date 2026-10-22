import type { TipoOrdenItem } from './tipo-orden.interface';
import type { ClienteItem } from './cliente.interface';
import type { AdminItem } from './admin.interface';
import type { InventarioItem } from './inventario.interface';
import type { ServicioTallerItem } from './servicio-taller.interface';

export type CotizacionEstado = 'pendiente' | 'aceptada' | 'rechazada' | 'anulada';
export type CotizacionTipo = 'inicial' | 'extra';

export interface CotizacionDetalleInventarioItem {
  id_detalle_cotizacion_inventario?: number;
  id_cotizacion?: number;
  id_inventario_insumo_saliente?: number | null;
  id_inventario_repuesto_saliente?: number | null;
  id_inventario_repuesto_entrante?: number | null;
  cantidad: number;
  precio_unitario: number | string;
  subtotal: number | string;
  inventario_insumo_saliente?: InventarioItem;
  inventario_repuesto_saliente?: InventarioItem;
  inventario_repuesto_entrante?: InventarioItem;
  // Soporte para camelCase de Eloquent
  inventarioInsumoSaliente?: InventarioItem;
  inventarioRepuestoSaliente?: InventarioItem;
  inventarioRepuestoEntrante?: InventarioItem;
}

export interface CotizacionDetalleServicioTallerItem {
  id_detalle_cotizacion_servicio?: number;
  id_cotizacion?: number;
  id_servicio_taller: number;
  precio: number | string;
  servicio_taller?: ServicioTallerItem;
  servicioTaller?: ServicioTallerItem;
}

export interface CotizacionItem {
  id_cotizacion: number;
  id_orden?: number | null;
  id_admin?: number;
  id_cliente: number;
  id_tipo_orden: number;
  num_cotizacion_padre?: string | null;
  num_cotizacion: string;
  tipo: CotizacionTipo;
  monto_total_gravado?: number | string;
  monto_total_exento?: number | string;
  monto_total_iva?: number | string;
  monto_total: number | string;
  estado: CotizacionEstado;
  pdf_cotizacion?: string | null;
  fecha_creacion: string;
  fecha_vencimiento: string;
  fecha_anulacion?: string | null;
  id_admin_anulacion?: number | null;
  motivo_anulacion?: string | null;
  num_repuestos_a_reparar?: number;
  services_tags_repuestos_a_reparar?: string[];
  cliente?: ClienteItem;
  tipo_orden?: TipoOrdenItem;
  admin?: AdminItem;
  detalles_inventario?: CotizacionDetalleInventarioItem[];
  detallesInventario?: CotizacionDetalleInventarioItem[];
  detalles_servicios_taller?: CotizacionDetalleServicioTallerItem[];
  detallesServiciosTaller?: CotizacionDetalleServicioTallerItem[];
}

