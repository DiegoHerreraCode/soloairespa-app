import { Link } from 'react-router';
import soloAireLogo from '@/assets/SOLO_AIRE_LOGO.png';
import soloAireLogoDark from '@/assets/SOLO_AIRE_LOGO_DARK_THEME.png';
import { useThemeStore } from '@/lib/theme.store';

interface Props {
  subtitle?: string;
  showSubtitle?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CustomLogo = ({ subtitle = 'Portal', showSubtitle = true, size = 'md' }: Props) => {
  const imageSizes = {
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-14 w-auto',
  };

  const { theme } = useThemeStore();

  return (
    <Link
      to="/"
      className="flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02] cursor-pointer"
    >
      <img
        src={theme === 'dark' ? soloAireLogoDark : soloAireLogo}
        alt="Solo Aire SpA Logo"
        className={`${imageSizes[size]} object-contain drop-shadow-sm`}
      />
      {showSubtitle && (
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-bold tracking-tight text-foreground text-base sm:text-lg">
            Solo Aire SpA
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary border border-primary/20">
            {subtitle}
          </span>
        </div>
      )}
    </Link>
  );
};
