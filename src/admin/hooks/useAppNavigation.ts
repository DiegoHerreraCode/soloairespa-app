import { useCallback } from 'react';
import { useNavigate } from 'react-router';

/**
 * Hook para regresar a la ruta anterior del historial de navegación real.
 * Si no existe una entrada previa en el historial dentro de la sesión de la aplicación,
 * redirige a la ruta de respaldo (fallbackRoute).
 */
export const useAppNavigation = () => {
  const navigate = useNavigate();

  const goBack = useCallback(
    (fallbackRoute: string) => {
      // En navegadores modernos con React Router, window.history.state.idx > 0 indica
      // que hay un historial previo dentro de la aplicación.
      const hasHistory =
        typeof window !== 'undefined' &&
        window.history?.state &&
        typeof window.history.state.idx === 'number' &&
        window.history.state.idx > 0;

      if (hasHistory) {
        navigate(-1);
      } else {
        navigate(fallbackRoute);
      }
    },
    [navigate]
  );

  return {
    goBack,
    navigate,
  };
};
