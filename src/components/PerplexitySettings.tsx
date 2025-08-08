import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export type PerplexityConfig = {
  recency: "day" | "week" | "month";
  maxArticles: number;
  scope: "amplo" | "local" | "restrito";
  deduplicate: boolean;
};

type Props = {
  value: PerplexityConfig;
  onChange: (next: PerplexityConfig) => void;
};

export function PerplexitySettings({ value, onChange }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações da Perplexity</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label>Recência</Label>
          <Select
            value={value.recency}
            onValueChange={(recency) => onChange({ ...value, recency: recency as PerplexityConfig["recency"] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a recência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Últimas 24h</SelectItem>
              <SelectItem value="week">Últimos 7 dias</SelectItem>
              <SelectItem value="month">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Escopo</Label>
          <Select
            value={value.scope}
            onValueChange={(scope) => onChange({ ...value, scope: scope as PerplexityConfig["scope"] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o escopo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="amplo">Amplo (Brasil)</SelectItem>
              <SelectItem value="local">Local (Cidade/UF)</SelectItem>
              <SelectItem value="restrito">Restrito (somente termos exatos)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Máx. artigos por consulta</Label>
          <Select
            value={String(value.maxArticles)}
            onValueChange={(v) => onChange({ ...value, maxArticles: Number(v) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
        </div>


        <div className="flex items-center justify-between border rounded-md p-3">
          <div className="space-y-1">
            <Label>Desduplicar por URL + Tenant</Label>
            <p className="text-sm text-muted-foreground">Evita artigos repetidos no mesmo tenant</p>
          </div>
          <Switch
            checked={value.deduplicate}
            onCheckedChange={(checked) => onChange({ ...value, deduplicate: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
