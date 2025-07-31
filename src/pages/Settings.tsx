import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Settings as SettingsIcon, Bell, MessageSquare, Shield, Database } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";

// Importar o conteúdo da página de usuários
import { UserManagement } from "@/components/settings/UserManagement";
import { SystemSettings } from "@/components/settings/SystemSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { WhatsAppSettings } from "@/components/settings/WhatsAppSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("users");

  const tabs = [
    {
      id: "users",
      label: "Usuários",
      icon: Users,
      description: "Gerenciar usuários e permissões do sistema"
    },
    {
      id: "system",
      label: "Sistema",
      icon: SettingsIcon,
      description: "Configurações gerais do sistema"
    },
    {
      id: "notifications",
      label: "Notificações",
      icon: Bell,
      description: "Configurar notificações e alertas"
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: MessageSquare,
      description: "Configurações de integração WhatsApp"
    },
    {
      id: "security",
      label: "Segurança",
      icon: Shield,
      description: "Configurações de segurança e auditoria"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema BR.I.A.N.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-fit lg:grid-cols-5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab Content Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {tabs.find(tab => tab.id === activeTab) && (
                  <>
                    {(() => {
                      const Icon = tabs.find(tab => tab.id === activeTab)!.icon;
                      return <Icon className="h-6 w-6 text-primary" />;
                    })()}
                    <div>
                      <CardTitle>
                        {tabs.find(tab => tab.id === activeTab)?.label}
                      </CardTitle>
                      <CardDescription>
                        {tabs.find(tab => tab.id === activeTab)?.description}
                      </CardDescription>
                    </div>
                  </>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Tab Contents */}
          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <SystemSettings />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-6">
            <WhatsAppSettings />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecuritySettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;