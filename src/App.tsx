import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import FTCAnalytics from "./pages/FTCAnalytics";
import IVO from "./pages/IVO";
import ReportsIndex from "./pages/ReportsIndex";
import ReportsCluster from "./pages/ReportsCluster";
import ReportDetail from "./pages/ReportDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/FTCAnalytics" element={<FTCAnalytics />} />
          <Route path="/ivo" element={<IVO />} />
          <Route path="/reports" element={<ReportsIndex />} />
          <Route path="/reports/cluster/:slug" element={<ReportsCluster />} />
          <Route path="/reports/:slug" element={<ReportDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
