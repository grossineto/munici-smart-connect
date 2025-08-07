import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { NavLink } from "react-router-dom";
import { Phone, MessageSquare, Voicemail, Globe, Mail, Shield, GitBranch, Database, Cog } from "lucide-react";
import WhatsApp from "./WhatsApp";

const setSEO = () => {
  const title = "Omnichannel de Atendimento com IA | BR.I.A.N.";
  const description =
    "Hub Omnichannel com IA: canais unificados, identificação segura e fluxos automatizados. Integração white label.";
  if (document.title !== title) document.title = title;

  const metaName = "description";
  let meta = document.querySelector(`meta[name="${metaName}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", metaName);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", description);

  const canonicalHref = `${window.location.origin}/whatsapp`;
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", canonicalHref);
};

const Omnichannel: React.FC = () => {
  const { toast } = useToast();
  const [voiceId, setVoiceId] = useState("pt-BR");
  const [biometric, setBiometric] = useState(true);
  const [voiceRecognition, setVoiceRecognition] = useState(true);
  const [password, setPassword] = useState(true);

  useEffect(() => {
    setSEO();
  }, []);

  const onSaveConfig = () => {
    toast({
      title: "Configurações salvas",
      description: "Placeholders aplicados. Integração white label será conectada com o time técnico.",
    });
  };

  return (
    <main className="p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Omnichannel de Atendimento com IA
        </h1>
        <p className="text-muted-foreground mt-1">
          Hub unificado para canais, identificação, fluxos de IA e data lakes. Integração white label em breve.
        </p>
      </header>

      <Tabs defaultValue="conversas" className="w-full">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="conversas">Conversas</TabsTrigger>
          <TabsTrigger value="canais">Canais</TabsTrigger>
          <TabsTrigger value="identificacao">Identificação</TabsTrigger>
          <TabsTrigger value="fluxos">Fluxos de IA</TabsTrigger>
          <TabsTrigger value="datalakes">Data Lakes</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="conversas" className="mt-4">
          <section aria-label="Conversas Omnichannel">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Conversas</CardTitle>
                <CardDescription>
                  Central atual de conversas. O chat do WhatsApp permanece disponível aqui como sub-aba do hub.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Reuso do chat existente */}
                <WhatsApp />
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        <TabsContent value="canais" className="mt-4">
          <section aria-label="Canais Integrados">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" /> Telefone (Voz)</CardTitle>
                  <CardDescription>Atendimento por chamadas com IA de voz.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge variant="secondary">Em breve</Badge>
                  <Button variant="outline" disabled>Conectar</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Voicemail className="h-5 w-5" /> Mensagens de Voz</CardTitle>
                  <CardDescription>Caixa postal inteligente com transcrição.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge variant="secondary">Em breve</Badge>
                  <Button variant="outline" disabled>Conectar</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> WhatsApp</CardTitle>
                  <CardDescription>Canal de mensagens integrado ao hub.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge>Ativo</Badge>
                  <NavLink to="/whatsapp"><Button variant="default">Abrir</Button></NavLink>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> E-mail</CardTitle>
                  <CardDescription>Fila inteligente para tickets por e-mail.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge variant="secondary">Em breve</Badge>
                  <Button variant="outline" disabled>Conectar</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Web Chat</CardTitle>
                  <CardDescription>Widget de chat para sites e portais.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge variant="secondary">Em breve</Badge>
                  <Button variant="outline" disabled>Conectar</Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="identificacao" className="mt-4">
          <section aria-label="Identificação do Usuário">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Identificação</CardTitle>
                <CardDescription>Defina os métodos aceitos para autenticação do munícipe.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="voice">Reconhecimento de Voz</Label>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <span className="text-sm text-muted-foreground">Biometria de voz</span>
                      <Switch id="voice" checked={voiceRecognition} onCheckedChange={setVoiceRecognition} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="biometric">Biometria/Impressão Digital</Label>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <span className="text-sm text-muted-foreground">Dispositivos compatíveis</span>
                      <Switch id="biometric" checked={biometric} onCheckedChange={setBiometric} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha/PIN</Label>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <span className="text-sm text-muted-foreground">Fallback universal</span>
                      <Switch id="password" checked={password} onCheckedChange={setPassword} />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="voiceId">Idioma da Voz da IA</Label>
                    <Input id="voiceId" value={voiceId} onChange={(e) => setVoiceId(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Ex.: pt-BR, pt-PT. Usado quando houver atendimento por voz.</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={onSaveConfig}>Salvar Preferências</Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        <TabsContent value="fluxos" className="mt-4">
          <section aria-label="Fluxos de IA">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><GitBranch className="h-5 w-5" /> Agendamento Médico</CardTitle>
                  <CardDescription>Exemplo em operação com confirmação automática.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge>Pronto</Badge>
                  <Button variant="outline" disabled>Editar</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><GitBranch className="h-5 w-5" /> Zeladoria Urbana</CardTitle>
                  <CardDescription>Abertura e triagem de solicitações.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge variant="secondary">Rascunho</Badge>
                  <Button variant="outline" disabled>Editar</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><GitBranch className="h-5 w-5" /> Consulta de Protocolo</CardTitle>
                  <CardDescription>Consulta de status via protocolo.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge variant="secondary">Rascunho</Badge>
                  <Button variant="outline" disabled>Editar</Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="datalakes" className="mt-4">
          <section aria-label="Data Lakes">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Monitoramento de Notícias</CardTitle>
                  <CardDescription>Extração e análise de mídia e veículos.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge>Conectado</Badge>
                  <NavLink to="/news-monitoring"><Button variant="default">Abrir</Button></NavLink>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Monitoramento de Redes</CardTitle>
                  <CardDescription>Coleta e análise direta de plataformas.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge>Conectado</Badge>
                  <NavLink to="/social-monitoring"><Button variant="default">Abrir</Button></NavLink>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Contato Direto</CardTitle>
                  <CardDescription>Interações com munícipes via Omnichannel.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge>Conectado</Badge>
                  <Button variant="outline" disabled>Gerenciar</Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <section aria-label="Configurações da Integração">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Cog className="h-5 w-5" /> Configurações</CardTitle>
                <CardDescription>Placeholders para a integração white label. Sem referência ao fornecedor.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="apiBase">Endpoint da API</Label>
                    <Input id="apiBase" placeholder="https://api.seu-dominio.gov.br/omni" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhook">Webhook de Eventos</Label>
                    <Input id="webhook" placeholder="https://sua-plataforma/webhook/omni" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secret">Segredo de Callback</Label>
                    <Input id="secret" type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Nome da Marca (white label)</Label>
                    <Input id="brand" placeholder="Prefeitura de Exemplo" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={onSaveConfig}>Salvar Configurações</Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Omnichannel;
