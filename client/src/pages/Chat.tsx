import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation, useParams } from "wouter";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  MessageSquare,
  Plus,
  Trash2,
  Send,
  Sparkles,
  User,
  Loader2,
  LogOut,
  PanelLeft,
  PanelRight,
  Shield,
  RotateCcw,
  Languages,
  FileUp,
  FileText,
  X,
  Menu,
} from "lucide-react";
import { Streamdown } from "streamdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const SUGGESTED_PROMPTS = [
  "ကျန်းမာရေး ပြဿနာအကြောင်း မေးမြန်းပါ",
  "ဆေးဝါး အကြံပြုချက် ရယူပါ",
  "Ask about symptoms and treatment",
  "Medical guidelines for Myanmar",
];

type Message = {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
};

type ChatSession = {
  id: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

type Document = {
  id: number;
  fileName: string;
  status: string;
  fileSize: number;
  uploadedAt: Date;
};

export default function Chat() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const params = useParams<{ sessionId?: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<'myanmar' | 'english' | 'mixed' | 'unknown'>('unknown');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDocsDialog, setShowDocsDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check mobile viewport
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Fetch sessions
  const sessionsQuery = trpc.chat.listSessions.useQuery();
  useEffect(() => {
    if (sessionsQuery.data) {
      setSessions(sessionsQuery.data as any[]);
    }
  }, [sessionsQuery.data]);

  // Fetch documents
  const docsQuery = trpc.documents.list.useQuery();
  const docs = docsQuery.data || [];

  // Load session messages
  const messagesQuery = trpc.chat.getMessages.useQuery(
    { sessionId: currentSessionId! },
    { enabled: !!currentSessionId }
  );

  useEffect(() => {
    if (messagesQuery.data) {
      setMessages(messagesQuery.data.map(m => ({ ...m, createdAt: new Date(m.createdAt) })) as any[]);
    }
  }, [messagesQuery.data]);

  // Check for session in URL
  useEffect(() => {
    if (params.sessionId) {
      setCurrentSessionId(parseInt(params.sessionId));
    }
  }, [params.sessionId]);

  // Auto scroll to bottom
  useEffect(() => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
    if (viewport) {
      requestAnimationFrame(() => {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
      });
    }
  }, [messages, isLoading]);

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setIsLoading(false);
      setDetectedLanguage(data.detectedLanguage as any);
      trpc.useUtils().chat.listSessions.invalidate();
      if (currentSessionId) {
        trpc.useUtils().chat.getMessages.invalidate({ sessionId: currentSessionId });
      }
    },
    onError: (error) => {
      setIsLoading(false);
      toast.error("Error sending message: " + error.message);
    },
  });

  const createSessionMutation = trpc.chat.createSession.useMutation({
    onSuccess: (data) => {
      setCurrentSessionId(data.sessionId);
      setMessages([]);
      setLocation(`/chat/${data.sessionId}`);
      trpc.useUtils().chat.listSessions.invalidate();
    },
  });

  const deleteSessionMutation = trpc.chat.deleteSession.useMutation({
    onSuccess: () => {
      trpc.useUtils().chat.listSessions.invalidate();
      if (sessions.length > 1) {
        const remaining = sessions.filter(s => s.id !== currentSessionId);
        if (remaining.length > 0) {
          setCurrentSessionId(remaining[0].id);
          setLocation(`/chat/${remaining[0].id}`);
        } else {
          setCurrentSessionId(null);
          setMessages([]);
        }
      } else {
        setCurrentSessionId(null);
        setMessages([]);
      }
    },
  });

  const uploadDocumentMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully!");
      setShowUploadDialog(false);
      setUploadFile(null);
      trpc.useUtils().documents.list.invalidate();
    },
    onError: (error) => {
      toast.error("Upload failed: " + error.message);
    },
  });

  const deleteDocumentMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Document deleted");
      trpc.useUtils().documents.list.invalidate();
    },
    onError: (error) => {
      toast.error("Delete failed: " + error.message);
    },
  });

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!currentSessionId) {
      createSessionMutation.mutate({ title: input.substring(0, 50) });
      return;
    }

    setMessages(prev => [...prev, { id: Date.now(), role: "user", content: input.trim(), createdAt: new Date() }]);
    setInput("");
    setIsLoading(true);

    sendMessageMutation.mutate({
      sessionId: currentSessionId,
      content: input.trim(),
      previousLanguage: detectedLanguage,
    });
  };

  const handleNewChat = () => {
    createSessionMutation.mutate({});
    if (isMobile) setSidebarOpen(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "application/pdf" || file.type === "text/plain")) {
      setUploadFile(file);
      setShowUploadDialog(true);
    } else {
      toast.error("Please upload PDF or text files only");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    try {
      const buffer = await uploadFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const base64 = btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''));
      uploadDocumentMutation.mutate({
        fileName: uploadFile.name,
        content: base64,
        mimeType: uploadFile.type,
      });
    } catch {
      toast.error("Failed to process file");
    }
    setIsUploading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Sidebar content component (reusable for both desktop sidebar and mobile sheet)
  const SidebarContent = () => (
    <>
      <div className="h-14 flex items-center justify-between px-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏥</span>
          <span className="font-semibold text-foreground text-sm">Medicare AI</span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
        >
          <PanelRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={handleNewChat}
          className="w-full"
          variant="default"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          <span className="ml-2">New Chat</span>
        </Button>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1 px-2">
        <p className="text-xs font-medium text-muted-foreground px-2 py-1 uppercase tracking-wider">Recent Chats</p>
        <div className="space-y-1">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => {
                setCurrentSessionId(session.id);
                setLocation(`/chat/${session.id}`);
                if (isMobile) setSidebarOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group flex items-center justify-between ${
                currentSessionId === session.id
                  ? "bg-primary/15 text-foreground border border-primary/20"
                  : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate">{session.title}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSessionMutation.mutate({ sessionId: session.id });
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => setShowDocsDialog(true)}
        >
          <FileText className="h-4 w-4 mr-2" />
          My Documents ({docs.length})
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => setShowUploadDialog(true)}
        >
          <FileUp className="h-4 w-4 mr-2" />
          Upload PDF
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => setLocation("/profile")}
        >
          <User className="h-4 w-4 mr-2" />
          My Profile
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => setLocation("/password-reset")}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Password Reset
        </Button>
        {user?.role === 'admin' && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => setLocation("/admin")}
          >
            <Shield className="h-4 w-4 mr-2" />
            Admin Dashboard
          </Button>
        )}
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-primary">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">{user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || "-"}</p>
          </div>
          <button
            onClick={() => logout()}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background relative">
      {/* Desktop Sidebar */}
      <div
        className={`${isMobile ? "hidden" : ""} ${sidebarOpen ? "w-72" : "w-16"} border-r border-border bg-sidebar transition-all duration-300 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-border">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <span className="text-xl">🏥</span>
              <span className="font-semibold text-foreground text-sm">Medicare AI</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
          >
            <PanelLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button
            onClick={handleNewChat}
            className={`w-full ${sidebarOpen ? "" : "px-2"}`}
            variant="default"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">New Chat</span>}
          </Button>
        </div>

        {/* Sessions List - Desktop only */}
        {sidebarOpen && (
          <ScrollArea className="flex-1 px-2">
            <p className="text-xs font-medium text-muted-foreground px-2 py-1 uppercase tracking-wider">Recent Chats</p>
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    setCurrentSessionId(session.id);
                    setLocation(`/chat/${session.id}`);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group flex items-center justify-between ${
                    currentSessionId === session.id
                      ? "bg-primary/15 text-foreground border border-primary/20"
                      : "text-muted-foreground hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="truncate">{session.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSessionMutation.mutate({ sessionId: session.id });
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Sidebar Footer - Desktop */}
        <div className="p-3 border-t border-border space-y-1">
          {sidebarOpen && (
            <>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setShowDocsDialog(true)}>
                <FileText className="h-4 w-4 mr-2" />My Documents ({docs.length})
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setShowUploadDialog(true)}>
                <FileUp className="h-4 w-4 mr-2" />Upload PDF
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setLocation("/profile")}>
                <User className="h-4 w-4 mr-2" />My Profile
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setLocation("/password-reset")}>
                <RotateCcw className="h-4 w-4 mr-2" />Password Reset
              </Button>
              {user?.role === 'admin' && (
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setLocation("/admin")}>
                  <Shield className="h-4 w-4 mr-2" />Admin Dashboard
                </Button>
              )}
            </>
          )}
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-primary">{user?.name?.charAt(0).toUpperCase() || "U"}</span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || "-"}</p>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={() => logout()} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sheet (Slide-over sidebar for mobile) */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[85vw] sm:w-80 p-0 flex flex-col">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Chat Area */}
      <div
        className="flex-1 flex flex-col min-w-0"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Chat Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-3 md:px-4 bg-background/80 backdrop-blur">
          <div className="flex items-center gap-2">
            {/* Mobile menu trigger */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors mr-1"
              >
                <Menu className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
            <h2 className="font-semibold text-foreground text-sm md:text-base truncate">
              {currentSessionId
                ? sessions.find(s => s.id === currentSessionId)?.title || "Chat"
                : "New Chat"}
            </h2>
            {detectedLanguage !== 'unknown' && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Languages className="h-3 w-3" />
                {detectedLanguage === 'myanmar' ? 'မြန်မာ' : detectedLanguage === 'mixed' ? 'Mixed' : 'English'}
              </Badge>
            )}
          </div>
          <Badge variant="outline" className="text-xs">{user?.role === 'admin' ? 'Admin' : 'User'}</Badge>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden" ref={scrollRef}>
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 md:mb-6 shadow-lg shadow-primary/10">
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2 text-center">
                Medicare Myanmar AI
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-6 md:mb-8 text-center max-w-sm md:max-w-md px-4">
                ဆေးပညာ အကြောင်း မေးမြန်းပါ။ မြန်မာဘာသာ သို့မဟုတ် အင်္ဂလိပ်ဘာသာဖြင့် ရေးသားနိုင်ပါသည်။
              </p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-md px-2">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(prompt);
                      textareaRef.current?.focus();
                    }}
                    className="text-left px-4 py-3 rounded-xl border border-border hover:border-primary/30 hover:bg-accent/30 transition-all duration-200 text-xs md:text-sm text-muted-foreground hover:text-foreground active:scale-[0.98]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="flex flex-col space-y-3 md:space-y-4 p-3 md:p-4 max-w-4xl mx-auto">
                {messages.map((msg, idx) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 md:gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 md:w-8 md:h-8 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mt-1 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-3 md:px-4 py-2.5 md:py-3 transition-all duration-300 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                          : "bg-card border border-border shadow-sm"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-xs md:text-sm">
                          <Streamdown>{msg.content}</Streamdown>
                        </div>
                      ) : (
                        <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}
                      <p className="text-[10px] mt-1.5 md:mt-2 opacity-50">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 md:w-8 md:h-8 shrink-0 rounded-xl bg-secondary flex items-center justify-center mt-1">
                        <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2 md:gap-3 justify-start animate-in fade-in duration-200">
                    <div className="w-7 h-7 md:w-8 md:h-8 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mt-1">
                      <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary animate-pulse" />
                    </div>
                    <div className="rounded-2xl bg-card border border-border px-3 md:px-4 py-2.5 md:py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Drag-over indicator */}
        {isDragOver && (
          <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center pointer-events-none z-10">
            <div className="flex flex-col items-center gap-2 p-8">
              <FileUp className="w-12 h-12 text-primary" />
              <p className="text-sm md:text-lg font-medium text-primary">Drop PDF file here</p>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-border p-3 md:p-4 bg-background safe-area-bottom">
          <div className="max-w-4xl mx-auto flex gap-2 md:gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your medical question..."
              className="flex-1 resize-none min-h-9 md:min-h-10 max-h-28 md:max-h-32 bg-card border-border transition-all duration-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-sm"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0 h-9 md:h-10 w-9 md:w-10 rounded-xl transition-all duration-200 active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground/60 text-center mt-1.5 md:mt-2 max-w-4xl mx-auto">
            Medicare Myanmar AI provides general medical information. Always consult a healthcare professional.
          </p>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-base">Upload Medical Document</DialogTitle>
            <DialogDescription className="text-xs">
              Upload PDF or text files to build the medical knowledge base
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <FileUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {uploadFile ? uploadFile.name : "Click or drag to upload"}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">PDF, TXT files supported</p>
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button onClick={handleUploadSubmit} disabled={!uploadFile || isUploading} className="w-full">
              {isUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
              ) : (
                <><FileUp className="w-4 h-4 mr-2" />Upload</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Documents List Dialog */}
      <Dialog open={showDocsDialog} onOpenChange={setShowDocsDialog}>
        <DialogContent className="sm:max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">My Documents</DialogTitle>
            <DialogDescription className="text-xs">
              Uploaded medical documents for knowledge base
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {docs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No documents uploaded yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => { setShowDocsDialog(false); setShowUploadDialog(true); }}>
                  Upload Document
                </Button>
              </div>
            ) : (
              docs.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : '-'} &middot; {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={doc.status === 'ready' ? 'default' : 'secondary'} className="text-xs">
                      {doc.status}
                    </Badge>
                    <button
                      onClick={() => deleteDocumentMutation.mutate({ documentId: doc.id })}
                      className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
