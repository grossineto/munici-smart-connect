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
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import DashboardLayout from "./layouts/DashboardLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">BR.I.A.N. Sistema</h1>
        <p className="text-lg text-gray-600">Sistema funcionando corretamente</p>
        <div className="mt-4">
          <a href="/auth" className="bg-blue-500 text-white px-4 py-2 rounded">
            Ir para Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default App;
