import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { MarcaItem } from '../interfaces/marca.interface';

export interface CreateMarcaPayload {
  nombre: string;
}

export interface UpdateMarcaPayload {
  nombre: string;
}

export type CreateUpdateMarcaPayload = CreateMarcaPayload | UpdateMarcaPayload;

export const createUpdateMarcaAction = async (
  payload: CreateUpdateMarcaPayload,
  id?: number | string
): Promise<MarcaItem> => {
  const isUpdating = !!id && id !== 'new';

  if (isUpdating) {
    const updateData: UpdateMarcaPayload = {
      nombre: payload.nombre,
    };
    const { data } = await apiClient.put<ApiResponse<MarcaItem> | MarcaItem>(
      `/marcas/${id}`,
      updateData
    );
    return 'data' in data ? data.data : data;
  } else {
    const { data } = await apiClient.post<ApiResponse<MarcaItem> | MarcaItem>(
      '/marcas',
      payload
    );
    return 'data' in data ? data.data : data;
  }
};
