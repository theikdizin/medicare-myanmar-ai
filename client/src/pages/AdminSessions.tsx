import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare,
  Shield,
  LogOut,
  PanelLeft,
  Activity,
  Users,
  FileText,
  Menu,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

export default function AdminSessions() {
  const { logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const sessionsQuery = trpc.admin.getAllSessions.useQuery();
  const sessions = sessionsQuery.data || [];

  const navItems = [
    { id: "/admin", label: "Overview", icon: Activity },
    { id: "/admin/users", label: "Users", icon: Users },
    { id: "/admin/sessions", label: "Chat Sessions", icon: MessageSquare },
    { id: "/admin/documents", label: "Documents", icon: FileText },
  ];

  const handleNav = (path: string) => {
    setLocation(path);
    if (isMobile) setMobileOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="h-14 flex items-center justify-between px-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground text-sm">Admin Panel</span>
        </div>
        <button onClick={() => setMobileOpen(false)} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors">
          <PanelLeft className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => handleNav(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${location === item.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}>
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <button onClick={() => logout()} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className={`${isMobile ? "hidden" : ""} ${sidebarOpen ? "w-64" : "w-16"} border-r border-border bg-sidebar transition-all duration-300 flex flex-col`}>
        <div className="h-14 flex items-center justify-between px-3 border-b border-border">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground text-sm">Admin Panel</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors">
            <PanelLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        {sidebarOpen && (
          <>
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => (
                <button key={item.id} onClick={() => handleNav(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${location === item.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-border">
              <button onClick={() => logout()} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile Sheet */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[85vw] sm:w-64 p-0 flex flex-col">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className={`h-14 border-b border-border flex items-center px-3 ${isMobile ? "justify-between" : ""}`}>
          {isMobile && (
            <button onClick={() => setMobileOpen(true)} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors mr-2">
              <Menu className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          <h1 className="text-lg font-bold text-foreground">Chat Sessions</h1>
        </div>

        <div className="p-3 md:p-6 max-w-6xl mx-auto">
          <p className="text-muted-foreground mt-1 text-sm mb-4">Overview of all chat conversations</p>

          {/* Desktop Table */}
          <div className={`${isMobile ? "hidden" : ""} rounded-2xl border border-border bg-card overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Title</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">User</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s: any) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-accent/20">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground truncate max-w-[200px]">{s.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">{s.userName || "-"}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{s.userEmail || "-"}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(s.updatedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className={`${isMobile ? "block" : "hidden"} space-y-3`}>
            {sessions.map((s: any) => (
              <div key={s.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <MessageSquare className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.userName || "Unknown"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs text-muted-foreground">
                  <span>{s.userEmail || "-"}</span>
                  <span>{new Date(s.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
