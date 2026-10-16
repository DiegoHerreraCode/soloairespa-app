import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { createPagoClienteAction } from '../actions/create-pago-cliente.action';

export const usePagoClienteMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Mutación exclusiva para registrar nuevo pago
  const createMutation = useMutation({
    mutationFn: (formData: FormData) => createPagoClienteAction(formData),
    onSuccess: () => {
      toast.success('Pago de cliente registrado correctamente');
      queryClient.invalidateQueries({ queryKey: ['pagos-clientes-listado'] });
      queryClient.invalidateQueries({ queryKey: ['finanzas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/admin/clientes/pagos-clientes');
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
        'Error al registrar el pago. Comprueba que la orden no esté pagada o pendiente.';
      toast.error(msg);
    },
  });

  return {
    createPago: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
};
