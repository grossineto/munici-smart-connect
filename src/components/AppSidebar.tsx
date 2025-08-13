import { 
  Home, 
  MessageSquare, 
  Calendar, 
  Users, 
  BarChart3, 
  FileText, 
  Settings,
  LogOut,
  Phone,
  Brain,
  AlertTriangle,
  Shield,
  Newspaper,
  Share2,
  UserCheck,
  Building2,
  LineChart,
  Landmark
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const group1 = [
  { title: "Secretarias", url: "/departments", icon: Building2 },
  { title: "Oportunidades e Recursos", url: "/oportunidades", icon: Landmark },
  { title: "Monitoramento de Redes", url: "/social-monitoring", icon: Share2 },
  { title: "Monitoramento de Notícias", url: "/news-monitoring", icon: Newspaper },
  { title: "Omnichannel", url: "/whatsapp", icon: Phone },
  { title: "Pesquisas", url: "/pesquisas-politicas", icon: LineChart },
];

const group2 = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Insights", url: "/insights", icon: Brain },
  { title: "Gabinete de Urgência", url: "/urgency-office", icon: AlertTriangle },
  { title: "Relatórios", url: "/reports", icon: BarChart3 },
];

const group3 = [
  { title: "Munícipes", url: "/citizens", icon: Users },
  { title: "Solicitações", url: "/requests", icon: MessageSquare },
  { title: "Agendamentos", url: "/appointments", icon: Calendar },
];

const group4 = [
  { title: "Usuários", url: "/users", icon: Shield },
];

export function AppSidebar() {
  const { signOut } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "sidebar-link sidebar-link--active font-medium"
      : "sidebar-link hover:bg-surfaceMuted";

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-6 border-b gradient-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse-glow"></div>
          <div className="flex justify-center relative z-10">
            <div className="relative hover-glow">
              <img 
                src="/lovable-uploads/15e88a34-c752-40da-b211-dbf4235418f1.png" 
                alt="BR.I.A.N. logo" 
                className="w-full h-auto max-w-28 transition-transform duration-300 hover:scale-110 drop-shadow-lg dark:hidden"
              />
              <img 
                src="/lovable-uploads/0ec6f0c4-8dda-463e-b561-6fbdb3c27d77.png" 
                alt="BR.I.A.N. logo — versão branca" 
                className="w-full h-auto max-w-28 transition-transform duration-300 hover:scale-110 drop-shadow-lg hidden dark:block"
              />
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            {/* Grupo 1 */}
            <SidebarMenu>
              {group1.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/dashboard"}
                      className={getNavCls}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>

            <SidebarSeparator />

            {/* Grupo 2 */}
            <SidebarMenu>
              {group2.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/dashboard"}
                      className={getNavCls}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>

            <SidebarSeparator />

            {/* Grupo 3 */}
            <SidebarMenu>
              {group3.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/dashboard"}
                      className={getNavCls}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>

            <SidebarSeparator />

            {/* Grupo 4 */}
            <SidebarMenu>
              {group4.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/dashboard"}
                      className={getNavCls}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t gradient-card backdrop-blur-sm">
          <Button
            variant="ghost"
            className="w-full justify-start mb-2 focus:ring-[hsl(var(--sidebar-icon-color-light))] dark:focus:ring-[hsl(var(--primary-ring))]"
            asChild
          >
            <NavLink to="/account" end className={({ isActive }) => isActive ? "sidebar-link sidebar-link--active font-medium w-full justify-start" : "sidebar-link w-full justify-start hover:bg-surfaceMuted"}>
              <Settings className="h-4 w-4" />
              <span className="ml-2">Configurações</span>
            </NavLink>
          </Button>
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start hover:bg-destructive/10 hover:text-destructive transition-colors focus:ring-[hsl(var(--sidebar-icon-color-light))] dark:focus:ring-[hsl(var(--primary-ring))]"
          >
            <LogOut className="h-4 w-4 icon-sidebar-accent" />
            <span className="ml-2">Sair</span>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
