import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock } from 'lucide-react';
import { useNavigate } from 'react-router';

interface Props {
  title: string;
  description: string;
}

export const ModulePlaceholder = ({ title, description }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <Button
          onClick={() => navigate('/admin')}
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl"
        >
          <ArrowLeft size={16} />
          <span>Volver al Dashboard</span>
        </Button>
      </div>

      <Card className="border-dashed border-2 border-border/80 rounded-2xl p-12 text-center bg-card shadow-xs">
        <CardHeader className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Clock size={28} />
          </div>
          <CardTitle className="text-2xl font-bold">Módulo en construcción</CardTitle>
          <CardDescription className="max-w-md mx-auto text-sm leading-relaxed">
            Próximamente conectaremos las acciones y componentes necesarios para este módulo en Solo Aire SpA.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};
