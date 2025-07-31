import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Eye, Megaphone, Clock, MapPin, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UrgentSituation {
  id: string;
  title: string;
  description: string;
  severity: 'crítica' | 'alta' | 'média';
  type: 'infraestrutura' | 'segurança' | 'saúde' | 'meio_ambiente' | 'social';
  location: string;
  neighborhood: string;
  publicOpinionRisk: number; // 1-10
  mediaExposure: number; // 1-10
  urgencyLevel: number; // 1-10
  estimatedImpact: string;
  recommendedAction: string;
  requiresPublicStatement: boolean;
  requiresPresidentialPresence: boolean;
  relatedRequests: number;
  createdAt: string;
  estimatedResolutionTime: string;
  politicalRisk: number; // 1-10
}

const UrgencyOffice = () => {
  const [urgentSituations, setUrgentSituations] = useState<UrgentSituation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUrgentSituations();
  }, []);

  const loadUrgentSituations = async () => {
    try {
      // Buscar solicitações críticas dos últimos 7 dias
      const { data: requests, error } = await supabase
        .from('requests')
        .select(`
          id,
          title,
          description,
          priority,
          type,
          location,
          status,
          created_at,
          citizen_id
        `)
        .eq('priority', 'high')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Analisar e classificar situações urgentes
      const situations = await analyzeUrgentSituations(requests || []);
      setUrgentSituations(situations);
    } catch (error) {
      console.error('Erro ao carregar situações urgentes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do Gabinete de Urgência",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeUrgentSituations = async (requests: any[]): Promise<UrgentSituation[]> => {
    // Agrupar por localização e tipo para identificar padrões
    const locationGroups = requests.reduce((groups: any, request) => {
      const key = `${request.location || 'Não informado'}-${request.type}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(request);
      return groups;
    }, {});

    const situations: UrgentSituation[] = [];

    // Analisar cada grupo
    Object.entries(locationGroups).forEach(([key, groupRequests]: [string, any]) => {
      const [location, type] = key.split('-');
      const requestCount = groupRequests.length;
      
      if (requestCount >= 3) { // Múltiplas ocorrências na mesma área
        const severity = requestCount >= 5 ? 'crítica' : requestCount >= 4 ? 'alta' : 'média';
        const publicOpinionRisk = calculatePublicOpinionRisk(type, requestCount);
        const mediaExposure = calculateMediaExposure(type, requestCount, location);
        const politicalRisk = calculatePoliticalRisk(type, requestCount, publicOpinionRisk);
        
        situations.push({
          id: `${key}-${Date.now()}`,
          title: `Múltiplas ocorrências: ${getTypeLabel(type)} em ${location}`,
          description: `${requestCount} solicitações de ${getTypeLabel(type)} registradas em ${location}. Possível padrão sistêmico.`,
          severity,
          type: type as any,
          location,
          neighborhood: location,
          publicOpinionRisk,
          mediaExposure,
          urgencyLevel: Math.min(10, requestCount + publicOpinionRisk),
          estimatedImpact: getEstimatedImpact(type, requestCount),
          recommendedAction: getRecommendedAction(type, requestCount, location),
          requiresPublicStatement: publicOpinionRisk >= 7 || mediaExposure >= 8,
          requiresPresidentialPresence: severity === 'crítica' && (publicOpinionRisk >= 8 || mediaExposure >= 9),
          relatedRequests: requestCount,
          createdAt: new Date().toISOString(),
          estimatedResolutionTime: getEstimatedResolutionTime(type, severity),
          politicalRisk
        });
      }
    });

    // Adicionar situações críticas individuais
    requests.forEach(request => {
      if (isCriticalIndividualCase(request)) {
        const publicOpinionRisk = calculateIndividualPublicRisk(request);
        const mediaExposure = calculateIndividualMediaRisk(request);
        const politicalRisk = calculatePoliticalRisk(request.type, 1, publicOpinionRisk);
        
        situations.push({
          id: request.id,
          title: `Caso crítico: ${request.title}`,
          description: request.description,
          severity: 'crítica',
          type: request.type,
          location: request.location || 'Não informado',
          neighborhood: request.location || 'Não informado',
          publicOpinionRisk,
          mediaExposure,
          urgencyLevel: 9,
          estimatedImpact: getEstimatedImpact(request.type, 1),
          recommendedAction: `Ação imediata necessária para ${request.title}`,
          requiresPublicStatement: publicOpinionRisk >= 6,
          requiresPresidentialPresence: true,
          relatedRequests: 1,
          createdAt: request.created_at,
          estimatedResolutionTime: "24-48 horas",
          politicalRisk
        });
      }
    });

    return situations.sort((a, b) => 
      (b.urgencyLevel + b.publicOpinionRisk + b.politicalRisk) - 
      (a.urgencyLevel + a.publicOpinionRisk + a.politicalRisk)
    );
  };

  const calculatePublicOpinionRisk = (type: string, count: number): number => {
    const baseRisk = {
      'infrastructure': 6,
      'cleaning': 4,
      'lighting': 3,
      'citizen_service': 5
    }[type] || 5;
    
    return Math.min(10, baseRisk + Math.floor(count / 2));
  };

  const calculateMediaExposure = (type: string, count: number, location: string): number => {
    const baseExposure = {
      'infrastructure': 7,
      'cleaning': 5,
      'lighting': 4,
      'citizen_service': 6
    }[type] || 5;
    
    const locationBonus = location.toLowerCase().includes('centro') ? 2 : 0;
    return Math.min(10, baseExposure + Math.floor(count / 3) + locationBonus);
  };

  const calculatePoliticalRisk = (type: string, count: number, publicOpinionRisk: number): number => {
    const baseRisk = {
      'infrastructure': 8,
      'cleaning': 6,
      'lighting': 4,
      'citizen_service': 7
    }[type] || 6;
    
    return Math.min(10, Math.floor((baseRisk + publicOpinionRisk + count) / 3));
  };

  const calculateIndividualPublicRisk = (request: any): number => {
    const riskKeywords = ['urgente', 'emergência', 'criança', 'idoso', 'hospital', 'escola'];
    const hasRiskKeyword = riskKeywords.some(keyword => 
      request.title?.toLowerCase().includes(keyword) || 
      request.description?.toLowerCase().includes(keyword)
    );
    
    return hasRiskKeyword ? 8 : 6;
  };

  const calculateIndividualMediaRisk = (request: any): number => {
    const mediaKeywords = ['acidente', 'ferido', 'criança', 'escola', 'hospital'];
    const hasMediaKeyword = mediaKeywords.some(keyword => 
      request.title?.toLowerCase().includes(keyword) || 
      request.description?.toLowerCase().includes(keyword)
    );
    
    return hasMediaKeyword ? 9 : 6;
  };

  const isCriticalIndividualCase = (request: any): boolean => {
    const criticalKeywords = ['emergência', 'acidente', 'ferido', 'criança em risco', 'idoso'];
    return criticalKeywords.some(keyword => 
      request.title?.toLowerCase().includes(keyword) || 
      request.description?.toLowerCase().includes(keyword)
    );
  };

  const getTypeLabel = (type: string): string => {
    const labels = {
      'infrastructure': 'Infraestrutura',
      'cleaning': 'Limpeza Urbana',
      'lighting': 'Iluminação Pública',
      'citizen_service': 'Atendimento ao Cidadão'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getEstimatedImpact = (type: string, count: number): string => {
    if (count >= 5) return "Impacto alto na opinião pública e possível repercussão na mídia";
    if (count >= 3) return "Impacto moderado na satisfação dos cidadãos";
    return "Impacto localizado mas com potencial de escalação";
  };

  const getRecommendedAction = (type: string, count: number, location: string): string => {
    if (count >= 5) {
      return `Mobilizar equipe de emergência para ${location}. Comunicado público necessário.`;
    }
    if (count >= 3) {
      return `Priorizar atendimento em ${location}. Monitorar evolução.`;
    }
    return `Verificação imediata da situação em ${location}.`;
  };

  const getEstimatedResolutionTime = (type: string, severity: string): string => {
    if (severity === 'crítica') return "24-48 horas";
    if (severity === 'alta') return "48-72 horas";
    return "3-5 dias";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'crítica': return 'destructive';
      case 'alta': return 'default';
      case 'média': return 'secondary';
      default: return 'secondary';
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 8) return 'text-red-600';
    if (risk >= 6) return 'text-orange-600';
    if (risk >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold">Gabinete de Urgência</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="h-8 w-8 text-red-600" />
        <h1 className="text-3xl font-bold">Gabinete de Urgência</h1>
      </div>
      
      <div className="grid gap-6 mb-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">⚠️ Situações Críticas Identificadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{urgentSituations.filter(s => s.severity === 'crítica').length}</div>
                <div className="text-sm text-muted-foreground">Críticas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{urgentSituations.filter(s => s.requiresPublicStatement).length}</div>
                <div className="text-sm text-muted-foreground">Necessitam Posicionamento</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{urgentSituations.filter(s => s.requiresPresidentialPresence).length}</div>
                <div className="text-sm text-muted-foreground">Presença Necessária</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{urgentSituations.filter(s => s.mediaExposure >= 8).length}</div>
                <div className="text-sm text-muted-foreground">Alto Risco Midiático</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {urgentSituations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-green-600 text-lg font-semibold mb-2">
                ✅ Nenhuma situação crítica identificada
              </div>
              <p className="text-muted-foreground">
                Todas as solicitações estão dentro dos parâmetros normais de operação.
              </p>
            </CardContent>
          </Card>
        ) : (
          urgentSituations.map((situation) => (
            <Card key={situation.id} className={`border-l-4 ${
              situation.severity === 'crítica' ? 'border-l-red-500' : 
              situation.severity === 'alta' ? 'border-l-orange-500' : 'border-l-yellow-500'
            }`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{situation.title}</CardTitle>
                      <Badge variant={getSeverityColor(situation.severity)}>
                        {situation.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-4">{situation.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm font-medium">Opinião Pública:</span>
                      <span className={`text-sm font-bold ${getRiskColor(situation.publicOpinionRisk)}`}>
                        {situation.publicOpinionRisk}/10
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4" />
                      <span className="text-sm font-medium">Exposição Midiática:</span>
                      <span className={`text-sm font-bold ${getRiskColor(situation.mediaExposure)}`}>
                        {situation.mediaExposure}/10
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">Risco Político:</span>
                      <span className={`text-sm font-bold ${getRiskColor(situation.politicalRisk)}`}>
                        {situation.politicalRisk}/10
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-medium">Local:</span>
                      <span className="text-sm">{situation.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Prazo:</span>
                      <span className="text-sm">{situation.estimatedResolutionTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Solicitações:</span>
                      <span className="text-sm">{situation.relatedRequests}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {situation.requiresPublicStatement && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        <Megaphone className="h-3 w-3 mr-1" />
                        Posicionamento Público
                      </Badge>
                    )}
                    {situation.requiresPresidentialPresence && (
                      <Badge variant="outline" className="text-purple-600 border-purple-600">
                        <Eye className="h-3 w-3 mr-1" />
                        Presença Necessária
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Impacto Estimado:</h4>
                    <p className="text-sm text-muted-foreground">{situation.estimatedImpact}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Ação Recomendada:</h4>
                    <p className="text-sm text-muted-foreground">{situation.recommendedAction}</p>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button size="sm" variant="destructive">
                      Marcar como Prioridade Máxima
                    </Button>
                    <Button size="sm" variant="outline">
                      Solicitar Relatório Detalhado
                    </Button>
                    <Button size="sm" variant="outline">
                      Agendar Reunião
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default UrgencyOffice;