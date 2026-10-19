import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { CompraItem, DetalleCompraItem, CompraPagoPayload } from '../interfaces/compra.interface';

export interface CreateCompraPayload {
  id_proveedor: number;
  num_factura_boleta: string;
  fecha_compra: string;
  tipo_pago: 'contado' | 'credito';
  num_pagos?: number;
  monto_total_gravado?: number;
  monto_total_exento?: number;
  monto_total_iva?: number;
  monto_total?: number;
  monto_pendiente?: number;
  detalles: DetalleCompraItem[];
  pagos: CompraPagoPayload[];
}

export const createCompraAction = async (payload: CreateCompraPayload): Promise<CompraItem> => {
  const { data } = await apiClient.post<ApiResponse<CompraItem> | CompraItem>('/compras', payload);
  return 'data' in data ? data.data : data;
};
