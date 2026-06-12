
import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "../lib/api-client";
import { Film, Lock, Mail, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "next-themes";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { settings } = useSettings();
  const { resolvedTheme } = useTheme();
  const loginMutation = useLogin();

  const getLogoUrl = () => {
    if (resolvedTheme === 'dark' && settings.darkLogoUrl) {
      return settings.darkLogoUrl;
    } else if (resolvedTheme === 'light' && settings.lightLogoUrl) {
      return settings.lightLogoUrl;
    }
    return settings.logoUrl;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password }, {
      onSuccess: () => {
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast({
          title: "Login failed",
          description: err?.message || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-card flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-red-600/30 via-red-500/20 to-transparent blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-red-500/20 via-red-600/10 to-transparent blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      <div className="z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-20 w-20 bg-muted border border-border rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
            {getLogoUrl() ? (
              <img src={getLogoUrl()} alt="Logo" className="h-12 w-auto object-contain" />
            ) : (
              <Film className="h-10 w-10 text-red-500" />
            )}
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent">
            {settings.platformName}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">{settings.loginSubtitle}</p>
        </div>

        {/* Demo Credentials Box */}
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 flex items-start gap-3">
          <KeyRound className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-red-300 mb-1.5">Demo Credentials</p>
            <div className="space-y-1 text-foreground">
              <p><span className="text-gray-500">Email:</span> <button type="button" onClick={() => setEmail("admin@streamvault.com")} className="font-mono text-red-300 hover:text-red-200 underline underline-offset-2 cursor-pointer">admin@streamvault.com</button></p>
              <p><span className="text-gray-500">Password:</span> <button type="button" onClick={() => setPassword("admin123")} className="font-mono text-red-300 hover:text-red-200 underline underline-offset-2 cursor-pointer">admin123</button></p>
            </div>
          </div>
        </div>

        <Card className="border-border shadow-2xl bg-muted/80 rounded-3xl transition-all duration-500 hover:shadow-3xl hover:shadow-red-500/10">
          <CardHeader className="space-y-2 text-center pb-8 pt-8">
            <CardTitle className="text-3xl font-bold text-foreground">{settings.loginTitle}</CardTitle>
            <CardDescription className="text-base text-muted-foreground">Sign in to access your {settings.platformName} admin panel</CardDescription>
          </CardHeader>
          <CardContent className="px-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium ml-1 text-foreground">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-red-500 transition-colors duration-300" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@streamvault.com"
                    className="pl-12 h-14 bg-card border-border text-foreground placeholder:text-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 rounded-2xl transition-all duration-300"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium ml-1 text-foreground">Password</Label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-red-500 transition-colors duration-300" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-12 h-14 bg-card border-border text-foreground placeholder:text-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 rounded-2xl transition-all duration-300"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full mt-2 h-14 text-base font-semibold bg-gradient-to-r from-red-600 via-red-700 to-red-600 hover:from-red-600/90 hover:via-red-700/90 hover:to-red-600/90 shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35 transition-all duration-300 rounded-2xl"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="mr-3 h-5 w-5 animate-spin" /> Authenticating...</>
                ) : settings.loginButtonText}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
