
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PoliticiansProvider } from "@/contexts/PoliticiansContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Requests from "./pages/Requests";
import Reports from "./pages/Reports";
import Insights from "./pages/Insights";
import Omnichannel from "./pages/Omnichannel";
import UrgencyOffice from "./pages/UrgencyOffice";
import Citizens from "./pages/Citizens";
import Appointments from "./pages/Appointments";
import Users from "./pages/Users";
import NewsMonitoring from "./pages/NewsMonitoring";
import SocialMonitoring from "./pages/SocialMonitoring";
import Politicians from "./pages/Politicians";
import DashboardLayout from "./layouts/DashboardLayout";
import NotFound from "./pages/NotFound";
import Account from "./pages/Account";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <PoliticiansProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
                <Route path="/requests" element={<DashboardLayout><Requests /></DashboardLayout>} />
                <Route path="/reports" element={<DashboardLayout><Reports /></DashboardLayout>} />
                <Route path="/insights" element={<DashboardLayout><Insights /></DashboardLayout>} />
                <Route path="/whatsapp" element={<DashboardLayout><Omnichannel /></DashboardLayout>} />
                <Route path="/urgency-office" element={<DashboardLayout><UrgencyOffice /></DashboardLayout>} />
                <Route path="/citizens" element={<DashboardLayout><Citizens /></DashboardLayout>} />
                <Route path="/appointments" element={<DashboardLayout><Appointments /></DashboardLayout>} />
                <Route path="/users" element={<DashboardLayout><Users /></DashboardLayout>} />
                <Route path="/news-monitoring" element={<DashboardLayout><NewsMonitoring /></DashboardLayout>} />
                <Route path="/social-monitoring" element={<DashboardLayout><SocialMonitoring /></DashboardLayout>} />
                <Route path="/politicians" element={<DashboardLayout><Politicians /></DashboardLayout>} />
                <Route path="/account" element={<DashboardLayout><Account /></DashboardLayout>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </PoliticiansProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
