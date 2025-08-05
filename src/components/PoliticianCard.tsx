import React from 'react';
import { User, MapPin, Calendar, Shield, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Politician {
  nome: string;
  partido?: string;
  mandato?: string;
  cidade: string;
  uf: string;
  cargo?: string;
  avatar?: string;
}

interface PoliticianCardProps {
  politician: Politician;
  className?: string;
}

export function PoliticianCard({ politician, className = "" }: PoliticianCardProps) {
  const getCargoIcon = (cargo?: string) => {
    switch (cargo?.toLowerCase()) {
      case 'prefeito':
      case 'prefeita':
        return <Crown className="h-4 w-4" />;
      case 'governador':
      case 'governadora':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getCargoColor = (cargo?: string) => {
    switch (cargo?.toLowerCase()) {
      case 'prefeito':
      case 'prefeita':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'governador':
      case 'governadora':
        return 'bg-purple-500/10 text-purple-700 border-purple-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className={`border-2 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-16 w-16 border-2 border-muted">
            <AvatarImage 
              src={politician.avatar} 
              alt={`Foto de ${politician.nome}`}
            />
            <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
              {politician.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          {/* Informações */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg leading-tight text-foreground">
                {politician.nome}
              </h3>
              <Badge 
                variant="outline" 
                className={`flex items-center gap-1 text-xs font-medium ${getCargoColor(politician.cargo)}`}
              >
                {getCargoIcon(politician.cargo)}
                {politician.cargo || 'Político'}
              </Badge>
            </div>

            {/* Localização */}
            <div className="flex items-center gap-1 mt-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">
                {politician.cidade}, {politician.uf}
              </span>
            </div>

            {/* Informações adicionais */}
            <div className="flex items-center gap-3 mt-3">
              {politician.mandato && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Mandato {politician.mandato}</span>
                </div>
              )}
              
              {politician.partido && (
                <Badge variant="secondary" className="text-xs">
                  {politician.partido}
                </Badge>
              )}
            </div>

            {/* Status */}
            <div className="mt-3">
              <Badge 
                className="bg-green-500/10 text-green-700 border-green-200 text-xs font-medium"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Mandato Ativo
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}