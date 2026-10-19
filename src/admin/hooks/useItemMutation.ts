import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  createUpdateItemAction,
  type CreateUpdateItemPayload,
} from '../actions/create-update-item.action';

export const useItemMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const saveMutation = useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: CreateUpdateItemPayload;
      id?: string;
    }) => createUpdateItemAction(payload, id),
    onSuccess: (_, variables) => {
      const isCreating = !variables.id || variables.id === 'new';
      toast.success(
        isCreating
          ? 'Ítem de inventario registrado correctamente'
          : 'Ítem de inventario actualizado correctamente'
      );
      queryClient.invalidateQueries({ queryKey: ['inventario-listado'] });
      if (variables.id && variables.id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['inventario-item', variables.id] });
      }
      navigate('/admin/inventario/items');
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
    saveItem: saveMutation.mutate,
    isPending: saveMutation.isPending,
  };
};
