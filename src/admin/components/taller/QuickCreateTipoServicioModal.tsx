import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, X, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createUpdateTipoServicioTallerAction } from '@/admin/actions/create-update-tipo-servicio-taller.action';
import type { TipoServicioTallerItem } from '@/admin/interfaces/tipo-servicio-taller.interface';

interface QuickCreateTipoServicioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (tipo: TipoServicioTallerItem) => void;
}

export const QuickCreateTipoServicioModal: React.FC<QuickCreateTipoServicioModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const mutation = useMutation({
    mutationFn: (payload: { nombre: string; descripcion?: string }) =>
      createUpdateTipoServicioTallerAction(payload),
    onSuccess: (nuevoTipo) => {
      toast.success(`Tipo de servicio "${nuevoTipo.nombre}" creado exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['tipos-servicios-taller-listado'] });
      onCreated(nuevoTipo);
      setNombre('');
      setDescripcion('');
      onClose();
    },
    onError: (err: any) => {
      console.error(err);
      const errors = err?.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        toast.error(errors[firstKey][0]);
        return;
      }
      toast.error(err?.response?.data?.message || 'Error al crear el tipo de servicio');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.warning('Ingresa el nombre del tipo de servicio');
      return;
    }
    mutation.mutate({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="relative bg-card border border-border/90 rounded-2xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
        {mutation.isPending && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-2.5 animate-fadeIn">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs sm:text-sm font-semibold text-foreground">
              Creando tipo de servicio...
            </p>
          </div>
        )}

        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500" />
            Nuevo Tipo de Servicio
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">
              Nombre <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Mantenimiento Preventivo, Diagnóstico"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Descripción (Opcional)</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              placeholder="Detalle o alcance de la categoría..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-muted/50 text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Crear Tipo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

