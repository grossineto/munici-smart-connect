import React, { useState, useEffect } from 'react';
import { Search, MapPin, User, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

  // Função para buscar cidades na API do IBGE
  const searchCities = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    
    try {
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?nome=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const formattedResults = data.slice(0, 8).map((city: any) => ({
          id: city.id,
          nome: city.nome,
          uf: city.microrregiao?.mesorregiao?.UF?.sigla || city.UF?.sigla
        }));
        setSearchResults(formattedResults);
      }
    } catch (error) {
      console.error('Erro ao buscar cidades:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCities(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Dados dos prefeitos (base expandida)
  const mayorData: Record<string, Politician> = {
    "São Paulo": { 
      nome: "Ricardo Nunes", 
      partido: "MDB", 
      mandato: "2021-2024", 
      cidade: "São Paulo", 
      uf: "SP",
      cargo: "Prefeito"
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
      default:
        return null;
    }
  };

  const handleCitySelect = (city: any) => {
    const mayor = mayorData[city.nome];
    if (mayor) {
      onSelectPolitician({
        ...mayor,
        cidade: city.nome,
        uf: city.uf
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
              {searchResults.map((city) => {
                const mayor = mayorData[city.nome];
                return (
                  <Button
                    key={city.id}
                    variant="ghost"
                    className="w-full justify-start p-3 h-auto text-left hover:bg-muted/80"
                    onClick={() => handleCitySelect(city)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {city.nome}, {city.uf}
                        </div>
                        {mayor ? (
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {mayor.nome} - {mayor.cargo}
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
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            Dados do político não disponíveis
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                );
              })}
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