import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How does the matching algorithm work?",
    a: "Our AI analyzes your interests, values, location, and activity to suggest people you're most likely to connect with. The more you interact, the smarter it gets.",
  },
  {
    q: "Is my data private?",
    a: "Absolutely. Your data is encrypted and never shared with third parties. You control what's visible on your profile through Privacy & Safety settings.",
  },
  {
    q: "How do I report inappropriate behavior?",
    a: "Tap the three-dot menu on any profile or message and select 'Report'. Our moderation team reviews every report within 24 hours.",
  },
  {
    q: "Can I delete my account?",
    a: "Yes. Go to Settings → Account Settings → Delete Account. This permanently removes all your data and cannot be undone.",
  },
  {
    q: "How do communities work?",
    a: "Communities are groups of people with shared interests. You can join existing communities or create your own. Members can chat, share events, and connect.",
  },
  {
    q: "Why am I not getting matches?",
    a: "Make sure your profile is complete with interests and values. Also check that your Privacy settings allow you to appear in search results.",
  },
];

const HelpSupport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      return toast.error("Please fill in all fields");
    }
    if (name.length > 100) return toast.error("Name is too long");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Invalid email");
    if (message.length > 2000) return toast.error("Message is too long (max 2000 chars)");

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("contact-form", {
        body: { name: name.trim(), email: email.trim(), message: message.trim(), userId: user?.id },
      });
      if (error) throw error;
      toast.success("Message sent! We'll get back to you soon.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Help & Support</h1>
        </div>
      </header>

      <main className="px-5 py-5 max-w-lg mx-auto space-y-6">
        {/* FAQ */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Frequently Asked Questions
          </p>
          <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-border">
                  <AccordionTrigger className="px-4 py-3 text-sm font-medium text-foreground hover:no-underline hover:bg-muted/50 text-left">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-3 text-sm text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Contact Form */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Contact Us
          </p>
          <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-card border border-border/50 p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Send us a message</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-name" className="text-xs">Name</Label>
              <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email" className="text-xs">Email</Label>
              <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-msg" className="text-xs">Message</Label>
              <Textarea id="contact-msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" rows={4} maxLength={2000} />
              <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
            </div>
            <Button type="submit" disabled={sending} className="w-full" size="sm">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Message"}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default HelpSupport;
