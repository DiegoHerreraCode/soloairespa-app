import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { PagoClienteItem } from '../interfaces/pago-cliente.interface';

export const createPagoClienteAction = async (formData: FormData): Promise<PagoClienteItem> => {
  // Axios detecta automáticamente la instancia de FormData y asigna multipart/form-data con su boundary
  const { data } = await apiClient.post<ApiResponse<PagoClienteItem> | PagoClienteItem>(
    '/pagos-clientes',
    formData
  );
  return 'data' in data ? data.data : data;
};
