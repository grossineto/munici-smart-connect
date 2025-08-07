import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Upload, Save, MoonStar, Sun } from "lucide-react";
import { useTheme } from "next-themes";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  phone: string | null;
}

const Account = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme, systemTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    avatar_url: "",
    role: null,
    phone: "",
  });

  const currentTheme = theme === "system" ? systemTheme : theme;

  const initials = useMemo(() => {
    const base = profile.full_name || user?.email || "U";
    const parts = base.split(" ");
    const first = parts[0]?.charAt(0) ?? "U";
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
    return (first + last).toUpperCase();
  }, [profile.full_name, user?.email]);

  useEffect(() => {
    document.title = "Configurações da Conta | BR.I.A.N.";
    const meta = document.querySelector('meta[name="description"]');
    const content = "Gerencie seu perfil: nome, avatar e preferências de tema.";
    if (meta) meta.setAttribute("content", content);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = content;
      document.head.appendChild(m);
    }
    const link = document.querySelector('link[rel="canonical"]');
    const href = window.location.href;
    if (link) (link as HTMLLinkElement).href = href;
    else {
      const l = document.createElement("link");
      l.rel = "canonical";
      l.href = href;
      document.head.appendChild(l);
    }
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles" as any)
        .select("full_name, avatar_url, role, phone")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) console.error("Erro ao carregar perfil:", error);
      setProfile({
        full_name: (data as any)?.full_name ?? "",
        avatar_url: (data as any)?.avatar_url ?? "",
        role: (data as any)?.role ?? null,
        phone: (data as any)?.phone ?? "",
      });
      setLoading(false);
    };
    loadProfile();
  }, [user]);

  const onUploadAvatar = async (file: File) => {
    if (!user) return;
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600" });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: updErr } = await supabase
        .from("profiles" as any)
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);
      if (updErr) throw updErr;

      setProfile((p) => ({ ...p, avatar_url: publicUrl }));
      toast({ title: "Avatar atualizado", description: "Sua foto foi atualizada com sucesso." });
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao enviar avatar", description: "Tente novamente.", duration: 5000 });
    }
  };

  const onSave = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles" as any)
        .update({ full_name: profile.full_name ?? "" })
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Configurações salvas", description: "Seu perfil foi atualizado." });
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao salvar", description: "Não foi possível salvar." });
    }
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Configurações da Conta</h1>
        <p className="text-sm text-muted-foreground">Gerencie suas informações e preferências.</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile.avatar_url || undefined} alt="Avatar do usuário" loading="lazy" />
                  <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar" className="text-sm">Atualizar avatar</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onUploadAvatar(f);
                      }}
                      className="hidden"
                    />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById("avatar")?.click()}>
                      <Upload className="h-4 w-4 mr-2" /> Enviar imagem
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name ?? ""}
                    onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
                    placeholder="Seu nome"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" value={user?.email ?? ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Permissão</Label>
                  <Input value={profile.role ?? "viewer"} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" value={profile.phone ?? ""} disabled />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={onSave} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" /> Salvar alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tema</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Modo escuro</p>
                <p className="text-xs text-muted-foreground">Ative para reduzir o brilho da interface.</p>
              </div>
              <div className="flex items-center gap-2">
                {currentTheme === "dark" ? (
                  <MoonStar className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Sun className="h-4 w-4 text-muted-foreground" />
                )}
                <Switch
                  checked={currentTheme === "dark"}
                  onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
                  aria-label="Alternar tema"
                />
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
};

export default Account;
