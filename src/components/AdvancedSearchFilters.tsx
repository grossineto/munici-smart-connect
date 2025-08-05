import React, { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

interface FilterOptions {
  cargos: string[];
  partidos: string[];
  ufs: string[];
}

interface AdvancedSearchFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  className?: string;
}

export function AdvancedSearchFilters({ onFiltersChange, className = "" }: AdvancedSearchFiltersProps) {
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    cargos: [],
    partidos: [],
    ufs: []
  });
  const [isOpen, setIsOpen] = useState(false);

  const availableOptions = {
    cargos: [
      { value: 'Prefeito', label: 'Prefeito' },
      { value: 'Prefeita', label: 'Prefeita' },
      { value: 'Governador', label: 'Governador' },
      { value: 'Governadora', label: 'Governadora' }
    ],
    partidos: [
      { value: 'MDB', label: 'MDB' },
      { value: 'PSD', label: 'PSD' },
      { value: 'PSB', label: 'PSB' },
      { value: 'União Brasil', label: 'União Brasil' },
      { value: 'PV', label: 'PV - Partido Verde' },
      { value: 'Republicanos', label: 'Republicanos' },
      { value: 'PMN', label: 'PMN' },
      { value: 'PDT', label: 'PDT' },
      { value: 'Avante', label: 'Avante' }
    ],
    ufs: [
      { value: 'SP', label: 'São Paulo' },
      { value: 'RJ', label: 'Rio de Janeiro' },
      { value: 'MG', label: 'Minas Gerais' },
      { value: 'PR', label: 'Paraná' },
      { value: 'PE', label: 'Pernambuco' },
      { value: 'RS', label: 'Rio Grande do Sul' },
      { value: 'BA', label: 'Bahia' },
      { value: 'CE', label: 'Ceará' },
      { value: 'DF', label: 'Distrito Federal' },
      { value: 'AM', label: 'Amazonas' }
    ]
  };

  const handleFilterChange = (category: keyof FilterOptions, value: string, checked: boolean) => {
    const newFilters = { ...activeFilters };
    
    if (checked) {
      newFilters[category] = [...newFilters[category], value];
    } else {
      newFilters[category] = newFilters[category].filter(item => item !== value);
    }
    
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = { cargos: [], partidos: [], ufs: [] };
    setActiveFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const removeFilter = (category: keyof FilterOptions, value: string) => {
    const newFilters = { ...activeFilters };
    newFilters[category] = newFilters[category].filter(item => item !== value);
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const getTotalActiveFilters = () => {
    return Object.values(activeFilters).flat().length;
  };

  const FilterSection = ({ title, category, options }: { 
    title: string; 
    category: keyof FilterOptions; 
    options: { value: string; label: string }[] 
  }) => (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-foreground">{title}</h4>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`${category}-${option.value}`}
              checked={activeFilters[category].includes(option.value)}
              onCheckedChange={(checked) => 
                handleFilterChange(category, option.value, checked as boolean)
              }
            />
            <label 
              htmlFor={`${category}-${option.value}`}
              className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Botão de Filtros */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="h-12 gap-2 shadow-subtle border-2 hover:border-primary/30 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filtros Avançados</span>
            {getTotalActiveFilters() > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-2 text-xs">
                {getTotalActiveFilters()}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0 shadow-institutional" align="start">
          <Card className="border-0 shadow-none">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="heading-institutional text-base">Filtros Avançados</h3>
                {getTotalActiveFilters() > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Limpar todos
                  </Button>
                )}
              </div>
              
              <FilterSection 
                title="Cargo" 
                category="cargos" 
                options={availableOptions.cargos}
              />
              
              <Separator />
              
              <FilterSection 
                title="Partido" 
                category="partidos" 
                options={availableOptions.partidos}
              />
              
              <Separator />
              
              <FilterSection 
                title="Estado (UF)" 
                category="ufs" 
                options={availableOptions.ufs}
              />
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

      {/* Badges de Filtros Ativos */}
      {getTotalActiveFilters() > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([category, values]) =>
            values.map((value) => (
              <Badge
                key={`${category}-${value}`}
                variant="secondary"
                className="px-3 py-1 text-xs font-medium gap-1 hover:bg-secondary/80 transition-colors"
              >
                {value}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeFilter(category as keyof FilterOptions, value)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))
          )}
        </div>
      )}
    </div>
  );
}