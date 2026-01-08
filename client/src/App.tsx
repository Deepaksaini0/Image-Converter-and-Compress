import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageReviews } from "@/components/reviews/PageReviews";
import Home from "@/pages/Home";
import FAQPage from "@/pages/FAQ";
import LLMPage from "@/pages/LLM";
import SEOAuditPage from "@/pages/SEOAudit";
import TextToHTMLPage from "@/pages/TextToHTML";
import WebToolsPage from "@/pages/WebTools";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/faq" component={FAQPage} />
        <Route path="/llms" component={LLMPage} />
        <Route path="/seo-audit" component={SEOAuditPage} />
        <Route path="/text-to-html" component={TextToHTMLPage} />
        <Route path="/web-tools" component={WebToolsPage} />
        <Route component={NotFound} />
      </Switch>
      
      {location !== "/not-found" && (
        <div className="container mx-auto px-4 max-w-4xl">
          <PageReviews pagePath={location} />
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
