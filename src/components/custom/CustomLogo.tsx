import { Link } from 'react-router';

interface Props {
  subtitle?: string;
}

export const CustomLogo = ({ subtitle = 'Portal' }: Props) => {
  return (
    <Link to="/" className="flex items-center whitespace-nowrap gap-1">
      <span className="text-xl font-bold tracking-tight">Solo Aire SpA |</span>
      <p className="text-muted-foreground text-sm font-normal">{subtitle}</p>
    </Link>
  );
};
