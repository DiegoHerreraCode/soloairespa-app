import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { TipoOrdenItem } from '../interfaces/tipo-orden.interface';

export interface CreateTipoOrdenPayload {
  nombre: string;
  descripcion?: string;
}

export interface UpdateTipoOrdenPayload {
  nombre?: string;
  descripcion?: string;
}

export type CreateUpdateTipoOrdenPayload = CreateTipoOrdenPayload | UpdateTipoOrdenPayload;

export const createUpdateTipoOrdenAction = async (
  payload: CreateUpdateTipoOrdenPayload,
  id?: number | string
): Promise<TipoOrdenItem> => {
  const isUpdating = !!id && id !== 'new';

  if (isUpdating) {
    // Al editar SOLO se envía nombre y descripcion
    const updateData: UpdateTipoOrdenPayload = {
      nombre: payload.nombre,
      descripcion: payload.descripcion,
    };
    const { data } = await apiClient.put<ApiResponse<TipoOrdenItem> | TipoOrdenItem>(
      `/tipos-ordenes/${id}`,
      updateData
    );
    return 'data' in data ? data.data : data;
  } else {
    // Al crear se envía nombre y descripcion
    const { data } = await apiClient.post<ApiResponse<TipoOrdenItem> | TipoOrdenItem>(
      '/tipos-ordenes',
      payload
    );
    return 'data' in data ? data.data : data;
  }
};
