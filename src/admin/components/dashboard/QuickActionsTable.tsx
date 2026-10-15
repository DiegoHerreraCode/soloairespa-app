import { Link } from 'react-router';
import {
  PlusCircle,
  ShoppingBag,
  Boxes,
  FileSpreadsheet,
  UserPlus,
  Users,
  ArrowUpRight,
} from 'lucide-react';

export const QuickActionsTable = () => {
  const actions = [
    {
      title: 'Nueva Orden de Trabajo',
      subtitle: 'Crear venta, recambio o reparación',
      to: '/admin/ordenes',
      icon: PlusCircle,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      title: 'Compras a Proveedores',
      subtitle: 'Registrar compra de insumos o repuestos',
      to: '/admin/compras',
      icon: ShoppingBag,
      color: 'text-purple-500 bg-purple-500/10',
    },
    {
      title: 'Listado de Inventario',
      subtitle: 'Consultar existencias y stocks mínimos',
      to: '/admin/inventario',
      icon: Boxes,
      color: 'text-cyan-500 bg-cyan-500/10',
    },
    {
      title: 'Nueva Cotización',
      subtitle: 'Elaborar propuesta de presupuesto',
      to: '/admin/cotizaciones',
      icon: FileSpreadsheet,
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      title: 'Gestión de Clientes',
      subtitle: 'Registrar clientes y cuentas por cobrar',
      to: '/admin/clientes',
      icon: UserPlus,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      title: 'Personal y Admins',
      subtitle: 'Administrar personal técnico',
      to: '/admin/personal',
      icon: Users,
      color: 'text-rose-500 bg-rose-500/10',
    },
  ];

  return (
    <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs flex flex-col justify-between h-full">
      <div className="mb-4">
        <h3 className="text-base font-bold text-foreground">
          Accesos Rápidos
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Las 6 funcionalidades operativas más relevantes
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((act, index) => {
          const Icon = act.icon;
          return (
            <Link
              key={index}
              to={act.to}
              className="p-3.5 rounded-xl border border-border/70 hover:border-primary/40 bg-muted/20 hover:bg-muted/50 transition-all duration-200 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${act.color} transition-transform group-hover:scale-105`}
                >
                  <Icon size={18} />
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {act.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {act.subtitle}
                  </p>
                </div>
              </div>

              <ArrowUpRight
                size={16}
                className="text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0 ml-2"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
};
