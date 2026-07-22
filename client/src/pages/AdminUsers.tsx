import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Users,
  Shield,
  LogOut,
  PanelLeft,
  Activity,
  MessageSquare,
  FileText,
  UserCog,
  MoreVertical,
  Menu,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

export default function AdminUsers() {
  const { user, logout } = useAuth();
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

  const usersQuery = trpc.admin.getUsers.useQuery();
  const users = usersQuery.data || [];

  const updateRoleMutation = trpc.admin.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated successfully");
      trpc.useUtils().admin.getUsers.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update role: " + error.message);
    },
  });

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
        <div className="flex items-center gap-2 px-2">
          <button onClick={() => logout()} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
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
              <div className="flex items-center gap-2 px-2">
                <button onClick={() => logout()} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
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
          <h1 className="text-lg font-bold text-foreground">User Management</h1>
        </div>

        <div className="p-3 md:p-6 max-w-6xl mx-auto">
          <p className="text-muted-foreground mt-1 text-sm mb-4">Manage user roles and access</p>

          {/* Desktop Table */}
          <div className={`${isMobile ? "hidden" : ""} rounded-2xl border border-border bg-card overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Role</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Created</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-accent/20">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">{(u.name || "U").charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="text-sm text-foreground">{u.name || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{u.email || "-"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: u.id, role: 'admin' })}>
                              <Shield className="h-4 w-4 mr-2" /> Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: u.id, role: 'user' })}>
                              <UserCog className="h-4 w-4 mr-2" /> Make User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className={`${isMobile ? "block" : "hidden"} space-y-3`}>
            {users.map((u: any) => (
              <div key={u.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">{(u.name || "U").charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{u.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{u.email || "-"}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {u.role}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: u.id, role: 'admin' })}>
                        <Shield className="h-4 w-4 mr-2" /> Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: u.id, role: 'user' })}>
                        <UserCog className="h-4 w-4 mr-2" /> Make User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
