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
