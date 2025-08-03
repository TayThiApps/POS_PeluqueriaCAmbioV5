import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/sidebar";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Transactions from "@/pages/transactions";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { apiRequest } from "./lib/queryClient";

function Router() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 no-print">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Sistema TPV</h2>
              <p className="text-gray-600 mt-1">
                Hoy, {new Date().toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Usuario activo</p>
                <p className="font-medium text-gray-800">Administrador</p>
              </div>
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                A
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/clients" component={Clients} />
            <Route path="/transactions" component={Transactions} />
            <Route path="/reports" component={Reports} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    // Initialize default client on app startup
    apiRequest('POST', '/api/init')
      .catch(err => console.error('Initialization error:', err));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
