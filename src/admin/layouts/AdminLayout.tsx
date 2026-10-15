import { useState } from 'react';
import { Outlet } from 'react-router';
import { AdminHeader } from '../components/AdminHeader';
import { AdminSidebar } from '../components/AdminSidebar';

export const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      {/* Header superior fijo con blur y borde sutil */}
      <AdminHeader
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Contenedor central */}
      <div className="flex-1 flex overflow-hidden">
        <AdminSidebar isOpen={isSidebarOpen} />

        {/* Área del Outlet con scroll independiente y fondo suave */}
        <main className="flex-1 p-5 md:p-8 lg:p-10 overflow-y-auto bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
