import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { createCompraAction, type CreateCompraPayload } from '../actions/create-compra.action';

export const useCompraMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: (payload: CreateCompraPayload) => createCompraAction(payload),
    onSuccess: () => {
      toast.success('Compra registrada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['compras-listado'] });
      queryClient.invalidateQueries({ queryKey: ['pagos-compras-listado'] });
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['finanzas'] });
      navigate('/admin/compras/listado');
    },
    onError: (error: any) => {
      const errors = error.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        const firstMsg = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : errors[firstKey];
        toast.error(firstMsg);
        return;
      }
      const msg =
        error.response?.data?.message ||
        'Error al registrar la compra. Por favor verifica los datos.';
      toast.error(msg);
    },
  });

  return {
    createCompra: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
};
