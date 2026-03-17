import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [regData, setRegData] = useState({ name: "", email: "", password: "", company: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
      toast.success("Welcome back!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(regData.name, regData.email, regData.password, regData.company);
      toast.success("Account created! You have a 7-day Growth trial.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Back to landing */}
        <Button variant="ghost" onClick={() => navigate("/")} className="text-slate-500 hover:text-slate-300 mb-4 -ml-2"
          data-testid="back-to-home-btn">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            GoSocial
          </h1>
        </div>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl text-white">Get started</CardTitle>
            <CardDescription className="text-slate-400">
              Convert followers into customers with AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 mb-6">
                <TabsTrigger value="login" data-testid="login-tab">Sign In</TabsTrigger>
                <TabsTrigger value="register" data-testid="register-tab">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-slate-300">Email</Label>
                    <Input
                      id="login-email" type="email" placeholder="you@example.com"
                      data-testid="login-email-input"
                      className="bg-slate-950/50 border-slate-700 h-11 text-slate-200 placeholder:text-slate-600"
                      value={loginData.email}
                      onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-slate-300">Password</Label>
                    <Input
                      id="login-password" type="password" placeholder="Enter password"
                      data-testid="login-password-input"
                      className="bg-slate-950/50 border-slate-700 h-11 text-slate-200 placeholder:text-slate-600"
                      value={loginData.password}
                      onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button
                    type="submit" disabled={loading}
                    data-testid="login-submit-btn"
                    className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                  >
                    {loading ? "Signing in..." : "Sign In"} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-slate-900 px-3 text-slate-500">or</span></div>
                  </div>
                  <Button type="button" variant="outline" onClick={handleGoogleLogin} data-testid="google-login-btn"
                    className="w-full h-11 bg-slate-950/50 border-slate-700 text-slate-300 hover:bg-slate-800">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Continue with Google
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name" className="text-slate-300">Full Name</Label>
                    <Input
                      id="reg-name" placeholder="John Doe"
                      data-testid="register-name-input"
                      className="bg-slate-950/50 border-slate-700 h-11 text-slate-200 placeholder:text-slate-600"
                      value={regData.name}
                      onChange={e => setRegData({ ...regData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-slate-300">Email</Label>
                    <Input
                      id="reg-email" type="email" placeholder="you@example.com"
                      data-testid="register-email-input"
                      className="bg-slate-950/50 border-slate-700 h-11 text-slate-200 placeholder:text-slate-600"
                      value={regData.email}
                      onChange={e => setRegData({ ...regData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-slate-300">Password</Label>
                    <Input
                      id="reg-password" type="password" placeholder="Min 6 characters"
                      data-testid="register-password-input"
                      className="bg-slate-950/50 border-slate-700 h-11 text-slate-200 placeholder:text-slate-600"
                      value={regData.password}
                      onChange={e => setRegData({ ...regData, password: e.target.value })}
                      required minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-company" className="text-slate-300">Company (optional)</Label>
                    <Input
                      id="reg-company" placeholder="Your company"
                      data-testid="register-company-input"
                      className="bg-slate-950/50 border-slate-700 h-11 text-slate-200 placeholder:text-slate-600"
                      value={regData.company}
                      onChange={e => setRegData({ ...regData, company: e.target.value })}
                    />
                  </div>
                  <Button
                    type="submit" disabled={loading}
                    data-testid="register-submit-btn"
                    className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                  >
                    {loading ? "Creating account..." : "Create Account"} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-slate-900 px-3 text-slate-500">or</span></div>
                  </div>
                  <Button type="button" variant="outline" onClick={handleGoogleLogin} data-testid="google-register-btn"
                    className="w-full h-11 bg-slate-950/50 border-slate-700 text-slate-300 hover:bg-slate-800">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Sign up with Google
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-6">
          AI-powered social selling platform for creators
        </p>
      </div>
    </div>
  );
}
