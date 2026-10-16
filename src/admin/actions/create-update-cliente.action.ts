import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ClienteItem } from '../interfaces/cliente.interface';

export interface CreateUpdateClientePayload {
  nombre?: string;
  rut?: string;
  correo?: string;
  num_tlf?: string;
  direccion?: string;
}

export const createUpdateClienteAction = async (
  payload: CreateUpdateClientePayload,
  id?: number | string
): Promise<ClienteItem> => {
  const isUpdating = !!id && id !== 'new';

  if (isUpdating) {
    const { data } = await apiClient.put<ApiResponse<ClienteItem> | ClienteItem>(
      `/clientes/${id}`,
      payload
    );
    return 'data' in data ? data.data : data;
  } else {
    const { data } = await apiClient.post<ApiResponse<ClienteItem> | ClienteItem>(
      '/clientes',
      payload
    );
    return 'data' in data ? data.data : data;
  }
};
