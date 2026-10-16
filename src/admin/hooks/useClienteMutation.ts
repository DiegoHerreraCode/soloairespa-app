import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  createUpdateClienteAction,
  type CreateUpdateClientePayload,
} from '../actions/create-update-cliente.action';

export const useClienteMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const saveMutation = useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: CreateUpdateClientePayload;
      id?: string;
    }) => createUpdateClienteAction(payload, id),
    onSuccess: (_, variables) => {
      const isCreating = !variables.id || variables.id === 'new';
      toast.success(
        isCreating
          ? 'Cliente registrado correctamente'
          : 'Cliente actualizado correctamente'
      );
      queryClient.invalidateQueries({ queryKey: ['clientes-listado'] });
      if (variables.id && variables.id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['cliente-item', variables.id] });
      }
      navigate('/admin/clientes/listado');
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
    saveCliente: saveMutation.mutate,
    isPending: saveMutation.isPending,
  };
};
