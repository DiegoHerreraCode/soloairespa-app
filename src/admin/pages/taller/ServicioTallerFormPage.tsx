import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Wrench, Layers, AlignLeft, Tag, DollarSign, Percent } from 'lucide-react';
import { getServicioTallerByIdAction } from '../../actions/get-servicio-taller-by-id.action';
import { getTiposServiciosTallerAction } from '../../actions/get-tipos-servicios-taller.action';
import { useServicioTallerMutation } from '../../hooks/useServicioTallerMutation';

export const ServicioTallerFormPage = () => {
  const { id } = useParams<{ id: string }>();

  // Si id === 'new', estamos creando; de lo contrario estamos editando
  const isCreating = !id || id === 'new';

  const { saveServicioTaller, isPending } = useServicioTallerMutation();

  // Consulta del catálogo de tipos de servicios del taller
  const { data: tiposServicios = [], isLoading: isLoadingTipos } = useQuery({
    queryKey: ['tipos-servicios-taller-listado'],
    queryFn: getTiposServiciosTallerAction,
  });

  // Consulta de datos del servicio si estamos editando
  const { data: servicioData, isLoading: isLoadingServicio } = useQuery({
    queryKey: ['servicio-taller-item', id],
    queryFn: () => getServicioTallerByIdAction(id!),
    enabled: !isCreating,
  });

  // Estado del formulario
  const [idTipoServicio, setIdTipoServicio] = useState<number | ''>('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [costoBase, setCostoBase] = useState<number>(0);
  const [porcentajeIva, setPorcentajeIva] = useState<number>(0);
  const [porcentajeGanancia, setPorcentajeGanancia] = useState<number>(0);

  // Sincronizar datos al editar
  useEffect(() => {
    if (servicioData) {
      setIdTipoServicio(servicioData.id_tipo_servicio_taller);
      setNombre(servicioData.nombre || '');
      setDescripcion(servicioData.descripcion || '');
      setCostoBase(servicioData.costo_base || 0);
      setPorcentajeIva(servicioData.porcentaje_iva || 0);
      setPorcentajeGanancia(servicioData.porcentaje_ganancia || 0);
    }
  }, [servicioData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.warning('Por favor ingresa el nombre del servicio del taller');
      return;
    }

    if (!costoBase) {
      toast.warning('Por favor ingresa el costo base del servicio del taller');
      return;
    }

    if (!porcentajeIva) {
      toast.warning('Por favor ingresa el porcentaje de IVA del servicio del taller');
      return;
    }

    if (!porcentajeGanancia) {
      toast.warning('Por favor ingresa el porcentaje de ganancia del servicio del taller');
      return;
    }

    if (isCreating) {
      if (!idTipoServicio) {
        toast.warning('Por favor selecciona un tipo de servicio para el servicio');
        return;
      }

      // Al crear: todos los campos requeridos excepto la descripción (opcional)
      saveServicioTaller({
        payload: {
          id_tipo_servicio_taller: Number(idTipoServicio),
          nombre: nombre.trim(),
          descripcion: descripcion.trim() ? descripcion.trim() : undefined,
          costo_base: costoBase,
          porcentaje_iva: porcentajeIva,
          porcentaje_ganancia: porcentajeGanancia,
        },
        id: undefined,
      });
    } else {
      // Al editar: lo UNICO NO editable es el id_tipo_servicio_taller
      saveServicioTaller({
        payload: {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() ? descripcion.trim() : undefined,
          costo_base: costoBase,
          porcentaje_iva: porcentajeIva,
          porcentaje_ganancia: porcentajeGanancia,
        },
        id,
      });
    }
  };

  if (!isCreating && isLoadingServicio) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Encontrar el nombre del tipo de servicio actual para mostrar cuando está bloqueado
  const tipoActual = tiposServicios.find((t) => t.id_tipo_servicio_taller === Number(idTipoServicio));

  return (
    <div className="space-y-6 max-w-2xl animate-fadeIn mx-auto pb-12">
      {/* 1. Encabezado con Botón Volver */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/taller/servicios"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Wrench className="w-6 h-6 text-blue-500" />
              {isCreating ? 'Registrar Nuevo Servicio del Taller' : `Editar Servicio del Taller #${id}`}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCreating
                ? 'Asocia un nuevo servicio técnico a un tipo de servicio de taller'
                : 'Modificación de las propiedades descriptivas del servicio técnico'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Tarjeta del Formulario */}
      <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border/80 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo: Tipo de Servicio del Taller (id_tipo_servicio_taller) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              Tipo de Servicio del Taller <span className="text-rose-500">*</span>
              {!isCreating && (
                <span className="text-[10px] font-normal normal-case text-amber-500 ml-1">
                  (No editable)
                </span>
              )}
            </label>

            {isCreating ? (
              <select
                value={idTipoServicio}
                onChange={(e) => setIdTipoServicio(e.target.value ? Number(e.target.value) : '')}
                disabled={isLoadingTipos}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
                required
              >
                <option value="">-- Selecciona un tipo de servicio --</option>
                {tiposServicios.map((t) => (
                  <option key={t.id_tipo_servicio_taller} value={t.id_tipo_servicio_taller}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-sm font-bold text-foreground">
                  {tipoActual?.nombre || servicioData?.tipo_servicio_taller?.nombre || `Tipo #${idTipoServicio}`}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  El tipo de servicio de taller asignado no puede ser modificado.
                </p>
              </div>
            )}
          </div>

          {/* Campo: Nombre del Servicio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-500" />
              Nombre del Servicio <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Rectificado de Plano y Asiento de Válvulas"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium"
              required
            />
          </div>

          {/* Campo: Descripción del Servicio (Opcional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-blue-500" />
              Descripción
              <span className="text-[10px] font-normal normal-case text-muted-foreground ml-1">
                (Opcional)
              </span>
            </label>
            <textarea
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalle o especificaciones de la labor técnica..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* Campos Económicos */}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-blue-500" />
              Costo Base <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={costoBase}
              onChange={(e) => setCostoBase(Number(e.target.value))}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium"
              required
              min={0}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-blue-500" />
              Porcentaje de IVA <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={porcentajeIva}
              onChange={(e) => setPorcentajeIva(Number(e.target.value))}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium"
              required
              min={0}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-blue-500" />
              Porcentaje de Ganancia <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={porcentajeGanancia}
              onChange={(e) => setPorcentajeGanancia(Number(e.target.value))}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium"
              required
              min={0}
            />
          </div>

          {/* Botón de Enviar */}
          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isPending
                ? 'Guardando...'
                : isCreating
                  ? 'Registrar Servicio'
                  : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServicioTallerFormPage;
