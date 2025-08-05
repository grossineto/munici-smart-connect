import React, { useState, useEffect } from 'react';
import { Search, MapPin, User, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdvancedSearchFilters } from '@/components/AdvancedSearchFilters';

interface Politician {
  id?: any;
  nome: string;
  partido?: string;
  mandato?: string;
  cidade: string;
  uf: string;
  cargo?: string;
}

interface SearchPoliticianInputProps {
  onSelectPolitician: (politician: Politician) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchPoliticianInput({ 
  onSelectPolitician, 
  placeholder = "Buscar político em mandato...",
  disabled = false 
}: SearchPoliticianInputProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Função para buscar prefeitos na base local
  const searchPoliticians = (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    
    try {
      const queryLower = query.toLowerCase();
      const filteredMayors = Object.entries(mayorData)
        .filter(([cityName, mayor]) => {
          return (
            cityName.toLowerCase().includes(queryLower) ||
            mayor.nome.toLowerCase().includes(queryLower) ||
            mayor.partido?.toLowerCase().includes(queryLower) ||
            mayor.uf.toLowerCase().includes(queryLower)
          );
        })
        .slice(0, 8)
        .map(([cityName, mayor]) => ({
          id: cityName,
          nome: cityName,
          uf: mayor.uf,
          mayor: mayor
        }));
      
      setSearchResults(filteredMayors);
    } catch (error) {
      console.error('Erro ao buscar políticos:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPoliticians(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Dados dos prefeitos (base expandida)
  const mayorData: Record<string, Politician> = {
    "São Paulo": { 
      nome: "Tarcísio Gomes de Freitas", 
      partido: "Republicanos", 
      mandato: "2023-2026", 
      cidade: "São Paulo", 
      uf: "SP",
      cargo: "Governador"
    },
    "Rio de Janeiro": { 
      nome: "Eduardo Paes", 
      partido: "PSD", 
      mandato: "2021-2024", 
      cidade: "Rio de Janeiro", 
      uf: "RJ",
      cargo: "Prefeito"
    },
    "Belo Horizonte": { 
      nome: "Fuad Noman", 
      partido: "PSD", 
      mandato: "2025-2028", 
      cidade: "Belo Horizonte", 
      uf: "MG",
      cargo: "Prefeito"
    },
    "Curitiba": { 
      nome: "Rafael Greca", 
      partido: "PMN", 
      mandato: "2017-2024", 
      cidade: "Curitiba", 
      uf: "PR",
      cargo: "Prefeito"
    },
    "Recife": { 
      nome: "João Campos", 
      partido: "PSB", 
      mandato: "2021-2024", 
      cidade: "Recife", 
      uf: "PE",
      cargo: "Prefeito"
    },
    "Porto Alegre": { 
      nome: "Sebastião Melo", 
      partido: "MDB", 
      mandato: "2021-2024", 
      cidade: "Porto Alegre", 
      uf: "RS",
      cargo: "Prefeito"
    },
    "Salvador": { 
      nome: "Bruno Reis", 
      partido: "União Brasil", 
      mandato: "2021-2024", 
      cidade: "Salvador", 
      uf: "BA",
      cargo: "Prefeito"
    },
    "Fortaleza": { 
      nome: "José Sarto", 
      partido: "PDT", 
      mandato: "2021-2024", 
      cidade: "Fortaleza", 
      uf: "CE",
      cargo: "Prefeito"
    },
    "Brasília": { 
      nome: "Ibaneis Rocha", 
      partido: "MDB", 
      mandato: "2019-2026", 
      cidade: "Brasília", 
      uf: "DF",
      cargo: "Governador"
    },
    "Manaus": { 
      nome: "David Almeida", 
      partido: "Avante", 
      mandato: "2021-2024", 
      cidade: "Manaus", 
      uf: "AM",
      cargo: "Prefeito"
    },
    "São Paulo Estado": { 
      nome: "Tarcísio Gomes de Freitas", 
      partido: "Republicanos", 
      mandato: "2023-2026", 
      cidade: "São Paulo", 
      uf: "SP",
      cargo: "Governador"
    },
    "Bauru": { 
      nome: "Suéllen Rosim", 
      partido: "PSD", 
      mandato: "2025-2028", 
      cidade: "Bauru", 
      uf: "SP",
      cargo: "Prefeita"
    },
    "Botucatu": { 
      nome: "Fábio Leite", 
      partido: "PSD", 
      mandato: "2021-2024", 
      cidade: "Botucatu", 
      uf: "SP",
      cargo: "Prefeito"
    },
    "São Roque": { 
      nome: "Guto Issa", 
      partido: "PSD", 
      mandato: "2021-2024", 
      cidade: "São Roque", 
      uf: "SP",
      cargo: "Prefeito"
    },
    "Pederneiras": { 
      nome: "Ivana Camarinha", 
      partido: "PV", 
      mandato: "2021-2024", 
      cidade: "Pederneiras", 
      uf: "SP",
      cargo: "Prefeita"
    }
  };

  // Função para obter logo do partido
  const getPartyLogo = (partido?: string) => {
    switch (partido?.toUpperCase()) {
      case 'MDB':
        return '/lovable-uploads/84ee407e-7a09-419b-8cc6-122b525ecb78.png';
      case 'PSD':
        return '/lovable-uploads/0db47da6-761a-4a1d-abff-33cd9d18d944.png';
      case 'PSB':
        return '/lovable-uploads/c1fc5a33-93d2-4978-b974-59917be945e0.png';
      case 'UNIÃO BRASIL':
      case 'UNIAO BRASIL':
        return '/lovable-uploads/80af8899-6d4a-4e09-9727-942aefbfc911.png';
      case 'PV':
      case 'PARTIDO VERDE':
        return '/lovable-uploads/c3695bb8-feda-48d4-beff-f390ac899551.png';
      case 'REPUBLICANOS':
        return '/lovable-uploads/5459eeca-7b7d-463c-b793-35eba82ba4f3.png';
      default:
        return null;
    }
  };

  const handlePoliticianSelect = (result: any) => {
    const mayor = result.mayor || mayorData[result.nome];
    if (mayor) {
      onSelectPolitician({
        ...mayor,
        cidade: result.nome,
        uf: result.uf
      });
    }
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          className="pl-10 pr-10 h-12 text-base border-2 border-muted focus:border-primary transition-colors"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Resultados da busca */}
      {showResults && searchResults.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg border-2">
          <CardContent className="p-2">
            <div className="space-y-1">
              {searchResults.map((result) => {
                const mayor = result.mayor || mayorData[result.nome];
                if (!mayor) return null;
                
                return (
                  <Button
                    key={result.id}
                    variant="ghost"
                    className="w-full justify-start p-3 h-auto text-left hover:bg-muted/80"
                    onClick={() => handlePoliticianSelect(result)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {mayor.nome} - {mayor.cargo}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {result.nome}, {result.uf}
                          {mayor.partido && (
                            <div className="flex items-center gap-1">
                              {getPartyLogo(mayor.partido) && (
                                <img 
                                  src={getPartyLogo(mayor.partido)!} 
                                  alt={`Logo ${mayor.partido}`}
                                  className="h-3 w-auto"
                                />
                              )}
                              <Badge variant="outline" className="text-xs">
                                {mayor.partido}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              }).filter(Boolean)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há resultados */}
      {showResults && !isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg border-2">
          <CardContent className="p-4 text-center">
            <div className="text-sm text-muted-foreground">
              Nenhuma cidade encontrada para "{searchQuery}"
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}