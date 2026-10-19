import type { ProveedorItem } from './proveedor.interface';
import type { InventarioItem } from './inventario.interface';
import type { PagoCompraItem } from './pago-compra.interface';

export interface DetalleCompraSerial {
  serial?: string;
  service_tag?: string;
}

export interface DetalleCompraItem {
  id_detalle_compra?: number;
  id_compra?: number;
  id_inventario: number;
  cantidad: number;
  costo_unitario: number | string;
  monto_total_linea_sin_iva?: number | string;
  porcentaje_iva?: number | string;
  monto_iva?: number | string;
  monto_total_linea_con_iva?: number | string;
  seriales?: DetalleCompraSerial[];
  inventario?: InventarioItem;
}

export interface CompraPagoPayload {
  monto_a_pagar: number | string;
  porcentaje_monto_total: number | string;
  fecha_pago_acordada: string;
}

export interface CompraItem {
  id_compra: number;
  id_proveedor: number;
  id_admin?: number;
  num_factura_boleta: string;
  fecha_compra: string;
  tipo_pago: 'contado' | 'credito';
  estado: 'por_pagar' | 'pagada_parcial' | 'pagada';
  monto_total_gravado?: string | number;
  monto_total_exento?: string | number;
  monto_total_iva?: string | number;
  monto_total: string | number;
  monto_pendiente?: string | number;
  num_pagos?: number;
  proveedor?: ProveedorItem;
  detalles?: DetalleCompraItem[];
  pagosCompras?: PagoCompraItem[];
}
