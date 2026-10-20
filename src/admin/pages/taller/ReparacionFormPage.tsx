import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Play,
  UserPlus,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Wrench,
  Search,
  Check,
  Edit,
} from 'lucide-react';
import { getReparacionByIdAction } from '../../actions/get-reparacion-by-id.action';
import { getRepuestosAction } from '../../actions/get-repuestos.action';
import { getInventarioAction } from '../../actions/get-inventario.action';
import { getServiciosTallerAction } from '../../actions/get-servicios-taller.action';
import { getReparacionesInsumosAction } from '../../actions/get-reparaciones-insumos.action';
import { getReparacionesServiciosTallerAction } from '../../actions/get-reparaciones-servicios-taller.action';
import { getAdminsAction } from '../../actions/get-admins.action';
import { getOrdenesAction } from '../../actions/get-ordenes.action';
import { getReparacionesAction } from '../../actions/get-reparaciones.action';
import { updateEstadoServicioTallerAction } from '../../actions/update-estado-servicio-taller.action';
import { useReparacionMutation } from '../../hooks/useReparacionMutation';
import type { InventarioItem } from '../../interfaces/inventario.interface';
import type { ServicioTallerItem } from '../../interfaces/servicio-taller.interface';

// Tipos para los ítems seleccionados en el formulario
interface InsumoFila {
  id_reparacion_insumo?: number;
  id_inventario: number;
  sku: string;
  nombre: string;
  cantidad: number;
  costo_unitario: number;
  monto_total_linea: number;
  porcentaje_ganancia: number;
  costo_unitario_con_ganancia: number;
  monto_total_linea_con_ganancia: number;
  porcentaje_iva: number;
  monto_iva: number;
}

interface ServicioFila {
  id_reparacion_servicio_taller?: number;
  id_servicio_taller: number;
  nombre: string;
  cantidad: number;
  costo_unitario: number;
  monto_total_linea: number;
  porcentaje_ganancia: number;
  costo_unitario_con_ganancia: number;
  monto_total_linea_con_ganancia: number;
  porcentaje_iva: number;
  monto_iva: number;
  estado?: 'pendiente_asignacion' | 'en_espera' | 'en_proceso' | 'finalizado' | 'anulado';
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}

