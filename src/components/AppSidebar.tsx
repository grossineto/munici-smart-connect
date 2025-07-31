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
  AlertTriangle
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Solicitações", url: "/requests", icon: MessageSquare },
  { title: "Munícipes", url: "/citizens", icon: Users },
  { title: "Agendamentos", url: "/appointments", icon: Calendar },
  { title: "WhatsApp", url: "/whatsapp", icon: Phone },
  { title: "Relatórios", url: "/reports", icon: BarChart3 },
  { title: "Insights", url: "/insights", icon: Brain },
  { title: "Gabinete de Urgência", url: "/urgency-office", icon: AlertTriangle },
];

export function AppSidebar() {
  const { signOut } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">B</span>
            </div>
            <div>
              <h2 className="font-bold text-lg">BRIAN</h2>
              <p className="text-xs text-muted-foreground">Sistema Municipal</p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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

        <div className="mt-auto p-4 border-t">
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-2">Sair</span>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}