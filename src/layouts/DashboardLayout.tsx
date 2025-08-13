import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/ui/notification-bell";
import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const initials = useMemo(() => {
    const base = fullName || user?.email || "U";
    const parts = base.split(" ");
    const first = parts[0]?.charAt(0) ?? "U";
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
    return (first + last).toUpperCase();
  }, [fullName, user?.email]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles" as any)
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      setAvatarUrl((data as any)?.avatar_url || null);
      setFullName((data as any)?.full_name || null);
    };
    load();
  }, [user]);

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full gradient-hero">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col">
            <header className="h-16 border-b glass-effect flex items-center px-4 md:px-6 gap-2 md:gap-4 sticky top-0 z-10 shadow-card">
              <SidebarTrigger />
              <div className="flex-1 flex items-center gap-2 md:gap-4 min-w-0">
                {/* Brand logo swaps for light/dark */}
                <span className="inline-flex items-center">
                  <img 
                    src="/lovable-uploads/15e88a34-c752-40da-b211-dbf4235418f1.png" 
                    alt="BR.I.A.N. logo" 
                    className="h-6 md:h-7 w-auto flex-shrink-0 dark:hidden"
                  />
                  <img 
                    src="/lovable-uploads/0ec6f0c4-8dda-463e-b561-6fbdb3c27d77.png" 
                    alt="BR.I.A.N. logo — versão branca" 
                    className="h-6 md:h-7 w-auto flex-shrink-0 hidden dark:inline-block"
                  />
                </span>
                <div className="h-4 md:h-6 w-px bg-border flex-shrink-0"></div>
                <span className="text-xs md:text-sm text-muted-foreground font-medium tracking-wide truncate">Your city. Smarter. Together.</span>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/politicians')}
                  className="hover:bg-muted/50 focus:ring-[hsl(var(--sidebar-icon-color-light))] dark:focus:ring-[hsl(var(--primary-ring))]"
                  title="Gerenciar Políticos"
                >
                  <UserCheck className="h-4 w-4 icon-sidebar-accent" />
                </Button>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-0 rounded-full focus:ring-[hsl(var(--sidebar-icon-color-light))] dark:focus:ring-[hsl(var(--primary-ring))]">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl || undefined} alt={user?.email || 'Conta'} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{fullName || user?.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/account">Minha conta</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>Sair</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
            
            <main className="flex-1 p-3 md:p-6 bg-gradient-to-br from-background/50 to-muted/30">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default DashboardLayout;