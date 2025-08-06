import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, FileSpreadsheet, Calendar, Filter, Loader2 } from 'lucide-react';
import { useSocialMentions, useSocialStats } from '@/hooks/useSocialMonitor';
import { toast } from 'sonner';

interface ExportToolsProps {
  selectedPolitician?: string;
  timeframe?: string;
  className?: string;
}

export function ExportTools({ 
  selectedPolitician, 
  timeframe = "7d",
  className = ""
}: ExportToolsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'json'>('pdf');
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'analysis'>('summary');

  const { data: mentions = [] } = useSocialMentions(
    selectedPolitician === "all" ? undefined : selectedPolitician
  );
  const { data: stats } = useSocialStats(
    selectedPolitician === "all" ? undefined : selectedPolitician, 
    timeframe
  );

  const generateReport = async () => {
    setIsExporting(true);
    
    try {
      // Preparar dados do relatório
      const reportData = {
        metadata: {
          politician: selectedPolitician || "Todos",
          timeframe,
          generatedAt: new Date().toISOString(),
          totalMentions: mentions.length
        },
        stats: {
          totalMentions: stats?.totalMentions || 0,
          engagementTotal: stats?.engagementTotal || 0,
          positiveCount: stats?.positiveCount || 0,
          negativeCount: stats?.negativeCount || 0,
          neutralCount: stats?.neutralCount || 0,
          platformBreakdown: stats?.platformBreakdown || {}
        },
        mentions: mentions.slice(0, 100), // Limitar para performance
        analysis: generateAnalysis()
      };

      if (exportFormat === 'json') {
        downloadJSON(reportData);
      } else if (exportFormat === 'excel') {
        await generateExcel(reportData);
      } else {
        await generatePDF(reportData);
      }

      toast.success(`Relatório ${exportFormat.toUpperCase()} gerado com sucesso!`);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateAnalysis = () => {
    const sentimentDistribution = mentions.reduce((acc, mention) => {
      acc[mention.sentiment] = (acc[mention.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const platformDistribution = mentions.reduce((acc, mention) => {
      acc[mention.platform] = (acc[mention.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topMentions = mentions
      .sort((a, b) => b.engagement_score - a.engagement_score)
      .slice(0, 5);

    const avgEngagement = mentions.length > 0 
      ? mentions.reduce((sum, m) => sum + m.engagement_score, 0) / mentions.length 
      : 0;

    return {
      sentimentDistribution,
      platformDistribution,
      topMentions,
      avgEngagement,
      insights: generateInsights()
    };
  };

  const generateInsights = () => {
    const insights = [];
    
    const negativeRatio = mentions.filter(m => m.sentiment === 'negative').length / mentions.length;
    if (negativeRatio > 0.4) {
      insights.push(`Alto índice de sentimento negativo (${Math.round(negativeRatio * 100)}%)`);
    }

    const highEngagementCount = mentions.filter(m => m.engagement_score > 100).length;
    if (highEngagementCount > 0) {
      insights.push(`${highEngagementCount} menções com alto engajamento detectadas`);
    }

    const twitterMentions = mentions.filter(m => m.platform === 'twitter').length;
    if (twitterMentions > mentions.length * 0.8) {
      insights.push('Atividade concentrada no Twitter');
    }

    return insights;
  };

  const downloadJSON = (data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-social-${selectedPolitician || 'todos'}-${timeframe}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateExcel = async (data: any) => {
    // Para Excel, vamos criar um CSV estruturado
    const csvContent = [
      // Header
      ['Relatório de Monitoramento Social'],
      ['Político:', data.metadata.politician],
      ['Período:', timeframe],
      ['Gerado em:', new Date(data.metadata.generatedAt).toLocaleString('pt-BR')],
      [''],
      
      // Estatísticas
      ['ESTATÍSTICAS'],
      ['Total de Menções:', data.stats.totalMentions],
      ['Engajamento Total:', data.stats.engagementTotal],
      ['Menções Positivas:', data.stats.positiveCount],
      ['Menções Negativas:', data.stats.negativeCount],
      ['Menções Neutras:', data.stats.neutralCount],
      [''],
      
      // Menções
      ['MENÇÕES RECENTES'],
      ['Timestamp', 'Político', 'Plataforma', 'Sentimento', 'Engajamento', 'Conteúdo'],
      ...data.mentions.map((mention: any) => [
        new Date(mention.timestamp).toLocaleString('pt-BR'),
        mention.politician_name,
        mention.platform,
        mention.sentiment,
        mention.engagement_score,
        mention.content.substring(0, 100) + '...'
      ])
    ];

    const csvString = csvContent.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-social-${selectedPolitician || 'todos'}-${timeframe}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generatePDF = async (data: any) => {
    // Para PDF, vamos criar um HTML que pode ser impresso
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório de Monitoramento Social</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 25px; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
          .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
          .mention { border-bottom: 1px solid #eee; padding: 10px 0; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
          .positive { background-color: #d4edda; color: #155724; }
          .negative { background-color: #f8d7da; color: #721c24; }
          .neutral { background-color: #e2e3e5; color: #383d41; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório de Monitoramento Social</h1>
          <p>Político: ${data.metadata.politician} | Período: ${timeframe}</p>
          <p>Gerado em: ${new Date(data.metadata.generatedAt).toLocaleString('pt-BR')}</p>
        </div>
        
        <div class="section">
          <h2>Estatísticas Gerais</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <h3>Total de Menções</h3>
              <p>${data.stats.totalMentions}</p>
            </div>
            <div class="stat-card">
              <h3>Engajamento Total</h3>
              <p>${data.stats.engagementTotal}</p>
            </div>
            <div class="stat-card">
              <h3>Sentimento Positivo</h3>
              <p>${data.stats.positiveCount}</p>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>Principais Menções</h2>
          ${data.analysis.topMentions.map((mention: any) => `
            <div class="mention">
              <div>
                <span class="badge ${mention.sentiment}">${mention.sentiment}</span>
                <strong>${mention.politician_name}</strong> - ${mention.platform}
                <span style="float: right;">Engajamento: ${mention.engagement_score}</span>
              </div>
              <p>${mention.content.substring(0, 200)}...</p>
              <small>${new Date(mention.timestamp).toLocaleString('pt-BR')}</small>
            </div>
          `).join('')}
        </div>
        
        <div class="section">
          <h2>Insights e Análises</h2>
          <ul>
            ${data.analysis.insights.map((insight: string) => `<li>${insight}</li>`).join('')}
          </ul>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-social-${selectedPolitician || 'todos'}-${timeframe}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'excel': return <FileSpreadsheet className="h-4 w-4" />;
      default: return <Download className="h-4 w-4" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Relatórios e Exportação
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Configurações do Relatório */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Formato</label>
            <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF (Relatório Visual)
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV (Dados Estruturados)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    JSON (Dados Brutos)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Relatório</label>
            <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Resumo Executivo</SelectItem>
                <SelectItem value="detailed">Detalhado</SelectItem>
                <SelectItem value="analysis">Análise Avançada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Prévia dos Dados */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Prévia dos Dados</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="p-3 bg-muted/50 rounded text-center">
              <div className="text-lg font-bold">{mentions.length}</div>
              <div className="text-xs text-muted-foreground">Menções</div>
            </div>
            <div className="p-3 bg-muted/50 rounded text-center">
              <div className="text-lg font-bold">{stats?.positiveCount || 0}</div>
              <div className="text-xs text-muted-foreground">Positivas</div>
            </div>
            <div className="p-3 bg-muted/50 rounded text-center">
              <div className="text-lg font-bold">{stats?.negativeCount || 0}</div>
              <div className="text-xs text-muted-foreground">Negativas</div>
            </div>
            <div className="p-3 bg-muted/50 rounded text-center">
              <div className="text-lg font-bold">{stats?.engagementTotal || 0}</div>
              <div className="text-xs text-muted-foreground">Engajamento</div>
            </div>
          </div>
        </div>

        {/* Filtros Aplicados */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Filtros Aplicados</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Político: {selectedPolitician || "Todos"}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Período: {timeframe}
            </Badge>
            {reportType && (
              <Badge variant="outline">
                Tipo: {reportType}
              </Badge>
            )}
          </div>
        </div>

        {/* Botão de Gerar */}
        <Button 
          onClick={generateReport}
          disabled={isExporting || mentions.length === 0}
          className="w-full"
          size="lg"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando relatório...
            </>
          ) : (
            <>
              {getFormatIcon(exportFormat)}
              <span className="ml-2">
                Gerar Relatório {exportFormat.toUpperCase()}
              </span>
            </>
          )}
        </Button>

        {mentions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Nenhum dado disponível para gerar relatório
          </p>
        )}
      </CardContent>
    </Card>
  );
}