import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  createUpdatePersonalAction,
  type CreateUpdatePersonalPayload,
} from '../actions/create-update-personal.action';

export const usePersonalMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const saveMutation = useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: CreateUpdatePersonalPayload;
      id?: string;
    }) => createUpdatePersonalAction(payload, id),
    onSuccess: (_, variables) => {
      const isCreating = !variables.id || variables.id === 'new';
      toast.success(
        isCreating
          ? 'Personal de taller registrado correctamente'
          : 'Personal de taller actualizado correctamente'
      );
      queryClient.invalidateQueries({ queryKey: ['personal-taller'] });
      if (variables.id && variables.id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['personal-item', variables.id] });
      }
      navigate('/admin/personal/taller');
    },
    onError: (error: any) => {
      const msg =
        error.response?.data?.message ||
        'Error al procesar la solicitud. Revisa los datos ingresados.';
      toast.error(msg);
    },
  });

  return {
    savePersonal: saveMutation.mutate,
    isPending: saveMutation.isPending,
  };
};
