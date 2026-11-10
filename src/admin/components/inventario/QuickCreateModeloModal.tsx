import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Layers, X, Save, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createUpdateModeloAction } from '@/admin/actions/create-update-modelo.action';
import { getMarcasAction } from '@/admin/actions/get-marcas.action';
import type { ModeloItem } from '@/admin/interfaces/modelo.interface';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { QuickCreateMarcaModal } from './QuickCreateMarcaModal';

interface QuickCreateModeloModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (modelo: ModeloItem) => void;
  defaultMarcaId?: number;
}

export const QuickCreateModeloModal: React.FC<QuickCreateModeloModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  defaultMarcaId,
}) => {
  const queryClient = useQueryClient();

  const { data: marcas = [] } = useQuery({
    queryKey: ['marcas-listado'],
    queryFn: getMarcasAction,
    enabled: isOpen,
  });

  const [idMarca, setIdMarca] = useState<number | ''>(defaultMarcaId || '');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isQuickMarcaOpen, setIsQuickMarcaOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload: { id_marca: number; nombre: string; descripcion?: string }) =>
      createUpdateModeloAction(payload),
    onSuccess: (nuevoModelo) => {
      toast.success(`Modelo "${nuevoModelo.nombre}" registrado exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['modelos-listado'] });
      onCreated(nuevoModelo);
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
      toast.error(err?.response?.data?.message || 'Error al crear el modelo');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idMarca) {
      toast.warning('Selecciona una marca');
      return;
    }
    if (!nombre.trim()) {
      toast.warning('Ingresa el nombre del modelo');
      return;
    }
    mutation.mutate({
      id_marca: Number(idMarca),
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
        <div className="bg-card border border-border/90 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" />
              Nuevo Modelo Técnico
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Marca <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsQuickMarcaOpen(true)}
                  className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nueva Marca
                </button>
              </div>
              <SearchableSelect
                options={marcas.map((m) => ({
                  value: m.id_marca,
                  label: m.nombre,
                  searchTerms: m.nombre,
                }))}
                value={idMarca}
                onChange={(val) => setIdMarca(val ? Number(val) : '')}
                placeholder="-- Seleccionar Marca --"
                searchPlaceholder="Buscar marca..."
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                Nombre del Modelo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: 4CES-9Y, T2 / TE2"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Descripción (Opcional)</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                placeholder="Detalles técnicos o notas breves..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
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
                    Crear Modelo
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <QuickCreateMarcaModal
        isOpen={isQuickMarcaOpen}
        onClose={() => setIsQuickMarcaOpen(false)}
        onCreated={(nueva) => setIdMarca(nueva.id_marca)}
      />
    </>
  );
};

