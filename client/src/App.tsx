import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import EventListener from "@/pages/event-listener";
import LandingPage from "@/pages/LandingPage";
import Documentation from "@/pages/Documentation";
import NotFound from "@/pages/not-found";
import Workflow from "@/pages/workflow";
import WorkflowDetail from "@/pages/workflow-detail";
import { KeepAlive } from "@/components/KeepAlive";
import Dashboard from "./pages/entry";
import SuccessfulActions from "@/pages/SuccessfulActions";
import FailedActions from "@/pages/FailedActions";
import YamlEditor from "@/pages/yaml-editor";
import YamlDetail from "@/pages/yaml-detail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/docs" component={Documentation} />
      <Route path="/dashboard" component={EventListener} />
      <Route path="/workflow" component={Workflow} />
      <Route path="/workflow/:id" component={WorkflowDetail} />
      <Route path="/yaml-editor" component={YamlEditor} />
      <Route path="/yaml/:id" component={YamlDetail} />
      <Route path="/successful-actions" component={SuccessfulActions} />
      <Route path="/failed-actions" component={FailedActions} />

      {/* <Route path="/work" component={} /> */}

    </Switch>
  );
}

import SmoothScroll from "@/components/ui/SmoothScroll";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <KeepAlive />
      <TooltipProvider>
        <Toaster />
        <SmoothScroll>
          <Router />
        </SmoothScroll>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
