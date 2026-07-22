import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Users,
  MessageSquare,
  FileText,
  LogOut,
  UserCog,
  FileUp,
  Activity,
  PanelLeft,
  Shield,
} from "lucide-react";
import { useState } from "react";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const statsQuery = trpc.admin.getStats.useQuery();
  const stats = statsQuery.data || { totalSessions: 0, totalMessages: 0, totalUsers: 0 };

  const navItems = [
    { id: "/admin", label: "Overview", icon: Activity },
    { id: "/admin/users", label: "Users", icon: Users },
    { id: "/admin/sessions", label: "Chat Sessions", icon: MessageSquare },
    { id: "/admin/documents", label: "Documents", icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-64" : "w-16"} border-r border-border bg-sidebar transition-all duration-300 flex flex-col`}
      >
        <div className="h-14 flex items-center justify-between px-3 border-b border-border">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground text-sm">Admin Panel</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
          >
            <PanelLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setLocation(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                location === item.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => setLocation("/chat")}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {sidebarOpen && "Back to Chat"}
          </Button>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-primary">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">{user?.name || "Admin"}</p>
                <p className="text-xs text-muted-foreground truncate">Administrator</p>
              </div>
            )}
            <button
              onClick={() => logout()}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">System overview and management</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Total Users</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Chat Sessions</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.totalSessions}</p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Total Messages</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.totalMessages}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setLocation("/admin/users")}
              className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <UserCog className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">User Management</h3>
              </div>
              <p className="text-sm text-muted-foreground">Manage user roles and access</p>
            </button>

            <button
              onClick={() => setLocation("/admin/documents")}
              className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <FileUp className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Document Management</h3>
              </div>
              <p className="text-sm text-muted-foreground">Manage uploaded medical documents</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
