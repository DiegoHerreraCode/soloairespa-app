import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ServicioTallerItem } from '../interfaces/servicio-taller.interface';

export interface CreateServicioTallerPayload {
  id_tipo_servicio_taller: number;
  nombre: string;
  descripcion?: string;
  costo_base: number;
  porcentaje_iva: number;
  porcentaje_ganancia: number;
}

export interface UpdateServicioTallerPayload {
  nombre?: string;
  descripcion?: string;
  costo_base?: number;
  porcentaje_iva?: number;
  porcentaje_ganancia?: number;
}

export type CreateUpdateServicioTallerPayload = CreateServicioTallerPayload | UpdateServicioTallerPayload;

export const createUpdateServicioTallerAction = async (
  payload: CreateUpdateServicioTallerPayload,
  id?: number | string
): Promise<ServicioTallerItem> => {
  const isUpdating = !!id && id !== 'new';

  if (isUpdating) {
    // Al editar: lo UNICO NO editable es id_tipo_servicio_taller
    const updateData: UpdateServicioTallerPayload = {
      nombre: payload.nombre,
      descripcion: payload.descripcion,
      costo_base: payload.costo_base,
      porcentaje_iva: payload.porcentaje_iva,
      porcentaje_ganancia: payload.porcentaje_ganancia,
    };
    const { data } = await apiClient.put<ApiResponse<ServicioTallerItem> | ServicioTallerItem>(
      `/servicios-taller/${id}`,
      updateData
    );
    return 'data' in data ? data.data : data;
  } else {
    // Al crear: id_tipo_servicio_taller, nombre y opcional descripcion
    const { data } = await apiClient.post<ApiResponse<ServicioTallerItem> | ServicioTallerItem>(
      '/servicios-taller',
      payload
    );
    return 'data' in data ? data.data : data;
  }
};
