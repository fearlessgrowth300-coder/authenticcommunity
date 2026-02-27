import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase handles the token exchange automatically from the URL hash/params
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setErrorMessage(error.message);
          setStatus("error");
          return;
        }

        if (data?.session) {
          setStatus("success");
          sessionStorage.removeItem("pending_signup_email");
          setTimeout(() => navigate("/onboarding/1", { replace: true }), 1500);
        } else {
          // Try exchanging the code from URL
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const queryParams = new URLSearchParams(window.location.search);
          
          const accessToken = hashParams.get("access_token") || queryParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token") || queryParams.get("refresh_token");
          const type = hashParams.get("type") || queryParams.get("type");

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              setErrorMessage(sessionError.message);
              setStatus("error");
              return;
            }

            setStatus("success");
            sessionStorage.removeItem("pending_signup_email");
            setTimeout(() => navigate("/onboarding/1", { replace: true }), 1500);
          } else if (type === "signup" || type === "email") {
            // The confirmation was processed; session should appear via onAuthStateChange
            setStatus("success");
            sessionStorage.removeItem("pending_signup_email");
            setTimeout(() => navigate("/onboarding/1", { replace: true }), 1500);
          } else {
            setErrorMessage("Verification link may have expired. Please request a new one.");
            setStatus("error");
          }
        }
      } catch (err: any) {
        setErrorMessage(err?.message || "Verification failed");
        setStatus("error");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      {status === "loading" && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Verifying your email...</h1>
          <p className="text-muted-foreground text-sm">Please wait a moment</p>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle className="h-12 w-12 text-primary mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Email verified!</h1>
          <p className="text-muted-foreground text-sm">Redirecting to onboarding...</p>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="h-12 w-12 text-destructive mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Verification failed</h1>
          <p className="text-muted-foreground text-sm mb-4">{errorMessage}</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/verify-email")}>
              Try again
            </Button>
            <Button variant="gradient" onClick={() => navigate("/signup")}>
              Sign up again
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AuthCallback;
