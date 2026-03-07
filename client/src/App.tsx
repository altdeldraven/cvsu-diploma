import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import HomePage from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import AdminDashboard from "@/pages/dashboard-admin";
import AdminStudentsPage from "@/pages/admin-students";
import AdminDiplomasPage from "@/pages/admin-diplomas";
import AdminSettingsPage from "@/pages/admin-settings";
import StudentDashboard from "@/pages/dashboard-student";
import ProfilePage from "@/pages/profile";
import VerificationPage from "@/pages/verification";
import AboutPage from "@/pages/about";
import NotFound from "@/pages/not-found";

// Protected Route Wrapper
function ProtectedRoute({ 
  component: Component, 
  requiredRole 
}: { 
  component: React.ComponentType<any>;
  requiredRole?: "admin" | "student";
}) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Redirect to={user.role === "admin" ? "/admin" : "/student"} />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/verify/:certificateId" component={VerificationPage} />

      {/* Admin Routes */}
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} requiredRole="admin" />
      </Route>
      <Route path="/admin/students">
        <ProtectedRoute component={AdminStudentsPage} requiredRole="admin" />
      </Route>
      <Route path="/admin/diplomas">
        <ProtectedRoute component={AdminDiplomasPage} requiredRole="admin" />
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute component={AdminSettingsPage} requiredRole="admin" />
      </Route>

      {/* Student Routes */}
      <Route path="/student">
        <ProtectedRoute component={StudentDashboard} requiredRole="student" />
      </Route>
      <Route path="/student/diploma">
        <ProtectedRoute component={StudentDashboard} requiredRole="student" />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={ProfilePage} />
      </Route>
      <Route path="/about">
        <ProtectedRoute component={AboutPage} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
