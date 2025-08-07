import React, { useState } from 'react';
import { User, MapPin, Calendar, Shield, Crown, Edit, Trash2, Plus, Save, X, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { usePoliticians, Politician } from '@/contexts/PoliticiansContext';
import { KeywordManager } from '@/components/KeywordManager';

export default function Politicians() {
  const { 
    politicians, 
    updatePolitician, 
    addPolitician, 
    deletePolitician, 
    toggleMonitoring 
  } = usePoliticians();
  const [editingPolitician, setEditingPolitician] = useState<Politician | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const { toast } = useToast();

  // Lista completa de partidos políticos brasileiros
  const partidos = [
    'MDB', 'PT', 'PSB', 'PDT', 'PL', 'PSDB', 'PSD', 'UNIÃO BRASIL',
    'REPUBLICANOS', 'PP', 'PSL', 'DEM', 'PSOL', 'PV', 'PCdoB',
    'AVANTE', 'SOLIDARIEDADE', 'NOVO', 'REDE', 'CIDADANIA'
  ];

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

  const handleEdit = (politician: Politician) => {
    setEditingPolitician({ ...politician });
  };

  const handleSave = () => {
    if (editingPolitician) {
      updatePolitician(editingPolitician);
      setEditingPolitician(null);
      toast({
        title: "Político atualizado",
        description: "As informações foram salvas com sucesso.",
      });
    }
  };

  const handleDelete = (id: string) => {
    deletePolitician(id);
    toast({
      title: "Político removido",
      description: "O político foi removido do sistema.",
    });
  };

  const handleAddNew = () => {
    const newPolitician: Politician = {
      id: Date.now().toString(),
      nome: '',
      partido: '',
      mandato: '',
      cidade: '',
      uf: '',
      cargo: '',
      avatar: '',
      socialMonitoring: false,
      newsMonitoring: false,
      keywords: []
    };
    setEditingPolitician(newPolitician);
    setIsAddingNew(true);
  };

  const handleSaveNew = () => {
    if (editingPolitician && editingPolitician.nome.trim()) {
      addPolitician(editingPolitician);
      setEditingPolitician(null);
      setIsAddingNew(false);
      toast({
        title: "Político adicionado",
        description: "Novo político foi cadastrado com sucesso.",
      });
    }
  };

  const handleCancel = () => {
    setEditingPolitician(null);
    setIsAddingNew(false);
  };

  const handleToggleMonitoring = (id: string, type: 'social' | 'news') => {
    toggleMonitoring(id, type);
    toast({
      title: `Monitoramento ${type === 'social' ? 'de redes sociais' : 'de notícias'} atualizado`,
      description: "As configurações foram salvas.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Políticos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os políticos cadastrados na plataforma e configure o monitoramento
          </p>
        </div>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Político
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {politicians.map((politician) => (
          <Card key={politician.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={politician.avatar} alt={politician.nome} />
                    <AvatarFallback>
                      {politician.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{politician.nome}</CardTitle>
                    <Badge variant="outline" className={`${getCargoColor(politician.cargo)} text-xs`}>
                      {getCargoIcon(politician.cargo)}
                      <span className="ml-1">{politician.cargo}</span>
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(politician)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(politician.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {politician.cidade}, {politician.uf}
              </div>
              
              {politician.partido && (
                <Badge variant="secondary" className="text-xs">
                  {politician.partido}
                </Badge>
              )}

              {politician.mandato && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Mandato {politician.mandato}
                </div>
              )}

              {/* Seção de Keywords */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  Palavras-chave:
                </div>
                <KeywordManager 
                  politicianId={politician.id}
                  politicianName={politician.nome}
                />
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Monitoramento Social</span>
                  <Button
                    variant={politician.socialMonitoring ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleMonitoring(politician.id, 'social')}
                  >
                    {politician.socialMonitoring ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Monitoramento de Notícias</span>
                  <Button
                    variant={politician.newsMonitoring ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleMonitoring(politician.id, 'news')}
                  >
                    {politician.newsMonitoring ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para edição */}
      <Dialog open={!!editingPolitician} onOpenChange={() => handleCancel()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isAddingNew ? 'Adicionar Novo Político' : 'Editar Político'}
            </DialogTitle>
          </DialogHeader>
          {editingPolitician && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={editingPolitician.nome}
                  onChange={(e) => setEditingPolitician({
                    ...editingPolitician,
                    nome: e.target.value
                  })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={editingPolitician.cidade}
                    onChange={(e) => setEditingPolitician({
                      ...editingPolitician,
                      cidade: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="uf">UF</Label>
                  <Input
                    id="uf"
                    value={editingPolitician.uf}
                    onChange={(e) => setEditingPolitician({
                      ...editingPolitician,
                      uf: e.target.value
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cargo">Cargo</Label>
                <Select
                  value={editingPolitician.cargo}
                  onValueChange={(value) => setEditingPolitician({
                    ...editingPolitician,
                    cargo: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Prefeito">Prefeito</SelectItem>
                    <SelectItem value="Prefeita">Prefeita</SelectItem>
                    <SelectItem value="Governador">Governador</SelectItem>
                    <SelectItem value="Governadora">Governadora</SelectItem>
                    <SelectItem value="Vereador">Vereador</SelectItem>
                    <SelectItem value="Vereadora">Vereadora</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="partido">Partido</Label>
                <Select
                  value={editingPolitician.partido}
                  onValueChange={(value) => setEditingPolitician({
                    ...editingPolitician,
                    partido: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o partido" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {partidos.map(partido => (
                      <SelectItem key={partido} value={partido}>{partido}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="mandato">Mandato</Label>
                <Input
                  id="mandato"
                  value={editingPolitician.mandato}
                  onChange={(e) => setEditingPolitician({
                    ...editingPolitician,
                    mandato: e.target.value
                  })}
                  placeholder="Ex: 2021-2024"
                />
              </div>

              <div>
                <Label htmlFor="avatar">URL do Avatar</Label>
                <Input
                  id="avatar"
                  value={editingPolitician.avatar}
                  onChange={(e) => setEditingPolitician({
                    ...editingPolitician,
                    avatar: e.target.value
                  })}
                  placeholder="URL da foto do político"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={isAddingNew ? handleSaveNew : handleSave}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Salvar
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}