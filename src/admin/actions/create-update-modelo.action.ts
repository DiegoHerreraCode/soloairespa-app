import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ModeloItem } from '../interfaces/modelo.interface';

export interface CreateModeloPayload {
  id_marca: number;
  nombre: string;
  descripcion?: string;
}

export interface UpdateModeloPayload {
  nombre?: string;
  descripcion?: string;
}

export type CreateUpdateModeloPayload = CreateModeloPayload | UpdateModeloPayload;

export const createUpdateModeloAction = async (
  payload: CreateUpdateModeloPayload,
  id?: number | string
): Promise<ModeloItem> => {
  const isUpdating = !!id && id !== 'new';

  if (isUpdating) {
    // Al editar SOLO se envía nombre y descripcion
    const updateData: UpdateModeloPayload = {
      nombre: payload.nombre,
      descripcion: payload.descripcion,
    };
    const { data } = await apiClient.put<ApiResponse<ModeloItem> | ModeloItem>(
      `/modelos/${id}`,
      updateData
    );
    return 'data' in data ? data.data : data;
  } else {
    // Al crear se envía id_marca, nombre y descripcion
    const { data } = await apiClient.post<ApiResponse<ModeloItem> | ModeloItem>(
      '/modelos',
      payload
    );
    return 'data' in data ? data.data : data;
  }
};
