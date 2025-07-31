import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Requests from "./pages/Requests";
import Reports from "./pages/Reports";
import Insights from "./pages/Insights";
import WhatsApp from "./pages/WhatsApp";
import UrgencyOffice from "./pages/UrgencyOffice";
import Citizens from "./pages/Citizens";
import Appointments from "./pages/Appointments";
import DashboardLayout from "./layouts/DashboardLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
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
            <Route path="/whatsapp" element={<DashboardLayout><WhatsApp /></DashboardLayout>} />
            <Route path="/urgency-office" element={<DashboardLayout><UrgencyOffice /></DashboardLayout>} />
            <Route path="/citizens" element={<DashboardLayout><Citizens /></DashboardLayout>} />
            <Route path="/appointments" element={<DashboardLayout><Appointments /></DashboardLayout>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
