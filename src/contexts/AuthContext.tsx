import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  onboardingCompleted: boolean | null;
  accountStatus: string;
  accountStatusLoading: boolean;
  refreshOnboarding: () => Promise<boolean>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [accountStatus, setAccountStatus] = useState<string>("active");
  const [accountStatusLoading, setAccountStatusLoading] = useState(true);

  const fetchOnboarding = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("onboarding_completed, account_status, is_active, suspended_until")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      setOnboardingCompleted(false);
      setAccountStatus("active");
      setAccountStatusLoading(false);
      return false;
    }

    if (!data) {
      const { error: insertError } = await supabase.from("profiles").insert({ user_id: userId });
      if (insertError) {
        const msg = (insertError.message || "").toLowerCase();
        const isRaceCondition = msg.includes("duplicate") || msg.includes("unique");
        if (!isRaceCondition) {
          setOnboardingCompleted(false);
          setAccountStatus("active");
          setAccountStatusLoading(false);
          return false;
        }
      }

      const { data: createdProfile } = await supabase
        .from("profiles")
        .select("onboarding_completed, account_status, is_active, suspended_until")
        .eq("user_id", userId)
        .maybeSingle();

      const completed = Boolean(createdProfile?.onboarding_completed);
      setOnboardingCompleted(completed);
      resolveAccountStatus(createdProfile, userId);
      return completed;
    }

    const completed = Boolean(data.onboarding_completed);
    setOnboardingCompleted(completed);
    resolveAccountStatus(data, userId);
    return completed;
  };

  const resolveAccountStatus = async (
    data: { account_status: string | null; is_active: boolean | null; suspended_until: string | null } | null,
    userId: string
  ) => {
    if (!data) {
      setAccountStatus("active");
      setAccountStatusLoading(false);
      return;
    }

    const raw = data.account_status || "active";

    // Deleted
    if (raw === "deleted" || data.is_active === false) {
      setAccountStatus("deleted");
      setAccountStatusLoading(false);
      return;
    }

    // Suspended - check expiry
    if (raw === "suspended" && data.suspended_until) {
      const until = new Date(data.suspended_until).getTime();
      if (!Number.isNaN(until) && until <= Date.now()) {
        // Auto-reactivate
        await supabase
          .from("profiles")
          .update({ account_status: "active", suspended_until: null, suspension_reason: null, is_active: true })
          .eq("user_id", userId);
        setAccountStatus("active");
        setAccountStatusLoading(false);
        return;
      }
    }

    setAccountStatus(raw);
    setAccountStatusLoading(false);
  };

  const refreshOnboarding = async () => {
    if (!user) return false;
    return fetchOnboarding(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setAccountStatusLoading(true);
        fetchOnboarding(session.user.id);
      } else {
        setOnboardingCompleted(null);
        setAccountStatus("active");
        setAccountStatusLoading(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setAccountStatusLoading(true);
        fetchOnboarding(session.user.id);
      } else {
        setOnboardingCompleted(null);
        setAccountStatus("active");
        setAccountStatusLoading(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, onboardingCompleted, accountStatus, accountStatusLoading, refreshOnboarding, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
