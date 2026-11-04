import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import type { OrdenItem } from '../../interfaces/orden.interface';

interface Props {
  ordenes: OrdenItem[];
}

export const RecentOrdersTable = ({ ordenes }: Props) => {
  const navigate = useNavigate();

  // Ordenar por last_update descendente y tomar las 5 primeras
  const topOrders = [...ordenes]
    .sort((a, b) => {
      const dateA = new Date(a.last_update || a.fecha_creacion).getTime();
      const dateB = new Date(b.last_update || b.fecha_creacion).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_espera':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            En espera
          </span>
        );
      case 'en_proceso':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            En proceso
          </span>
        );
      case 'finalizada':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Finalizada
          </span>
        );
      case 'anulada':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Anulada
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Últimas Órdenes Actualizadas
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            5 órdenes con last_update más reciente
          </p>
        </div>

        <Button
          onClick={() => navigate('/admin/ordenes/listado')}
          variant="outline"
          size="sm"
          className="rounded-xl font-semibold shadow-xs hover:border-primary/50 text-xs px-3"
        >
          Ver Todas
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/80 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="py-2.5 px-3">ID</th>
              <th className="py-2.5 px-3">Estado</th>
              <th className="py-2.5 px-3">Monto</th>
              <th className="py-2.5 px-3 text-right">Actualizada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {topOrders.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-xs text-muted-foreground">
                  No hay órdenes registradas aún
                </td>
              </tr>
            ) : (
              topOrders.map((ord) => (
                <tr key={ord.id_orden} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3 font-semibold text-foreground">
                    #{ord.id_orden}
                  </td>
                  <td className="py-3 px-3">
                    {getStatusBadge(ord.estado_operativo)}
                  </td>
                  <td className="py-3 px-3 font-medium text-foreground">
                    ${Number(ord.monto_total || 0).toLocaleString('es-CL')}
                  </td>
                  <td className="py-3 px-3 text-right text-xs text-muted-foreground font-mono">
                    {ord.last_update ? ord.last_update.split('T')[0] : ord.fecha_creacion}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
