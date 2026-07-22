import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminDocuments from "./pages/AdminDocuments";
import AdminSessions from "./pages/AdminSessions";
import PasswordReset from "./pages/PasswordReset";
import UserProfile from "./pages/UserProfile";
import { useAuth } from "./_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "./const";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="text-3xl">🏥</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-center text-foreground">
            Medicare Myanmar AI
          </h1>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            ဆေးပညာ အကူအညီ ချက်ဘော့ ဝန်ဆောင်မှု
          </p>
          <Button onClick={() => startLogin()} size="lg" className="w-full shadow-lg">
            Sign in
          </Button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-6 p-8">
          <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">Admin access required</p>
          <Button onClick={() => window.location.href = '/'}>Go Home</Button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat">
        <ProtectedRoute><Chat /></ProtectedRoute>
      </Route>
      <Route path="/chat/:sessionId">
        <ProtectedRoute><Chat /></ProtectedRoute>
      </Route>
      <Route path="/password-reset">
        <ProtectedRoute><PasswordReset /></ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute><UserProfile /></ProtectedRoute>
      </Route>
      <Route path="/admin">
        <AdminRoute><AdminDashboard /></AdminRoute>
      </Route>
      <Route path="/admin/users">
        <AdminRoute><AdminUsers /></AdminRoute>
      </Route>
      <Route path="/admin/documents">
        <AdminRoute><AdminDocuments /></AdminRoute>
      </Route>
      <Route path="/admin/sessions">
        <AdminRoute><AdminSessions /></AdminRoute>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
