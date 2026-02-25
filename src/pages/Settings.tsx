import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Shield, Bell, HelpCircle, LogOut, ChevronRight, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  {
    title: "Account",
    items: [
      { icon: User, label: "Account Settings", desc: "Email, password, 2FA" },
      { icon: CreditCard, label: "Subscription", desc: "Free plan" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: Shield, label: "Privacy & Safety", desc: "Privacy, blocked users" },
      { icon: Bell, label: "Notifications", desc: "Push, email, in-app" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: HelpCircle, label: "Help & Support", desc: "FAQ, contact us" },
    ],
  },
];

const SettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Settings</h1>
        </div>
      </header>

      <main className="px-5 py-5 max-w-lg mx-auto space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">{section.title}</p>
            <div className="bg-card rounded-xl shadow-card border border-border/50 divide-y divide-border">
              {section.items.map((item) => (
                <button key={item.label} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-card rounded-xl shadow-card border border-border/50 hover:bg-destructive/5 transition-colors"
        >
          <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
            <LogOut className="h-4 w-4 text-destructive" />
          </div>
          <span className="text-sm font-medium text-destructive">Log Out</span>
        </button>

        <p className="text-center text-xs text-muted-foreground pt-4">Authentic Community Connection v1.0</p>
      </main>
    </div>
  );
};

export default SettingsPage;
