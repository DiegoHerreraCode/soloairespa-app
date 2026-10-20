import { apiClient } from '@/api/apiClient';

export const deleteAsignacionAction = async (id_asignacion: number | string): Promise<boolean> => {
  await apiClient.delete(`/asignaciones/${id_asignacion}`);
  return true;
};
