import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchableOption {
  value: string | number;
  label: string;
  sublabel?: string;
  badge?: string;
  searchTerms?: string; // Palabras clave adicionales para la búsqueda (ej: RUT, SKU, etc.)
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string | number | '';
  onChange: (value: string | number | '') => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Selecciona una opción...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No se encontraron resultados',
  disabled = false,
  required = false,
  className = '',
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autofocus en el input de búsqueda al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Opción seleccionada actual
  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.value) === String(value));
  }, [options, value]);

  // Opciones filtradas en tiempo real
  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return options;

    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(term);
      const matchSublabel = opt.sublabel ? opt.sublabel.toLowerCase().includes(term) : false;
      const matchBadge = opt.badge ? opt.badge.toLowerCase().includes(term) : false;
      const matchTerms = opt.searchTerms ? opt.searchTerms.toLowerCase().includes(term) : false;
      const matchValue = String(opt.value).toLowerCase().includes(term);

      return matchLabel || matchSublabel || matchBadge || matchTerms || matchValue;
    });
  }, [options, searchTerm]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input oculto para soporte de required en formularios nativos */}
      {required && (
        <input
          type="text"
          value={value === '' ? '' : String(value)}
          onChange={() => {}}
          required={required}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Botón activador que simula el select */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground flex items-center justify-between gap-2 transition-all text-left focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-500/50'
        } ${isOpen ? 'ring-2 ring-blue-500/30 border-blue-500' : ''}`}
      >
        <span className="truncate flex-1">
          {selectedOption ? (
            <span className="flex items-center gap-2 truncate">
              <span className="font-medium text-foreground truncate">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-muted-foreground text-xs font-mono shrink-0">
                  {selectedOption.sublabel}
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
          {value !== '' && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 hover:text-foreground hover:bg-muted/60 rounded-full transition-colors cursor-pointer"
              title="Limpiar selección"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`}
          />
        </div>
      </button>

      {/* Menú desplegable con barra de búsqueda rápida */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-card border border-border/90 rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
          {/* Input de Búsqueda */}
          <div className="p-2 border-b border-border/60 bg-muted/20 relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-background border border-border/70 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Lista de Resultados con Scroll */}
          <div className="max-h-56 overflow-y-auto p-1.5 divide-y divide-border/20">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'hover:bg-accent/60 text-foreground'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[11px] text-muted-foreground font-mono truncate">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-blue-500 shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

