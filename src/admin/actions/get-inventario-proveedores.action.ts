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

