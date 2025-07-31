import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

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
            <header className="h-16 border-b bg-background flex items-center px-6 gap-4">
              <SidebarTrigger />
              <div className="flex-1 flex items-center gap-3">
                <img 
                  src="/lovable-uploads/15e88a34-c752-40da-b211-dbf4235418f1.png" 
                  alt="BR.I.A.N." 
                  className="h-8 w-auto"
                />
                <span className="text-sm text-muted-foreground">Sistema Municipal</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Olá, {user?.email}
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