import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ProveedorItem } from '../interfaces/proveedor.interface';

export const getProveedoresAction = async (): Promise<ProveedorItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<ProveedorItem[]> | ProveedorItem[]>('/proveedores');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    return [];
  }
};
