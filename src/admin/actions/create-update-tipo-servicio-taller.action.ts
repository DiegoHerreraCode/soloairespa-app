import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { TipoServicioTallerItem } from '../interfaces/tipo-servicio-taller.interface';

export interface CreateTipoServicioTallerPayload {
  nombre: string;
  descripcion?: string;
}

export interface UpdateTipoServicioTallerPayload {
  nombre?: string;
  descripcion?: string;
}

export type CreateUpdateTipoServicioTallerPayload = CreateTipoServicioTallerPayload | UpdateTipoServicioTallerPayload;

export const createUpdateTipoServicioTallerAction = async (
  payload: CreateUpdateTipoServicioTallerPayload,
  id?: number | string
): Promise<TipoServicioTallerItem> => {
  const isUpdating = !!id && id !== 'new';

  if (isUpdating) {
    // Al editar SOLO se envía nombre y descripcion
    const updateData: UpdateTipoServicioTallerPayload = {
      nombre: payload.nombre,
      descripcion: payload.descripcion,
    };
    const { data } = await apiClient.put<ApiResponse<TipoServicioTallerItem> | TipoServicioTallerItem>(
      `/tipos-servicios-taller/${id}`,
      updateData
    );
    return 'data' in data ? data.data : data;
  } else {
    // Al crear se envía id_marca, nombre y descripcion
    const { data } = await apiClient.post<ApiResponse<TipoServicioTallerItem> | TipoServicioTallerItem>(
      '/tipos-servicios-taller',
      payload
    );
    return 'data' in data ? data.data : data;
  }
};
