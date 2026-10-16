import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { AdminItem } from '../interfaces/admin.interface';

export interface CreateAdminPayload {
  name: string;
  email: string;
  password?: string;
  rut: string;
  num_tlf?: string;
  direccion: string;
}

export interface UpdateAdminPayload {
  nombre?: string;
  rut?: string;
  num_tlf?: string;
  direccion?: string;
}

export const createUpdateAdminAction = async (
  payload: CreateAdminPayload | UpdateAdminPayload,
  id?: number | string
): Promise<AdminItem> => {
  const isUpdating = !!id && id !== 'new';

  if (isUpdating) {
    // Editar administrador existente: PUT /admins/:id
    const { data } = await apiClient.put<ApiResponse<AdminItem> | AdminItem>(
      `/admins/${id}`,
      payload
    );
    return 'data' in data ? data.data : data;
  } else {
    // Crear nuevo administrador: POST /auth/register (Crea registro en users y en admins)
    const { data } = await apiClient.post<ApiResponse<AdminItem> | AdminItem>(
      '/register',
      payload
    );
    return 'data' in data ? data.data : data;
  }
};
