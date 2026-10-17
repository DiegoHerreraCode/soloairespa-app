export interface PagoCompraItem {
  id_pago_compra: number;
  id_compra: number;
  id_admin?: number;
  monto_a_pagar: string | number;
  porcentaje_monto_total?: string | number;
  fecha_pago?: string | null;
  fecha_pago_acordada?: string | null;
  metodo_pago?: 'transferencia' | 'efectivo' | 'cheque' | null;
  num_referencia?: string | null;
  image?: string | null;
  imagePath?: string | null;
  estado: 'pendiente' | 'realizado';
  abono_al_bien?: string | number;
  abono_al_iva?: string | number;
}
