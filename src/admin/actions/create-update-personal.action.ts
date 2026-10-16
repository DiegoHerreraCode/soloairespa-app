import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { PersonalItem } from '../interfaces/personal.interface';

export interface CreateUpdatePersonalPayload {
  nombre?: string;
  rut?: string;
  correo?: string;
  num_tlf?: string;
  direccion?: string;
  disponible?: boolean;
  is_deleted?: boolean;
}

export const createUpdatePersonalAction = async (
  payload: CreateUpdatePersonalPayload,
  id?: number | string
): Promise<PersonalItem> => {
  const isUpdating = !!id && id !== 'new';

  if (isUpdating) {
    const { data } = await apiClient.put<ApiResponse<PersonalItem> | PersonalItem>(
      `/personal/${id}`,
      payload
    );
    return 'data' in data ? data.data : data;
  } else {
    const { data } = await apiClient.post<ApiResponse<PersonalItem> | PersonalItem>(
      '/personal',
      payload
    );
    return 'data' in data ? data.data : data;
  }
};
