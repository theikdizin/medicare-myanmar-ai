import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { MessageSquare, Shield, FileText, Sparkles, Globe, Activity } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && !loading) {
      setLocation(user.role === "admin" ? "/admin" : "/chat");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: MessageSquare,
      title: "AI Medical Chat",
      titleMm: "AI ဆေးပညာ ချက်ဘော့",
      desc: "Intelligent medical assistant powered by advanced AI models",
      descMm: "AI နည်းပညာဖြင့် ဆေးပညာ အကူအညီ ပေးနိုင်သော ချက်ဘော့",
    },
    {
      icon: Globe,
      title: "Myanmar Language",
      titleMm: "မြန်မာဘာသာ",
      desc: "Full support for Myanmar and English with auto-translation",
      descMm: "မြန်မာနှင့် အင်္ဂလိပ်ဘာသာဖြင့် အလိုအလျောက် ဘာသာပြန်",
    },
    {
      icon: FileText,
      title: "PDF Knowledge Base",
      titleMm: "PDF အသိပညာ အခြေခံ",
      desc: "Upload medical documents for RAG-powered responses",
      descMm: "ဆေးပညာ စာရွက်စာတမ်းများ upload လုပ်၍ AI အကူအညီ ရယူနိုင်ခြင်း",
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      titleMm: "Role အခြေခံ ဝင်ရောက်ခွင့်",
      desc: "Separate admin and user dashboards with secure access",
      descMm: "Admin နှင့် user dashboard ခွဲခြား ထိန်းချုပ်ထားခြင်း",
    },
    {
      icon: Sparkles,
      title: "Smart Responses",
      titleMm: "ဉာဏ်ရည် အကူအညီ",
      desc: "Context-aware medical answers without external links",
      descMm: "ဆေးပညာ အကြောင်းပြန်ချက်များကို ပြည့်စုံစွာ ပေးခြင်း",
    },
    {
      icon: Activity,
      title: "Chat History",
      titleMm: "စကားဝိုင်း မှတ်တမ်း",
      desc: "Persistent chat history with session management",
      descMm: "စကားဝိုင်း မှတ်တမ်းများ သိမ်းဆည်းထားခြင်း",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-6xl mx-auto px-3 md:px-4 py-12 md:py-32">
          <div className="flex flex-col items-center text-center gap-8">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Powered by AI & LangChain</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
              Medicare Myanmar AI
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
              မြန်မာနိုင်ငံအတွက် AI ဆေးပညာ အကူအညီ ချက်ဘော့
            </p>
            
            <p className="text-sm md:text-base text-muted-foreground max-w-xl">
              AI-powered medical assistant with RAG pipeline, Myanmar language support, and intelligent document processing for healthcare professionals and patients.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button 
                onClick={() => startLogin()} 
                size="lg" 
                className="px-8 h-12 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-3 md:px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group p-4 md:p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-primary/80 mb-2">{feature.titleMm}</p>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Medicare Myanmar AI &copy; {new Date().getFullYear()} | Built with LangChain & Groq API
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            မြန်မာနိုင်ငံ ဆေးပညာ AI ချက်ဘော့
          </p>
        </div>
      </footer>
    </div>
  );
}
