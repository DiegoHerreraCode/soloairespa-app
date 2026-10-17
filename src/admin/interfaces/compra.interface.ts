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
}
