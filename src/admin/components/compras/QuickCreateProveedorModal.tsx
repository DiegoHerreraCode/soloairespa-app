import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, X, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createUpdateProveedorAction } from '@/admin/actions/create-update-proveedor.action';
import type { ProveedorItem } from '@/admin/interfaces/proveedor.interface';

interface QuickCreateProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (proveedor: ProveedorItem) => void;
}

export const QuickCreateProveedorModal: React.FC<QuickCreateProveedorModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const queryClient = useQueryClient();

  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [correo, setCorreo] = useState('');
  const [numTlf, setNumTlf] = useState('');
  const [direccion, setDireccion] = useState('');

  const mutation = useMutation({
    mutationFn: (payload: {
      nombre: string;
      rut: string;
      correo: string;
      num_tlf: string;
      direccion: string;
    }) => createUpdateProveedorAction(payload),
    onSuccess: (nuevoProveedor) => {
      toast.success(`Proveedor "${nuevoProveedor.nombre}" creado exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['proveedores-listado'] });
      queryClient.invalidateQueries({ queryKey: ['proveedores-select'] });
      onCreated(nuevoProveedor);
      handleReset();
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
      toast.error(err?.response?.data?.message || 'Error al crear el proveedor');
    },
  });

  const handleReset = () => {
    setNombre('');
    setRut('');
    setCorreo('');
    setNumTlf('');
    setDireccion('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !rut.trim()) {
      toast.warning('El nombre y RUT del proveedor son obligatorios');
      return;
    }

    mutation.mutate({
      nombre: nombre.trim(),
      rut: rut.trim().toUpperCase(),
      correo: correo.trim(),
      num_tlf: numTlf.trim(),
      direccion: direccion.trim(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="relative bg-card border border-border/90 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 overflow-hidden">
        {/* Overlay con spinner cuando está guardando */}
        {mutation.isPending && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-2.5 animate-fadeIn">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs sm:text-sm font-semibold text-foreground">
              Creando nuevo proveedor...
            </p>
          </div>
        )}

        {/* Cabecera del modal */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            Registrar Nuevo Proveedor
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario rápido */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">
              Nombre de la Empresa / Razón Social <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Distribuidora de Climatización SpA"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                RUT <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="Ej: 77.987.654-3"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Teléfono</label>
              <input
                type="text"
                value={numTlf}
                onChange={(e) => setNumTlf(e.target.value)}
                placeholder="Ej: +56 2 2345 6789"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Correo de Ventas / Contacto</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="ventas@proveedor.cl"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Dirección Casa Matriz / Bodega</label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Panamericana Norte 5000, Quilicura"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Crear y Seleccionar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

