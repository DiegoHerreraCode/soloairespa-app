import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

interface Props {
  title: string;
  description: string;
}

export const ModulePlaceholder = ({ title, description }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <Button
          onClick={() => navigate('/admin')}
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5"
        >
          <ArrowLeft size={16} />
          <span>Volver al Dashboard</span>
        </Button>
      </div>

      <Card className="border-dashed border-2 p-8 text-center bg-card">
        <CardHeader>
          <CardTitle className="text-xl">Módulo en construcción</CardTitle>
          <CardDescription>
            Próximamente implementaremos las acciones y controladores correspondientes a este módulo.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};
