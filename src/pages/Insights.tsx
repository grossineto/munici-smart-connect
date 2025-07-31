import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, TrendingUp, AlertTriangle, Brain, Download, Map } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface InsightData {
  urgentAreas: Array<{
    region: string;
    count: number;
    severity: string;
    primaryIssue: string;
  }>;
  maintenanceNeeds: Array<{
    area: string;
    priority: number;
    requestCount: number;
    averageAge: number;
  }>;
  citySegments: Array<{
    segment: string;
    needsAttention: boolean;
    score: number;
    issues: string[];
  }>;
  predictiveAlerts: Array<{
    type: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
    actionRequired: string;
  }>;
}

const Insights = () => {
  const [insights, setInsights] = useState<InsightData>({
    urgentAreas: [],
    maintenanceNeeds: [],
    citySegments: [],
    predictiveAlerts: []
  });
  const [loading, setLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    loadInsightsData();
  }, []);

  const loadInsightsData = async () => {
    try {
      // Carregar dados das solicitações para análise
      const { data: requests, error } = await supabase
        .from('requests')
        .select(`
          *,
          citizen:citizens(name, neighborhood)
        `);

      if (error) throw error;

      if (!requests) return;

      // Análise de áreas urgentes por bairro
      const areaAnalysis = requests.reduce((acc: any, req) => {
        const neighborhood = req.citizen?.neighborhood || 'Não informado';
        if (!acc[neighborhood]) {
          acc[neighborhood] = {
            count: 0,
            urgent: 0,
            types: {}
          };
        }
        acc[neighborhood].count++;
        if (req.priority === 'high' || req.priority === 'urgent') {
          acc[neighborhood].urgent++;
        }
        acc[neighborhood].types[req.type] = (acc[neighborhood].types[req.type] || 0) + 1;
        return acc;
      }, {});

      const urgentAreas = Object.entries(areaAnalysis)
        .map(([region, data]: [string, any]) => ({
          region,
          count: data.count,
          severity: data.urgent > data.count * 0.3 ? 'high' : data.urgent > data.count * 0.15 ? 'medium' : 'low',
          primaryIssue: Object.entries(data.types).sort(([,a]: any, [,b]: any) => b - a)[0]?.[0] || 'Diversos'
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Análise de necessidades de manutenção
      const maintenanceTypes = ['Infraestrutura', 'Limpeza urbana', 'Iluminação pública', 'Saneamento'];
      const maintenanceNeeds = maintenanceTypes.map(area => {
        const areaRequests = requests.filter(req => 
          req.type.toLowerCase().includes(area.toLowerCase().split(' ')[0])
        );
        const avgAge = areaRequests.length > 0
          ? areaRequests.reduce((acc, req) => {
              const age = (Date.now() - new Date(req.created_at).getTime()) / (1000 * 60 * 60 * 24);
              return acc + age;
            }, 0) / areaRequests.length
          : 0;

        return {
          area,
          priority: areaRequests.filter(r => r.priority === 'high' || r.priority === 'urgent').length,
          requestCount: areaRequests.length,
          averageAge: Math.round(avgAge)
        };
      }).sort((a, b) => b.priority - a.priority);

      // Análise de segmentos da cidade
      const neighborhoods = [...new Set(requests.map(r => r.citizen?.neighborhood).filter(Boolean))];
      const citySegments = neighborhoods.slice(0, 8).map(segment => {
        const segmentRequests = requests.filter(r => r.citizen?.neighborhood === segment);
        const urgentCount = segmentRequests.filter(r => r.priority === 'high' || r.priority === 'urgent').length;
        const pendingCount = segmentRequests.filter(r => r.status === 'pending').length;
        
        const score = Math.max(0, 100 - (urgentCount * 10 + pendingCount * 5));
        const needsAttention = score < 70;

        const issues = segmentRequests.reduce((acc: string[], req) => {
          if (!acc.includes(req.type)) acc.push(req.type);
          return acc;
        }, []).slice(0, 3);

        return {
          segment: segment as string,
          needsAttention,
          score,
          issues
        };
      }).sort((a, b) => a.score - b.score);

      // Alertas preditivos
      const totalRequests = requests.length;
      const lastWeekRequests = requests.filter(r => 
        new Date(r.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;
      const avgWeeklyRequests = totalRequests / 12; // Aproximação

      const predictiveAlerts = [];

      if (lastWeekRequests > avgWeeklyRequests * 1.5) {
        predictiveAlerts.push({
          type: 'volume_spike',
          message: 'Aumento anômalo de solicitações na última semana (+50%)',
          severity: 'high' as const,
          actionRequired: 'Revisar capacidade de atendimento'
        });
      }

      const infraRequests = requests.filter(r => r.type.toLowerCase().includes('infraestrutura'));
      if (infraRequests.length > totalRequests * 0.4) {
        predictiveAlerts.push({
          type: 'infrastructure_focus',
          message: 'Alta concentração de problemas de infraestrutura',
          severity: 'medium' as const,
          actionRequired: 'Planejar ações preventivas'
        });
      }

      if (urgentAreas.filter(a => a.severity === 'high').length > 2) {
        predictiveAlerts.push({
          type: 'multiple_hotspots',
          message: 'Múltiplas áreas com alta demanda simultânea',
          severity: 'high' as const,
          actionRequired: 'Redistribuir recursos'
        });
      }

      setInsights({
        urgentAreas,
        maintenanceNeeds,
        citySegments,
        predictiveAlerts
      });

    } catch (error) {
      console.error('Erro ao carregar insights:', error);
      toast({
        title: "Erro ao carregar insights",
        description: "Não foi possível carregar os dados de análise.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-46.6333, -23.5505], // São Paulo como centro
      zoom: 10
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Adicionar marcadores para áreas urgentes
    insights.urgentAreas.forEach((area, index) => {
      const color = area.severity === 'high' ? '#ef4444' : area.severity === 'medium' ? '#f59e0b' : '#22c55e';
      
      new mapboxgl.Marker({ color })
        .setLngLat([-46.6333 + (index - 3) * 0.1, -23.5505 + (index % 2) * 0.1])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <h3>${area.region}</h3>
          <p>Solicitações: ${area.count}</p>
          <p>Problema principal: ${area.primaryIssue}</p>
        `))
        .addTo(map.current!);
    });

    setShowTokenInput(false);
  };

  const exportInsights = () => {
    const data = {
      generated_at: new Date().toISOString(),
      urgent_areas: insights.urgentAreas,
      maintenance_needs: insights.maintenanceNeeds,
      city_segments: insights.citySegments,
      predictive_alerts: insights.predictiveAlerts
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insights-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Gerando insights...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Insights Preditivos</h2>
          <p className="text-muted-foreground">
            Análise inteligente dos dados municipais para tomada de decisão
          </p>
        </div>
        <Button onClick={exportInsights} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Mapa Interativo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Mapa de Calor - Áreas Críticas
          </CardTitle>
          <CardDescription>
            Visualização geográfica das solicitações por região
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!mapboxToken ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">Para visualizar o mapa, insira seu token do Mapbox</p>
              {!showTokenInput ? (
                <Button onClick={() => setShowTokenInput(true)}>
                  Configurar Mapbox
                </Button>
              ) : (
                <div className="max-w-md mx-auto space-y-2">
                  <Input
                    placeholder="Cole seu token público do Mapbox aqui"
                    value={mapboxToken}
                    onChange={(e) => setMapboxToken(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button onClick={initializeMap} className="flex-1">
                      Inicializar Mapa
                    </Button>
                    <Button variant="outline" onClick={() => setShowTokenInput(false)}>
                      Cancelar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Obtenha seu token em{" "}
                    <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="underline">
                      mapbox.com
                    </a>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div ref={mapContainer} className="h-96 rounded-lg" />
          )}
        </CardContent>
      </Card>

      {/* Alertas Preditivos */}
      {insights.predictiveAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Alertas Preditivos
            </CardTitle>
            <CardDescription>
              IA identificou padrões que requerem atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.predictiveAlerts.map((alert, index) => (
                <div 
                  key={index}
                  className={`p-4 border rounded-lg ${
                    alert.severity === 'high' ? 'border-red-200 bg-red-50' :
                    alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      alert.severity === 'high' ? 'bg-red-100' :
                      alert.severity === 'medium' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      <AlertTriangle className={`h-4 w-4 ${
                        alert.severity === 'high' ? 'text-red-600' :
                        alert.severity === 'medium' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{alert.message}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ação recomendada: {alert.actionRequired}
                      </p>
                    </div>
                    <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                      {alert.severity === 'high' ? 'Crítico' : 
                       alert.severity === 'medium' ? 'Moderado' : 'Baixo'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Áreas Mais Carentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Áreas Mais Carentes
            </CardTitle>
            <CardDescription>
              Regiões que necessitam atenção prioritária
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.urgentAreas.map((area, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{area.region}</h4>
                    <p className="text-sm text-muted-foreground">
                      Principal: {area.primaryIssue}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{area.count}</div>
                    <Badge variant={
                      area.severity === 'high' ? 'destructive' : 
                      area.severity === 'medium' ? 'secondary' : 'outline'
                    }>
                      {area.severity === 'high' ? 'Crítico' : 
                       area.severity === 'medium' ? 'Moderado' : 'Normal'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Necessidades de Manutenção */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Prioridades de Manutenção
            </CardTitle>
            <CardDescription>
              Setores que requerem ação imediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.maintenanceNeeds.map((need, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{need.area}</h4>
                    <p className="text-sm text-muted-foreground">
                      {need.requestCount} solicitações • {need.averageAge} dias
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">{need.priority}</div>
                    <p className="text-xs text-muted-foreground">urgentes</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segmentos da Cidade */}
      <Card>
        <CardHeader>
          <CardTitle>Análise por Segmento da Cidade</CardTitle>
          <CardDescription>
            Score de qualidade e necessidade de atenção por região
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {insights.citySegments.map((segment, index) => (
              <div 
                key={index} 
                className={`p-4 border rounded-lg ${
                  segment.needsAttention ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{segment.segment}</h4>
                  <Badge variant={segment.needsAttention ? 'destructive' : 'secondary'}>
                    {segment.score}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {segment.issues.map((issue, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground">• {issue}</p>
                  ))}
                </div>
                {segment.needsAttention && (
                  <div className="mt-2">
                    <Badge variant="destructive" className="text-xs">
                      Requer Atenção
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Insights;