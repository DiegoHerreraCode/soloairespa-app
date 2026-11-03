/**
 * Generador de identificadores únicos para service_tag y seriales por defecto.
 *
 * Formato:
 * S/N-[FECHA_HORA]-[ALEATORIO_HEX]
 * Ejemplo: S/N-20261103160845-A4F2
 *
 * Se garantiza que el resultado sea inferior a 100 caracteres (aprox 25 caracteres),
 * respetando holgadamente los límites de la base de datos (500 chars para service_tag, 100 para serial).
 */

export const generarServiceTagUnico = (
  _tipo?: string,
  existingTags: Set<string> = new Set()
): string => {
  const prefijo = 'S/N';
  let attempts = 0;

  while (attempts < 100) {
    attempts++;
    const now = new Date();
    const dateStr =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    // 4 caracteres hexadecimales aleatorios + contador para unicidad instantánea en bucle
    const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
    const tag = `${prefijo}-${dateStr}-${randomHex}`;

    if (!existingTags.has(tag.toLowerCase())) {
      existingTags.add(tag.toLowerCase());
      return tag;
    }
  }

  // Respaldo con UUID si hay colisión
  const fallback = `${prefijo}-${Date.now()}-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
  existingTags.add(fallback.toLowerCase());
  return fallback;
};

