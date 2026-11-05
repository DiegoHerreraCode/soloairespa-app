import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { InventarioItem } from '../interfaces/inventario.interface';

export interface ItemProveedorPayload {
  id_proveedor: number;
  codigo_proveedor: string;
  ultimo_monto_compra?: number | string;
}

export interface CreateItemPayload {
  sku: string;
  nombre: string;
  tipo: 'insumo' | 'compresor' | 'valvula' | 'equipo';
  condicion: string;
  stock_minimo: number;
  porcentaje_iva: number;
  porcentaje_ganancia: number;
  id_modelo: number;
  proveedores?: ItemProveedorPayload[];
}

export interface UpdateItemPayload {
  sku: string;
  nombre: string;
  stock_minimo: number;
  porcentaje_iva: number;
  porcentaje_ganancia: number;
  proveedores?: ItemProveedorPayload[];
}

export type CreateUpdateItemPayload = CreateItemPayload | UpdateItemPayload;

export const createUpdateItemAction = async (
  payload: CreateUpdateItemPayload,
  id?: number | string
): Promise<InventarioItem> => {
  const isUpdating = !!id && id !== 'new';

  if (isUpdating) {
    // Al editar: solo editable sku, nombre, stock_minimo, porcentaje_iva y porcentaje_ganancia, mas proveedores
    const updateData: UpdateItemPayload = {
      sku: payload.sku,
      nombre: payload.nombre,
      stock_minimo: Number(payload.stock_minimo),
      porcentaje_iva: Number(payload.porcentaje_iva),
      porcentaje_ganancia: Number(payload.porcentaje_ganancia),
      proveedores: payload.proveedores,
    };
    const { data } = await apiClient.put<ApiResponse<InventarioItem> | InventarioItem>(
      `/inventario/${id}`,
      updateData
    );
    return 'data' in data ? data.data : data;
  } else {
    // Al crear: sku, nombre, tipo, condicion, stock_minimo, porcentaje_iva y porcentaje_ganancia (opcional id_modelo)
    const { data } = await apiClient.post<ApiResponse<InventarioItem> | InventarioItem>(
      '/inventario',
      payload
    );
    return 'data' in data ? data.data : data;
  }
};