export const ReparacionFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const isCreating = !id || id === 'new';

  // Modo edición vs Solo lectura: si no es new, arranca en modo 'solo lectura' (boceto 1), y se pasa a modo edición al presionar 'Editar Sin Generar Cotización Extra'
  const [isEditingDirecto, setIsEditingDirecto] = useState(false);

  const { saveReparacion, isPending: isSaving } = useReparacionMutation();

  // 1. Consultas maestras
  const { data: repuestos = [] } = useQuery({
    queryKey: ['repuestos-listado'],
    queryFn: getRepuestosAction,
  });

  const { data: ordenes = [] } = useQuery({
    queryKey: ['ordenes-listado'],
    queryFn: getOrdenesAction,
  });

  const { data: todasLasReparaciones = [] } = useQuery({
    queryKey: ['reparaciones-listado'],
    queryFn: getReparacionesAction,
  });

  const { data: inventario = [] } = useQuery({
    queryKey: ['inventario-listado'],
    queryFn: getInventarioAction,
  });

  const { data: serviciosCatalogo = [] } = useQuery({
    queryKey: ['servicios-taller-listado'],
    queryFn: getServiciosTallerAction,
  });

  const { data: admins = [] } = useQuery({
    queryKey: ['admins-listado'],
    queryFn: getAdminsAction,
  });

  // Consulta de la reparación específica si estamos en detalle / edición
  const { data: reparacionData, isLoading: isLoadingReparacion } = useQuery({
    queryKey: ['reparacion-item', id],
    queryFn: () => getReparacionByIdAction(id!),
    enabled: !isCreating,
  });

  // Consultas de tablas pivote para asegurar obtención completa de insumos y servicios de esta reparación
  const { data: todosLosInsumos = [] } = useQuery({
    queryKey: ['reparaciones-insumos'],
    queryFn: getReparacionesInsumosAction,
    enabled: !isCreating,
  });

  const { data: todosLosServicios = [] } = useQuery({
    queryKey: ['reparaciones-servicios-taller'],
    queryFn: getReparacionesServiciosTallerAction,
    enabled: !isCreating,
  });

  // Estados del encabezado de la reparación
  const [idRepuesto, setIdRepuesto] = useState<number | ''>('');
  const [idOrden, setIdOrden] = useState<number | null>(null);
  const [estadoReparacion, setEstadoReparacion] = useState<'pendiente' | 'en_proceso' | 'finalizada' | 'anulada'>('pendiente');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [idAdminInicio, setIdAdminInicio] = useState<number | ''>('');
  const [idAdminFin, setIdAdminFin] = useState<number | ''>('');

  // Filas seleccionadas de insumos y servicios
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<InsumoFila[]>([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<ServicioFila[]>([]);

  // Búsqueda en sidebar lateral (para crear o editar)
  const [busquedaSkuInsumo, setBusquedaSkuInsumo] = useState('');
  const [busquedaNombreServicio, setBusquedaNombreServicio] = useState('');

  // Mapas auxiliares para resolución ágil
  const repuestosMap = useMemo(() => new Map(repuestos.map((r) => [r.id_repuesto, r])), [repuestos]);
  const ordenesMap = useMemo(() => new Map(ordenes.map((o) => [o.id_orden, o])), [ordenes]);
  const inventarioMap = useMemo(() => new Map(inventario.map((i) => [i.id_inventario, i])), [inventario]);
  const serviciosCatalogoMap = useMemo(() => new Map(serviciosCatalogo.map((s) => [s.id_servicio_taller, s])), [serviciosCatalogo]);
  const adminsMap = useMemo(() => new Map(admins.map((a) => [a.id_admin, a])), [admins]);

  // Función para reestablecer datos originales (usado al cargar o cancelar edición)
  const sincronizarConDatosOriginales = useCallback(() => {
    if (!reparacionData) return;

    setIdRepuesto(reparacionData.id_repuesto);
    setIdOrden(reparacionData.id_orden ?? null);
    setEstadoReparacion(reparacionData.estado);
    setFechaInicio(reparacionData.fecha_inicio || '');
    setFechaFin(reparacionData.fecha_fin || '');
    setIdAdminInicio(reparacionData.id_admin_fecha_inicio || '');
    setIdAdminFin(reparacionData.id_admin_fecha_fin || '');

    // Insumos asociados a esta reparación
    const insumosDeEstaReparacion = reparacionData.insumos && reparacionData.insumos.length > 0
      ? reparacionData.insumos
      : todosLosInsumos.filter((ins) => ins.id_reparacion === reparacionData.id_reparacion);

    setInsumosSeleccionados(
      insumosDeEstaReparacion.map((ins) => {
        const itemInv = ins.inventario || inventarioMap.get(ins.id_inventario);
        const cantidad = Number(ins.cantidad || 1);
        const costoUnit = Number(ins.costo_unitario || 0);
        const costoConGan = Number(ins.costo_unitario_con_ganancia || 0);
        const pctIva = Number(ins.porcentaje_iva || 19);
        const pctGan = Number(itemInv?.porcentaje_ganancia || 0);

        return {
          id_reparacion_insumo: ins.id_reparacion_insumo,
          id_inventario: ins.id_inventario,
          sku: itemInv?.sku || 'N/A',
          nombre: itemInv?.nombre || `Ítem #${ins.id_inventario}`,
          cantidad,
          costo_unitario: costoUnit,
          monto_total_linea: Number(ins.monto_total_linea || (cantidad * costoUnit)),
          porcentaje_ganancia: pctGan,
          costo_unitario_con_ganancia: costoConGan,
          monto_total_linea_con_ganancia: Number(ins.monto_total_linea_con_ganancia || (cantidad * costoConGan)),
          porcentaje_iva: pctIva,
          monto_iva: Number(ins.monto_iva || 0),
        };
      })
    );

    // Servicios asociados a esta reparación
    const serviciosDeEstaReparacion = reparacionData.servicios_taller && reparacionData.servicios_taller.length > 0
      ? reparacionData.servicios_taller
      : todosLosServicios.filter((srv) => srv.id_reparacion === reparacionData.id_reparacion);

    setServiciosSeleccionados(
      serviciosDeEstaReparacion.map((srv) => {
        const servCat = srv.servicio_taller || serviciosCatalogoMap.get(srv.id_servicio_taller);
        const cantidad = Number(srv.cantidad || 1);
        const costoUnit = Number(srv.costo_unitario || 0);
        const costoConGan = Number(srv.costo_unitario_con_ganancia || 0);
        const pctIva = Number(srv.porcentaje_iva || 19);
        const pctGan = Number(servCat?.porcentaje_ganancia || 0);

        return {
          id_reparacion_servicio_taller: srv.id_reparacion_servicio_taller,
          id_servicio_taller: srv.id_servicio_taller,
          nombre: servCat?.nombre || `Servicio #${srv.id_servicio_taller}`,
          cantidad,
          costo_unitario: costoUnit,
          monto_total_linea: Number(srv.monto_total_linea || (cantidad * costoUnit)),
          porcentaje_ganancia: pctGan,
          costo_unitario_con_ganancia: costoConGan,
          monto_total_linea_con_ganancia: Number(srv.monto_total_linea_con_ganancia || (cantidad * costoConGan)),
          porcentaje_iva: pctIva,
          monto_iva: Number(srv.monto_iva || 0),
          estado: srv.estado,
          fecha_inicio: srv.fecha_inicio,
          fecha_fin: srv.fecha_fin,
        };
      })
    );
  }, [reparacionData, todosLosInsumos, todosLosServicios, inventarioMap, serviciosCatalogoMap]);

  // Sincronizar datos si estamos en modo detalle/edición
  useEffect(() => {
    sincronizarConDatosOriginales();
  }, [sincronizarConDatosOriginales]);

  // Cancelar edición directa volviendo a los datos originales (Consideración 4)
  const handleCancelarEdicion = () => {
    sincronizarConDatosOriginales();
    setIsEditingDirecto(false);
  };

  // Filtrado de repuestos para el select al crear (Consideración 1):
  // 1- estado === "pendiente_reparacion"
  // 2- orden de entrada con estado_operativo != "anulada"
  // 3- NO tengan una reparación ya asociada a ellos en estado "pendiente" o "en_proceso"
  const repuestosDisponiblesParaReparar = useMemo(() => {
    return repuestos.filter((r) => {
      // Si estamos editando y es el repuesto ya seleccionado de esta reparación, permitirlo siempre
      if (!isCreating && Number(idRepuesto) === r.id_repuesto) {
        return true;
      }

      // Condición 1: Solo repuestos con estado "pendiente_reparacion"
      if (r.estado !== 'pendiente_reparacion') {
        return false;
      }

      // Condición 2: Debe tener como orden de entrada una orden válida y no anulada
      if (!r.id_orden_entrada) {
        return false;
      }
      const ordenEntrada = ordenesMap.get(r.id_orden_entrada);
      if (!ordenEntrada || ordenEntrada.estado_operativo === 'anulada') {
        return false;
      }

      // Condición 3: No deben tener una reparación activa ("pendiente" o "en_proceso")
      const tieneReparacionActiva = todasLasReparaciones.some(
        (rep) =>
          rep.id_repuesto === r.id_repuesto &&
          (rep.estado === 'pendiente' || rep.estado === 'en_proceso') &&
          (isCreating || String(rep.id_reparacion) !== String(id))
      );

      if (tieneReparacionActiva) {
        return false;
      }

      return true;
    });
  }, [repuestos, ordenesMap, todasLasReparaciones, isCreating, idRepuesto, id]);

  // Manejador del cambio de repuesto al crear (Consideración 7):
  // Si la orden de entrada tiene id_tipo_orden = 2 (reparación), id_orden = id_orden_entrada, sino null
  const handleSelectRepuesto = (val: string) => {
    if (!val) {
      setIdRepuesto('');
      setIdOrden(null);
      return;
    }
    const nuevoIdRepuesto = Number(val);
    setIdRepuesto(nuevoIdRepuesto);

    const rObj = repuestosMap.get(nuevoIdRepuesto);
    if (rObj?.id_orden_entrada) {
      const ord = ordenesMap.get(rObj.id_orden_entrada);
      if (ord && Number(ord.id_tipo_orden) === 2) {
        setIdOrden(ord.id_orden);
      } else {
        setIdOrden(null);
      }
    } else {
      setIdOrden(null);
    }
  };

  // Mutación para cambiar estado del servicio individual (e.g. Iniciar servicio)
  const mutacionEstadoServicio = useMutation({
    mutationFn: ({ idServicioTaller, nuevoEstado }: { idServicioTaller: number; nuevoEstado: 'pendiente_asignacion' | 'en_espera' | 'en_proceso' | 'finalizado' }) =>
      updateEstadoServicioTallerAction(idServicioTaller, nuevoEstado),
    onSuccess: (_, variables) => {
      toast.success(`Servicio actualizado a ${variables.nuevoEstado}`);
      queryClient.invalidateQueries({ queryKey: ['reparacion-item', id] });
      queryClient.invalidateQueries({ queryKey: ['reparaciones-servicios-taller'] });
      queryClient.invalidateQueries({ queryKey: ['reparaciones-listado'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al actualizar estado del servicio';
      toast.error(msg);
    },
  });

  // Funciones de cálculo matemático de líneas
  const calcularValoresInsumo = (itemInv: InventarioItem, cantidad: number, costoUnitarioInput?: number) => {
    const costoUnit = costoUnitarioInput !== undefined ? costoUnitarioInput : Number(itemInv.monto_compra_prom || itemInv.ultimo_monto_compra || 0);
    const pctGan = Number(itemInv.porcentaje_ganancia || 0);
    const costoConGan = (pctGan > 0 && pctGan < 100)
      ? Number((costoUnit / (1 - (pctGan / 100))).toFixed(2))
      : costoUnit;
    const montoTotalLinea = Number((cantidad * costoUnit).toFixed(2));
    const montoTotalLineaConGan = Number((cantidad * costoConGan).toFixed(2));
    const pctIva = Number(itemInv.porcentaje_iva !== undefined ? itemInv.porcentaje_iva : 19);
    const montoIva = Number((montoTotalLineaConGan * (pctIva / 100)).toFixed(2));

    return {
      costo_unitario: costoUnit,
      monto_total_linea: montoTotalLinea,
      porcentaje_ganancia: pctGan,
      costo_unitario_con_ganancia: costoConGan,
      monto_total_linea_con_ganancia: montoTotalLineaConGan,
      porcentaje_iva: pctIva,
      monto_iva: montoIva,
    };
  };

  const calcularValoresServicio = (servCat: ServicioTallerItem, cantidad: number, costoUnitarioInput?: number) => {
    const costoUnit = costoUnitarioInput !== undefined ? costoUnitarioInput : Number(servCat.costo_base || 0);
    const pctGan = Number(servCat.porcentaje_ganancia || 0);
    const costoConGan = (pctGan > 0 && pctGan < 100)
      ? Number((costoUnit / (1 - (pctGan / 100))).toFixed(2))
      : costoUnit;
    const montoTotalLinea = Number((cantidad * costoUnit).toFixed(2));
    const montoTotalLineaConGan = Number((cantidad * costoConGan).toFixed(2));
    const pctIva = Number(servCat.porcentaje_iva !== undefined ? servCat.porcentaje_iva : 19);
    const montoIva = Number((montoTotalLineaConGan * (pctIva / 100)).toFixed(2));

    return {
      costo_unitario: costoUnit,
      monto_total_linea: montoTotalLinea,
      porcentaje_ganancia: pctGan,
      costo_unitario_con_ganancia: costoConGan,
      monto_total_linea_con_ganancia: montoTotalLineaConGan,
      porcentaje_iva: pctIva,
      monto_iva: montoIva,
    };
  };

  // Agregar insumo desde el sidebar
  const handleAgregarInsumo = (itemInv: InventarioItem) => {
    const yaExiste = insumosSeleccionados.some((i) => i.id_inventario === itemInv.id_inventario);
    if (yaExiste) {
      toast.info('Este insumo ya se encuentra agregado en la lista');
      return;
    }

    const calculos = calcularValoresInsumo(itemInv, 1);
    const nuevaFila: InsumoFila = {
      id_inventario: itemInv.id_inventario,
      sku: itemInv.sku || 'N/A',
      nombre: itemInv.nombre,
      cantidad: 1,
      ...calculos,
    };

    setInsumosSeleccionados((prev) => [...prev, nuevaFila]);
  };

  // Agregar servicio desde el sidebar
  const handleAgregarServicio = (servCat: ServicioTallerItem) => {
    const yaExiste = serviciosSeleccionados.some((s) => s.id_servicio_taller === servCat.id_servicio_taller);
    if (yaExiste) {
      toast.info('Este servicio de taller ya se encuentra agregado en la lista');
      return;
    }

    const calculos = calcularValoresServicio(servCat, 1);
    const nuevaFila: ServicioFila = {
      id_servicio_taller: servCat.id_servicio_taller,
      nombre: servCat.nombre,
      cantidad: 1,
      ...calculos,
      estado: 'pendiente_asignacion',
    };

    setServiciosSeleccionados((prev) => [...prev, nuevaFila]);
  };

  // Modificar cantidad o costo unitario de insumo
  const handleActualizarInsumo = (index: number, campo: 'cantidad' | 'costo_unitario', valor: number) => {
    setInsumosSeleccionados((prev) => {
      const actual = [...prev];
      const target = actual[index];
      const itemInv = inventarioMap.get(target.id_inventario);
      if (!itemInv) return prev;

      const nuevaCantidad = campo === 'cantidad' ? Math.max(1, valor) : target.cantidad;
      const nuevoCosto = campo === 'costo_unitario' ? Math.max(0, valor) : target.costo_unitario;

      const nuevosCalculos = calcularValoresInsumo(itemInv, nuevaCantidad, nuevoCosto);
      actual[index] = {
        ...target,
        cantidad: nuevaCantidad,
        ...nuevosCalculos,
      };
      return actual;
    });
  };

  // Modificar cantidad o costo unitario de servicio
  const handleActualizarServicio = (index: number, campo: 'cantidad' | 'costo_unitario', valor: number) => {
    setServiciosSeleccionados((prev) => {
      const actual = [...prev];
      const target = actual[index];
      const servCat = serviciosCatalogoMap.get(target.id_servicio_taller);
      if (!servCat) return prev;

      const nuevaCantidad = campo === 'cantidad' ? Math.max(1, valor) : target.cantidad;
      const nuevoCosto = campo === 'costo_unitario' ? Math.max(0, valor) : target.costo_unitario;

      const nuevosCalculos = calcularValoresServicio(servCat, nuevaCantidad, nuevoCosto);
      actual[index] = {
        ...target,
        cantidad: nuevaCantidad,
        ...nuevosCalculos,
      };
      return actual;
    });
  };

  // Eliminar insumo de la lista
  const handleRemoverInsumo = (index: number) => {
    setInsumosSeleccionados((prev) => prev.filter((_, i) => i !== index));
  };

  // Eliminar servicio de la lista
  const handleRemoverServicio = (index: number) => {
    setServiciosSeleccionados((prev) => prev.filter((_, i) => i !== index));
  };

  // Totales de la Data Económica de la Reparación
  const totalesEconomicos = useMemo(() => {
    const costo_insumos_base = Number(insumosSeleccionados.reduce((acc, i) => acc + Number(i.monto_total_linea), 0).toFixed(2));
    const costo_insumos_con_ganancia = Number(insumosSeleccionados.reduce((acc, i) => acc + Number(i.monto_total_linea_con_ganancia), 0).toFixed(2));
    const ivaInsumos = Number(insumosSeleccionados.reduce((acc, i) => acc + Number(i.monto_iva), 0).toFixed(2));

    const costo_servicios_base = Number(serviciosSeleccionados.reduce((acc, s) => acc + Number(s.monto_total_linea), 0).toFixed(2));
    const costo_servicios_con_ganancia = Number(serviciosSeleccionados.reduce((acc, s) => acc + Number(s.monto_total_linea_con_ganancia), 0).toFixed(2));
    const ivaServicios = Number(serviciosSeleccionados.reduce((acc, s) => acc + Number(s.monto_iva), 0).toFixed(2));

    const costo_total = Number((costo_insumos_base + costo_servicios_base).toFixed(2));
    const costo_total_con_ganancia = Number((costo_insumos_con_ganancia + costo_servicios_con_ganancia).toFixed(2));
    const monto_total_iva = Number((ivaInsumos + ivaServicios).toFixed(2));

    return {
      costo_servicios_base,
      costo_insumos_base,
      costo_servicios_con_ganancia,
      costo_insumos_con_ganancia,
      costo_total,
      costo_total_con_ganancia,
      monto_total_iva,
    };
  }, [insumosSeleccionados, serviciosSeleccionados]);

  // Lista de insumos filtrados en sidebar (solo tipo insumo)
  const insumosDisponibles = useMemo(() => {
    const term = busquedaSkuInsumo.toLowerCase().trim();
    return inventario
      .filter((i) => i.tipo === 'insumo')
      .filter((i) => {
        if (!term) return true;
        return (i.sku || '').toLowerCase().includes(term) || i.nombre.toLowerCase().includes(term);
      });
  }, [inventario, busquedaSkuInsumo]);

  // Lista de servicios de taller filtrados en sidebar
  const serviciosDisponibles = useMemo(() => {
    const term = busquedaNombreServicio.toLowerCase().trim();
    return serviciosCatalogo.filter((s) => {
      if (!term) return true;
      return s.nombre.toLowerCase().includes(term);
    });
  }, [serviciosCatalogo, busquedaNombreServicio]);

  // Enviar formulario (Crear o Editar directo)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!idRepuesto) {
      toast.warning('Por favor selecciona el repuesto a reparar');
      return;
    }

    if (serviciosSeleccionados.length === 0) {
      toast.warning('Debes agregar al menos un servicio de taller a la reparación');
      return;
    }

    const payload = {
      id_repuesto: Number(idRepuesto),
      id_orden: idOrden !== null ? idOrden : (reparacionData?.id_orden ?? null),
      estado: estadoReparacion,
      fecha_inicio: fechaInicio || null,
      fecha_fin: fechaFin || null,
      ...totalesEconomicos,
      insumos: insumosSeleccionados.map((i) => ({
        id_reparacion_insumo: i.id_reparacion_insumo,
        id_inventario: i.id_inventario,
        cantidad: i.cantidad,
        costo_unitario: i.costo_unitario,
        costo_unitario_con_ganancia: i.costo_unitario_con_ganancia,
        porcentaje_iva: i.porcentaje_iva,
      })),
      servicios: serviciosSeleccionados.map((s) => ({
        id_reparacion_servicio_taller: s.id_reparacion_servicio_taller,
        id_servicio_taller: s.id_servicio_taller,
        cantidad: s.cantidad,
        costo_unitario: s.costo_unitario,
        costo_unitario_con_ganancia: s.costo_unitario_con_ganancia,
        porcentaje_iva: s.porcentaje_iva,
        estado: s.estado || 'pendiente_asignacion',
      })),
    };

    saveReparacion({
      payload,
      id: isCreating ? undefined : id,
    });
  };

  if (!isCreating && isLoadingReparacion) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Identificador visual del repuesto
  const repuestoObj = idRepuesto ? repuestosMap.get(Number(idRepuesto)) : null;
  const adminInicioObj = idAdminInicio ? adminsMap.get(Number(idAdminInicio)) : null;
  const adminFinObj = idAdminFin ? adminsMap.get(Number(idAdminFin)) : null;

  const isReadOnly = !isCreating && !isEditingDirecto;

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. BARRA SUPERIOR: Título, Volver */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Wrench className="w-7 h-7 text-blue-500" />
            {isCreating ? 'Registrar Nueva Reparacion' : `Reparacion #${id}`}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isCreating
              ? 'Planificación técnica de insumos y servicios de reacondicionamiento'
              : isEditingDirecto
                ? 'Edición directa de componentes y servicios (sin cotización extra)'
                : 'Ficha técnica y operativa de la orden de reparación (Solo lectura)'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/taller/reparaciones"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
      </div>

      {/* 2. ENCABEZADO: service_tag/id_repuesto, estado, admin/fecha inicio, admin/fecha fin */}
      <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
          {/* service_tag / id_repuesto */}
          <div className="p-3 bg-accent/40 rounded-xl space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              service_tag, id_repuesto
            </span>
            {isCreating ? (
              <select
                value={idRepuesto}
                onChange={(e) => handleSelectRepuesto(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
                required
              >
                <option value="">-- Seleccionar Repuesto --</option>
                {repuestosDisponiblesParaReparar.map((r) => (
                  <option key={r.id_repuesto} value={r.id_repuesto}>
                    #{r.id_repuesto} - {r.service_tag || (r.serial ? `Serial: ${r.serial}` : 'Sin tag')} ({r.estado})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-bold text-foreground font-mono block">
                {repuestoObj?.service_tag || 'Sin service tag'} (#{idRepuesto})
              </span>
            )}
          </div>

          {/* estado */}
          <div className="p-3 bg-accent/40 rounded-xl space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              estado
            </span>
            <div className="flex items-center gap-1.5 pt-0.5">
              {estadoReparacion === 'pendiente' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Clock className="w-3.5 h-3.5" />
                  pendiente
                </span>
              ) : estadoReparacion === 'en_proceso' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <AlertCircle className="w-3.5 h-3.5" />
                  en proceso
                </span>
              ) : estadoReparacion === 'finalizada' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  finalizada
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <XCircle className="w-3.5 h-3.5" />
                  anulada
                </span>
              )}
            </div>
          </div>

          {/* admin fecha inicio & fecha inicio */}
          <div className="p-3 bg-accent/40 rounded-xl space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3 text-blue-500" />
              nombre admin fecha inicio
            </span>
            <span className="text-xs font-semibold text-foreground block">
              {adminInicioObj ? `${adminInicioObj.nombre}` : '-'}
            </span>
            <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground font-mono">
              <Calendar className="w-3 h-3" />
              <span>{fechaInicio || 'fecha inicio: -'}</span>
            </div>
          </div>

          {/* admin fecha fin & fecha fin */}
          <div className="p-3 bg-accent/40 rounded-xl space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3 text-emerald-500" />
              nombre admin fecha fin
            </span>
            <span className="text-xs font-semibold text-foreground block">
              {adminFinObj ? `${adminFinObj.nombre}` : '-'}
            </span>
            <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground font-mono">
              <Calendar className="w-3 h-3" />
              <span>{fechaFin || 'fecha fin: -'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECCIÓN INSUMOS (Tabla + Sidebar lateral de búsqueda si editable) */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-foreground">
          Lista de Insumos Seleccionados
        </h2>

        <div className={`grid grid-cols-1 ${!isReadOnly ? 'lg:grid-cols-12' : ''} gap-4 items-start`}>
          {/* Tabla de Insumos */}
          <div className={`${!isReadOnly ? 'lg:col-span-9' : 'w-full'} bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                    <th className="py-2.5 px-3 text-center">sku</th>
                    <th className="py-2.5 px-3 text-center">nombre</th>
                    <th className="py-2.5 px-3 text-center">cantidad</th>
                    <th className="py-2.5 px-3 text-center">costo unitario</th>
                    <th className="py-2.5 px-3 text-center">monto total linea</th>
                    <th className="py-2.5 px-3 text-center">porcentaje de ganancia</th>
                    <th className="py-2.5 px-3 text-center">costo unitario con ganancia</th>
                    <th className="py-2.5 px-3 text-center">monto total linea con ganancia</th>
                    <th className="py-2.5 px-3 text-center">porcentaje de iva</th>
                    <th className="py-2.5 px-3 text-center">monto de iva</th>
                    {!isReadOnly && <th className="py-2.5 px-3 text-center"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {insumosSeleccionados.length === 0 ? (
                    <tr>
                      <td colSpan={!isReadOnly ? 11 : 10} className="py-6 text-center text-muted-foreground text-xs">
                        No hay insumos seleccionados
                      </td>
                    </tr>
                  ) : (
                    insumosSeleccionados.map((ins, idx) => (
                      <tr key={idx} className="hover:bg-accent/40 transition-colors text-center">
                        <td className="py-2.5 px-3 font-mono font-bold text-foreground text-xs">{ins.sku}</td>
                        <td className="py-2.5 px-3 font-medium text-foreground text-xs">{ins.nombre}</td>
                        <td className="py-2.5 px-3 text-center">
                          {!isReadOnly ? (
                            <input
                              type="number"
                              min={1}
                              value={ins.cantidad}
                              onChange={(e) => handleActualizarInsumo(idx, 'cantidad', Number(e.target.value))}
                              className="w-16 px-1.5 py-1 text-xs text-center rounded border border-border/80 bg-background text-foreground font-semibold"
                            />
                          ) : (
                            <span className="font-semibold text-foreground text-xs">{ins.cantidad}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs">
                          {!isReadOnly ? (
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={ins.costo_unitario}
                              onChange={(e) => handleActualizarInsumo(idx, 'costo_unitario', Number(e.target.value))}
                              className="w-24 px-1.5 py-1 text-xs rounded border border-border/80 bg-background text-foreground font-mono"
                            />
                          ) : (
                            <span>${Number(ins.costo_unitario).toFixed(1)}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                          ${Number(ins.monto_total_linea).toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                          {Number(ins.porcentaje_ganancia).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                          ${Number(ins.costo_unitario_con_ganancia).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs font-semibold text-foreground">
                          ${Number(ins.monto_total_linea_con_ganancia).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                          {Number(ins.porcentaje_iva).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                          ${Number(ins.monto_iva).toFixed(2)}
                        </td>
                        {!isReadOnly && (
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoverInsumo(idx)}
                              className="p-1 rounded-md text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                              title="Remover insumo"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar lateral de Búsqueda por SKU (boceto 2) */}
          {!isReadOnly && (
            <div className="lg:col-span-3 bg-card rounded-2xl border border-border/80 p-3.5 space-y-3 shadow-xs">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-foreground block">Buscar por SKU</span>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={busquedaSkuInsumo}
                    onChange={(e) => setBusquedaSkuInsumo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const disponible = insumosDisponibles.find(
                          (item) => !insumosSeleccionados.some((i) => i.id_inventario === item.id_inventario)
                        );
                        if (disponible) {
                          handleAgregarInsumo(disponible);
                        } else if (insumosDisponibles.length > 0) {
                          toast.info('Los ítems encontrados ya están agregados');
                        }
                      }
                    }}
                    placeholder="Filtrar insumo..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/40">
                {insumosDisponibles.slice(0, 15).map((item) => {
                  const yaSeleccionado = insumosSeleccionados.some((i) => i.id_inventario === item.id_inventario);
                  return (
                    <div key={item.id_inventario} className="pt-1.5 flex items-center justify-between gap-2 text-xs">
                      <div className="truncate">
                        <span className={`font-semibold block truncate ${yaSeleccionado ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          {item.nombre}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">SKU: {item.sku}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAgregarInsumo(item)}
                        disabled={yaSeleccionado}
                        className={`p-1 rounded-lg shrink-0 transition-colors ${yaSeleccionado
                          ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                          : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                          }`}
                        title={yaSeleccionado ? 'Ya agregado' : 'Agregar a la lista'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. SECCIÓN SERVICIOS DEL TALLER (Tabla + Sidebar lateral de búsqueda si editable) */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-foreground">
          Lista de Servicios del Taller Seleccionados
        </h2>

        <div className={`grid grid-cols-1 ${!isReadOnly ? 'lg:grid-cols-12' : ''} gap-4 items-start`}>
          {/* Tabla de Servicios */}
          <div className={`${!isReadOnly ? 'lg:col-span-9' : 'w-full'} bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[750px]">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                    <th className="py-2.5 px-3 text-center">nombre</th>
                    <th className="py-2.5 px-3 text-center">cantidad</th>
                    <th className="py-2.5 px-3 text-center">costo unitario</th>
                    <th className="py-2.5 px-3 text-center">monto total linea</th>
                    <th className="py-2.5 px-3 text-center">porcentaje de ganancia</th>
                    <th className="py-2.5 px-3 text-center">costo unitario con ganancia</th>
                    <th className="py-2.5 px-3 text-center">monto total linea con ganancia</th>
                    <th className="py-2.5 px-3 text-center">porcentaje de iva</th>
                    <th className="py-2.5 px-3 text-center">monto de iva</th>
                    <th className="py-2.5 px-3 text-center">estado</th>
                    <th className="py-2.5 px-3 text-center">fecha inicio</th>
                    <th className="py-2.5 px-3 text-center">fecha fin</th>
                    <th className="py-2.5 px-3 text-center">acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {serviciosSeleccionados.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-6 text-center text-muted-foreground text-xs">
                        No hay servicios seleccionados
                      </td>
                    </tr>
                  ) : (
                    serviciosSeleccionados.map((srv, idx) => (
                      <tr key={idx} className="hover:bg-accent/40 transition-colors text-center">
                        <td className="py-2.5 px-3 font-semibold text-foreground text-xs">{srv.nombre}</td>
                        <td className="py-2.5 px-3 text-center">
                          {!isReadOnly ? (
                            <input
                              type="number"
                              min={1}
                              value={srv.cantidad}
                              onChange={(e) => handleActualizarServicio(idx, 'cantidad', Number(e.target.value))}
                              className="w-16 px-1.5 py-1 text-xs text-center rounded border border-border/80 bg-background text-foreground font-semibold"
                            />
                          ) : (
                            <span className="font-semibold text-foreground text-xs">{srv.cantidad}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs">
                          {!isReadOnly ? (
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={srv.costo_unitario}
                              onChange={(e) => handleActualizarServicio(idx, 'costo_unitario', Number(e.target.value))}
                              className="w-24 px-1.5 py-1 text-xs rounded border border-border/80 bg-background text-foreground font-mono"
                            />
                          ) : (
                            <span>${Number(srv.costo_unitario).toFixed(1)}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                          ${Number(srv.monto_total_linea).toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                          {Number(srv.porcentaje_ganancia).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                          ${Number(srv.costo_unitario_con_ganancia).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs font-semibold text-foreground">
                          ${Number(srv.monto_total_linea_con_ganancia).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                          {Number(srv.porcentaje_iva).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                          ${Number(srv.monto_iva).toFixed(2)}
                        </td>

                        {/* estado del servicio */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {srv.estado === 'pendiente_asignacion' ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-500/10 text-zinc-600 dark:text-zinc-400">
                              pendiente asignacion
                            </span>
                          ) : srv.estado === 'en_espera' ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              en espera
                            </span>
                          ) : srv.estado === 'en_proceso' ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              en proceso
                            </span>
                          ) : srv.estado === 'finalizado' ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              finalizado
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>

                        {/* fecha inicio */}
                        <td className="py-2.5 px-3 text-center font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {srv.fecha_inicio || '-'}
                        </td>

                        {/* fecha fin */}
                        <td className="py-2.5 px-3 text-center font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {srv.fecha_fin || '-'}
                        </td>

                        {/* acciones */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {!isReadOnly && (srv.estado === 'pendiente_asignacion' || srv.estado === 'en_espera') ? (
                            <button
                              type="button"
                              onClick={() => handleRemoverServicio(idx)}
                              className="p-1 rounded-md text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                              title="Remover servicio"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Botón según estado para interactuar directamente (Boceto 1) */}
                              {srv.estado === 'en_espera' && isReadOnly && srv.id_reparacion_servicio_taller && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    mutacionEstadoServicio.mutate({
                                      idServicioTaller: srv.id_reparacion_servicio_taller!,
                                      nuevoEstado: 'en_proceso',
                                    })
                                  }
                                  disabled={mutacionEstadoServicio.isPending}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-card border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                                >
                                  <Play className="w-3 h-3" />
                                  iniciar
                                </button>
                              )}

                              {srv.estado === 'pendiente_asignacion' && isReadOnly && srv.id_reparacion_servicio_taller && (
                                <Link
                                  to={`/admin/taller/reparaciones/${id}/servicios/${srv.id_reparacion_servicio_taller}/asignar-personal`}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent cursor-pointer transition-colors"
                                >
                                  <UserPlus className="w-3 h-3 text-blue-500" />
                                  asignar personal
                                </Link>
                              )}

                              {srv.estado === 'en_proceso' && isReadOnly && srv.id_reparacion_servicio_taller && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    mutacionEstadoServicio.mutate({
                                      idServicioTaller: srv.id_reparacion_servicio_taller!,
                                      nuevoEstado: 'finalizado',
                                    })
                                  }
                                  disabled={mutacionEstadoServicio.isPending}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-card border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                  finalizar
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar lateral de Búsqueda por Nombre (boceto 2) */}
          {!isReadOnly && (
            <div className="lg:col-span-3 bg-card rounded-2xl border border-border/80 p-3.5 space-y-3 shadow-xs">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-foreground block">Buscar por nombre</span>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={busquedaNombreServicio}
                    onChange={(e) => setBusquedaNombreServicio(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const disponible = serviciosDisponibles.find(
                          (serv) => !serviciosSeleccionados.some((s) => s.id_servicio_taller === serv.id_servicio_taller)
                        );
                        if (disponible) {
                          handleAgregarServicio(disponible);
                        } else if (serviciosDisponibles.length > 0) {
                          toast.info('Los servicios encontrados ya están agregados');
                        }
                      }
                    }}
                    placeholder="Filtrar servicio..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/40">
                {serviciosDisponibles.slice(0, 15).map((serv) => {
                  const yaSeleccionado = serviciosSeleccionados.some((s) => s.id_servicio_taller === serv.id_servicio_taller);
                  return (
                    <div key={serv.id_servicio_taller} className="pt-1.5 flex items-center justify-between gap-2 text-xs">
                      <div className="truncate">
                        <span className={`font-semibold block truncate ${yaSeleccionado ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          {serv.nombre}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">Base: ${Number(serv.costo_base || 0).toFixed(0)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAgregarServicio(serv)}
                        disabled={yaSeleccionado}
                        className={`p-1 rounded-lg shrink-0 transition-colors ${yaSeleccionado
                          ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                          : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                          }`}
                        title={yaSeleccionado ? 'Ya agregado' : 'Agregar a la lista'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. DATA ECONÓMICA DE LA REPARACIÓN */}
      <div className="pt-4 border-t border-border/80 space-y-4">
        {/* Recuadro de Totales Consolidados a ancho completo */}
        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-2 text-xs">
          <span className="font-bold text-foreground text-sm block">
            Data Económica de la Reparación
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 text-muted-foreground font-mono">
            <div className="space-y-0.5">
              <span className="text-[10px] block uppercase font-sans tracking-wide">servicios_base:</span>
              <strong className="text-foreground text-sm">${totalesEconomicos.costo_servicios_base}</strong>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] block uppercase font-sans tracking-wide">insumos_base:</span>
              <strong className="text-foreground text-sm">${totalesEconomicos.costo_insumos_base}</strong>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] block uppercase font-sans tracking-wide">servicios_con_ganancia:</span>
              <strong className="text-blue-600 dark:text-blue-400 text-sm">${totalesEconomicos.costo_servicios_con_ganancia}</strong>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] block uppercase font-sans tracking-wide">insumos_con_ganancia:</span>
              <strong className="text-blue-600 dark:text-blue-400 text-sm">${totalesEconomicos.costo_insumos_con_ganancia}</strong>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] block uppercase font-sans tracking-wide">costo_total:</span>
              <strong className="text-foreground text-sm">${totalesEconomicos.costo_total}</strong>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] block uppercase font-sans tracking-wide">total_con_ganancia:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">${totalesEconomicos.costo_total_con_ganancia}</strong>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] block uppercase font-sans tracking-wide">monto_total_iva:</span>
              <strong className="text-foreground text-sm">${totalesEconomicos.monto_total_iva}</strong>
            </div>
          </div>
        </div>

        {/* Fila separada de botones de acción para máxima legibilidad y comodidad */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isCreating ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-6 py-3 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Registrando...' : 'Registrar Reparación'}
            </button>
          ) : isReadOnly && reparacionData.estado != 'finalizada' && reparacionData.estado != 'anulada' ? (
            <button
              type="button"
              onClick={() => setIsEditingDirecto(true)}
              className="px-6 py-3 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar Sin Generar Cotización Extra
            </button>
          ) : isEditingDirecto ? (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCancelarEdicion}
                className="px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all cursor-pointer"
              >
                Cancelar Edición
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-6 py-3 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios Directos'}
              </button>
            </div>
          ) : (
            <span className="px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground">Reparación {reparacionData.estado}</span>
          )
          }
        </div>
      </div>
    </div>
  );
};

export default ReparacionFormPage;
