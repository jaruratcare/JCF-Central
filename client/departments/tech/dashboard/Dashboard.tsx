import React from 'react';
import { Switch, Route, Router as WouterRouter } from "wouter";
import { AppLayout as JcfAppLayout } from '@/shared/layouts/AppLayout';
import { AuthProvider, useAuth } from "@/departments/tech/contexts/auth-context";
import { AppLayout as TechAppLayout } from "@/departments/tech/components/layout/app-layout";
import { setBaseUrl, setAuthTokenGetter } from "@/departments/tech/lib/api-client";
import { supabase } from "@/departments/tech/lib/supabase";

// Configure API base URL and token getter for PostgREST backend route
setBaseUrl("/api/tech");
setAuthTokenGetter(async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
});

import ProjectsList from "@/departments/tech/pages/projects";
import ProjectDashboard from "@/departments/tech/pages/project-dashboard";
import Board from "@/departments/tech/pages/board";
import Backlog from "@/departments/tech/pages/backlog";
import Sprints from "@/departments/tech/pages/sprints";
import ItemDetail from "@/departments/tech/pages/item-detail";
import Gantt from "@/departments/tech/pages/gantt";
import About from "@/departments/tech/pages/about";
import NotFound from "@/departments/tech/pages/not-found";

function TechRouter() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <TechAppLayout>
      <Switch>
        <Route path="/" component={ProjectsList} />
        <Route path="/projects/:projectId" component={ProjectDashboard} />
        <Route path="/projects/:projectId/board" component={Board} />
        <Route path="/projects/:projectId/backlog" component={Backlog} />
        <Route path="/projects/:projectId/sprints" component={Sprints} />
        <Route path="/projects/:projectId/gantt" component={Gantt} />
        <Route path="/projects/:projectId/about" component={About} />
        <Route path="/projects/:projectId/items/:itemId" component={ItemDetail} />
        <Route component={NotFound} />
      </Switch>
    </TechAppLayout>
  );
}

export default function TechDashboard() {
  return (
    <JcfAppLayout departmentName="Tech">
      <AuthProvider>
        <WouterRouter base="/departments/tech">
          <TechRouter />
        </WouterRouter>
      </AuthProvider>
    </JcfAppLayout>
  );
}
