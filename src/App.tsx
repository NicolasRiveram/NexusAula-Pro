import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { EstablishmentProvider } from "./contexts/EstablishmentContext";
import { DesignProvider } from "./contexts/DesignContext";
import { AuthProvider } from "./contexts/AuthContext";
import FullPageLoader from "./components/layout/FullPageLoader";
import AppRoutes from "./components/AppRoutes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <DesignProvider>
                <EstablishmentProvider>
                  <Suspense fallback={<FullPageLoader />}>
                    <AppRoutes />
                  </Suspense>
                </EstablishmentProvider>
              </DesignProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;