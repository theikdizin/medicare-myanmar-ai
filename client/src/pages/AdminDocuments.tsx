import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  FileText,
  Shield,
  LogOut,
  PanelLeft,
  Activity,
  Users,
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";
import { useState } from "react";

export default function AdminDocuments() {
  const { logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const docsQuery = trpc.admin.getAllDocuments.useQuery();
  const docs = docsQuery.data || [];

  const navItems = [
    { id: "/admin", label: "Overview", icon: Activity },
    { id: "/admin/users", label: "Users", icon: Users },
    { id: "/admin/sessions", label: "Chat Sessions", icon: MessageSquare },
    { id: "/admin/documents", label: "Documents", icon: FileText },
  ];

  const statusIcon = (status: string) => {
    switch (status) {
      case "ready": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "processing": return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case "error": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <div className={`${sidebarOpen ? "w-64" : "w-16"} border-r border-border bg-sidebar transition-all duration-300 flex flex-col`}>
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
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setLocation(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${location === item.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}>
              <item.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button onClick={() => logout()} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Document Management</h1>
            <p className="text-muted-foreground mt-1">All uploaded medical documents</p>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">File Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">User</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Size</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d: any) => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-accent/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm text-foreground">{d.fileName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{d.userName || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {statusIcon(d.status)}
                        <span className="text-sm capitalize">{d.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {d.fileSize ? `${(d.fileSize / 1024).toFixed(1)} KB` : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(d.uploadedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
