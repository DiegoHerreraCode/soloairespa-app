import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  createUpdateProveedorAction,
  type CreateUpdateProveedorPayload,
} from '../actions/create-update-proveedor.action';

export const useProveedorMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const saveMutation = useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: CreateUpdateProveedorPayload;
      id?: string;
    }) => createUpdateProveedorAction(payload, id),
    onSuccess: (_, variables) => {
      const isCreating = !variables.id || variables.id === 'new';
      toast.success(
        isCreating
          ? 'Proveedor registrado correctamente'
          : 'Proveedor actualizado correctamente'
      );
      queryClient.invalidateQueries({ queryKey: ['proveedores-listado'] });
      if (variables.id && variables.id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['proveedor-item', variables.id] });
      }
      navigate('/admin/compras/proveedores');
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
    saveProveedor: saveMutation.mutate,
    isPending: saveMutation.isPending,
  };
};
