import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  createUpdateMarcaAction,
  type CreateUpdateMarcaPayload,
} from '../actions/create-update-marca.action';

export const useMarcaMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const saveMutation = useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: CreateUpdateMarcaPayload;
      id?: string;
    }) => createUpdateMarcaAction(payload, id),
    onSuccess: (_, variables) => {
      const isCreating = !variables.id || variables.id === 'new';
      toast.success(
        isCreating
          ? 'Marca registrada correctamente'
          : 'Marca actualizada correctamente'
      );
      queryClient.invalidateQueries({ queryKey: ['marcas-listado'] });
      if (variables.id && variables.id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['marca-item', variables.id] });
      }
      navigate('/admin/inventario/marcas');
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
    saveMarca: saveMutation.mutate,
    isPending: saveMutation.isPending,
  };
};
