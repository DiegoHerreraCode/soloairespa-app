import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ProveedorItem } from '../interfaces/proveedor.interface';

export interface CreateUpdateProveedorPayload {
  nombre?: string;
  rut?: string;
  correo?: string;
  num_tlf?: string;
  direccion?: string;
}

export const createUpdateProveedorAction = async (
  payload: CreateUpdateProveedorPayload,
  id?: number | string
): Promise<ProveedorItem> => {
  const isUpdating = !!id && id !== 'new';

  if (isUpdating) {
    const { data } = await apiClient.put<ApiResponse<ProveedorItem> | ProveedorItem>(
      `/proveedores/${id}`,
      payload
    );
    return 'data' in data ? data.data : data;
  } else {
    const { data } = await apiClient.post<ApiResponse<ProveedorItem> | ProveedorItem>(
      '/proveedores',
      payload
    );
    return 'data' in data ? data.data : data;
  }
};
