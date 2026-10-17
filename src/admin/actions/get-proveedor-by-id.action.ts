import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ProveedorItem } from '../interfaces/proveedor.interface';

export const getProveedorByIdAction = async (id: number | string): Promise<ProveedorItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<ProveedorItem> | ProveedorItem>(`/proveedores/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener proveedor por ID:', error);
    return null;
  }
};
