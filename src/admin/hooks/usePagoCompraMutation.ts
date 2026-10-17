import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { updatePagoCompraAction } from '../actions/update-pago-compra.action';

export const usePagoCompraMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const payMutation = useMutation({
    mutationFn: ({
      id,
      formData,
    }: {
      id: number | string;
      formData: FormData;
    }) => updatePagoCompraAction(id, formData),
    onSuccess: (_, variables) => {
      toast.success('Pago a proveedor registrado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['pagos-compras-listado'] });
      queryClient.invalidateQueries({ queryKey: ['pago-compra-item', String(variables.id)] });
      queryClient.invalidateQueries({ queryKey: ['compras-listado'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['finanzas'] });
      navigate('/admin/compras/pagos-compras');
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
        'Error al registrar el pago a la compra. Revisa los datos ingresados.';
      toast.error(msg);
    },
  });

  return {
    updatePagoCompra: payMutation.mutate,
    isPending: payMutation.isPending,
  };
};
