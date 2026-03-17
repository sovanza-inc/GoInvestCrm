import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const navigate = useNavigate();
  const { googleAuth } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const sessionId = params.get("session_id");

    if (!sessionId) {
      navigate("/login");
      return;
    }

    const processAuth = async () => {
      try {
        await googleAuth(sessionId);
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.error("Google auth failed:", err);
        navigate("/login", { replace: true });
      }
    };
    processAuth();
  }, [googleAuth, navigate]);

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Signing you in with Google...</p>
      </div>
    </div>
  );
}
