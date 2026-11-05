import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, X, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createUpdateMarcaAction } from '@/admin/actions/create-update-marca.action';
import type { MarcaItem } from '@/admin/interfaces/marca.interface';

interface QuickCreateMarcaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (marca: MarcaItem) => void;
}

export const QuickCreateMarcaModal: React.FC<QuickCreateMarcaModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState('');

  const mutation = useMutation({
    mutationFn: (name: string) => createUpdateMarcaAction({ nombre: name }),
    onSuccess: (nuevaMarca) => {
      toast.success(`Marca "${nuevaMarca.nombre}" registrada exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['marcas-listado'] });
      onCreated(nuevaMarca);
      setNombre('');
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
      toast.error(err?.response?.data?.message || 'Error al crear la marca');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.warning('Ingresa el nombre de la marca');
      return;
    }
    mutation.mutate(nombre.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-card border border-border/90 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-500" />
            Nueva Marca
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">
              Nombre de la Marca <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Bitzer, Danfoss, Carrier"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-muted/50 text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Crear Marca
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

