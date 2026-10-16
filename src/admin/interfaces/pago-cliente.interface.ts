export interface PagoClienteItem {
  id_pago_cliente: number;
  id_cliente: number;
  id_orden: number;
  monto: string | number;
  estado: 'completado' | 'anulado';
  fecha_pago: string;
  metodo_pago?: 'transferencia' | 'efectivo' | 'cheque' | string;
  num_referencia?: string;
  image?: string | null;
  imagePath?: string | null;
  fecha_anulacion?: string | null;
  id_admin_anulacion?: number | null;
  motivo_anulacion?: string | null;
  cliente?: {
    id_cliente: number;
    nombre: string;
    rut: string;
    correo?: string;
    num_tlf?: string;
    direccion?: string;
  };
}
