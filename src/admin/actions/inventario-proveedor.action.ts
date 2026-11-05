import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { InventarioProveedorItem } from '../interfaces/inventario-proveedor.interface';

export const getInventarioProveedoresAction = async (params?: {
  id_proveedor?: number;
  id_inventario?: number;
}): Promise<InventarioProveedorItem[]> => {
  try {
    const { data } = await apiClient.get<
      ApiResponse<InventarioProveedorItem[]> | InventarioProveedorItem[]
    >('/inventario-proveedores', { params });
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener inventario proveedores:', error);
    return [];
  }
};

export const createInventarioProveedorAction = async (payload: {
  id_proveedor: number;
  id_inventario: number;
  codigo_proveedor: string;
  ultimo_monto_compra?: number | string;
}): Promise<InventarioProveedorItem> => {
  const { data } = await apiClient.post<
    ApiResponse<InventarioProveedorItem> | InventarioProveedorItem
  >('/inventario-proveedores', payload);
  return 'data' in data ? data.data : data;
};

export const updateInventarioProveedorAction = async (
  id: number,
  payload: { codigo_proveedor?: string; ultimo_monto_compra?: number | string }
): Promise<InventarioProveedorItem> => {
  const { data } = await apiClient.put<
    ApiResponse<InventarioProveedorItem> | InventarioProveedorItem
  >(`/inventario-proveedores/${id}`, payload);
  return 'data' in data ? data.data : data;
};

export const deleteInventarioProveedorAction = async (id: number): Promise<void> => {
  await apiClient.delete(`/inventario-proveedores/${id}`);
};

