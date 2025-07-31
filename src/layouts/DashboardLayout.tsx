import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/ui/notification-bell";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col">
            <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-6 gap-4 sticky top-0 z-10">
              <SidebarTrigger />
              <div className="flex-1 flex items-center gap-4">
                <img 
                  src="/lovable-uploads/15e88a34-c752-40da-b211-dbf4235418f1.png" 
                  alt="BR.I.A.N." 
                  className="h-7 w-auto"
                />
                <div className="h-6 w-px bg-border"></div>
                <span className="text-sm text-muted-foreground font-medium tracking-wide">Your city. Smarter. Together.</span>
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell />
                <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                  {user?.email}
                </span>
              </div>
            </header>
            
            <main className="flex-1 p-6 bg-muted/10">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default DashboardLayout;