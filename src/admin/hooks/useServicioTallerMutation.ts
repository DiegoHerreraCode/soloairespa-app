import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  createUpdateServicioTallerAction,
  type CreateUpdateServicioTallerPayload,
} from '../actions/create-update-servicio-taller.action';

export const useServicioTallerMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const saveMutation = useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: CreateUpdateServicioTallerPayload;
      id?: string;
    }) => createUpdateServicioTallerAction(payload, id),
    onSuccess: (_, variables) => {
      const isCreating = !variables.id || variables.id === 'new';
      toast.success(
        isCreating
          ? 'Servicio del taller registrado correctamente'
          : 'Servicio del taller actualizado correctamente'
      );
      queryClient.invalidateQueries({ queryKey: ['servicios-taller-listado'] });
      if (variables.id && variables.id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['servicio-taller-item', variables.id] });
      }
      navigate('/admin/taller/servicios');
    },
    onError: (error: any) => {
      const errors = error.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        const firstMsg = errors[firstKey][0];
        toast.error(firstMsg);
        return;
      }
      const msg =
        error.response?.data?.message ||
        'Error al procesar la solicitud. Revisa los datos ingresados.';
      toast.error(msg);
    },
  });

  return {
    saveServicioTaller: saveMutation.mutate,
    isPending: saveMutation.isPending,
  };
};
