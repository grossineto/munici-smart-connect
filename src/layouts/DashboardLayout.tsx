import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/ui/notification-bell";
import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col">
            <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-4 md:px-6 gap-2 md:gap-4 sticky top-0 z-10">
              <SidebarTrigger />
              <div className="flex-1 flex items-center gap-2 md:gap-4 min-w-0">
                <img 
                  src="/lovable-uploads/15e88a34-c752-40da-b211-dbf4235418f1.png" 
                  alt="BR.I.A.N." 
                  className="h-6 md:h-7 w-auto flex-shrink-0"
                />
                <div className="h-4 md:h-6 w-px bg-border flex-shrink-0"></div>
                <span className="text-xs md:text-sm text-muted-foreground font-medium tracking-wide truncate">Your city. Smarter. Together.</span>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/politicians')}
                  className="hover:bg-muted/50"
                  title="Gerenciar Políticos"
                >
                  <UserCheck className="h-4 w-4" />
                </Button>
                <NotificationBell />
                <span className="hidden sm:inline text-xs md:text-sm text-muted-foreground bg-muted/50 px-2 md:px-3 py-1 md:py-1.5 rounded-full truncate max-w-[120px] md:max-w-none">
                  {user?.email}
                </span>
              </div>
            </header>
            
            <main className="flex-1 p-3 md:p-6 bg-muted/10">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default DashboardLayout;