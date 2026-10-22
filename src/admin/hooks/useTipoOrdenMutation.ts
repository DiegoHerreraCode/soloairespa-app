import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  createUpdateTipoOrdenAction,
  type CreateUpdateTipoOrdenPayload,
} from '../actions/create-update-tipo-orden.action';

export const useTipoOrdenMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const saveMutation = useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: CreateUpdateTipoOrdenPayload;
      id?: string;
    }) => createUpdateTipoOrdenAction(payload, id),
    onSuccess: (_, variables) => {
      const isCreating = !variables.id || variables.id === 'new';
      toast.success(
        isCreating
          ? 'Tipo de orden registrado correctamente'
          : 'Tipo de orden actualizado correctamente'
      );
      queryClient.invalidateQueries({ queryKey: ['tipos-ordenes-listado'] });
      if (variables.id && variables.id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['tipo-orden-item', variables.id] });
      }
      navigate('/admin/ordenes/tipos-ordenes');
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
    saveTipoOrden: saveMutation.mutate,
    isPending: saveMutation.isPending,
  };
};
